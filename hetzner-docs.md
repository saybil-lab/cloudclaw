i### Setup Uptime Kuma with Node.js

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/nodejs

This sequence of commands clones the Uptime Kuma repository, navigates into the directory, and then runs the setup script using a specific Node.js version (e.g., 20). It requires git and Node.js with npm to be installed.

```shell
git clone https://github.com/louislam/uptime-kuma.git
cd uptime-kuma
NODEVERSION=20 npm run setup
```

--------------------------------

### Node.js Hello World Example

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/nodejs

A basic Node.js 'Hello World' application using the built-in 'http' module. This snippet demonstrates how to create a simple HTTP server that responds with 'Hello World' and logs a message to the console when the server starts.

```javascript
const { createServer } = require('node:http');

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(() => {
  console.log("Application is running...");
});
```

--------------------------------

### Hetzner API GET Request Example

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

An example of a GET request to the Hetzner Cloud API to retrieve information about servers. It includes the necessary authorization header. This command fetches a list of servers within a specified project.

```shell
curl \
-H "Authorization: Bearer $API_TOKEN_1" \
'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Example SSH Config Entry for Hetzner Server

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-the-server

A specific example of an SSH configuration entry for a Hetzner server. It uses a placeholder `<unique-name>`, the server's IP address `<203.0.113.1>`, the 'root' user, and 'publickey' as the preferred authentication. This entry simplifies connecting to the server after setup.

```bash
Host <unique-name>
        HostName <203.0.113.1>
        User root
        PreferredAuthentications publickey
```

--------------------------------

### Hetzner API GET Request Example with Specific Endpoint

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

A specific example of a GET request to the Hetzner Cloud API to retrieve a list of servers. This command demonstrates the practical application of the GET request structure, including the authorization header and the target API endpoint.

```shell
curl \
    -H "Authorization: Bearer $API_TOKEN" \
    'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Activate Let's Encrypt Post Installation

Source: https://docs.hetzner.com/cloud/apps/list/jitsi-meet

Instructions and script for enabling Let's Encrypt SSL/TLS certificates for Jitsi Meet after initial installation.

```APIDOC
## Activate Let's Encrypt Post Installation

### Description
This section details how to obtain and configure Let's Encrypt certificates to enable HTTPS for your Jitsi Meet instance after the initial setup.

### Method
Script Execution

### Endpoint
N/A (Executed on the server)

### Parameters
None

### Request Example
```bash
/usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

### Response
#### Success Response
The script will configure Jitsi to use SSL and obtain a valid Let's Encrypt certificate.

#### Response Example
Output will vary depending on the script's execution, confirming certificate installation and configuration.
```

--------------------------------

### Example Output of lsblk -So for Hetzner Cloud Volumes

Source: https://docs.hetzner.com/cloud/volumes/faq

An example of the output from the `lsblk -So NAME,MODEL,SERIAL` command, demonstrating how to identify Hetzner Cloud Volumes based on their 'Model' and 'Serial' attributes.

```shell
# lsblk -So NAME,MODEL,SERIAL

NAME MODEL         SERIAL
sda  QEMU_HARDDISK drive-scsi0-0-0-0
sdb  Volume        16246638
sdc  Volume        16246643
sdd  Volume        16246652
sr0  QEMU_DVD-ROM  QM00003
```

--------------------------------

### Create Hetzner Server with Coolify via hcloud-cli

Source: https://docs.hetzner.com/cloud/apps/list/coolify

This example shows how to provision a Hetzner Cloud server with Coolify using the hcloud-cli tool. It provides a simpler command-line interface for creating servers, specifying the server name, type, and the 'coolify' image.

```bash
hcloud server create --name my-coolify-server --type cpx11 --image coolify
```

--------------------------------

### MariaDB/MySQL Command Line SSL Access

Source: https://docs.hetzner.com/konsoleh/account-management/databases/mysql

Example command to connect to a MariaDB or MySQL database using SSL encryption via the command line. Requires the 'sqlca.pem' certificate file.

```bash
mysql --ssl --ssl-ca sqlca.pem -h HOSTNAME ...
```

--------------------------------

### Mount Partitions on New Server

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-partition

This command mounts the specified partitions to designated mount points on the new Hetzner cloud server. It assumes the partitions already have a file system. The example shows mounting `/dev/sda1` to `/mnt` and `/dev/sda15` to `/mnt/boot/efi`.

```bash
mount /dev/sda1 /mnt
mount /dev/sda15 /mnt/boot/efi
```

--------------------------------

### Encrypted PostgreSQL Access Commands

Source: https://docs.hetzner.com/konsoleh/account-management/databases/postgresql

Examples demonstrate how to connect to a PostgreSQL database using SSL encryption. The 'verify-full' mode ensures the server certificate is verified, and 'sslrootcert' points to the saved certificate file. Replace placeholders with your actual server, login, and database details.

```bash
PGSSLMODE=verify-full PGSSLROOTCERT=sqlca.pem psql -h ${SERVER?} -U ${LOGIN?} -d ${DATABASE?} -W
```

```php
$pdo = new PDO('pgsql:host=SERVER;dbname=DATABASE;sslmode=verify-full;sslrootcert=sqlca.pem;', 'LOGIN', 'PASSWORD');
```

--------------------------------

### Install n8n with Node.js

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/nodejs

This command installs the n8n automation tool globally using npm, specifying a particular Node.js version (e.g., 22). It requires Node.js and npm to be available on the server.

```shell
NODEVERSION=22 npm install -g n8n
```

--------------------------------

### Activate Let's Encrypt SSL Certificate for Jitsi Meet

Source: https://docs.hetzner.com/cloud/apps/list/jitsi-meet

This script activates Let's Encrypt SSL/TLS certificates for Jitsi Meet installations after the initial setup. It configures Jitsi to use HTTPS and obtains a valid certificate from Let's Encrypt.

```bash
/usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

--------------------------------

### Activate Let's Encrypt with Certbot (Apache)

Source: https://docs.hetzner.com/cloud/apps/list/nextcloud

This command initiates the Certbot tool to automatically obtain and install an SSL/TLS certificate from Let's Encrypt for your Nextcloud instance, enabling HTTPS. It assumes Apache is the web server and guides the user through the certificate process. Ensure Certbot is installed and Apache is running.

```bash
certbot --apache
```

--------------------------------

### Hetzner Cloud API Query Parameter Examples (cURL)

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

These examples demonstrate how to use query parameters with cURL to refine results from the Hetzner Cloud API. They cover filtering by label selectors, sorting results by ID or creation date, and combining multiple query parameters in a single request.

```bash
https://api.hetzner.cloud/v1/floating_ips?label_selector=env
```

```bash
https://api.hetzner.cloud/v1/floating_ips?sort=id:asc
```

```bash
https://api.hetzner.cloud/v1/floating_ips?label_selector=env&sort=id:asc
```

--------------------------------

### Configure .html and .htm Files for PHP Parsing

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/php-configuration

Enable PHP processing for .html and .htm files by adding directives to your .htaccess file. This example configures PHP 7.4 for these file types.

```apache
FcgidWrapper "/home/httpd/cgi-bin/php74-fcgi-starter.fcgi" .html
FcgidWrapper "/home/httpd/cgi-bin/php74-fcgi-starter.fcgi" .htm
<FilesMatch "\.(html|htm)$">
 SetHandler fcgid-script
</FilesMatch>
```

--------------------------------

### Backup System Configuration Files (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-partition

Backs up essential system configuration files on the old server before migration. This ensures that critical settings are preserved and can be restored or compared. The example provided is for Ubuntu systems.

```bash
# On the old server, run these commands
mv /etc/fstab /etc/fstab.bak
mv /etc/netplan /etc/netplan.bak
mv /etc/network/interfaces /etc/network/interfaces.bak
mv /etc/default/grub /etc/default/grub.bak
mv /boot/grub /boot/grub.bak
```

--------------------------------

### Configure Default Gateway During Ubuntu/Debian Installation

Source: https://docs.hetzner.com/cloud/servers/iso-installation-gateway

This snippet shows the commands to execute in the console during a manual ISO installation on Ubuntu or Debian to set the default gateway. It assumes the interface name is 'ens3' and provides the IP address for the gateway. These changes are temporary and will be lost on reboot.

```bash
$ ip address
$ ip route add 172.31.1.1 dev ens3
$ ip route add default via 172.31.1.1
```

--------------------------------

### Debian Installer Boot Options Modification

Source: https://docs.hetzner.com/cloud/servers/iso-installation-gateway

This snippet shows the modified boot parameters for the Debian installer. By changing 'vga' to 'normal' and adding 'fb=false', users can ensure proper display and prevent issues when booting into the graphical installer via GRUB menu.

```bash
/install.amd/vmlinuz vga=normal fb=false initrd=/install.amd/gtk/initrd.gz ---
quiet
```

--------------------------------

### Create PhotoPrism Server using Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/photoprism

This snippet demonstrates how to provision a new Hetzner Cloud server with the PhotoPrism app pre-installed using a curl command. It requires an API token for authentication and specifies the server name, type, and image.

```bash
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-photoprism-server", "server_type":"cpx21", "image":"photoprism"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Connect to Server via SSH

Source: https://docs.hetzner.com/cloud/servers/getting-started/rescue-system

This command initiates an SSH connection to your server as the root user. Ensure you replace the placeholder IP address with your server's actual IP. This is used after activating Rescue mode to access your server's environment.

```bash
ssh root@<203.0.113.1>
```

--------------------------------

### Hetzner Cloud API Data Payload Example (cURL)

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

This example shows a formatted data payload for a cURL request to create a resource in the Hetzner Cloud API. It illustrates the structure for various data types including strings, integers, objects, booleans, and nullable values. The example includes common properties like 'name', 'resource_y', 'labels', 'delete', and 'description'.

```json
{"name":"my-resource","resource_y":18,"labels":{"labelkey":"my-label"},"delete":true,"description":null}
```

--------------------------------

### Create PhotoPrism Server using Hetzner Cloud CLI (hcloud)

Source: https://docs.hetzner.com/cloud/apps/list/photoprism

This command uses the hcloud CLI to create a Hetzner Cloud server with the PhotoPrism image. It's a concise alternative to using curl for API interactions, requiring server name, type, and image as arguments.

```bash
hcloud server create --name my-photoprism-server --type cpx21 --image photoprism
```

--------------------------------

### Hetzner API POST/PUT Data Payload Example

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

An example illustrating how to add a JSON data payload for POST and PUT requests in the Hetzner Cloud API. This payload is used to define properties for resource creation or modification. The example shows how to include properties like 'name' and 'type'.

```shell
curl \
-X POST \
-H "Authorization: Bearer $API_TOKEN" \
+ -H "Content-Type: application/json" \
+ -d '{"property":value,"property":value,...}' \
'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Activate Let's Encrypt SSL Certificate for WordPress

Source: https://docs.hetzner.com/cloud/apps/list/wordpress

These commands are used to enable HTTPS for your WordPress site by obtaining and installing a Let's Encrypt SSL certificate. First, Certbot is run with the Apache plugin to handle certificate acquisition. Second, the Apache web server is restarted to apply the new configuration.

```shell
certbot --apache
```

```shell
systemctl restart apache2
```

--------------------------------

### SSH Host Authenticity Warning Example

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-the-server

An example of a warning message that may appear when connecting to a server for the first time, indicating that the host's authenticity cannot be established. Users are prompted to confirm connection by typing 'yes'. The host key is then saved in `~/.ssh/known_hosts`.

