#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-$USER}"
APP_ROOT="${APP_ROOT:-/var/www/ltc-insurance-portal}"
APP_LOG_DIR="${APP_LOG_DIR:-/var/log/ltc-insurance-portal}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo: sudo bash deploy/hostinger/install-server.sh"
  exit 1
fi

echo "==> Updating apt packages"
apt update
apt upgrade -y

echo "==> Installing base packages"
apt install -y nginx mysql-server git curl ufw unzip ca-certificates gnupg build-essential certbot python3-certbot-nginx apache2-utils

echo "==> Installing Node.js 22"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
fi

echo "==> Installing pnpm and PM2"
npm install -g pnpm pm2

echo "==> Creating application directories"
mkdir -p "${APP_ROOT}/current" "${APP_ROOT}/shared" "${APP_ROOT}/backups" "${APP_ROOT}/storage" "${APP_LOG_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${APP_ROOT}" "${APP_LOG_DIR}"
chgrp -R www-data "${APP_ROOT}/storage"
chmod 750 "${APP_ROOT}/shared"
chmod 750 "${APP_ROOT}/backups"
chmod 2750 "${APP_ROOT}/storage"

echo "==> Configuring firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Enabling services"
systemctl enable nginx
systemctl enable mysql
systemctl restart nginx
systemctl restart mysql

echo "==> Server baseline complete"
echo "Next: clone the branch, create shared/.env, configure MySQL, build, and start PM2."
