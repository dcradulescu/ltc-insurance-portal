# LTC Insurance Portal — development setup

Read DEVELOPMENT_2026-10-09.md for current verified status and remaining work. DEVELOPMENT_2026-10-08.md records earlier checkpoints. This is a development checkpoint, not a completed production release.

## Care calculator audit

Read `CALCULATOR_AUDIT_2026-10-09.md` before relying on calculator results. Checkpoint 10 corrects premium-waiver, inflation, waiting-period and benefit-limit errors. The calculator now models eligible home-care expense reimbursement with verified daily/calendar-month caps and a finite remaining dollar pool. Cash/indemnity/hybrid and other unsupported policy terms require a policy-specific calculation.

Confirm current limits, past benefit use, eligibility, elimination counting and any rider terms against the issued policy and carrier statement. The five-year calendar projection separates care costs, insurer reimbursement, household expenses and the premium month reviewed. It does not certify coverage or forecast a benefit duration beyond the modeled horizon.

`corepack pnpm exec vitest run shared/careCalculator.test.ts` runs the 116 direct calculator tests; the full suite has 367 passing tests. Browser evidence is in `verification/LTC_Portal_Calculator_UI_Verification.json` in the development archive.

Full premium waiver is now selected by default as a planning assumption for the premium month reviewed. A $200 premium gives $200 assumed savings and $0 premium payable. This never increases the benefit pool. The option can be cleared to model no waiver. Checkpoint 12 adds a prominent effective-monthly-cost section: gross care cost minus your waived premium and the spouse’s waived premium if dual waiver is selected. Separate premium fields support single and dual waiver. The comparison is before insurance reimbursement. All calendar months remain selectable, but partial-month waiver amounts require actual carrier terms and are not guessed. Latest browser evidence: `verification/LTC_Portal_Calculator_UI_Verification_CHECKPOINT12.json`.

Inflation support remains limited to verified fixed annual increases to caps and/or the **total maximum**. Some riders grow only the remaining pool (including FLTCIP); these require a separate calculation and must not use the total-maximum branch.

## Review production configuration

After supplying environment variables (or a local `.env`), run:

```sh
corepack pnpm config:check
```

The command is offline and read-only. It sends no messages, makes no provider requests, and prints no configuration values. JSON output lists errors and warnings by setting name. Exit code 1 means blocking configuration errors; exit code 0 means no blocking settings errors. Warnings can still require operator review. `deploymentReady` is always false because this command does not verify a deployment.

It checks production mode, session-secret length, public origins, ports/proxy count, database URL structure, S3 credential pairs (including legacy aliases), AI settings, SMTP/owner email, delivery webhook and optional SMS settings. The untouched `.env.example` intentionally fails. S3 runtime roles and unauthenticated SMTP relays are allowed with explicit review warnings. No default credentials are created. Secret entropy, real permissions, DNS/connectivity, private bucket policies, mail receipt and TLS remain separate checks.

For the current AI adapter, OPENAI_BASE_URL is the base before `/v1/chat/completions`; do not append `/v1` yourself. ZAPIER_WEBHOOK_URL handles explicit email requests when configured, but does not replace SMTP for owner/contact notifications. The check is an operator command, not an automatic server-start gate. It is available in the existing production Docker layout because the scripts and dotenv dependency are copied into that image; the image itself still needs verification.

