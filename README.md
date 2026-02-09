# CloudClaw

**Cloud Desktop Platform** - Deploy AI-powered cloud desktops with integrated VNC access, email accounts, and pay-as-you-go billing.

## Features

### 🖥️ Cloud Desktops
- Deploy Ubuntu-based cloud desktops on Hetzner Cloud
- Xfce desktop environment with TigerVNC
- Browser-based access via noVNC (no VNC client needed)
- Multiple server configurations (cx22, cx32, cx42)
- European and US datacenter locations

### 💳 Pay-as-you-go Billing
- Credit-based billing system
- Stripe Checkout integration
- Hourly server charges
- Auto-stop servers when credits run out

### 📧 Integrated Email
- Dedicated email account per server
- Mailcow API integration
- Format: `server-{id}@ai.cloudclaw.com`

### 🔐 Security
- Secure VNC passwords
- SSH access with dedicated user
- UFW firewall pre-configured
- TLS email enforced

## Tech Stack

- **Backend**: Laravel 11
- **Frontend**: React + Inertia.js
- **UI**: shadcn/ui + Tailwind CSS
- **Payments**: Stripe
- **Cloud**: Hetzner Cloud API
- **Email**: Mailcow (optional)
- **VNC**: TigerVNC + noVNC

## Installation

### Prerequisites

- PHP 8.2+
- Node.js 20+
- Composer
- SQLite or MySQL

### Setup

```bash
# Clone the repository
git clone https://github.com/saybil-lab/cloudclaw.git
cd cloudclaw

# Install dependencies
composer install
npm install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Build assets
npm run build

# Start the server
php artisan serve
```

## Configuration

### Hetzner Cloud

1. Create a Hetzner Cloud account at https://console.hetzner.cloud/
2. Create a new project
3. Generate an API token (Read & Write)
4. Add to `.env`:

```env
HETZNER_API_TOKEN=your_api_token
HETZNER_MOCK=false
```

### Stripe Payments

1. Create a Stripe account at https://dashboard.stripe.com/
2. Get your API keys
3. Set up a webhook endpoint: `https://your-domain.com/webhooks/stripe`
4. Add events: `checkout.session.completed`, `payment_intent.succeeded`
5. Add to `.env`:

```env
STRIPE_KEY=pk_live_xxx
STRIPE_SECRET=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MOCK=false
```

### Mailcow Email (Optional)

1. Set up a Mailcow server
2. Create an API key with mailbox permissions
3. Add your domain
4. Add to `.env`:

```env
MAILCOW_API_URL=https://mail.your-domain.com
MAILCOW_API_KEY=your_api_key
MAILCOW_DOMAIN=ai.cloudclaw.com
```

## Queue Worker

For server provisioning to work, you need to run the queue worker:

```bash
php artisan queue:work --tries=1 --timeout=1800
```

## Scheduled Tasks

Add to your crontab:

```bash
* * * * * cd /path/to/cloudclaw && php artisan schedule:run >> /dev/null 2>&1
```

This will:
- Check server status every 5 minutes
- Charge hourly server costs

## Development

### Mock Mode

For development without real API calls:

```env
HETZNER_MOCK=true
STRIPE_MOCK=true
```

In mock mode:
- Hetzner servers are simulated
- Stripe payments add credits instantly
- Email accounts are skipped

### Building Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### Testing

```bash
php artisan test
```

## Architecture

```
app/
├── Http/Controllers/
│   ├── ServerController.php     # Server CRUD
│   ├── CreditController.php     # Credit management
│   └── WebhookController.php    # Stripe webhooks
├── Jobs/
│   ├── ProvisionServerJob.php   # Server provisioning
│   └── CheckServerStatusJob.php # Status monitoring
├── Services/
│   ├── HetznerService.php       # Hetzner API
│   ├── CreditService.php        # Credit system
│   ├── ProvisioningService.php  # Orchestration
│   └── MailService.php          # Mailcow API
└── Models/
    ├── Server.php
    ├── User.php
    ├── Credit.php
    └── CreditTransaction.php

scripts/
└── provision-server.sh          # Server setup script
```

## Server Provisioning

When a server is created:

1. Server record created in database
2. Hetzner API creates the VM
3. ProvisionServerJob is dispatched
4. Script installs: Xfce, TigerVNC, noVNC, Docker, Node.js
5. Email account created (if Mailcow configured)
6. Server marked as ready

## API Endpoints

### Servers
- `GET /servers` - List servers
- `GET /servers/create` - Create form
- `POST /servers` - Create server
- `GET /servers/{id}` - Show server
- `DELETE /servers/{id}` - Delete server
- `POST /servers/{id}/power` - Power on/off

### Credits
- `GET /credits` - View balance & history
- `POST /credits/purchase` - Start purchase flow
- `GET /credits/success` - Payment callback

### Webhooks
- `POST /webhooks/stripe` - Stripe events

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