```bash
The authenticity of host '<203.0.113.1> (<203.0.113.1>)' can't be established.
ECDSA key fingerprint is SHA256:Jw/3FIJwpp3FIJw/3FIJw/3FppLVppmjWs.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

--------------------------------

### Set PHP Error Reporting Level via .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/php-configuration

Configures the error reporting level for PHP scripts. This example sets the 'error_reporting' level to 'E_ALL' using its numeric representation (32767) via the 'php_value' directive in .htaccess.

```apache
php_value error_reporting 32767
```

--------------------------------

### SSH Configuration File Entry

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-the-server

Example of how to configure your local SSH client to use a unique name for connecting to your server. This simplifies connections by allowing you to use `ssh <unique-name>` instead of the full `ssh username@IP-address`. It specifies the hostname, user, and preferred authentication method.

```bash
Host <unique-name>
        HostName <IP-address>
        User <username>
        PreferredAuthentications <publickey/password>
```

--------------------------------

### Hetzner Cloud API Request Example (cURL)

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

This snippet demonstrates a basic cURL command to interact with the Hetzner Cloud API. It includes essential headers for authorization and content type, and a data payload for the request. Ensure you replace '$API_TOKEN' with your actual API token and '{api-url-ending}' with the specific API endpoint.

```bash
-H "Authorization: Bearer $API_TOKEN" \
-H "Content-Type: application/json" \
-d '{"property":value,"property":value,...}' \
'https://api.hetzner.cloud/v1/{api-url-ending}'
```

--------------------------------

### Set PHP Version per Directory with .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/php-configuration

Configure specific PHP versions for directories by creating an .htaccess file with FcgidWrapper directives. This allows granular control over PHP versions used by your web server.

```apache
FcgidWrapper "/home/httpd/cgi-bin/php56-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php73-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php74-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php80-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php81-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php82-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php83-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php84-fcgi-starter.fcgi" .php
FcgidWrapper "/home/httpd/cgi-bin/php85-fcgi-starter.fcgi" .php
```

--------------------------------

### Configure PHP Settings via .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/php-configuration

Allows setting PHP configuration values and flags directly within the .htaccess file. 'php_value' is used for settings that require a specific value (string or number), while 'php_flag' is used for boolean settings (on/off).

```apache
php_value [Setting_1] [value]
php_flag [Setting_2] [0 or 1]
```

--------------------------------

### Hetzner API GET Request Structure

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

The basic structure for a GET request to the Hetzner Cloud API. This command is used to read information about various resources. Replace `{api-url-ending}` with the specific API endpoint.

```shell
curl \
-H "Authorization: Bearer $API_TOKEN" \
'https://api.hetzner.cloud/v1/{api-url-ending}'
```

--------------------------------

### PHP PDO SSL Database Connection

Source: https://docs.hetzner.com/konsoleh/account-management/databases/mysql

PHP PDO example demonstrating how to establish an SSL-encrypted connection to a MariaDB/MySQL database. It utilizes the PDO::MYSQL_ATTR_SSL_CA attribute to specify the certificate.

```php
$pdo = new PDO('mysql:host=HOSTNAME;dbname=DBNAME', 'USERNAME', 'PASSWORD', array(PDO::MYSQL_ATTR_SSL_CA=>'sqlca.pem'));
```

--------------------------------

### Java JDBC SSL Connection String

Source: https://docs.hetzner.com/konsoleh/account-management/databases/mysql

Example JDBC connection string for Java applications to connect to a MariaDB/MySQL database using SSL. It requires importing the certificate into a keystore and specifying its path and password.

```java
jdbc:mysql://[host][:port]/[database]?useSSL=true&requireSSL=true&trustCertificateKeyStorePassword=<secret>&trustCertificateKeyStoreUrl=file:/path/to/my/keystore
```

--------------------------------

### PHP mysqli SSL Database Connection

Source: https://docs.hetzner.com/konsoleh/account-management/databases/mysql

PHP mysqli example for creating an SSL-encrypted connection to a MariaDB/MySQL database. This involves initializing mysqli, setting SSL options with ssl_set, and then connecting.

```php
$db = mysqli_init();
$db->ssl_set(NULL, NULL, 'sqlca.pem', NULL, NULL);
$link = mysqli_real_connect ($db, 'HOSTNAME', 'USERNAME', 'PASSWORD','DBNAME', 3306, NULL, MYSQLI_CLIENT_SSL);
```

--------------------------------

### Example curl request with API Token

Source: https://docs.hetzner.com/cloud/api/getting-started/generating-api-token

This snippet demonstrates how to include the generated API token in an authorization header for requests to the Hetzner Cloud API. The token must be included in every request.

```shell
curl \
	-H "Authorization: Bearer $API_TOKEN" \
    ...
```

--------------------------------

### Configure GitLab External URL and Reconfigure

Source: https://docs.hetzner.com/cloud/apps/list/gitlab-ce

These commands are used to activate Let's Encrypt and enable HTTPS for your GitLab instance after initial installation. It involves modifying the GitLab configuration file and then running the reconfigure command.

```shell
echo "external_url 'https://[your-domain]'" | sudo tee -a /etc/gitlab/gitlab.rb
gitlab-ctl reconfigure
```

--------------------------------

### Enable PHP Error Logging via .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/php-configuration

Activates PHP error logging and specifies the path to the error log file. 'log_errors' must be turned on using 'php_flag', and the 'error_log' path is set using 'php_value'. Remember to replace '«login»' with your FTP username.

```apache
php_flag  log_errors on
php_value error_log  /usr/home/«login»/php.log
```

--------------------------------

### Configure Default Gateway Permanently (Ubuntu 20.04+)

Source: https://docs.hetzner.com/cloud/servers/iso-installation-gateway

This snippet demonstrates how to permanently configure the default gateway for Ubuntu 20.04 and newer versions using netplan. It involves editing the '/etc/netplan/50-cloud-init.yaml' file to specify the gateway and interface. This configuration persists across reboots.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens3:
      addresses:
        - <IPv6 address>::1/64
      dhcp4: true
      routes:
      - to: default
        via: fe80::1
```

--------------------------------

### Disable Cloud-init Network Configuration

Source: https://docs.hetzner.com/cloud/servers/static-configuration

This configuration file disables cloud-init from modifying or regenerating network configurations, allowing for manual static IP setup. It's a prerequisite for static IP configuration.

```yaml
network:
  config: disabled
```

--------------------------------

### Set PHP Version for Current SSH Session

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/php-configuration

Temporarily change the PHP version for your current SSH session using the 'export' command. This setting affects all subsequent PHP commands executed within that session.

```bash
export PHPVERSION=8.0
```

--------------------------------

### Cloud-Init User Data Execution

Source: https://docs.hetzner.com/cloud/servers/faq

Allows execution of user-defined scripts during server boot using cloud-init. This is useful for automating initial server configuration tasks such as user creation or running shell commands. Ensure you are using system images provided by Hetzner, as they include the necessary cloud-init datasource.

```bash
#!/bin/bash
touch /tmp/cloudinit_was_here
```

--------------------------------

### Add Multiple Domain Redirects to www Subdomain

Source: https://docs.hetzner.com/konsoleh/account-management/development/redirection-of-a-domain

This example demonstrates how to extend the default www redirect to include additional domains. By adding more RewriteCond directives, you can specify multiple domains to be redirected to their respective www subdomains. This requires mod_rewrite and an .htaccess file.

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} !^www\.your-domain\.de [NC]
RewriteRule (.*) http://www.your-domain.de/$1 [R=301,L]
RewriteCond %{HTTP_HOST} !^www\.another-domain\.de [NC]
RewriteRule (.*) http://www.another-domain.de/$1 [R=301,L]
```

--------------------------------

### Configure Default Gateway Permanently (Debian 10+)

Source: https://docs.hetzner.com/cloud/servers/iso-installation-gateway

This snippet shows how to permanently configure the default gateway for Debian 10 and newer versions by editing the '/etc/network/interfaces' file. It sets up both IPv4 and IPv6 static configurations with the specified gateway. This configuration persists across reboots.

```bash
auto ens3
iface ens3 inet dhcp
iface ens3 inet6 static
    address {{ IPv6 address of the server }}
    netmask 64
    gateway fe80::1
```

--------------------------------

### Redirect HTTP to HTTPS using .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/development/hsts

This code snippet configures Apache's rewrite engine to redirect all incoming HTTP requests to HTTPS. It ensures that the server automatically enforces secure connections for the domain. This is crucial for HSTS implementation, especially when using the 'preload' directive.

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```

--------------------------------

### Chroot and Update Bootloader using GRUB

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-partition

This sequence of commands prepares the system for bootloader updates by binding necessary directories and then entering a chroot environment. Inside the chroot, `update-grub` and `grub-install` are used to update the GRUB bootloader configuration and reinstall it to the target disk. Finally, the chroot environment is exited.

```bash
mount -o bind /dev /mnt/dev
mount --rbind /sys /mnt/sys
mount -t proc /proc /mnt/proc
chroot /mnt /bin/bash
update-grub
grub-install /dev/sda
exit
```

--------------------------------

### Create Server with LAMP App via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/lamp-stack

This snippet demonstrates how to create a new server with the LAMP app pre-installed using the Hetzner Cloud API via a curl command. It requires an API token for authentication and specifies server name, type, and image. The output is a JSON object representing the created server.

```bash
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-server", "server_type":"cpx21", "image":"lamp"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Embed 'Deploy to Hetzner Cloud' Button (HTML)

Source: https://docs.hetzner.com/cloud/apps/overview

This snippet demonstrates embedding the 'Deploy to Hetzner Cloud' button using HTML. It utilizes an anchor tag with an image source, linking to the Hetzner Console for app deployment. Users are directed to select a project and then forwarded to the 'Create a server' page with the app preselected. Verify the image source and the app name in the href attribute.

```html
<a href="https://console.hetzner.com/deploy/collab-tools"><img src="dp_to_hc--default-dark.svg"></a>
```

--------------------------------

### Configure Keyboard Mapping on Ubuntu

Source: https://docs.hetzner.com/cloud/servers/faq

This snippet demonstrates how to reconfigure the keyboard mapping on an Ubuntu server to match your local PC's layout. This is necessary because Hetzner images default to a US keyboard layout. The process involves running a command and selecting the desired layout, followed by a reboot for the changes to take effect. This is particularly useful for console access.

```bash
sudo dpkg-reconfigure keyboard-configuration
```

--------------------------------

### POST /v1/servers - Create Server with Jitsi Image

Source: https://docs.hetzner.com/cloud/apps/list/jitsi-meet

This endpoint allows you to create a new server instance in Hetzner Cloud with the Jitsi image pre-installed. You can specify server name, type, and image.

```APIDOC
## POST /v1/servers

### Description
Creates a new server with a specified image, suitable for deploying Jitsi Meet.

### Method
POST

### Endpoint
/v1/servers

### Parameters
#### Query Parameters
None

#### Request Body
- **name** (string) - Required - The name of the server.
- **server_type** (string) - Required - The server type (e.g., "cpx21").
- **image** (string) - Required - The image to use, specifically "jitsi" for Jitsi Meet.

### Request Example
```json
{
	"name": "my-server",
	"server_type": "cpx21",
	"image": "jitsi"
}
```

### Response
#### Success Response (201 Created)
- **server** (object) - Details of the created server.
  - **id** (integer) - The ID of the server.
  - **name** (string) - The name of the server.
  - **state** (string) - The current state of the server.

