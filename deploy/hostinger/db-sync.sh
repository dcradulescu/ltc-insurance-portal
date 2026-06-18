#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/ltc-insurance-portal/current}"
cd "${APP_DIR}"

if [[ ! -f ".env" ]]; then
  echo "Missing .env symlink/file in ${APP_DIR}"
  exit 1
fi

echo "Attempting project database migration script..."
if pnpm db:push; then
  echo "Database migration completed with pnpm db:push"
  exit 0
fi

echo "Project migration script failed. Attempting direct Drizzle schema push fallback..."
if pnpm exec drizzle-kit push; then
  echo "Database schema synchronized with drizzle-kit push"
  exit 0
fi

echo "Database synchronization failed. Review DATABASE_URL, drizzle.config.ts, and MySQL permissions."
exit 1
