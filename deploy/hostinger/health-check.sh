#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
APP_NAME="${APP_NAME:-ltc-insurance-portal}"

echo "==> PM2 status"
pm2 describe "${APP_NAME}" >/dev/null
pm2 status "${APP_NAME}"

echo "==> Local HTTP check: ${APP_URL}"
curl -fsSI "${APP_URL}" | head -n 20

echo "==> Recent PM2 logs"
pm2 logs "${APP_NAME}" --lines 50 --nostream

echo "==> Health check complete"
