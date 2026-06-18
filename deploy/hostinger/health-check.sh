#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
APP_NAME="${APP_NAME:-ltc-insurance-portal}"
UPLOAD_ROOT="${UPLOAD_ROOT:-/var/www/ltc-insurance-portal/shared/uploads}"

printf '\n==> PM2 status\n'
pm2 describe "${APP_NAME}" >/dev/null
pm2 status "${APP_NAME}"

printf '\n==> Login page check\n'
curl -fsS "${APP_URL}/login" | grep -i "LTC Portal" >/dev/null

printf '\n==> Public auth endpoint check\n'
curl -fsS "${APP_URL}/api/trpc/auth.me" >/dev/null

printf '\n==> Unauthenticated page gate check\n'
PAGE_STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: text/html" "${APP_URL}/")
if [[ "${PAGE_STATUS_CODE}" != "302" && "${PAGE_STATUS_CODE}" != "200" ]]; then
  echo "Unexpected root page status. Expected 302 redirect to login or 200 if page auth is disabled. HTTP ${PAGE_STATUS_CODE}"
  exit 1
fi

printf '\n==> Protected API unauthenticated check\n'
API_STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/trpc/policy.get")
if [[ "${API_STATUS_CODE}" != "401" && "${API_STATUS_CODE}" != "400" ]]; then
  echo "Protected API did not reject unauthenticated request. HTTP ${API_STATUS_CODE}"
  exit 1
fi

printf '\n==> Uploaded-file unauthenticated check\n'
FILE_STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/uploaded-files/__healthcheck_missing_file__.txt")
if [[ "${FILE_STATUS_CODE}" != "401" ]]; then
  echo "Uploaded-file route did not require authentication before file lookup. HTTP ${FILE_STATUS_CODE}"
  exit 1
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

printf '\n==> Nginx config check\n'
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
fi

printf '\n==> Health check complete\n'
