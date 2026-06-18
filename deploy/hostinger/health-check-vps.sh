#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
PUBLIC_URL="${PUBLIC_URL:-}"
APP_NAME="${APP_NAME:-ltc-insurance-portal}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/var/www/ltc-insurance-portal/shared/uploads}"

echo "Checking PM2 process..."
pm2 describe "${APP_NAME}" >/dev/null
pm2 status "${APP_NAME}"

echo "Checking local app home page..."
curl -fsSI "${APP_URL}" >/dev/null

echo "Checking local login page..."
curl -fsS "${APP_URL}/login" | grep -i "LTC Portal" >/dev/null

echo "Checking tRPC system health..."
curl -fsS "${APP_URL}/api/trpc/system.health" >/dev/null

echo "Checking upload directory..."
test -d "${UPLOAD_ROOT}"
test -w "${UPLOAD_ROOT}"
ls -ld "${UPLOAD_ROOT}"

if [[ -n "${PUBLIC_URL}" ]]; then
  echo "Checking public app home page..."
  curl -fsSI "${PUBLIC_URL}" >/dev/null
  echo "Checking public login page..."
  curl -fsS "${PUBLIC_URL}/login" | grep -i "LTC Portal" >/dev/null
fi

echo "Checking Nginx configuration if installed..."
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
fi

echo "Recent app logs..."
pm2 logs "${APP_NAME}" --lines 30 --nostream

echo "VPS health check complete."
