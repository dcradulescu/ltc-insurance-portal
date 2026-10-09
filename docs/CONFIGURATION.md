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

## Browser workflow regression checks

After `pnpm build`, run `pnpm test:workflows` with Playwright and its Chromium browser installed. If Playwright is installed outside this checkout, set `PLAYWRIGHT_MODULE` to that installation's module path. `QA_PORT` defaults to 3012, and `QA_OUTPUT_DIR` defaults to the ignored `.qa-workflows` directory.

The script starts and stops its own local production server. It mocks all private-data and messaging transport, blocks external browser requests, and disables outbound service configuration in the server process. Only the local `pdfDelivery.generatePdf` endpoint is exercised without mocks. Tests cover profile/contact editing, error handling, strategy selection and task persistence, recipient validation, and both actual PDF downloads. These checks do not replace a real MySQL round-trip, inbox verification, model-provider generation or calendar booking test.

Profile CC preferences are included in the comprehensive office-handoff payload. Strategy email recipients must currently be chosen explicitly. Notification preferences are stored but are not wired to automatic delivery. The Profile screen states these limits.
