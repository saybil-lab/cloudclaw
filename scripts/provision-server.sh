#!/bin/bash
#
# CloudClaw Server Provisioning Script
# This script sets up a cloud desktop with Xfce, TigerVNC, noVNC, and OpenClaw
#
# Usage: ./provision-server.sh <server_ip> <root_password> <vnc_password>
#
set -e

# Configuration
SERVER_IP="${1:-}"
ROOT_PASSWORD="${2:-}"
VNC_PASSWORD="${3:-}"

if [ -z "$SERVER_IP" ] || [ -z "$ROOT_PASSWORD" ] || [ -z "$VNC_PASSWORD" ]; then
    echo "Usage: $0 <server_ip> <root_password> <vnc_password>"
    exit 1
fi

echo "========================================"
echo "CloudClaw Provisioning Script"
echo "Server: $SERVER_IP"
echo "========================================"

# Create SSH command helper
SSH_CMD="sshpass -p '$ROOT_PASSWORD' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$SERVER_IP"
SCP_CMD="sshpass -p '$ROOT_PASSWORD' scp -o StrictHostKeyChecking=no"

# Wait for server to be ready
wait_for_ssh() {
    echo "Waiting for SSH to be available..."
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if $SSH_CMD "echo 'SSH ready'" 2>/dev/null; then
            echo "SSH is available!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts - waiting..."
        sleep 5
    done
    
    echo "ERROR: SSH not available after $max_attempts attempts"
    return 1
}

# Main provisioning
run_remote() {
    echo ">> Running: $1"
    $SSH_CMD "$1"
}

# Wait for SSH
wait_for_ssh

echo ""
echo "=== Step 1: System Update ==="
run_remote "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y"

echo ""
echo "=== Step 2: Install Desktop Environment (Xfce) ==="
run_remote "DEBIAN_FRONTEND=noninteractive apt-get install -y xfce4 xfce4-goodies dbus-x11"

echo ""
echo "=== Step 3: Install TigerVNC ==="
run_remote "DEBIAN_FRONTEND=noninteractive apt-get install -y tigervnc-standalone-server tigervnc-common"

echo ""
echo "=== Step 4: Install noVNC ==="
run_remote "DEBIAN_FRONTEND=noninteractive apt-get install -y novnc websockify python3-websockify"

echo ""
echo "=== Step 5: Install Additional Tools ==="
run_remote "DEBIAN_FRONTEND=noninteractive apt-get install -y \
    firefox \
    chromium-browser \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    nodejs \
    npm \
    docker.io \
    docker-compose \
    fonts-liberation \
    fonts-dejavu \
    fonts-noto \
    fonts-noto-color-emoji"

echo ""
echo "=== Step 6: Create CloudClaw User ==="
run_remote "useradd -m -s /bin/bash -G sudo,docker cloudclaw || true"
run_remote "echo 'cloudclaw:$VNC_PASSWORD' | chpasswd"
run_remote "echo 'cloudclaw ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers.d/cloudclaw"

echo ""
echo "=== Step 7: Configure VNC ==="
run_remote "mkdir -p /home/cloudclaw/.vnc"
run_remote "echo '$VNC_PASSWORD' | vncpasswd -f > /home/cloudclaw/.vnc/passwd"
run_remote "chmod 600 /home/cloudclaw/.vnc/passwd"
run_remote "chown -R cloudclaw:cloudclaw /home/cloudclaw/.vnc"

# Create VNC xstartup
run_remote "cat > /home/cloudclaw/.vnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
exec startxfce4
EOF"
run_remote "chmod +x /home/cloudclaw/.vnc/xstartup"
run_remote "chown cloudclaw:cloudclaw /home/cloudclaw/.vnc/xstartup"

echo ""
echo "=== Step 8: Create VNC Service ==="
run_remote "cat > /etc/systemd/system/vncserver@.service << 'EOF'
[Unit]
Description=TigerVNC Server for %i
After=syslog.target network.target

[Service]
Type=simple
User=%i
WorkingDirectory=/home/%i
ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill :%i > /dev/null 2>&1 || :'
ExecStart=/usr/bin/vncserver -fg -geometry 1920x1080 -depth 24 :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
EOF"

# Start VNC on display :1
run_remote "systemctl daemon-reload"
run_remote "systemctl enable vncserver@1"
run_remote "systemctl start vncserver@1 || true"

echo ""
echo "=== Step 9: Create noVNC Service ==="
run_remote "cat > /etc/systemd/system/novnc.service << 'EOF'
[Unit]
Description=noVNC WebSocket Proxy
After=network.target vncserver@1.service
Requires=vncserver@1.service

[Service]
Type=simple
User=root
ExecStart=/usr/share/novnc/utils/novnc_proxy --vnc localhost:5901 --listen 6080 --web /usr/share/novnc
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF"

run_remote "systemctl daemon-reload"
run_remote "systemctl enable novnc"
run_remote "systemctl start novnc || true"

echo ""
echo "=== Step 10: Configure Firewall ==="
run_remote "ufw allow 22/tcp"
run_remote "ufw allow 80/tcp"
run_remote "ufw allow 443/tcp"
run_remote "ufw allow 5901/tcp"
run_remote "ufw allow 6080/tcp"
run_remote "ufw --force enable || true"

echo ""
echo "=== Step 11: Install Node.js (LTS) ==="
run_remote "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
run_remote "apt-get install -y nodejs"

echo ""
echo "=== Step 12: Setup Docker for cloudclaw user ==="
run_remote "systemctl enable docker"
run_remote "systemctl start docker"
run_remote "usermod -aG docker cloudclaw"

echo ""
echo "=== Step 13: Create CloudClaw Desktop Shortcuts ==="
run_remote "mkdir -p /home/cloudclaw/Desktop"
run_remote "cat > /home/cloudclaw/Desktop/firefox.desktop << 'EOF'
[Desktop Entry]
Name=Firefox
Exec=firefox
Icon=firefox
Type=Application
Categories=Network;WebBrowser;
EOF"
run_remote "chmod +x /home/cloudclaw/Desktop/firefox.desktop"

run_remote "cat > /home/cloudclaw/Desktop/terminal.desktop << 'EOF'
[Desktop Entry]
Name=Terminal
Exec=xfce4-terminal
Icon=utilities-terminal
Type=Application
Categories=System;
EOF"
run_remote "chmod +x /home/cloudclaw/Desktop/terminal.desktop"
run_remote "chown -R cloudclaw:cloudclaw /home/cloudclaw/Desktop"

echo ""
echo "=== Step 14: Final Cleanup ==="
run_remote "apt-get autoremove -y"
run_remote "apt-get clean"

echo ""
echo "=== Step 15: Restart VNC Services ==="
# Restart services to ensure they're running properly
run_remote "systemctl restart vncserver@1 || true"
sleep 2
run_remote "systemctl restart novnc || true"

echo ""
echo "========================================"
echo "Provisioning Complete!"
echo "========================================"
echo ""
echo "VNC Access:"
echo "  - noVNC URL: http://$SERVER_IP:6080/vnc.html"
echo "  - VNC Password: $VNC_PASSWORD"
echo "  - Direct VNC: $SERVER_IP:5901"
echo ""
echo "SSH Access:"
echo "  - User: cloudclaw"
echo "  - Password: $VNC_PASSWORD"
echo ""
echo "========================================"

# Return success
exit 0
