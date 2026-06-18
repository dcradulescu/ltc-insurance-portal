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

## Data access and privacy

- [ ] Sensitive document routes are scoped to the authenticated user
- [ ] Sensitive policy routes are scoped to the authenticated user
- [ ] Hard-coded `userId = 1` access has been removed from sensitive write/read paths
- [ ] Uploaded files require a valid session before download
- [ ] Public routes expose only non-sensitive metadata

## Manus decoupling

- [ ] Legacy OAuth replaced or confirmed disabled for production login
- [ ] Legacy storage proxy replaced or confirmed unused
- [ ] Hosted-preview domains removed from CORS/CSP
- [ ] Hosted-runtime/debug tooling removed or made conditional

## Production validation

- [ ] `pnpm check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] database sync completed against production database
- [ ] Login tested
- [ ] Upload/download flow tested
- [ ] Email sending tested
- [ ] SMS sending tested if enabled
- [ ] PDF/document generation tested
- [ ] PM2 restart tested
- [ ] Server reboot tested
