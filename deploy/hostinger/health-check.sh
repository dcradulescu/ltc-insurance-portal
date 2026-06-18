#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
APP_NAME="${APP_NAME:-ltc-insurance-portal}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/var/www/ltc-insurance-portal/shared/uploads}"

pm2 describe "${APP_NAME}" >/dev/null
pm2 status "${APP_NAME}"

curl -fsSI "${APP_URL}" | head -n 20
curl -fsS "${APP_URL}/login" | grep -i "LTC Portal" >/dev/null
curl -fsS "${APP_URL}/api/trpc/auth.me" >/dev/null

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/trpc/policy.get")
if [[ "${STATUS_CODE}" != "401" && "${STATUS_CODE}" != "400" ]]; then
  echo "Protected API did not reject unauthenticated request. HTTP ${STATUS_CODE}"
  exit 1
fi

if [[ ! -d "${UPLOAD_ROOT}" ]]; then
  echo "Missing upload directory: ${UPLOAD_ROOT}"
  exit 1
fi

if [[ ! -w "${UPLOAD_ROOT}" ]]; then
  echo "Upload directory is not writable: ${UPLOAD_ROOT}"
  exit 1
fi

if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
fi

echo "Health check complete"
