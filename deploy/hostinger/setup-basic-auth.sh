#!/usr/bin/env bash
set -euo pipefail

AUTH_FILE="${AUTH_FILE:-/etc/nginx/.htpasswd-ltc-insurance-portal}"
AUTH_USER="${AUTH_USER:-portaladmin}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo: sudo AUTH_USER=portaladmin bash deploy/hostinger/setup-basic-auth.sh"
  exit 1
fi

if ! command -v htpasswd >/dev/null 2>&1; then
  echo "htpasswd not found. Run install-server.sh first or install apache2-utils."
  exit 1
fi

echo "Creating/updating Basic Auth user: ${AUTH_USER}"
htpasswd -c "${AUTH_FILE}" "${AUTH_USER}"
chown root:www-data "${AUTH_FILE}"
chmod 640 "${AUTH_FILE}"

echo "Basic Auth file ready: ${AUTH_FILE}"
echo "Reload Nginx after installing the site config: sudo nginx -t && sudo systemctl reload nginx"
