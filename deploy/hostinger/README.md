# LTC Insurance Portal — Hostinger VPS Deployment

This branch prepares the LTC Insurance Portal to run outside Manus on a Hostinger VPS.

## Current application shape

- Frontend: React + Vite
- Backend: Node.js + Express + tRPC
- Database: MySQL through Drizzle
- Process manager: PM2
- Reverse proxy: Nginx
- Runtime port: `3000` by default
- File storage: local VPS storage by default

## Production target

Recommended VPS layout:

```text
/var/www/ltc-insurance-portal
├── current/                 # cloned repo checkout
├── shared/.env              # production environment file, never committed
├── storage/                 # local uploaded document storage
└── backups/                 # database/file backups
```

## Current security posture

The current application still behaves mostly as a single-operator portal. Until full application-level authentication is implemented, the VPS deployment uses Nginx Basic Auth as a temporary access gate.

Do not remove the Nginx Basic Auth gate before replacing the public/single-user model with real application auth and data ownership.

## Server install

From the cloned repo on the VPS:

```bash
sudo bash deploy/hostinger/install-server.sh
```

This installs:

- Nginx
- MySQL
- Node.js 22
- pnpm
- PM2
- Certbot
- apache2-utils for `htpasswd`
- firewall baseline
- application directories

## Required environment variables

Copy `.env.hostinger.example` to `/var/www/ltc-insurance-portal/shared/.env` and fill in real values.

Minimum required for server startup:

```bash
NODE_ENV=production
PORT=3000
APP_PUBLIC_URL=https://ltc.example.com
JWT_SECRET=<strong-random-secret>
DATABASE_URL=mysql://<user>:<password>@127.0.0.1:3306/<database>
OBJECT_STORAGE_PROVIDER=local
LOCAL_STORAGE_ROOT=/var/www/ltc-insurance-portal/storage
LOCAL_STORAGE_PUBLIC_BASE_URL=/uploaded-files
```

Features that need additional configuration:

- SMTP email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`
- Twilio SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Zapier: `VITE_ZAPIER_WEBHOOK_URL`

## MySQL bootstrap

Edit `deploy/hostinger/mysql-bootstrap.sql`, replace the placeholder password, then run:

```bash
sudo mysql < deploy/hostinger/mysql-bootstrap.sql
```

Make sure the same user, password, and database are reflected in `/var/www/ltc-insurance-portal/shared/.env`.

## Access gate setup

Create the temporary Nginx Basic Auth user:

```bash
sudo AUTH_USER=portaladmin bash deploy/hostinger/setup-basic-auth.sh
```

Store the password securely. This protects the portal while app-level auth is still being refactored.

## Initial deployment flow

```bash
sudo mkdir -p /var/www/ltc-insurance-portal
sudo chown -R $USER:$USER /var/www/ltc-insurance-portal
cd /var/www/ltc-insurance-portal
git clone -b hostinger-vps-deployment https://github.com/dcradulescu/ltc-insurance-portal.git current
mkdir -p shared backups storage
cp current/.env.hostinger.example shared/.env
nano shared/.env
cd current
ln -sfn ../shared/.env .env
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm db:push
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Nginx

Use `deploy/hostinger/nginx-ltc-insurance-portal.conf` as the starting point. Replace `ltc.example.com` with the real domain.

```bash
sudo cp deploy/hostinger/nginx-ltc-insurance-portal.conf /etc/nginx/sites-available/ltc-insurance-portal
sudo ln -sfn /etc/nginx/sites-available/ltc-insurance-portal /etc/nginx/sites-enabled/ltc-insurance-portal
sudo nginx -t
sudo systemctl reload nginx
```

## SSL

After DNS points to the VPS:

```bash
sudo certbot --nginx -d ltc.example.com -d www.ltc.example.com
```

## Health check

After deployment:

```bash
bash deploy/hostinger/health-check.sh
curl -I http://127.0.0.1:3000/
curl -I https://ltc.example.com/
pm2 status
pm2 logs ltc-insurance-portal --lines 100
```

## Manus decoupling status

Completed on this branch:

- VPS deployment scaffolding
- local VPS file storage provider
- Nginx serving for `/uploaded-files/`
- configurable production origins helper
- temporary Nginx Basic Auth access gate

Still required for true public production:

1. Replace Manus/WebDev OAuth with application-level authentication.
2. Refactor public/single-user data access into real user-owned records.
3. Replace or remove any remaining Manus-specific storage proxy usage.
4. Run a security review before accepting real public users.
