# Manus Dependency Inventory — LTC Insurance Portal

This file tracks code paths that should be replaced before the app is fully independent from Manus.

## Summary

The app is portable at the React, Vite, Express, Node, and MySQL layer. Remaining Manus-specific areas are authentication, storage, domain rules, and development tooling.

## Priority 1 — Authentication

### Files

- `server/_core/env.ts`
- `server/_core/sdk.ts`
- `server/_core/oauth.ts`
- `server/_core/context.ts`
- `shared/const.ts`

### Current behavior

The current login flow expects Manus/WebDev OAuth values:

- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- Manus OAuth exchange endpoints
- Manus-style `openId`

### Replacement options

- Auth.js
- Clerk
- Auth0
- Custom JWT authentication

### Recommended first pass

Use custom JWT authentication or Auth.js so the app can run independently on the VPS.

## Priority 2 — Storage

### Files

- `server/_core/storageProxy.ts`
- Upload routes/components using `/manus-storage/*`
- `drizzle/schema.ts`, table `documentUploads`

### Current behavior

The server proxies `/manus-storage/*` paths through Manus/Forge variables:

- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

### Replacement options

- Cloudflare R2
- AWS S3
- MinIO on VPS

### Recommended first pass

Use Cloudflare R2 or another S3-compatible provider. Keep `fileKey`, `fileName`, `mimeType`, and `fileSize`; generate signed URLs from the app server.

## Priority 3 — CORS and CSP

### Files

- `server/_core/index.ts`
- `vite.config.ts`

### Current behavior

Allowed origins and CSP include Manus domains.

### Required change

Use environment-driven production origins such as:

- `APP_PUBLIC_URL`
- `ALLOWED_ORIGINS`

Then remove Manus domains after cutover.

## Priority 4 — Vite Manus runtime plugin

### File

- `vite.config.ts`

### Current behavior

The app uses Manus runtime/debug development tooling.

### Required change

Make Manus plugins conditional or remove them after migration.

## Priority 5 — Deployment foundation

### Files

- `package.json`
- `ecosystem.config.cjs`
- `deploy/hostinger/*`

### Current behavior

The app already has portable scripts:

- `pnpm build`
- `pnpm start`
- `pnpm db:push`

## Migration sequence

1. Deploy the current branch to VPS staging.
2. Confirm app startup behind Nginx.
3. Configure MySQL and run Drizzle migrations.
4. Replace CORS/CSP domain rules.
5. Replace Manus storage.
6. Replace Manus OAuth.
7. Re-run checks and tests.
8. Point the production domain to the VPS.
9. Retire Manus hosting.