#### Response Example
```json
{
  "server": {
    "id": 12345,
    "name": "my-server",
    "state": "creating"
  }
}
```
```

--------------------------------

### Create Jitsi Server via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/jitsi-meet

This snippet demonstrates how to create a new server with the Jitsi app pre-installed using a curl command against the Hetzner Cloud API. It requires an API token for authentication and specifies the server name, type, and image.

```bash
curl \
	-X POST \
	-H "Authorization: Bearer $API_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"name":"my-server", "server_type":"cpx21", "image":"jitsi"}' \
	'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Embed 'Deploy to Hetzner Cloud' Button (Markdown)

Source: https://docs.hetzner.com/cloud/apps/overview

This snippet shows how to embed the 'Deploy to Hetzner Cloud' button in Markdown format. It uses an image link that, when clicked, directs the user to the Hetzner Console to deploy a preselected app. Ensure the image path and the app name in the URL are correct.

```markdown
[![](dp_to_hc--default-dark.svg)](https://console.hetzner.com/deploy/collab-tools)
```

--------------------------------

### Create Server with LAMP App via Hetzner Cloud CLI (hcloud)

Source: https://docs.hetzner.com/cloud/apps/list/lamp-stack

This command utilizes the hcloud-cli to create a new server with the LAMP app pre-installed. It's a simpler alternative to the raw API curl command, specifying the server name, type, and image. The command returns information about the newly created server.

```bash
hcloud server create --name my-server --type cpx21 --image lamp
```

--------------------------------

### Create Jitsi Server via Hetzner Cloud CLI (hcloud-cli)

Source: https://docs.hetzner.com/cloud/apps/list/jitsi-meet

This command utilizes the hcloud-cli to create a new server with the Jitsi app pre-installed. It's a simpler alternative to the curl command, specifying the server name, type, and image.

```bash
hcloud server create --name my-server --type cpx21 --image jitsi
```

--------------------------------

### POST /v1/servers

Source: https://docs.hetzner.com/cloud/apps/list/owncast

Creates a new server instance with the Owncast application pre-installed using the Hetzner Cloud API.

```APIDOC
## POST /v1/servers

### Description
Creates a new server instance with the Owncast application pre-installed. This allows for automated server provisioning via the Hetzner Cloud API.

### Method
POST

### Endpoint
`https://api.hetzner.cloud/v1/servers`

### Parameters
#### Request Body
- **name** (string) - Required - The name of the server.
- **server_type** (string) - Required - The type of server to create (e.g., `cpx21`).
- **image** (string) - Required - The image to use for the server. For Owncast, this should be `owncast`.

### Request Example
```json
{
  "name": "my-owncast-server",
  "server_type": "cpx21",
  "image": "owncast"
}
```

### Response
#### Success Response (201 Created)
- **server** (object) - Details of the created server.
  - **id** (integer) - The unique identifier for the server.
  - **name** (string) - The name of the server.
  - **status** (string) - The current status of the server.

#### Response Example
```json
{
  "server": {
    "id": 123456,
    "name": "my-owncast-server",
    "status": "creating"
  }
}
```
```

--------------------------------

### Create Hetzner Server with Coolify via API

Source: https://docs.hetzner.com/cloud/apps/list/coolify

This snippet demonstrates how to create a new Hetzner Cloud server with Coolify pre-installed using the Hetzner Cloud API. It requires an API token for authentication and specifies server name, type, and image. The command uses curl for direct API interaction.

```bash
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-coolify-server", "server_type":"cpx11", "image":"coolify"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Create Server with Docker CE via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/docker-ce

This snippet demonstrates how to create a new server pre-installed with the Docker CE app using a curl command with the Hetzner Cloud API. It requires an API token for authentication and specifies the server name, type, and image.

```bash
curl \
	-X POST \
	-H "Authorization: Bearer $API_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"name":"my-server", "server_type":"cpx21", "image":"docker-ce"}' \
	'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Copy System Files to Hetzner Server using SCP

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-partition

This command copies configuration files from the local machine to a Hetzner cloud server using SCP (Secure Copy Protocol). It requires an SSH private key for authentication and specifies the source files and destination path on the remote server.

```bash
scp -i ~/.ssh/migrate-backups /etc/fstab root@203.0.113.1:/etc/fstab
scp -i ~/.ssh/migrate-backups -r /etc/netplan root@203.0.113.1:/etc/netplan
scp -i ~/.ssh/migrate-backups /etc/network/interfaces root@203.0.113.1:/etc/network/interfaces
scp -i ~/.ssh/migrate-backups /etc/default/grub root@203.0.113.1:/etc/default/grub
scp -i ~/.ssh/migrate-backups -r /boot/grub root@203.0.113.1:/boot/grub
```

--------------------------------

### Create Server with WordPress Image via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/wordpress

This snippet demonstrates how to create a new Hetzner Cloud server with the 'wordpress' image pre-installed using a curl command. It requires an API token for authentication and specifies server name and type. The output is a JSON object representing the created server.

```shell
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-server", "server_type":"cpx21", "image":"wordpress"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Create Server with Docker CE via Hetzner Cloud CLI (hcloud)

Source: https://docs.hetzner.com/cloud/apps/list/docker-ce

This snippet shows how to create a new server with the Docker CE app pre-installed using the hcloud CLI tool. It's a simpler alternative to using curl for interacting with the Hetzner Cloud API.

```bash
hcloud server create --name my-server --type cpx21 --image docker-ce
```

--------------------------------

### Create RustDesk Server via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/rustdesk

This snippet demonstrates how to create a new Hetzner Cloud server with the RustDesk image pre-installed using a curl command. It requires an API token and specifies the server name and type.

```shell
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-rustdesk-server", "server_type":"cpx11", "image":"rustdesk"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Query Registry for Time Synchronization Setting (Windows)

Source: https://docs.hetzner.com/cloud/servers/windows-on-cloud

Queries the Windows registry to verify if the RealTimeIsUniversal setting for UTC synchronization has been applied successfully. This command should be run after restarting the server and applying the registry change.

```batch
reg query "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\TimeZoneInformation" /s
```

--------------------------------

### Create Server with WordPress Image via Hetzner Cloud CLI (hcloud-cli)

Source: https://docs.hetzner.com/cloud/apps/list/wordpress

This command utilizes the hcloud-cli tool to create a Hetzner Cloud server with the 'wordpress' image. It is a simpler alternative to the curl command, specifying the server name, type, and image directly. This command provisions a new server instance.

```shell
hcloud server create --name my-server --type cpx21 --image wordpress
```

--------------------------------

### Configure Debian/Ubuntu Network with ifup

Source: https://docs.hetzner.com/cloud/servers/how-to-upgrade-network-model

This snippet shows how to configure network interfaces on Debian/Ubuntu systems using the `ifup` method. It sets up DHCP for IPv4 and a static configuration for IPv6, including the server's IPv6 subnet, netmask, and gateway. It also notes the use of predictable network names.

```bash
auto eth0

iface eth0 inet dhcp

iface eth0 inet6 static
    address <server IPv6 subnet>::1
    netmask 64
    gateway fe80::1
```

--------------------------------

### Backup Users, Permissions, and SSH Directories (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Saves user account information (passwd, group, shadow, sudoers) and SSH configuration directories from existing users to tar.gz archives. Requires root privileges. Assumes backups are stored in '/home/holu/backups/'.

```bash
sudo su
cd /etc && sudo tar -czvf /home/holu/backups/users-and-permissions.tar.gz -P passwd group shadow sudoers
sudo tar czvf /home/holu/backups/ssh-directories.tar.gz $(find /home -maxdepth 3 -type d -name ".ssh")
exit
```

--------------------------------

### Create RustDesk Server via Hetzner Cloud CLI (hcloud)

Source: https://docs.hetzner.com/cloud/apps/list/rustdesk

This snippet shows how to create a new Hetzner Cloud server with the RustDesk image using the hcloud command-line interface. It specifies the server name, type, and image.

```shell
hcloud server create --name my-rustdesk-server --type cpx11 --image rustdesk
```

--------------------------------

### Create Server with WireGuard App via Hetzner Cloud API

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

This section details how to provision a new Hetzner server with the WireGuard app pre-installed using the Hetzner Cloud API.

```APIDOC
## POST /v1/servers

### Description
Creates a new server instance with specified configurations, including pre-installed applications like WireGuard.

### Method
POST

### Endpoint
https://api.hetzner.cloud/v1/servers

### Parameters
#### Request Body
- **name** (string) - Required - The name for the new server.
- **server_type** (string) - Required - The type of server to create (e.g., "cpx11").
- **image** (string) - Required - The image to use for the server. Use "wireguard" for the WireGuard app.

### Request Example
```json
{
  "name": "my-server",
  "server_type": "cpx11",
  "image": "wireguard"
}
```

### Response
#### Success Response (201 Created)
- **server** (object) - The newly created server object.
  - **id** (integer) - The unique identifier for the server.
  - **name** (string) - The name of the server.
  - **status** (string) - The current status of the server.

#### Response Example
```json
{
  "server": {
    "id": 12345,
    "name": "my-server",
    "status": "creating"
  }
}
```
```

--------------------------------

### Create Nextcloud Server via Hetzner Cloud CLI (hcloud-cli)

Source: https://docs.hetzner.com/cloud/apps/list/nextcloud

This command uses the `hcloud-cli` to create a Hetzner Cloud server with the Nextcloud app pre-installed. It's a convenient alternative to the `curl` command for users who prefer a dedicated CLI tool. You specify the server name, type, and the 'nextcloud' image.

```bash
hcloud server create --name my-server --type cpx21 --image nextcloud
```

--------------------------------

### Backup Personal Data (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Creates a compressed tar archive of a specified file or directory. This command is used to back up personal data that needs to be migrated.

```bash
sudo tar -cvzf ~/backups/example-dir.tar.gz /file/or/directory/to/save
```

--------------------------------

### Copy Backups via SCP (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Securely copies the entire '~/backups' directory from the local server to the root user's home directory on a remote Hetzner Cloud server using the generated SSH key. Requires the IP address of the new server.

```bash
scp -i ~/.ssh/migrate-backups -r ~/backups root@203.0.113.1:~/
```

--------------------------------

### Create WireGuard Server via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

This snippet demonstrates how to create a new server with the WireGuard app pre-installed using a curl command to the Hetzner Cloud API. It requires an API token and specifies server name, type, and image. The response will contain details of the newly created server.

```shell
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name": "my-server", "server_type":"cpx11", "image":"wireguard"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Create WireGuard Server via Hetzner Cloud CLI

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

This command uses the hcloud-cli to provision a new server with the WireGuard application. It's a convenient alternative to the API for command-line users, requiring similar parameters like server name, type, and image.

```shell
hcloud server create --name my-server --type cpx11 --image wireguard
```

--------------------------------

### Backup Firewall Rules (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Saves the current iptables and ip6tables firewall rules to text files. These commands are typically run with root privileges.

```bash
sudo iptables-save > ~/backups/iptables_backup.txt
sudo ip6tables-save > ~/backups/iptables6_backup.txt
```

--------------------------------

### Update Caddy Web Server Binary

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

This snippet shows how to update the Caddy web server by downloading the latest Linux AMD64 binary and extracting it to the `/usr/local/bin` directory. This process is manual as Caddy is not updated via package managers like apt.

