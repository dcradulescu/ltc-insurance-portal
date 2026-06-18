#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
PUBLIC_URL="${PUBLIC_URL:-}"
APP_NAME="${APP_NAME:-ltc-insurance-portal}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/var/www/ltc-insurance-portal/shared/uploads}"

printf '\n==> PM2 status\n'
pm2 describe "${APP_NAME}" >/dev/null
pm2 status "${APP_NAME}"

printf '\n==> Local HTTP check: %s\n' "${APP_URL}"
curl -fsSI "${APP_URL}" | head -n 20

printf '\n==> Local login page check\n'
curl -fsS "${APP_URL}/login" | grep -i "LTC Portal" >/dev/null

printf '\n==> Public tRPC health check\n'
curl -fsS "${APP_URL}/api/trpc/system.health" >/dev/null

printf '\n==> Protected API unauthenticated check\n'
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/trpc/policy.get")
if [[ "${STATUS_CODE}" != "401" && "${STATUS_CODE}" != "400" ]]; then
  echo "Expected protected API to reject unauthenticated request, got HTTP ${STATUS_CODE}"
  exit 1
fi

if [[ -n "${PUBLIC_URL}" ]]; then
  printf '\n==> Public HTTPS check: %s\n' "${PUBLIC_URL}"
  curl -fsSI "${PUBLIC_URL}" | head -n 20

  printf '\n==> Public login page check\n'
  curl -fsS "${PUBLIC_URL}/login" | grep -i "LTC Portal" >/dev/null
fi

printf '\n==> Upload directory check\n'
if [[ ! -d "${UPLOAD_ROOT}" ]]; then
  echo "Missing upload directory: ${UPLOAD_ROOT}"
  exit 1
fi
if [[ ! -w "${UPLOAD_ROOT}" ]]; then
  echo "Upload directory is not writable: ${UPLOAD_ROOT}"
  exit 1
fi
ls -ld "${UPLOAD_ROOT}"

printf '\n==> Nginx config check\n'
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
fi

printf '\n==> Recent PM2 logs\n'
pm2 logs "${APP_NAME}" --lines 50 --nostream

printf '\n==> Health check complete\n'
