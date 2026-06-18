#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/ltc-insurance-portal}"
UPLOAD_DIR="${UPLOAD_DIR:-${APP_ROOT}/shared/uploads}"
BACKUP_DIR="${BACKUP_DIR:-${APP_ROOT}/backups/uploads}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -d "${UPLOAD_DIR}" ]]; then
  echo "Upload directory does not exist: ${UPLOAD_DIR}"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
chmod 750 "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/uploads_$(date +%Y%m%d_%H%M%S).tar.gz"

echo "Creating upload backup: ${BACKUP_FILE}"
tar -czf "${BACKUP_FILE}" -C "${UPLOAD_DIR}" .
chmod 640 "${BACKUP_FILE}"

find "${BACKUP_DIR}" -type f -name 'uploads_*.tar.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "Upload backup complete: ${BACKUP_FILE}"