```bash
tar -C /usr/local/bin -xzf caddy_*_linux_amd64.tar.gz caddy
```

--------------------------------

### Create GitLab Server via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/gitlab-ce

This snippet demonstrates how to create a new server with the GitLab image pre-installed using a curl command. It requires an API token and specifies the server name, type, and image. The output is a JSON response from the API.

```shell
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-server", "server_type":"cpx31", "image":"gitlab"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Add Registry Key for Time Synchronization (Windows)

Source: https://docs.hetzner.com/cloud/servers/windows-on-cloud

Adds a registry entry to synchronize Windows server time with UTC. This is necessary because Hetzner Cloud hosts use UTC, which can cause discrepancies in Windows vServers. The command requires administrator privileges and a server restart.

```batch
reg add "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\TimeZoneInformation" /v RealTimeIsUniversal /d 1 /t REG_DWORD /f
```

--------------------------------

### Restore Firewall Rules (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Restores the saved iptables and ip6tables firewall rules on the new Hetzner server from the backup text files. Assumes backup files are in '~/backups/'.

```bash
iptables-restore < ~/backups/iptables_backup.txt
ip6tables-restore < ~/backups/iptables6_backup.txt
```

--------------------------------

### Create Nextcloud Server via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/nextcloud

This snippet demonstrates how to provision a new Hetzner Cloud server with the Nextcloud image pre-installed using a `curl` command. It requires an API token for authentication and specifies server name, type, and the 'nextcloud' image. This method is useful for scripting server deployments.

```bash
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-server", "server_type":"cpx21", "image":"nextcloud"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Connect VPN clients

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

Instructions on how to add and manage WireGuard VPN clients through the WireGuard UI.

```APIDOC
## WireGuard Client Management

### Description
This section outlines the process for adding new VPN clients and applying configuration changes in the WireGuard management UI.

### Process
1.  **Add New Client**: Navigate to the management UI and fill in the 'Name' field for the new client. Other fields can be left at their default values.
2.  **Apply Configuration**: After adding clients or making any changes, it is crucial to click the '_Apply config_' button. This action ensures that the new client configurations are activated and clients can connect.
3.  **Client Connection Methods**:
    *   **QR Code**: Use the '_QR code_' button to generate a scannable code for mobile WireGuard apps (Android/iOS).
    *   **Download Config**: Alternatively, click '_Download_' to get a configuration file for connecting from desktop clients (PC/Mac).

### Important Note
Always remember to click '_Apply config_' after any modifications to the client list or settings. Failure to do so will prevent new clients from connecting.
```

--------------------------------

### Trace Server Location using Command Line

Source: https://docs.hetzner.com/general/others/data-centers-and-connection

Commands to trace the network path to a server and identify its data center location based on hop names. Supported on Windows and Linux operating systems. The output reveals the data center initials in the hop names.

```windows
tracert <your_IP>
```

```linux
traceroute <your_IP>
```

```text
2   217.0.117.200 (217.0.117.200)			18.149 ms  17.080 ms  16.750 ms
3   87.190.176.130 (87.190.176.130)			17.602 ms  17.786 ms  17.778 ms
4   217.239.47.14 (217.239.47.14)			21.653 ms  21.880 ms  22.086 ms
5   ae8-0.fra20.core-backbone.com (62.157.251.158)	31.661 ms  22.087 ms  22.106 ms
6   ae1-2014.nbg40.core-backbone.com (81.95.15.206)	26.164 ms  23.759 ms  24.207 ms
7   core-backbone-100g-nbg.hetzner.de (81.95.15.6)	25.032 ms  25.771 ms  25.485 ms
8   core11.nbg1.hetzner.com (213.239.229.161)		26.463 ms  26.234 ms  26.000 ms
9   core22.fsn1.hetzner.com (213.239.245.213)		27.311 ms  25.535 ms  25.825 ms
10  ex9k2.**dc3.fsn1**.hetzner.com (213.239.229.246)	26.027 ms  26.072 ms  26.317 ms
11  eigenerServer (vvv.xxx.yyy.zzz)			26.959 ms  26.807 ms  26.958 ms
```

--------------------------------

### Create Owncast Server via Hetzner Cloud CLI (hcloud-cli)

Source: https://docs.hetzner.com/cloud/apps/list/owncast

This snippet shows how to create a new Owncast server instance using the hcloud-cli command-line tool. It's a simpler alternative to using curl for API interactions.

```shell
hcloud server create --name my-owncast-server --type cpx21 --image owncast
```

--------------------------------

### Create Resource X

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

This endpoint allows for the creation of a new resource. It accepts various properties including name, associated resource ID, labels, and a flag to control deletion.

```APIDOC
## POST /websites/hetzner

### Description
Allows for the creation of a new resource with specified properties such as name, associated resource ID, labels, and a deletion control flag.

### Method
POST

### Endpoint
`https://api.hetzner.cloud/v1/{api-url-ending}`

### Parameters
#### Request Body
- **name** (string) - Required - Name of the resource.
- **resource_y** (integer) - Required - ID of Resource Y to associate with Resource X.
- **labels** (object) - Optional - User-defined labels (key-value pairs).
  - **labelkey** (string) - Required - New label key.
- **delete** (boolean) - Optional - If true, prevents the resource from being deleted.
- **description** (string) - Optional (nullable) - Description of the resource.

### Request Example
```json
{
  "name": "my-resource",
  "resource_y": 18,
  "labels": {
    "labelkey": "my-label"
  },
  "delete": true,
  "description": null
}
```

### Response
#### Success Response (200)
- **id** (integer) - The unique identifier of the created resource.
- **name** (string) - The name of the created resource.
- **created** (string) - The timestamp of resource creation.

#### Response Example
```json
{
  "resource": {
    "id": 123,
    "name": "my-resource",
    "created": "2023-10-27T10:00:00Z"
  }
}
```
```

--------------------------------

### Static IP Configuration for Ubuntu (netplan)

Source: https://docs.hetzner.com/cloud/servers/static-configuration

Sets up static IPv4 and IPv6 addresses for Ubuntu using netplan. This involves editing the `/etc/netplan/50-cloud-init.yaml` file and applying the changes with netplan commands.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
      - <your IPv4 address>/32
      - <one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>/64
      routes:
      - to: 0.0.0.0/0
        via: 172.31.1.1
        on-link: true
      - to: default
        via: fe80::1
      match:
        macaddress: YOUR:MAC:ADDRESS
      set-name: eth0
```

```bash
sudo netplan generate
sudo netplan try
```

--------------------------------

### Restart Hetzner Cloud Server

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-partition

This command initiates a system reboot for the Hetzner cloud server. After the restart, the server should be accessible without rescue mode, and all migrated data should be available.

```bash
reboot
```

--------------------------------

### Restore User and SSH Data (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Extracts user account information and SSH configuration directories from backup archives into their respective system locations (/etc and /) on the new Hetzner server. Assumes backup files are in '~/backups/'.

```bash
tar -xvf ~/backups/users-and-permissions.tar.gz -C /etc
tar -xzvf ~/backups/ssh-directories.tar.gz -C /
```

--------------------------------

### Copy Partitions from Old to New Server using DD

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-partition

These commands utilize `dd` to copy data block by block from partitions on an old server to partitions on a new Hetzner cloud server. This is a low-level disk copy operation. Ensure the correct source and destination partition names are used, and that the new server has sufficient disk space.

```bash
ssh -i ~/.ssh/migrate-backups root@<old_server> "dd bs=4M if=/dev/<old-root-partition> status=progress" | dd bs=4M of=/dev/sda1
ssh -i ~/.ssh/migrate-backups root@<old_server> "dd bs=4M if=/dev/<old-efi-partition> status=progress" | dd bs=4M of=/dev/sda14
ssh -i ~/.ssh/migrate-backups root@<old_server> "dd bs=4M if=/dev/<old-boot-partition> status=progress" | dd bs=4M of=/dev/sda15
```

--------------------------------

### Create Owncast Server via Hetzner Cloud API (curl)

Source: https://docs.hetzner.com/cloud/apps/list/owncast

This snippet demonstrates how to create a new Owncast server instance using the Hetzner Cloud API with a curl command. It requires an API token and specifies the server name, type, and image.

```shell
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-owncast-server", "server_type":"cpx21", "image":"owncast"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Restart Apache Service

Source: https://docs.hetzner.com/cloud/apps/list/nextcloud

This command restarts the Apache web server service. It is typically used after making configuration changes, such as activating a new SSL certificate with Let's Encrypt, to ensure the changes are applied correctly. This command requires root privileges.

```bash
systemctl restart apache2
```

--------------------------------

### Configure Ubuntu Network with Netplan

Source: https://docs.hetzner.com/cloud/servers/how-to-upgrade-network-model

This configuration is for Ubuntu systems using `netplan`. It defines network settings for the `eth0` interface, enabling DHCP for IPv4, setting a static IPv6 address derived from the server's IPv6 subnet, and specifying the IPv6 gateway. It also mentions the consideration of predictable network names.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
        - <IPv6 subnet>::1/64
      dhcp4: true
      gateway6: fe80::1
```

--------------------------------

### Create GitLab Server via Hetzner Cloud CLI (hcloud-cli)

Source: https://docs.hetzner.com/cloud/apps/list/gitlab-ce

This snippet shows how to create a server with the GitLab app using the hcloud-cli. It requires specifying the server name, type, and image. This is a convenient command-line alternative to the API.

```shell
hcloud server create --name my-server --type cpx31 --image gitlab
```

--------------------------------

### Connect to Redis via Command Line

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/redis

This command-line interface allows direct interaction with a Redis instance. It requires the path to the Redis socket file for connection.

```bash
redis-cli -s /run/redis_example/redis.sock
```

--------------------------------

### Configure IPv6 on Debian using ifupdown

Source: https://docs.hetzner.com/cloud/servers/primary-ips/primary-ip-configuration

This snippet demonstrates how to configure a primary IPv6 address on Debian-based distributions using the ifupdown networking system. It requires editing the '/etc/network/interfaces.d/50-cloud-init' file to add the IPv6 address and related gateway information.

```bash
# This file is generated from information provided by the datasource.  Changes
# to it will not persist across an instance reboot.  To disable cloud-init's
# network configuration capabilities, write a file
# /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg with the following:
# network: {config: disabled}
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp
   dns-nameservers 185.12.64.2 185.12.64.1

# control-alias eth0
iface eth0 inet6 static
   address <one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>/64
   dns-nameservers 2a01:4ff:ff00::add:1 2a01:4ff:ff00::add:2
   gateway fe80::1
```

--------------------------------

### Configure Floating IP on Ubuntu (netplan)

Source: https://docs.hetzner.com/cloud/floating-ips/persistent-configuration

This snippet demonstrates how to configure a Floating IP on Ubuntu systems utilizing netplan. It involves creating a YAML configuration file and applying the changes. Remember to substitute placeholder IP addresses with your actual Floating IP.

```yaml
network:
   version: 2
   renderer: networkd
   ethernets:
     eth0:
       addresses:
       - your.float.ing.ip/32
```

```yaml
network:
   version: 2
   renderer: networkd
   ethernets:
     eth0:
       addresses:
       - your.float.ing.ip/64
```

```shell
sudo netplan apply
```

--------------------------------

### Configure IPv6 on Ubuntu using Netplan

Source: https://docs.hetzner.com/cloud/servers/primary-ips/primary-ip-configuration

