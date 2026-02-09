# CloudClaw ☁️🦞

> Deploy your own AI Assistant in minutes

CloudClaw is a SaaS platform that makes it easy to deploy and manage personal OpenClaw instances. Pay only for what you use with our simple credit-based system.

## Features

- **One-Click Deploy** - Launch OpenClaw servers with a single click
- **Hetzner Integration** - Powered by reliable cloud infrastructure
- **Credit System** - Pay-as-you-go with Stripe integration
- **Admin Dashboard** - Full control over users and servers
- **Real-time Status** - Monitor your instances in real-time

## Tech Stack

- **Backend**: Laravel 12
- **Frontend**: React + Inertia.js + TypeScript
- **UI**: shadcn/ui (New York theme)
- **Database**: SQLite (dev) / MySQL or PostgreSQL (prod)
- **Payments**: Stripe
- **Infrastructure**: Hetzner Cloud

## Requirements

- PHP 8.2+
- Node.js 20+
- Composer

## Installation

```bash
# Clone the repository
git clone https://github.com/saybil-lab/cloudclaw.git
cd cloudclaw

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Build assets
npm run build

# Start the development server
php artisan serve
```

## Configuration

### Environment Variables

```env
# Hetzner API
HETZNER_API_TOKEN=your_token_here
HETZNER_MOCK=true  # Set to false in production

# Stripe
STRIPE_KEY=pk_...
STRIPE_SECRET=sk_...
STRIPE_MOCK=true  # Set to false in production
```

### Creating an Admin User

```bash
php artisan tinker
>>> $user = User::first();
>>> $user->is_admin = true;
>>> $user->save();
```

## Development

```bash
# Start the dev server with hot reload
npm run dev

# In another terminal
php artisan serve

# Run tests
php artisan test
```

## Pricing

| Plan | vCPU | RAM | Disk | Price |
|------|------|-----|------|-------|
| Starter | 2 | 4GB | 40GB SSD | €0.0065/hr (~€4.68/mo) |
| Standard | 4 | 8GB | 80GB SSD | €0.013/hr (~€9.36/mo) |
| Performance | 8 | 16GB | 160GB SSD | €0.026/hr (~€18.72/mo) |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
