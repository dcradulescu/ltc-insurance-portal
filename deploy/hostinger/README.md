# LTC Insurance Portal — Hostinger VPS Deployment

This branch prepares the LTC Insurance Portal to run outside Manus on a Hostinger VPS.

## Current application shape

- Frontend: React + Vite
- Backend: Node.js + Express + tRPC
- Database: MySQL through Drizzle
- Process manager: PM2 recommended
- Reverse proxy: Nginx recommended
- Runtime port: `3000` by default

## Production target

Recommended VPS layout:

```text
/var/www/ltc-insurance-portal
├── current/                 # cloned repo checkout
├── shared/.env              # production environment file, never committed
└── backups/                 # database/file backups
```

## Required server services

Install these on Ubuntu:

```bash
sudo apt update
sudo apt install -y nginx mysql-server git curl ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

## Required environment variables

Copy `.env.hostinger.example` to `/var/www/ltc-insurance-portal/shared/.env` and fill in real values.

Minimum required for server startup:

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=<strong-random-secret>
DATABASE_URL=mysql://<user>:<password>@127.0.0.1:3306/<database>
```

Features that need additional configuration:

- SMTP email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`
- Twilio SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Zapier: `VITE_ZAPIER_WEBHOOK_URL`

## Manus decoupling work still required

The current app still has two major Manus dependencies:

1. Authentication currently references Manus/WebDev OAuth.
2. Document storage currently uses `/manus-storage/*` and Forge storage environment variables.

This branch does not pretend those are solved yet. The first goal is reproducible VPS deployment scaffolding. The next development pass should replace Manus auth and storage with portable services.

## Initial deployment flow

```bash
sudo mkdir -p /var/www/ltc-insurance-portal
sudo chown -R $USER:$USER /var/www/ltc-insurance-portal
cd /var/www/ltc-insurance-portal
git clone -b hostinger-vps-deployment https://github.com/dcradulescu/ltc-insurance-portal.git current
mkdir -p shared backups
cp current/.env.hostinger.example shared/.env
nano shared/.env
cd current
ln -sfn ../shared/.env .env
pnpm install --frozen-lockfile
pnpm build
pnpm db:push
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Nginx

Use `deploy/hostinger/nginx-ltc-insurance-portal.conf` as the starting point. Replace `ltc.example.com` with the real domain.

## SSL

After DNS points to the VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ltc.example.com
```

## Health check

After deployment:

```bash
curl -I http://127.0.0.1:3000/
curl -I https://ltc.example.com/
pm2 status
pm2 logs ltc-insurance-portal --lines 100
```