This snippet shows how to configure a primary IPv6 address on Ubuntu 20.04 or later by editing the netplan configuration file. It involves modifying the '/etc/netplan/50-cloud-init.yaml' file to include the new IPv6 address before assigning it to the server.

```yaml
# This file is generated from information provided by the datasource.  Changes
# to it will not persist across an instance reboot.  To disable cloud-init's
# network configuration capabilities, write a file
# /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg with the following:
# network: {config: disabled}
network:
   version: 2
   ethernets:
      eth0:
            addresses:
              - <one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>/64
            dhcp4: true
            routes:
            - to: default
              via: fe80::1
            match:
               macaddress: your-original-macaddress
            nameservers:
               addresses:
               - 2a01:4ff:ff00::add:2
               - 2a01:4ff:ff00::add:1
            set-name: eth0
```

--------------------------------

### Connect to Server via SSH (IPv6)

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-the-server

Command to initiate an SSH connection to your server using its IPv6 address. Use the first address of the assigned /64 network (e.g., `<2001:db8:1234::1>`). Do not include the network suffix `/64`. This is essential for servers with IPv6 enabled.

```bash
$ ssh root@<2001:db8:1234::1>
```

--------------------------------

### List Hetzner Cloud Apps via API (curl)

Source: https://docs.hetzner.com/cloud/apps/overview

This snippet uses curl to interact with the Hetzner Cloud API to retrieve a list of all available applications. It requires an API token for authentication and specifies the desired image type and architecture. The output is a JSON array of app objects.

```bash
curl \
    -H "Authorization: Bearer $API_TOKEN" \
    'https://api.hetzner.cloud/v1/images?type=app&architecture=x86'
```

--------------------------------

### Sending Emails with PHP mail() Function

Source: https://docs.hetzner.com/konsoleh/account-management/email/setting-up-an-email-account

This snippet demonstrates how to send emails using PHP's built-in `mail()` function. It highlights the importance of setting the 'From' and 'envelope-from' headers correctly in the optional parameters to avoid emails being flagged as spam. Ensure these headers are accurately configured, especially when sending to external servers which typically require port 587.

```php
mail('recipient@example.com',
     'subject',
     'message',
     'From: sender@example.com',
     '-f sender@example.com'
);
```

--------------------------------

### Configure SSH Root Login

Source: https://docs.hetzner.com/cloud/servers/faq

This snippet demonstrates how to modify the SSH daemon configuration to control root password authentication. It shows the configuration lines for disabling and enabling root login with password. This is relevant for security hardening or specific access requirements.

```shell
nano /etc/ssh/sshd_config
```

```shell
# Root password authentication is disabled
PermitRootLogin prohibit-password
```

```shell
# Root password authentication is allowed
PermitRootLogin yes
```

--------------------------------

### Restore Personal Data (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Extracts personal data from a tar.gz archive to a specified target directory on the new Hetzner server. The target directory must be provided.

```bash
tar -xvf ~/backups/example-dir.tar.gz -C /target/directory
```

--------------------------------

### Hetzner Cloud API Overview

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

This section details the general principles of using the Hetzner Cloud API, including authentication and the four main request types.

```APIDOC
## API Token Authentication

To use the API, you need an API token. Create a separate token for each project. Save the token after creation as it cannot be viewed again.

In examples, `$API_TOKEN` is used as a placeholder for your actual API token.

### Authorization Header Format
`Authorization: Bearer $API_TOKEN`

## Request Types

### GET
**Purpose**: Read information about available resources.
**Method**: GET
**Endpoint**: `https://api.hetzner.cloud/v1/{api-url-ending}`

### POST
**Purpose**: Create new resources and/or configure them.
**Method**: POST
**Endpoint**: `https://api.hetzner.cloud/v1/{api-url-ending}`
**Headers**: `Content-Type: application/json`
**Body**: `{"property":value,"property":value,...}`

### PUT
**Purpose**: Update the properties of an existing resource.
**Method**: PUT
**Endpoint**: `https://api.hetzner.cloud/v1/{api-url-ending}/{id}`
**Headers**: `Content-Type: application/json`
**Body**: `{"property":value,"property":value,...}`

### DELETE
**Purpose**: Delete an existing resource.
**Method**: DELETE
**Endpoint**: `https://api.hetzner.cloud/v1/{api-url-ending}/{id}`

## Constructing Curl Commands

To construct a curl command:
1. Identify the request type and API URL ending from the documentation (e.g., `GET /servers`).
2. Include the `Authorization` header.
3. For POST and PUT requests, include `Content-Type: application/json` and a request body (`-d`).

### Example Curl Command (GET Servers)
```bash
curl \
    -H "Authorization: Bearer $API_TOKEN" \
    'https://api.hetzner.cloud/v1/servers'
```

### Example Curl Command (POST Servers)
```bash
curl \
    -X POST \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"my-server","server_type":"cx11","location":"hel1"}' \
    'https://api.hetzner.cloud/v1/servers'
```

## Request Body Properties

Properties in POST and PUT requests can include fields like `name`, `type`, etc. Mandatory properties are marked as `required` in the detailed documentation. Use the format `"property":value` within the JSON body.
```

--------------------------------

### List Block Devices with Model and Serial for Volume Identification

Source: https://docs.hetzner.com/cloud/volumes/faq

A shell command to list all block devices attached to a cloud server, displaying their name, model, and serial number. This is useful for identifying Hetzner Cloud Volumes by their model ('Volume') and serial (Hetzner Console ID).

```shell
lsblk -So NAME,MODEL,SERIAL
```

--------------------------------

### Correct CNAME Record Syntax in Zone File

Source: https://docs.hetzner.com/dns-console/dns/general/faq

Illustrates the correct syntax for a CNAME record in a DNS zone file, emphasizing the necessity of a trailing period for external hostnames. Incorrect syntax can lead to domain resolution issues.

```dns
ftp      IN CNAME  ftp.andererserver.de.

```

--------------------------------

### Restart WireGuard UI and Caddy Services

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

This command restarts both the WireGuard UI and Caddy services. It's typically run after updating either the WireGuard UI binary or the Caddy web server to ensure all services are running with the latest versions and configurations.

```bash
systemctl restart wireguard-ui caddy
```

--------------------------------

### Edit SSH Config File with Nano

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-the-server

Command to open the SSH configuration file located at `~/.ssh/config` using the 'nano' text editor. This allows users to add or modify host entries for simplified SSH connections. Changes are saved using CTRL+X, Y, and ENTER.

```bash
nano ~/.ssh/config
```

--------------------------------

### Generate New SSH Key (Bash)

Source: https://docs.hetzner.com/cloud/servers/getting-started/migrate-data

Creates a new Ed25519 SSH key pair named 'migrate-backups' in the user's .ssh directory. This key is intended for the migration process.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/migrate-backups
```

--------------------------------

### Configure IPv6 on RHEL8-based distributions

Source: https://docs.hetzner.com/cloud/servers/primary-ips/primary-ip-configuration

This snippet outlines the configuration for a primary IPv6 address on RHEL8-based distributions like AlmaLinux and Rocky Linux. The configuration is done by editing the '/etc/sysconfig/network-scripts/ifcfg-eth0' file, specifying the IPv6 address, initialization, and gateway.

```bash
BOOTPROTO=dhcp
DEFROUTE=yes
DEVICE=eth0
DNS1=2a01:4ff:ff00::add:1
DNS2=185.12.64.1
HWADDR=<keep the HWADDR as is!!>
IPV6ADDR=<one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>/64
IPV6INIT=yes
IPV6_AUTOCONF=no
IPV6_DEFAULTGW=fe80::1
IPV6_FORCE_ACCEPT_RA=no
ONBOOT=yes
TYPE=Ethernet
USERCTL=no
```

--------------------------------

### Create Hetzner Server with Prometheus-Grafana (curl)

Source: https://docs.hetzner.com/cloud/apps/list/prometheus-grafana

This snippet demonstrates how to create a new Hetzner Cloud server pre-installed with Prometheus and Grafana using a curl command. It requires an API token and specifies server details like name, type, and image.

```bash
curl \
   -X POST \
   -H "Authorization: Bearer $API_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"name":"my-server", "server_type":"cpx21", "image":"prometheus-grafana"}' \
   'https://api.hetzner.cloud/v1/servers'
```

--------------------------------

### Configure GRUB for eth0 Naming

Source: https://docs.hetzner.com/cloud/servers/how-to-upgrade-network-model

This configuration snippet modifies the GRUB bootloader settings to force the use of `eth0` as the network interface name instead of predictable names like `ens3`. This is achieved by adding `net.ifnames=0` to the kernel command line. After editing, `update-grub` must be run to apply the changes.

```bash
GRUB_CMDLINE_LINUX="net.ifnames=0"
```

```bash
update-grub
```

--------------------------------

### Specify Node.js Version via SSH

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/nodejs

This command allows users to specify a desired Node.js version directly on the server via SSH without using the konsoleH interface. It sets the Node.js version for the user's account.

```shell
echo 24 > ~/.nodeversion
```

--------------------------------

### Connect to Server via SSH

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

Establish an SSH connection to a server using its private IP address. If an SSH key has been set up, the connection will be passwordless. Otherwise, you will be prompted for the root password.

```bash
$ ssh root@<10.2.0.3>
```

--------------------------------

### PostgreSQL SSL Certificate

Source: https://docs.hetzner.com/konsoleh/account-management/databases/postgresql

This is the SSL certificate provided for establishing encrypted connections to your PostgreSQL database. Save this content to a file (e.g., sqlca.pem) to use with your connection strings. Note that encrypted connections may be slower, and client certificates are not supported.

