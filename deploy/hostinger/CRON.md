# LTC Insurance Portal — VPS Cron Jobs

These cron jobs are recommended after the first successful deployment.

## Open crontab

```bash
crontab -e
```

## Daily MySQL backup

Replace `CHANGE_ME_DB_PASSWORD` with the real database password on the VPS only.

```cron
15 2 * * * DB_PASSWORD='CHANGE_ME_DB_PASSWORD' bash /var/www/ltc-insurance-portal/current/deploy/hostinger/backup-db.sh >> /var/log/ltc-insurance-portal/backup.log 2>&1
```

## Daily app health check

```cron
*/15 * * * * bash /var/www/ltc-insurance-portal/current/deploy/hostinger/health-check.sh >> /var/log/ltc-insurance-portal/health-check.log 2>&1
```

## Notes

- Keep real passwords only on the VPS.
- Do not commit cron secrets to GitHub.
- Backups are retained for 14 days by default.
- For production, copy database backups off-server as well, not only to local disk.
