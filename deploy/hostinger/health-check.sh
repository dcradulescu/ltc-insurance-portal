#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
PUBLIC_URL="${PUBLIC_URL:-}"
APP_NAME="${APP_NAME:-ltc-insurance-portal}"
STORAGE_ROOT="${STORAGE_ROOT:-/var/www/ltc-insurance-portal/storage}"

printf '\n==> PM2 status\n'
pm2 describe "${APP_NAME}" >/dev/null
pm2 status "${APP_NAME}"

printf '\n==> Local HTTP check: %s\n' "${APP_URL}"
curl -fsSI "${APP_URL}" | head -n 20

if [[ -n "${PUBLIC_URL}" ]]; then
  printf '\n==> Public HTTPS check: %s\n' "${PUBLIC_URL}"
  curl -fsSI "${PUBLIC_URL}" | head -n 20
fi

printf '\n==> Storage directory check\n'
if [[ ! -d "${STORAGE_ROOT}" ]]; then
  echo "Missing storage directory: ${STORAGE_ROOT}"
  exit 1
fi
if [[ ! -w "${STORAGE_ROOT}" ]]; then
  echo "Storage directory is not writable: ${STORAGE_ROOT}"
  exit 1
fi
ls -ld "${STORAGE_ROOT}"

printf '\n==> Nginx config check\n'
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
fi

printf '\n==> Recent PM2 logs\n'
pm2 logs "${APP_NAME}" --lines 50 --nostream

printf '\n==> Health check complete\n'