```text
-----BEGIN CERTIFICATE-----
MIIG7jCCBNagAwIBAgIJAOHaB6/9NNBGMA0GCSqGSIb3DQEBCwUAMIGqMQswCQYD
VQQGEwJERTEPMA0GA1UECBMGQmF5ZXJuMRUwEwYDVQQHEwxHdW56ZW5oYXVzZW4x
GjAYBgNVBAoTEUhldHpuZXIgT25saW5lIEFHMRIwEAYDVQQLEwlEYXRhYmFzZXMx
GzAZBgNVBAMTEnNxbC55b3VyLXNlcnZlci5kZTEmMCQGCSqGSIb3DQEJARYXcm9v
ZEBzcWwueW91ci1zZXJ2ZXIuZGUwHhcNMjIwNjA3MTYyOTUyWhcNMzIwNjA0MTYy
OTUyWjCBqjELMAkGA1UEBhMCREUxDzANBgNVBAgTBkJheWVybjEVMBMGA1UEBxMM
R3VuemVuaGF1c2VuMRowGAYDVQQKExFIZXR6bmVyIE9ubGluZSBBRzESMBAGA1UE
CxMJRGF0YWJhc2VzMRswGQYDVQQDExJzcWwueW91ci1zZXJ2ZXIuZGUxJjAkBgkq
hkiG9w0BCQEWF3Jvb3RAc3FsLnlvdXItc2VydmVyLmRlMIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEAq1bzb3Mm4HlRNzf1xI1ssFIvaRjCu/ZpUYhh2Rk8
grexQWJ2ZNZtRqd8UPkIxGgJFuHbbfyf4N1QhC7uI/QqOf5VyPrE0WU75BBIvAhh
MH/xeBxvrrMHF/8yTg5RDS1heJ3Y5UzwSoVHvoNR8fOpcSQ1N3jHkSpZLNhUIky/
hSGdZMOaOUTk1IQbvCrvyIQB8QalCtc5fkg72PlX+ACeGfQGoM5jj+gyKfydQg6s
bPSatIxsKr7KcQxxsWRrV1BfROtxXDbDUwFDS1V7vEGzp7qQlyPLNvTVdH6Xk+U
eVT9I1TfTBq4nsVOjOaHUNC0QtRhTJpjyR/SE9MpRq0+d78LQ21wpYQNnB+ukjOK
TW4Slgr7Pk83cIGS5mJWDI786GiQ7LXFLrg3gyG1FiEATyDrfTrNkZQ9VRD/YSco
1pw84xUBwSwANKCrO+l4wFo8A7cSrYPQBpL/3RuxFap5BavX2MbuymK2MO2/8W0H
p8+wn5qnSt0BcrpeNV92UlBRaZHbnl+N/6oGXrt7lCScuRhIyHCftkEX/DQhwxvj
/lIWMWQTyceqQl9QLI7UkxcXsL7NoalO83CH6BP905mZs+PCL9DPagyMceKOLSwm
mWt05OIAECbqUotCqtLZhHcTB1Nnlqi/4VJiASEStzs7hkhCAZmaTkV0+X7quiQJ
l3MCAwEAAaOCARMwggEPMAwGA1UdEwQFMAMBAf8wHQYDVR0OBBYEFCf95RRu/ZgZ
iZIyQCLn7SKJFJFoMIHfBgNVHSMEgdcwgdSAFCf95RRu/ZgZiZIyQCLn7SKJFJFo
oYGwpIGtMIGqMQswCQYDVQQGEwJERTEPMA0GA1UECBMGQmF5ZXJuMRUwEwYDVQQH
EwxHdW56ZW5oYXVzZW4xGjAYBgNVBAoTEUhldHpuZXIgT25saW5lIEFHMRIwEAYD
VQQLEwlEYXRhYmFzZXMxGzAZBgNVBAMTEnNxbC55b3VyLXNlcnZlci5kZTEmMCQG
CSqGSIb3DQEJARYXcm9vdEBzcWwueW91ci1zZXJ2ZXIuZGWCCQDh2gev/TTQRjAN
BgkqhkiG9w0BAQsFAAOCAgEAYNs1ptU+SjBeDMtZY1gXUkoMYN/ujsNwLp64Si2z
De/md+XxQtN01t14MJn7yWdfPudl3WS3b4S9cXx5koLqjPBDk25R2Yb/klcj5AU7
H7bfPR/mHIj/1Xc3US6sEIE1oU3pjQvm6iYWuhKV41CQQAEGdjCS8Y4Y36aaNTB/
4NL4t8ZHE4JKuDHWYUArQcvubPt5yGjkspoFVPlV4ktkw+W2hjBvwCNflE+s8zKl
qEJy+izsxl6+tIz8UXK7++ocBZP4Wxc/GlZQ2g3NWWLMpK0r+4G1MKUs8f5yWsaL
Sswhs15rnN07X9DKbsmZboc0DT8QVqUYl5ErO/baG3Fd3cwk9vUJRDlCeHWKAQDM
Ne6171VKMBVcjd3u9IqL17j2JughrfelH5SfkX7VJnkcS7Gaf2ppJeyedgngLE3A
BeFDhAJ9rQdSAXAzeZC5/6YotR5tDaumYgWtGu5biNocY+f0OHNsuBjjQcIBC7MV
zZ5XET75IaY2LCbTz58a3KrImyYGjKt+WzGfemWHVx9TC6ZOmVXSuPzTevQvpY5q
Wgx7nM25JCPXjhtwS7uBQ+QDhlITYgwgMPyDzzEFUDAblInqgUnj3VfVLTQPx+sL
MZb5eNEJ0316JCcgZJ8HZ+iUL/QjFewpOL+MlMqvUbfLh9jT04BXzSFLT8Cry1Wb
X40=
-----END CERTIFICATE-----
```

--------------------------------

### Connect to Server via SSH (IPv4)

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-the-server

Command to initiate an SSH connection to your server using its IPv4 address. Replace `<203.0.113.1>` with your server's actual IPv4 address. This is a fundamental step for remote server management.

```bash
$ ssh root@<203.0.113.1>
```

--------------------------------

### Generate bcrypt Password Hash with Caddy CLI

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

This snippet demonstrates how to generate a bcrypt password hash using the Caddy command-line interface. The output is piped through `tr` to remove newlines and then base64 encoded for easy integration into configuration files. This is a crucial step for securely updating user passwords in WireGuard UI.

```bash
caddy hash-password --algorithm bcrypt | tr -d '\n' | base64 -w0 && echo
```

--------------------------------

### Static IP Configuration for FreeBSD

Source: https://docs.hetzner.com/cloud/servers/static-configuration

Sets up static IPv4 and IPv6 addresses for FreeBSD by modifying the `/etc/rc.conf` file. This includes defining interface configurations, static routes, and default IPv6 router.

```shell
ifconfig_vtnet0="<your IPv4 address>/32"
static_routes="gateway default"
route_gateway="-host 172.31.1.1 -interface em0"
route_default="default 172.31.1.1"
ifconfig_vtnet0_ipv6="inet6 <one IPv6 address from your subnet, e.g. 2a01:4f8:0::1>/64" disebabkan_ipv6_defaultrouter="fe80::1%vtnet0"
```

--------------------------------

### Configure CentOS/openSUSE Network

Source: https://docs.hetzner.com/cloud/servers/how-to-upgrade-network-model

This configuration targets CentOS and openSUSE systems. It involves removing the `route-eth0` file if it exists and modifying the `ifcfg-eth0` file to use DHCP for booting. It also instructs to remove specific IP configuration parameters like IPADDR, NETMASK, SCOPE, and BROADCAST.

```bash
BOOTPROTO=dhcp
```

--------------------------------

### Convert Public Key Format (Linux)

Source: https://docs.hetzner.com/konsoleh/account-management/access-details/login-data

Converts an OpenSSH public key to a different format, often required for specific server configurations. This command is used on Linux systems.

```bash
ssh-keygen -e -f ~/.ssh/id_rsa.pub
```

--------------------------------

### Configure Floating IP on RHEL-based systems (CentOS/Fedora)

Source: https://docs.hetzner.com/cloud/floating-ips/persistent-configuration

This snippet provides the configuration for setting up a Floating IP on RHEL-based distributions such as CentOS and Fedora. It involves creating an interface configuration file and restarting the network service. Replace placeholder values with your specific Floating IP details.

```shell
BOOTPROTO=static
DEVICE=eth0:1
IPADDR=your.Float.ing.IP
PREFIX=32
TYPE=Ethernet
USERCTL=no
ONBOOT=yes
```

```shell
BOOTPROTO=none
DEVICE=eth0:1
ONBOOT=yes
IPV6ADDR=one IPv6 address of the subnet, e.g. 2a01:4f9:0:2a1::2/64
IPV6INIT=yes
```

```shell
systemctl restart network
```

--------------------------------

### Resize Filesystem for Hetzner Cloud Volumes

Source: https://docs.hetzner.com/cloud/volumes/faq

Commands to enlarge the filesystem on a Hetzner Cloud Volume after resizing it. These commands are specific to the filesystem type and assume the volume is attached as /dev/sdb.

```shell
resize2fs /dev/sdb
```

```shell
xfs_growfs /dev/sdb
```

--------------------------------

### Create Hetzner Server with Prometheus-Grafana (hcloud-cli)

Source: https://docs.hetzner.com/cloud/apps/list/prometheus-grafana

This snippet shows how to create a Hetzner Cloud server with the Prometheus-Grafana image using the hcloud-cli tool. It specifies the server name, type, and the image name.

```bash
hcloud server create --name my-server --type cpx21 --image prometheus-grafana
```

--------------------------------

### Query Parameters

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

Query parameters can be used to refine the results of a request. They allow filtering by labels and sorting the returned resources.

```APIDOC
## Query Parameters

### Description
Query parameters allow you to filter and sort the resources returned by a request.

### Method
GET

### Endpoint
`https://api.hetzner.cloud/v1/{api-url-ending}`

### Parameters
#### Query Parameters
- **label_selector** (string) - Optional - Filters resources based on labels. Can be a key only or a key-value pair (e.g., `env` or `env=production`).
- **sort** (string) - Optional - Sorts the results. Accepts `field:direction` format (e.g., `id:asc`, `created:desc`).

### Request Example
* **Filtering by label and sorting by ID:**
  `https://api.hetzner.cloud/v1/floating_ips?label_selector=env&sort=id:asc`

### Response
#### Success Response (200)
- **resources** (array) - A list of resources matching the query parameters.

#### Response Example
```json
{
  "resources": [
    {
      "id": 101,
      "name": "example-resource",
      "labels": {
        "env": "production"
      }
    }
  ]
}
```
```

--------------------------------

### Restart WireGuard UI Service with systemctl

Source: https://docs.hetzner.com/cloud/apps/list/wireguard

This command restarts the WireGuard UI systemd service. This is necessary after making changes to its configuration files, such as updating the password hash in the users.json file, to ensure the new settings are applied.

```bash
systemctl restart wireguard-ui
```

--------------------------------

### Static IP Configuration for Debian (ifup)

Source: https://docs.hetzner.com/cloud/servers/static-configuration

Configures static IPv4 and IPv6 addresses for Debian using the ifup method. This involves editing the `/etc/network/interfaces` file and removing a cloud-init specific configuration file.

```bash
auto eth0
iface eth0 inet static
        address <your IPv4 address>
        netmask 255.255.255.255
        gateway 172.31.1.1
        pointopoint 172.31.1.1
        dns-nameservers 185.12.64.1 185.12.64.2

iface eth0 inet6 static
        address <one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>
        netmask 64
        gateway fe80::1
```

```bash
rm /etc/network/interfaces.d/50-cloud-init.cfg
```

--------------------------------

### Configure NetworkManager for Fedora/RHEL9 (Alma, CentOS, Rocky)

Source: https://docs.hetzner.com/cloud/servers/primary-ips/primary-ip-configuration

This snippet shows the configuration file for NetworkManager on Fedora/RHEL9-based systems. It allows manual assignment of IPv4 and IPv6 addresses, DNS servers, and other network parameters. Ensure to retain the existing UUID and MAC address.

```ini
[connection]
id=cloud-init eth0
uuid=<keep the UUID as is!!>
type=ethernet

[ethernet]
mac-address=<keep the HWADDR as is!!>

[ipv4]
address1=<your IPv4 address>/32,172.31.1.1
dns=185.12.64.1;185.12.64.2;
may-fail=false
method=manual

[ipv6]
address1=<one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>/64,fe80::1
dns=2a01:4ff:ff00::add:1;2a01:4ff:ff00::add:2;
may-fail=false
method=manual

[proxy]

[user]
org.freedesktop.NetworkManager.origin=cloud-init

