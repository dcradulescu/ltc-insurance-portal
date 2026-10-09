# Development and deployment configuration

Use Node and the packageManager version pinned in package.json. Install with `pnpm install --frozen-lockfile`; then `pnpm check`, `pnpm test`, and `pnpm build`. Start with `NODE_ENV=production pnpm start`. `/healthz` reports process availability, not database/provider readiness.

| Variable | Purpose |
|---|---|
| APP_URL | Canonical HTTPS portal origin; used for recovery links and allowed API origin. Local development may use http://localhost:3000. |
| DATABASE_URL | MySQL connection for private visitor profiles, policies, strategies, contacts and recovery data. |
| JWT_SECRET | Random secret of at least 32 characters for visitor-cookie signatures. Rotating it invalidates visitor sessions. |
| ZAPIER_WEBHOOK_URL | Server-only HTTPS receiving automation. Prefer this to the legacy VITE-prefixed alias; never expose webhook credentials in browser code. |
| CONTACT_EMAIL | Intended office notification recipient. |
| VITE_BOOKING_URL | Actual booking URL; absent configuration falls back to calling the office. |
| BUILT_IN_FORGE_API_URL / BUILT_IN_FORGE_API_KEY | Existing model-provider integration. Provider portability remains pending. |
| TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER | SMS transport. |

Email attachment payloads use `attachmentBase64`, `attachmentFilename`, and `attachmentContentType`. The receiving workflow must decode and attach bytes, validate the expected event type, and route recipients. Ordinary contact/page/recovery events do not have PDF attachments. Do not enable production delivery until this contract is verified.

Visitors can browse public education without an account. Private saving requires the signed visitor session and database. Keep the browser cookie to return to the same private records; clearing it creates a new visitor. A resume link restores form contents but does not transfer ownership of existing records. Old shared user-ID records are intentionally not exposed.

No database migration deleting the legacy SSN column or reassigning shared records has been run. Review those data changes separately against the real schema, retention requirements and backups.
