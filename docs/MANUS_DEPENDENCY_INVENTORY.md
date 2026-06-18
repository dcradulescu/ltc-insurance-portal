# Manus Dependency Inventory — LTC Insurance Portal

This document tracks application areas that currently depend on Manus-specific runtime services and must be replaced before the app is truly independent on Hostinger VPS.

## Summary

| Area | Current dependency | Migration status | Recommended replacement |
|---|---|---:|---|
| Authentication | Manus/WebDev OAuth service | Not replaced | Clerk, Auth.js, Supabase Auth, or custom JWT |
| Session bootstrap | Manus OpenID / project app ID | Not replaced | Internal users table + first-admin bootstrap |
| File storage | `/manus-storage/*` + Forge storage presign API | Not replaced | Cloudflare R2 or AWS S3 |
| Vite dev runtime | `vite-plugin-manus-runtime` | Not production-critical | Remove after migration |
| CORS/CSP allowlists | Manus domains hard-coded | Needs update | Production domain only |
| Logs/debug | Manus debug collector in Vite config | Dev-only | Remove or guard behind env flag |

## Confirmed files

### `server/_core/env.ts`

Reads the following Manus/Forge-related environment variables:

- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

### `server/_core/sdk.ts`

Current auth SDK is built around Manus/WebDev auth concepts:

- Exchange OAuth code with Manus auth endpoint.
- Fetch user info from Manus auth endpoint.
- Use Manus `openId` as user identity.
- Sync user into local MySQL database after Manus auth.

### `server/_core/oauth.ts`

Handles `/api/oauth/callback` for the current Manus OAuth flow.

### `server/_core/storageProxy.ts`

Handles `/manus-storage/*` and requests signed URLs from Forge storage.

This is a critical migration target because the portal stores document upload metadata in MySQL and expects document URLs/keys to resolve.

### `server/_core/index.ts`

Production CORS and CSP currently include Manus domains and CloudFront image sources.

### `vite.config.ts`

Includes:

- `vite-plugin-manus-runtime`
- Manus debug collector
- Manus allowed hosts

This is mostly development/runtime scaffolding, but it should be removed before final production hardening.

## Migration order

1. Add stable deployment scaffolding.
2. Replace auth.
3. Replace storage.
4. Remove Manus Vite/runtime plugins.
5. Replace CORS/CSP allowlists with final production domain.
6. Run full test/build/deployment verification.
7. Run security review before production launch.

## Recommended auth strategy

For fastest production-grade migration, use Clerk or Auth.js.

For maximum ownership/control, use custom email/password + JWT + password reset + admin bootstrap.

Given this project handles sensitive LTC data, avoid weak DIY auth unless it includes:

- Strong password hashing
- Secure password reset
- Secure session cookies
- Rate limiting
- Email verification
- Audit logging
- Admin role assignment controls

## Recommended storage strategy

Use Cloudflare R2 if Cloudflare is already managing DNS. Benefits:

- S3-compatible API
- Low egress cost
- Good fit with VPS
- Private bucket + signed URLs

Required implementation work:

- Replace `/manus-storage/*` proxy with `/api/storage/*` routes.
- Use AWS SDK S3 client already present in dependencies.
- Store object key, MIME type, size, category, and owner user ID in MySQL.
- Generate signed upload/download URLs.
- Enforce user ownership on every file access.

## Production risk note

Until auth and storage are replaced, the app can be deployed to a VPS for staging, but it should not be considered fully independent of Manus or ready for real users with sensitive LTC data.