```

--------------------------------

### Set PHP Upload File Size with .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/php-faq

This snippet demonstrates how to set the maximum file size for uploads and POST data in PHP using .htaccess directives. It ensures that both 'post_max_size' and 'upload_max_filesize' are configured to handle larger files. No external dependencies are required, and the changes take effect after the web server reloads the configuration.

```apache
php_value post_max_size 200M
php_value upload_max_filesize 200M
```

--------------------------------

### Configure PHP Include Path with .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/development/own-version-of-pear

This configuration snippet is used in an .htaccess file to modify the PHP include_path. It allows you to specify a custom directory for PEAR packages. Ensure you replace FTP_LOGINNAME and PATH_TO_PEAR with your specific account details and package directory.

```apache
php_value include_path /usr/www/users/FTP_LOGINNAME/PATH_TO_PEAR:.:/usr/local/lib/php/
```

--------------------------------

### Temporarily Configure Floating IPv6

Source: https://docs.hetzner.com/cloud/floating-ips/faq

This command adds the first IPv6 address from a Floating IPv6 netblock to a server's network interface temporarily. It will not persist after a reboot. The command requires the specific IPv6 address and the network device name.

```bash
ip addr add 2a01:4f8:2c17:2c::1/128 dev eth0
```

--------------------------------

### Hetzner Database SSL Certificate

Source: https://docs.hetzner.com/konsoleh/account-management/databases/mysql

The SSL certificate provided by Hetzner for establishing encrypted connections to your database. This certificate should be saved locally (e.g., as 'sqlca.pem') and used by your client applications.

```pem
-----BEGIN CERTIFICATE-----
MIIG7jCCBNagAwIBAgIJAOHaB6/9NNBGMA0GCSqGSIb3DQEBCwUAMIGqMQswCQYD
VQQGEwJERTEPMA0GA1UECBMGQmF5ZXJuMRUwEwYDVQQHEwxHdW56ZW5oYXVzZW4x
GjAYBgNVBAoTEUhldHpuZXIgT25saW5lIEFHMRIwEAYDVQQLEwlEYXRhYmFzZXMx
GzAZBgNVBAMTEnNxbC55b3VyLXNlcnZlci5kZTEmMCQGCSqGSIb3DQEJARYXcm9v
dEBzcWwueW91ci1zZXJ2ZXIuZGUwHhcNMjIwNjA3MTYyOTUyWhcNMzIwNjA0MTYy
OTUyWjCBqjELMAkGA1UEBhMCREUxDzANBgNVBAgTBkJheWVybjEVMBMGA1UEBxMM
R3VuemVuaGF1c2VuMRowGAYDVQQKExFIZXR6bmVyIE9ubGluZSBBRzESMBAGA1UE
CxMJRGF0YWJhc2VzMRswGQYDVQQDExJzcWwueW91ci1zZXJ2ZXIuZGUxJjAkBgkq
hkiG9w0BCQEWF3Jvb3RAc3FsLnlvdXItc2VydmVyLmRlMIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEAq1bzb3Mm4HlRNzf1xI1ssFIvaRjCu/ZpUYhh2Rk8
grexQWJ2ZNZtRqd8UPkIxGgJFuHbbfyf4N1QhC7uI/QqOf5VyPrE0WU75BBIvAhh
MH/xeBxvrrMHF/8yTg5RDS1heJ3Y5UzwSoVHvoNR8fOpcSQ1N3jHkSpZLNhUIky/
hSGdZMOaOUTk1IQbvCrvyIQB8QalCtc5fkg72PlX+ACeGfQGoM5jj+gyKfydQg6s
bPSatIxsKr7KcQxxsWRrV1BfROtxXDbDUwFDS1V7vEGzp7qQlyPLNvTVdH6Xk+U
eVT9I1TfTBq4nsVOjOaHUNC0QtRhTJpjyR/SE9MpRq0+d78LQ21wpYQNnB+ukjOK
TW4Slgr7Pk83cIGS5mJWDI786GiQ7LXFLrg3gyG1FiEATyDrfTrNkZQ9VRD/YSco
1pw84xUBwSwANKCrO+l4wFo8A7cSrYPQBpL/3RuxFap5BavX2MbuymK2MO2/8W0H
p8+wn5qnSt0BcrpeNV92UlBRaZHbnl+N/6oGXrt7lCScuRhIyHCftkEX/DQhwxvj
/lIWMWQTyceqQl9QLI7UkxcXsL7NoalO83CH6BP905mZs+PCL9DPagyMceKOLSwm
mWt05OIAECbqUotCqtLZhHcTB1Nnlqi/4VJiASEStzs7hkhCAZmaTkV0+X7quiQJ
l3MCAwEAAaOCARMwggEPMAwGA1UdEwQFMAMBAf8wHQYDVR0OBBYEFCf95RRu/ZgZ
iZIyQCLn7SKJFJFoMIHfBgNVHSMEgdcwgdSAFCf95RRu/ZgZiZIyQCLn7SKJFJFo
oYGwpIGtMIGqMQswCQYDVQQGEwJERTEPMA0GA1UECBMGQmF5ZXJuMRUwEwYDVQQH
EwxHdW56ZW5oYXVzZW4xGjAYBgNVBAoTEUhldHpuZXIgT25saW5lIEFHMRIwEAYD
VQQLEwlEYXRhYmFzZXMxGzAZBgNVBAMTEnNxbC55b3VyLXNlcnZlci5kZTEmMCQG
CSqGSIb3DQEJARYXcm9vdEBzcWwueW91ci1zZXJ2ZXIuZGWCCQDh2gev/TTQRjAN
BgkqhkiG9w0BAQsFAAOCAgEAYNs1ptU+SjBeDMtZY1gXUkoMYN/ujsNwLp64Si2z
De/md+XxQtN01t14MJn7yWdfPudl3WS3b4S9cXx5koLqjPBDk25R2Yb/klcj5AU7
H7bfPR/mHIj/1Xc3US6sEIE1oU3pjQvm6iYWuhKV41CQQAEGdjCS8Y4Y36aaNTB/
4NL4t8ZHE4JKuDHWYUArQcvubPt5yGjkspoFVPlV4ktkw+W2hjBvwCNflE+s8zKl
qEJy+izsxl6+tIz8UXK7++ocBZP4Wxc/GlZQ2g3NWWLMpK0r+4G1MKUs8f5yWsaL
Sswhs15rnN07X9DKbsmZboc0DT8QVqUYl5ErO/baG3Fd3cwk9vUJRDlCeHWKAQDM
Ne6171VKMBVcjd3u9IqL17j2JughrfelH5SfkX7VJnkcS7Gaf2ppJeyedgngLE3A
BeFDhAJ9rQdSAXAzeZC5/6YotR5tDaumYgWtGu5biNocY+f0OHNsuBjjQcIBC7MV
zZ5XET75IaY2LCbTz58a3KrImyYGjKt+WzGfemWHVx9TC6ZOmVXSuPzTevQvpY5q
Wgx7nM25JCPXjhtwS7uBQ+QDhlITYgwgMPyDzzEFUDAblInqgUnj3VfVLTQPx+sL
MZb5eNEJ0316JCcgZJ8HZ+iUL/QjFewpOL+MlMqvUbfLh9jT04BXzSFLT8Cry1Wb
X40=
-----END CERTIFICATE-----
```

--------------------------------

### Specify Redis Socket Path in Applications

Source: https://docs.hetzner.com/konsoleh/account-management/configuration/redis

This string format specifies the protocol and path to the Unix socket for connecting to a Redis instance from applications. It ensures the application can locate and communicate with the Redis server.

```text
unix:/run/redis_<account_login>/redis.sock
```

--------------------------------

### Configure Floating IP on Debian/Ubuntu (ifupdown)

Source: https://docs.hetzner.com/cloud/floating-ips/persistent-configuration

This snippet configures a Floating IP for Debian/Ubuntu systems using the ifupdown network configuration system. It requires creating a new configuration file and restarting the network service. Ensure you replace placeholders with your actual Floating IP.

```shell
auto eth0:1
iface eth0:1 inet static
    address your.Float.ing.IP
    netmask 32
```

```shell
auto eth0:1
iface eth0:1 inet6 static
    address one IPv6 address of the subnet, e.g. 2a01:4f9:0:2a1::2
    netmask 64
```

```shell
sudo service networking restart
```

--------------------------------

### Redirect Addon Domain to Main Domain using Mod_Rewrite

Source: https://docs.hetzner.com/konsoleh/account-management/development/redirection-of-a-domain

This code snippet configures a redirect from an addon domain to a main domain. It uses Apache's mod_rewrite module and is placed in an .htaccess file. This is useful for ensuring a consistent URL is displayed in the browser's address bar. The input is a request to the addon domain, and the output is a 301 redirect to the main domain.

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?addon-domain\.de [NC]
RewriteRule (.*) http://www.main-domain.de/$1 [R=301,L]
```

--------------------------------

### SSH Configuration for Hetzner Servers

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

This configuration snippet sets up SSH client options for connecting to Hetzner servers. It specifies preferred authentication methods and enables proxy jumping to connect to servers without public IPs. Ensure you replace placeholder IP addresses with your actual server IPs.

```sshconfig
PreferredAuthentications publickey
ProxyJump server-public-ip
```

--------------------------------

### Generate OpenSSH Key Pair (Linux)

Source: https://docs.hetzner.com/konsoleh/account-management/access-details/login-data

Generates an OpenSSH key pair for secure connections. This command is typically used on Linux systems.

```bash
ssh-keygen
```

--------------------------------

### Customize Content Compression Rules with .htaccess

Source: https://docs.hetzner.com/konsoleh/account-management/development/content-compression

This snippet provides Apache configuration directives for a .htaccess file to customize content compression using mod_deflate. It defines filters to compress various text and JavaScript MIME types. Ensure mod_deflate is enabled on your server.

```apache
FilterDeclare COMPRESS
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'text/html*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'text/plain*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'text/xml*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'text/css*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'application/x-javascript*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'application/javascript*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'application/ecmascript*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'text/javascript*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'application/rss+xml*'"
FilterProvider COMPRESS DEFLATE "% {Content_Type} -strmatch 'application/json*'"
FilterChain COMPRESS
FilterProtocol COMPRESS DEFLATE change=yes;byteranges=no
```

--------------------------------

### Create SSH Key Pair

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

Generate a new SSH key pair on your server with a public IP address. This command creates an ed25519 type key pair, with the public key saved as '~/.ssh/id_ed25519.pub'.

```bash
ssh-keygen -t ed25519
```

--------------------------------

### Hetzner API Authorization Header

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

This snippet shows the required header format for authenticating requests to the Hetzner Cloud API using a bearer token. The API token is project-specific and must be replaced with your actual token.

```shell
-H "Authorization: Bearer $API_TOKEN" \

```

```shell
-H "Authorization: Bearer jEheVytlAoFl7F8MqUQ7jAo2hOXASztX" \

```

--------------------------------

### Temporarily Configure Floating IPv4

Source: https://docs.hetzner.com/cloud/floating-ips/faq

This command adds a Floating IPv4 address to a server's network interface temporarily. It will not persist after a reboot. The command requires the Floating IP address and the network device name.

```bash
ip addr add 1.2.3.4/32 dev eth0
```

--------------------------------

### Disable Temporary IPv6 Addresses (Windows Server 2008R2)

Source: https://docs.hetzner.com/cloud/servers/windows-on-cloud

Disables the use of temporary IPv6 addresses and randomizes identifiers on Windows Server 2008R2 using netsh commands. This ensures proper functionality with /64 IPv6 networks. Requires cmd.exe with administrator rights.

```batch
netsh interface ipv6 set global randomizeidentifiers=disabled store=active
netsh interface ipv6 set global randomizeidentifiers=disabled store=persistent
netsh interface ipv6 set privacy state=disabled store=active
netsh interface ipv6 set privacy state=disabled store=persistent
```

--------------------------------

### Configure Floating IP on Fedora 38 (NetworkManager)

