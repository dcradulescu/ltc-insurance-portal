#!/usr/bin/env bash
set -euo pipefail

# LTC Insurance Portal — MySQL backup script
# Configure these through cron environment variables or edit a protected copy on the VPS.
# Do not commit real passwords.

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-ltc_insurance_portal}"
DB_USER="${DB_USER:-ltc_portal_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
APP_ROOT="${APP_ROOT:-/var/www/ltc-insurance-portal}"
BACKUP_DIR="${BACKUP_DIR:-${APP_ROOT}/backups/mysql}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ -z "${DB_PASSWORD}" ]]; then
  echo "DB_PASSWORD is required. Example: DB_PASSWORD='password' bash deploy/hostinger/backup-db.sh"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
chmod 750 "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/ltc_insurance_portal_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "==> Creating database backup: ${BACKUP_FILE}"
MYSQL_PWD="${DB_PASSWORD}" mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  "${DB_NAME}" | gzip > "${BACKUP_FILE}"

find "${BACKUP_DIR}" -type f -name '*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "==> Backup complete: ${BACKUP_FILE}"
