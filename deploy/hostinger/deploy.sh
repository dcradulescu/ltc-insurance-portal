#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/ltc-insurance-portal}"
APP_DIR="${APP_DIR:-${APP_ROOT}/current}"
SHARED_ENV="${SHARED_ENV:-${APP_ROOT}/shared/.env}"
BRANCH="${BRANCH:-hostinger-vps-deployment}"
REPO_URL="${REPO_URL:-https://github.com/dcradulescu/ltc-insurance-portal.git}"
APP_NAME="${APP_NAME:-ltc-insurance-portal}"

if [[ ! -f "${SHARED_ENV}" ]]; then
  echo "Missing environment file: ${SHARED_ENV}"
  echo "Create it from .env.hostinger.example before deploying."
  exit 1
fi

mkdir -p "${APP_ROOT}"

if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "==> Cloning ${REPO_URL} branch ${BRANCH}"
  git clone -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  echo "==> Updating existing checkout"
  cd "${APP_DIR}"
  git fetch origin
  git checkout "${BRANCH}"
  git pull --ff-only origin "${BRANCH}"
fi

cd "${APP_DIR}"

ln -sfn "${SHARED_ENV}" .env

echo "==> Ensuring runtime directories"
sudo mkdir -p "${APP_ROOT}/storage" /var/log/ltc-insurance-portal
sudo chown -R "$USER:www-data" "${APP_ROOT}/storage"
sudo chmod 2750 "${APP_ROOT}/storage"
sudo chown -R "$USER:$USER" /var/log/ltc-insurance-portal

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Running TypeScript check"
pnpm check

echo "==> Building app"
pnpm build

echo "==> Running database migrations"
pnpm db:push

echo "==> Starting/reloading PM2 app"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --only "${APP_NAME}" --update-env
else
  pm2 start ecosystem.config.cjs --only "${APP_NAME}"
fi

pm2 save

echo "==> Deployment complete"
pm2 status