Source: https://docs.hetzner.com/cloud/floating-ips/persistent-configuration

This snippet shows how to configure a Floating IP on Fedora 38 using NetworkManager. It involves editing an existing connection file, ensuring you keep the original UUID and MAC address. Replace placeholder IPs with your actual Floating IP.

```ini
[connection]
id=cloud-init eth0
uuid=<keep the UUID as is!!>
type=ethernet

[ethernet]
mac-address=<keep the HWADDR as is!!>

[ipv4]
address1=<your IPv4 address>/32,172.31.1.1
address2=<your floating ip>/32
dns=185.12.64.1;185.12.64.2;
may-fail=false
method=manual

[ipv6]
address1=<one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>/64,fe80::1
dns=2a01:4ff:ff00::add:1;2a01:4ff:ff00::add:2;
may-fail=false
method=manual

[proxy]

[user]
org.freedesktop.NetworkManager.origin=cloud-init
```

--------------------------------

### Disable Temporary IPv6 Addresses (Windows Server 2012+)

Source: https://docs.hetzner.com/cloud/servers/windows-on-cloud

Disables the use of temporary IPv6 addresses and randomizes identifiers on Windows Server 2012, 2012R2, and 2016. This is required to properly utilize /64 IPv6 networks. Requires PowerShell with administrator rights.

```powershell
Set-NetIPv6Protocol -RandomizeIdentifiers Disabled
Set-NetIPv6Protocol -UseTemporaryAddresses Disabled
```

--------------------------------

### Configure Specific Cache Lifetimes with mod_expires

Source: https://docs.hetzner.com/konsoleh/account-management/development/cache-lifetime

Configures specific cache lifetimes for different file types using Apache's mod_expires module. It demonstrates setting a 1-hour cache for images (like GIF) and text/html files, and a 4-minute cache for plain text files.

```apache
ExpiresActive on 
ExpiresDefault "now plus 1 hour" 
ExpiresByType image/gif "access plus 1 hour" 
ExpiresByType text/html "access plus 4 minutes" 
ExpiresByType text/plain "access plus 4 minutes"
```

--------------------------------

### Static IP Configuration for CentOS/Fedora (NetworkManager)

Source: https://docs.hetzner.com/cloud/servers/static-configuration

Configures static IPv4 and IPv6 addresses for CentOS/Fedora using NetworkManager. This involves editing the connection profile file and restarting the network connection.

```ini
[connection]
id=cloud-init eth0
uuid=<keep the UUID as is!!>
type=ethernet

[ethernet]
mac-address=<keep the HWADDR as is!!>

[ipv4]
address1=<your IPv4 address>/32,172.31.1.1
dns=185.12.64.1;185.12.64.2;
may-fail=false
method=manual

[ipv6]
address1=<one IPv6 address from your subnet, e.g. 2001:db8:0:3df1::1>/64,fe80::1
dns=2a01:4ff:ff00::add:1;2a01:4ff:ff00::add:2;
may-fail=false
method=manual

[proxy]

[user]
org.freedesktop.NetworkManager.origin=cloud-init
```

```bash
nmcli connection down "cloud-init eth0" ; nmcli connection up "cloud-init eth0"
```

--------------------------------

### Connect to Server via SSH using IPv6

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

This command connects to a server using SSH with its public IPv6 address. Use the first address (e.g., '::1') of the server's assigned /64 network, not the entire network range. Replace the placeholder with the actual IPv6 address.

```bash
ssh root@<2001:db8:1234::1>
```

--------------------------------

### Hetzner API POST Request Structure

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

The structure for a POST request to the Hetzner Cloud API, used for creating new resources. It includes the request type, authorization header, content type, and a JSON data payload. Replace `{api-url-ending}` with the specific API endpoint.

```shell
curl \
-X POST \
-H "Authorization: Bearer $API_TOKEN" \
-H "Content-Type: application/json" \
-d '{"property":value,"property":value,...}' \
'https://api.hetzner.cloud/v1/{api-url-ending}'
```

--------------------------------

### Setting Sender in PHPMailer

Source: https://docs.hetzner.com/konsoleh/account-management/email/setting-up-an-email-account

This snippet shows how to set the sender's email address and name when using the PHPMailer library for sending emails. This method provides a structured way to configure email headers, similar to the `mail()` function's optional parameters, ensuring better deliverability and avoiding spam filters.

```php
$mail->SetFrom('sender@example.com', 'Name Surname');
```

--------------------------------

### SSH Config File Entry with ProxyJump

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

This configuration demonstrates the use of 'ProxyJump' to connect to a server through an intermediate host. The connection to 'unique-name-2' will first establish a connection to 'unique-name-1' and then jump to the 'HostName' specified for 'unique-name-2'.

```sshconfig
Host unique-name-1
        HostName 203.0.113.1
        User root
        PreferredAuthentications publickey

Host unique-name-2
        HostName 10.2.0.3
        User root
        ProxyJump unique-name-1
```

--------------------------------

### Generate Prometheus Password Hash (Docker)

Source: https://docs.hetzner.com/cloud/apps/list/prometheus-grafana

This command generates a hashed password suitable for Prometheus Basic Auth. The plaintext password is provided as an argument, and the output hash should be used to update the PROMETHEUS_ADMIN_PASSWORD variable in the Prometheus environment file.

```bash
docker exec -it caddy caddy hash-password -plaintext <password>
```

--------------------------------

### Configure CORS Headers and Preflight Requests (.htaccess)

Source: https://docs.hetzner.com/konsoleh/account-management/development/cors

This snippet configures Cross-Origin Resource Sharing (CORS) for an Apache web server using an .htaccess file. It sets allowed HTTP methods, permitted origins, and custom headers. It also specifically handles OPTIONS preflight requests by returning a 200 status code, ensuring compatibility with browser security policies.

```apache
# Here you have to provide the "supported" HTTP methods. OPTIONS shall *always* be included, you can find further inforamtion regarding this setting at:
# https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
# This should be configured according to your requirements:
header always set Access-Control-Allow-Methods OPTIONS,GET,POST,PUT

# Here you have to specify, from which domains the access is permitted. It's supported to specify multiple domains comma separated:
header always set Access-Control-Allow-Origin https://testen.de

# OPTIONAL allowing further custom HTTP headers:
header always set Access-Control-Allow-Headers Content-Type

# The HTTP Status Code shall only be enforced for preflight (OPTIONS) requests. When confgiuring this for all domains, it would harm the functionality of the website.
<If "%{REQUEST_METHOD} == 'OPTIONS'">
        # Change the HTTP Status Code to 200 (successfully)
        RewriteRule ^ - [R=200,L]
</If>
```

--------------------------------

### Add Server Configuration to SSH Config

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

Append specific host configurations to your local SSH config file. 'server-public-ip' connects directly to 203.0.113.1 as root using public key authentication. 'server-private-ip' connects to 10.2.0.3 as root.

```sshconfig
Host server-public-ip
        HostName 203.0.113.1
        User root
        PreferredAuthentications publickey

Host server-private-ip
        HostName 10.2.0.3
        User root
```

--------------------------------

### Restart Caddy Container for Prometheus Password Change (Docker Compose)

Source: https://docs.hetzner.com/cloud/apps/list/prometheus-grafana

After updating the Prometheus admin password hash, this command sequence stops and then restarts the Caddy container. This action applies the new password configuration for Prometheus Basic Auth.

```bash
docker compose -f /opt/containers/prometheus-grafana/docker-compose.yml stop caddy
docker compose -f /opt/containers/prometheus-grafana/docker-compose.yml start caddy
```

--------------------------------

### Copy SSH Public Key to Server

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

Transfer the generated SSH public key to a server without a public IP address. This allows passwordless SSH login to that server. You will be prompted for the root password of the target server.

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<10.2.0.3>
```

--------------------------------

### Hetzner API PUT Request Structure

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

The structure for a PUT request to the Hetzner Cloud API, used for updating existing resources. It includes the request type, authorization header, content type, and a JSON data payload. Replace `{api-url-ending}` and `{id}` with the specific API endpoint and resource ID.

```shell
curl \
-X PUT \
-H "Authorization: Bearer $API_TOKEN" \
-H "Content-Type: application/json" \
-d '{"property":value,"property":value,...}' \
'https://api.hetzner.cloud/v1/{api-url-ending}/{id}'
```

--------------------------------

### Remove Udev Network Interface Rules

Source: https://docs.hetzner.com/cloud/servers/how-to-upgrade-network-model

This command removes udev rules that assign persistent names to network interfaces based on MAC addresses. This is typically done to allow the system to use default interface naming conventions, which can be useful during network model upgrades. The rules are located in `/etc/udev/rules.d/`.

```bash
rm /etc/udev/rules.d/70-persistent-net.rules
rm /etc/udev/rules.d/80-net-setup-link.rules
```

--------------------------------

### Redirect Domain to www Subdomain using Mod_Rewrite

Source: https://docs.hetzner.com/konsoleh/account-management/development/redirection-of-a-domain

This snippet redirects requests from a domain without the 'www.' prefix to the corresponding 'www.' subdomain. It requires Apache's mod_rewrite module to be enabled and an .htaccess file in the document root. The input is any HTTP request to the domain, and the output is a 301 redirect to the 'www.' version.

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} !^www\.your-domain\.de [NC]
RewriteRule (.*) http://www.your-domain.de/$1 [R=301,L]
```

--------------------------------

### Direct SSH Connection to Server without Public IPs

Source: https://docs.hetzner.com/cloud/servers/getting-started/connecting-via-private-ip

This command allows for a direct SSH connection to a server that does not have a public IP address. It leverages the SSH configuration to first connect to a server with a public IP (acting as a jump host) and then forwards the connection to the private IP. This simplifies server access.

```bash
ssh server-private-ip
```

--------------------------------

### Configure Default Cache Lifetime with mod_expires

Source: https://docs.hetzner.com/konsoleh/account-management/development/cache-lifetime

Sets the default cache lifetime for all files served by the Apache server to 30 seconds using the mod_expires module. This ensures that users fetch updated content from the server after the specified duration.

```apache
ExpiresActive On
ExpiresDefault "access plus 30 seconds"
```

--------------------------------

### Set Cache Lifetime for a Specific File Type with mod_expires

Source: https://docs.hetzner.com/konsoleh/account-management/development/cache-lifetime

Sets a cache lifetime of 1 minute specifically for GIF image files using the mod_expires module in Apache. This allows granular control over caching for individual asset types.

```apache
ExpiresActive on 
ExpiresByType image/gif "access plus 1 minutes"
```

--------------------------------

### Hetzner API DELETE Request Structure

Source: https://docs.hetzner.com/cloud/api/getting-started/using-api

The structure for a DELETE request to the Hetzner Cloud API, used for deleting existing resources. It includes the request type and authorization header. Replace `{api-url-ending}` and `{id}` with the specific API endpoint and resource ID.

```shell
curl \
-X DELETE \
-H "Authorization: Bearer $API_TOKEN" \
'https://api.hetzner.cloud/v1/{api-url-ending}/{id}'
```

--------------------------------

### Reset Grafana Admin Password (Docker)

Source: https://docs.hetzner.com/cloud/apps/list/prometheus-grafana

This command resets the Grafana admin user's password. It requires logging into the server and executing the command within the Docker environment where Grafana is running. The new password is provided as a plaintext argument.

```bash
docker exec -it grafana grafana-cli --homepath "/usr/share/grafana" admin reset-admin-password <password>
```
