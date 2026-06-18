# LTC Insurance Portal — VPS Security Checklist

Use this before exposing the portal publicly.

## Server baseline

- [ ] Ubuntu packages updated
- [ ] SSH root login disabled
- [ ] Password SSH login disabled if key access is configured
- [ ] UFW enabled
- [ ] Only SSH, HTTP, and HTTPS exposed publicly
- [ ] Nginx running as reverse proxy
- [ ] PM2 process configured and saved
- [ ] Logs written outside the repository

## Domain and SSL

- [ ] Production DNS points to VPS
- [ ] HTTPS certificate installed with Certbot
- [ ] HTTP redirects to HTTPS after SSL setup
- [ ] App cookies work under HTTPS

## Database

- [ ] MySQL app user has limited database permissions
- [ ] Database is not exposed publicly
- [ ] Daily database backups configured
- [ ] Backup restore tested
- [ ] Database password is not committed

## Application secrets

- [ ] Real `.env` exists only at `/var/www/ltc-insurance-portal/shared/.env`
- [ ] `JWT_SECRET` is strong and unique
- [ ] SMTP credentials are production-ready
- [ ] Twilio credentials are configured only if SMS is enabled
- [ ] Zapier webhook is correct for production

## Manus decoupling

- [ ] Manus OAuth replaced
- [ ] Manus storage replaced
- [ ] Manus domains removed from CORS/CSP
- [ ] Manus Vite runtime/debug tooling removed or made conditional

## Production validation

- [ ] `pnpm check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] `pnpm db:push` completed against production database
- [ ] Login tested
- [ ] Upload/download flow tested
- [ ] Email sending tested
- [ ] SMS sending tested if enabled
- [ ] PDF/document generation tested
- [ ] PM2 restart tested
- [ ] Server reboot tested