## Build and test

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm test
corepack pnpm build
```

Use the recorded pnpm 10.4.1. Copy .env.example to .env and supply real values outside source control. JWT_SECRET must contain at least 64 random characters. APP_PUBLIC_URL is the actual HTTPS origin in production. Set ZAPIER_WEBHOOK_URL server-side; the old VITE-prefixed name is no longer used. TRUST_PROXY_HOPS must match the actual reverse proxy topology.

## Database setup

For an **empty, disposable development MySQL database**, `corepack pnpm db:bootstrap` creates the full current schema and records a migration baseline. It refuses nonempty databases and refuses a stale schema baseline. MySQL DDL is not transactional: if bootstrap fails partway, inspect the error and recreate only the intended disposable empty database before retrying.

For an **existing database**, back up first. Run `corepack pnpm db:check` to list missing tables/columns. Inspect the actual migration ledger and inherited schema drift before choosing an upgrade path. The new access-control migration is drizzle/0004_portal_access.sql. Do not apply bootstrap to existing data. Do not run automatic schema generation and accept suggested renames/deletions against production. `db:migrate` applies the tracked SQL only after the ledger and prerequisites have been verified. `db:push` now aliases that explicit migration command.

The schema preflight checks table/column presence. It does not establish type/index/constraint equality or migrate any data. The fresh schema baseline is generated from drizzle/schema.ts and guarded by its SHA-256 digest.

## Provision an account

Accounts are provisioned by an operator; there is no public registration route. Passwords are accepted through stdin, never command-line arguments. Example for a local Bash shell:

```sh
read -r -s -p 'New account password: ' LTC_ACCOUNT_PASSWORD
printf '%s' "$LTC_ACCOUNT_PASSWORD" | corepack pnpm auth:account --email owner@example.com --name 'Portal Owner' --role admin
unset LTC_ACCOUNT_PASSWORD
```

Use a strong password of 15–128 characters. The email/name above are placeholders for the intended account. The command prints only the user ID. In a production-only install use `node dist/provision-account.js` instead of the pnpm TypeScript command.

To reset an existing account's password, use the same stdin method with `--email <account email> --reset`. This revokes its active sessions. To deliberately associate a local account with a verified legacy user, use `--existing-user-id <id>` after reviewing that user's records. No automatic user-1 reassignment occurs. An existing role is preserved unless an explicit --role is supplied.

Run `corepack pnpm dev` for local development, or `corepack pnpm start` after a production build. On a non-HTTPS local development origin use NODE_ENV=development; production cookies require HTTPS. `/healthz` is a process-liveness check, not proof of database or integration readiness.

Production-only commands also include `node dist/check-database.js`, `node scripts/bootstrap-database.mjs`, and `node scripts/migrate-database.mjs`. None has been executed against your live database in this checkpoint.

## Delivery configuration and limits

Explicit email requests use ZAPIER_WEBHOOK_URL when configured; otherwise they require SMTP_HOST and SMTP_FROM (plus your SMTP authentication settings). There is no development-mode fake success. Configure the webhook workflow to map the recipients, subject and body fields and the existing event-specific fields. A successful HTTP or SMTP response means the service accepted the request, not that the recipient received it. No automatic provider fallback or retries occur because a timeout can happen after acceptance. Partial SMTP rejection reports counts; check with the provider before retrying.

PDF emails include a signed download link that expires after one hour; they do not claim to attach a file. Resume emails go only to the signed-in account email using APP_PUBLIC_URL. If email cannot be confirmed, the saved record remains available and the dialog offers a copyable resume link. Contact form owner notifications require NOTIFY_OWNER_EMAIL and working SMTP even when a separate Zapier workflow exists.

SMS preferences persist on the account. Automatic reminder scheduling is not enabled; direct test/send routes require the admin role and configured Twilio service. Private object storage must remain private, including legacy files.

## Account documents

Open Documents after sign-in. Choose a category and one file up to 50 MB; upload, search/filter, and download documents belonging to the account. Removing a document requires confirmation and revokes its portal mapping; the underlying stored object is retained. This is not permanent deletion, and previously issued signed download URLs remain valid until expiry. Document upload does not send a claim or notify an insurer. Account changes detected by session refresh cause a full reload to discard the previous account's query caches.

Verify signed-download response overrides against the chosen S3-compatible provider before release. Open the Strategy checklist and choose “View or upload documents” beneath a task to attach new files to that task. Task uploads inherit the strategy policy and do not mark the task complete. Unknown or inaccessible task links block uploading. Use “Use an existing document” to attach an unassigned file from the same account with a compatible policy/strategy. A file has one task association at a time. “Detach from task” keeps the file and policy association in the account. Malware scanning/quarantine and permanent object deletion remain future work.

## Reproduce real database verification

The source now includes a guarded integration command. Use a newly created, empty MySQL database on localhost named `ltc_verify_...`, with a dedicated user permitted to create/read/write its tables. Do not use a production connection. The verifier deliberately ignores DATABASE_URL and requires LTC_TEST_DATABASE_URL instead.

```sh
corepack pnpm build
corepack pnpm test:database:guards
read -r -s -p 'Disposable local database URL: ' LTC_TEST_DATABASE_URL
export LTC_TEST_DATABASE_URL
corepack pnpm test:database
unset LTC_TEST_DATABASE_URL
```

The schema must be empty; the command bootstraps it itself, creates synthetic account/data fixtures, starts a loopback-only application, and leaves the test database available for inspection. It never drops a database. Use a fresh empty schema for another run and remove disposable test schemas yourself when finished.

Set LTC_QA_REPORT_PATH to an output JSON path if you want the results saved. To include the optional real-browser check, set LTC_QA_PLAYWRIGHT_MODULE to an installed Playwright module path with a compatible Chromium browser; LTC_QA_SCREENSHOT_PATH optionally selects its screenshot output. The default command runs 23 database checks; with browser verification enabled it runs 24. These are separate from the 251-test Vitest suite and three guard tests.

Checkpoint 5 passed all 21 checks on local MySQL 8.0.46, including actual browser login and account isolation. Application database connections establish UTC even when the MySQL server default timezone differs. Review legacy timestamp assumptions before upgrading an existing database; no automatic timestamp rewriting is performed. Real storage/messaging/AI integrations, production TLS and production database migration remain separate release checks.

Checkpoint 6 added existing-file attachment and detachment. Its 202 automated tests, three database guards, type check, build and mocked Chromium UI checks passed. The expanded real-MySQL attach/detach assertions have not yet been run; the 21-check result above is checkpoint 5 evidence.

Checkpoint 7 closes that verification gap: all 22 real MySQL/HTTP/browser checks passed on October 9, including concurrent attach/detach requests and the real authenticated browser workflow. The temporary engine was stopped afterward. Production and external integrations remain unverified.

Checkpoint 9 adds Profile → Change password. Users must supply the current password, use a different 15–128-character new password, and sign in again afterward; all sessions are revoked. Save unfinished work first. Forgot-password recovery remains operator-managed. Five password-change requests per IP per 15 minutes are allowed; current-password failures also count toward account lockout. The final checkpoint 9 run passed 251 automated tests and 24 real MySQL/HTTP/browser checks.
