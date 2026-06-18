#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/ltc-insurance-portal}"
UPLOAD_DIR="${UPLOAD_DIR:-${APP_ROOT}/shared/uploads}"
APP_USER="${APP_USER:-$USER}"

mkdir -p "${UPLOAD_DIR}"
chown -R "${APP_USER}:www-data" "${APP_ROOT}/shared"
chmod 750 "${APP_ROOT}/shared"
chmod 2750 "${UPLOAD_DIR}"

echo "Upload directory ready: ${UPLOAD_DIR}"
