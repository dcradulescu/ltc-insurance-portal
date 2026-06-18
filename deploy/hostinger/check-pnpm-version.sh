#!/usr/bin/env bash
set -euo pipefail

REQUIRED_MAJOR="10"
REQUIRED_VERSION_HINT="10.4.1"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not installed. Install pnpm before deploying."
  exit 1
fi

CURRENT_VERSION="$(pnpm --version)"
CURRENT_MAJOR="${CURRENT_VERSION%%.*}"

if [[ "${CURRENT_MAJOR}" != "${REQUIRED_MAJOR}" ]]; then
  echo "Unsupported pnpm major version: ${CURRENT_VERSION}"
  echo "This repo expects pnpm ${REQUIRED_VERSION_HINT} or another compatible pnpm 10.x release."
  exit 1
fi

echo "pnpm version OK: ${CURRENT_VERSION}"
