# Manus Dependency Audit — LTC Insurance Portal

Branch: `hostinger-vps-deployment`

Purpose: identify all known Manus-specific dependencies that must be removed or replaced before this application can be considered independently production-ready on Hostinger VPS.

## Executive summary

The app is mostly portable because it is a conventional React + Vite + Express + Node + MySQL application. However, it is not fully independent from Manus yet.

The two highest-risk dependencies are:

1. Manus/WebDev OAuth authentication.
2. Manus/Forge storage proxy.

These must be replaced before real production use with sensitive LTC, medical, Medicare, Medicaid, policy, and identity data.

## Dependency 1 — Manus OAuth / WebDev Auth

### Files involved

- `server/_core/env.ts`
- `server/_core/sdk.ts`
- `server/_core/oauth.ts`
- `server/_core/context.ts`
- `shared/const.ts`

### Environment variables involved

- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `JWT_SECRET`

### Current behavior

The server exchanges Manus OAuth codes, gets user info from a Manus/WebDev auth service, creates a local session token, and syncs the user into MySQL.

### Production risk

If Manus auth is unavailable, changed, or sunset, new login and user sync can fail.

### Recommended replacement

Choose one:

1. Clerk — fastest, polished hosted auth.
2. Auth.js / NextAuth-style custom Express integration — more control, more work.
3. Custom email/password + JWT — maximum control, higher security responsibility.
4. Supabase Auth — acceptable if using Supabase as auth provider only.

Recommended for this project: Clerk or custom JWT, depending on how much PHI/PII control is required.

## Dependency 2 — Manus / Forge storage

### Files involved

- `server/_core/env.ts`
- `server/_core/storageProxy.ts`
- document upload features that store or reference `/manus-storage/*` URLs.

### Environment variables involved

- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

### Current behavior

Requests to `/manus-storage/*` are proxied to a Forge storage presign endpoint.

### Production risk

Document access can fail outside Manus. This is a critical issue because LTC claim workflows depend on documents.

### Recommended replacement

Use Cloudflare R2 or AWS S3.

Recommended for this project: Cloudflare R2, because it integrates well with Cloudflare DNS/proxy and is cost-effective.

## Dependency 3 — Manus Vite plugins and dev tooling

### Files involved

- `vite.config.ts`
- `package.json`

### Packages involved

- `vite-plugin-manus-runtime`
- Manus debug collector code in `vite.config.ts`

### Current behavior

The Manus plugin and debug collector support Manus preview/development tooling.

### Production risk

Lower risk than auth/storage. The production build may still work, but this should be removed once the app is independent.

### Recommended replacement

Remove Manus runtime plugin after confirming it is not needed for production. Keep standard Vite React plugin and Tailwind plugin.

## Dependency 4 — Manus domains in security configuration

### Files involved

- `server/_core/index.ts`
- `vite.config.ts`

### Current behavior

CORS and CSP allow Manus domains such as:

- `ltcportal.manus.space`
- `*.manus.space`
- `*.manus.computer`
- Manus preview computer domains

### Production risk

Security policy is too Manus-oriented and should be narrowed to the actual production domain.

### Recommended replacement

Add `APP_PUBLIC_URL` or `ALLOWED_ORIGINS` environment variable and derive CORS/CSP from it.

## Migration order

### Phase 1 — VPS scaffolding

Status: in progress on this branch.

- Add PM2 config.
- Add Nginx config.
- Add environment template.
- Add deployment scripts.
- Add backup scripts.
- Add MySQL bootstrap script.

### Phase 2 — Domain and CORS cleanup

- Add `APP_PUBLIC_URL` and `ALLOWED_ORIGINS` parsing.
- Remove hard-coded Manus origins.
- Add Hostinger/Cloudflare production origin.

### Phase 3 — Storage replacement

- Add object storage abstraction.
- Implement Cloudflare R2 adapter.
- Replace `/manus-storage/*` proxy with signed URL or controlled download endpoint.
- Migrate existing document records if production Manus documents already exist.

### Phase 4 — Auth replacement

- Decide auth provider.
- Replace Manus OAuth SDK.
- Preserve `users.openId` or add a new stable `authProviderId` field.
- Add admin bootstrap flow.
- Add logout/session expiration handling.

### Phase 5 — Production security pass

- Encrypt sensitive fields or decide database-level encryption strategy.
- Remove unnecessary PHI/PII from logs.
- Confirm backups are encrypted or protected.
- Add account lockout/rate limiting for auth.
- Add audit logs for policy/document access.
- Confirm SSL, HSTS, secure cookies, and reverse proxy headers.

## Current go/no-go

VPS deployment scaffolding: GO.

Production use with real sensitive users: NO-GO until Manus auth and storage are replaced and security review is completed.
