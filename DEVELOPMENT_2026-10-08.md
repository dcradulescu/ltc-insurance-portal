# LTC Insurance Portal — development checkpoint 5

**Status: in progress; source changes verified with documented environment exceptions. No public deployment or live URL is verified.**

This supersedes the first four October 8 checkpoints. Base source was recovered from Dropbox Ai/LTC App/LTC_Insurance_Portal_PORTABLE_MIGRATION_2026-08-12.zip. Report templates/design references are in Ai/LTC Portal. Home Care Evaluator is a separate application.

## Implemented in this checkpoint

- Local, operator-provisioned account sign-in with normalized unique email and salted scrypt password hashes. Minimum password length is 15 characters; maximum 128. Hash parameters follow OWASP's scrypt guidance (N=131072, r=8, p=1): https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Eight-hour JWT sessions with a database session record, active-account check, server-side logout revocation, password-reset session revocation, and rejection of legacy sessions that lack a persisted session identifier.
- Ten HTTP sign-in attempts per IP per 15 minutes, account lockout after five failed attempts, and bounded concurrent password hashing. Login cannot be batched.
- Host-only HttpOnly session cookies with SameSite=Lax and Secure in production. Mutations require a custom same-origin request header; configured CORS origins govern cross-origin requests. Logs omit query strings, cookies and response cookie headers.
- Authentication for all personal-data operations. Only auth.me, auth.login, auth.logout, system.health, and the public contact form remain public.
- Account ownership checks for policy reads/updates, strategy reads/generation/updates, task completion, contacts, chat policy context/history, saved-progress links and document APIs. Admin status does not implicitly grant cross-client access.
- Registered the previously disconnected documents router. Uploads authenticate before accepting the large body, keep the declared 50 MB file limit, and validate ownership of linked policy/strategy records. Document removal revokes the portal's download mapping; the S3 object is retained.
- Private file registry and download proxy. The proxy verifies both sign-in and file ownership, returns non-cacheable 60-second signed redirects, and does not use public CDN URLs for client files. Explicit PDF email operations use a one-hour signed delivery URL.
- Saved-progress links require their owning account. Legacy links without an owner cannot be resumed automatically. Link creation ignores browser-supplied origins and uses APP_PUBLIC_URL.
- Login screen in the existing Visiting Angels visual theme, protected page redirects preserving the intended return path, sign-out control, session-expiry handling, and account-scoped browser draft storage. Existing unscoped legacy browser drafts are not imported or deleted. New private drafts live in per-account sessionStorage and are cleared on sign-out/session-account transition.
- Profile editing is scoped to the signed-in account. Sign-in email changes are operator-managed; the UI shows email read-only.
- Moved the Zapier webhook to the server-only ZAPIER_WEBHOOK_URL variable. Existing VITE_ZAPIER_WEBHOOK_URL configurations must be renamed and the frontend rebuilt.
- Added an additive access-control migration, an empty-database-only current-schema bootstrap, a read-only schema preflight command, and an account provisioning/password reset command. These tools were subsequently verified against disposable local MySQL in checkpoint 4; production/legacy databases remain unmodified.
- Removed static production imports of development-only Vite packages. Production bundles include account/schema tooling, and Docker includes required migration/bootstrap resources.
- Retained the prior session application-ID and PDF/email body-limit fixes. Fixed a pre-existing footer-link overflow on mobile.

- Replaced simulated/ignored delivery success with explicit provider acceptance. SMTP is required even in development when no webhook is configured. Missing configuration, SMTP rejection/partial rejection, webhook rejection and network errors cannot report full success. Provider acceptance does not assert inbox or phone delivery; requests are not automatically retried or switched between providers.
- Strategy/PDF email stops if the requested PDF fails to generate, and messages accurately describe a one-hour PDF download link. Page-content email now submits the actual content to every supplied recipient. Contact form failures retain input and direct the user to the office.
- Saved-progress email uses the signed-in account address, preserves the saved record on delivery failure, and exposes a copyable account-bound resume link. The recipient field is read-only. Browser-supplied origins are ignored for outbound mail.
- SMS preferences now persist per account in the existing JSON preference column, with a locked merge to preserve profile preferences. The UI loads saved preferences, removes the unsupported additional-recipient selector, restricts test-message controls to administrators, and states that automatic reminders are not enabled. Bulk SMS results include accepted/failed counts.

## Added in checkpoint 3

- Added /documents behind the existing sign-in gate and added Documents to desktop/mobile navigation. The login return-path allowlist includes this route. At intermediate widths, navigation uses the mobile menu to prevent overcrowding.
- Account document screen supports one-file uploads, the existing server-defined categories and 50 MB limit, filename search, category filtering, private downloads, and confirmed removal. It has explicit loading, empty, validation, upload failure, list failure, and removal failure states. Uploading does not submit a claim or notify an insurer.
- Read APIs replace inherited public file URLs with the authorization proxy. Proxy downloads still check ownership, expire after 60 seconds, and now request attachment disposition with safely encoded filenames, a binary response type, and private/no-store caching. S3-compatible response overrides still need live verification.
- Removal explicitly means removing portal access, not erasing the underlying storage object. The UI requires confirmation and describes that distinction. Existing signed links remain usable until expiration. Permanent erasure/retention administration is not implemented.
- Tightened document input validation and made document list helpers fail explicitly when no database is available instead of returning an apparently empty list.
- Account changes observed in an open tab now gate private rendering and reload the page, discarding all query caches before mounting the next account. This includes a cookie/account change in another tab detected by session refresh. Account drafts are cleared as before.

## Added in checkpoint 5

- Strategy checklist tasks link to a task-specific documents screen with a server-verified task label, scoped file list, and upload association. Uploads derive the policy from the owned strategy. Users can return to Strategy or view all account documents.
- Task association requires an existing task in an owned strategy. Unknown/removed tasks, mismatched policies, and cross-account strategy access fail before storage. Documents are queried by account, strategy and task together because task IDs repeat across strategies.
- Invalid task links block uploading; task uploads do not mark tasks complete or submit a claim. Existing account files remain available in the all-documents screen. Linking an already uploaded file to another task is not yet implemented.
- Verified task upload payload, successful refresh, unknown/malformed task blocking, stale-file hiding, and all-documents navigation in Chromium with mocked API responses. Screenshots inspected at desktop and mobile; no horizontal overflow at 1440, 1024 and 390 pixels. The checklist link itself was code-reviewed, not exercised in this browser fixture.
- Re-ran 21 real MySQL/browser checks with added assertions that repeated task IDs in separate strategies cannot mix documents. Real S3 upload is still unverified. No database schema migration was needed.
- Current suite: 184 passing Vitest tests; TypeScript and production build pass. Production build retains the existing large-chunk warning. Three database guard tests passed in checkpoint 4 and were unchanged in this checkpoint.

## Added in checkpoint 4

- Ran the application against a real, isolated MySQL 8.0.46 database with synthetic accounts and records. The portable engine was extracted into scratch from an official Ubuntu package after verifying the archive signature, package-index digest, and package SHA-256. No database engine, test data directory, or credentials are bundled with the source.
- Fixed a lockout bug found by integration testing: ORM-generated MySQL UPDATE assignment order caused lockout after four failures. Failed-attempt recording now locks the account row, computes the next count explicitly, locks on exactly the fifth failure, and starts a fresh attempt window after an expired lockout.
- Fixed timestamp handling: application connection pools use UTC for both client conversion and each MySQL session. Drizzle timestamp strings, NOW(), default timestamps, lockouts and session comparisons now use the same time basis. Verification used a database with SYSTEM/KST defaults to exercise this difference. Existing production timestamps were not rewritten or reconciled.
- Added `test:database`, an opt-in real integration command requiring an explicit local `LTC_TEST_DATABASE_URL`, an `ltc_verify_*` schema name and an initially empty database. It does not drop the test database. SMTP, S3, AI and SMS settings are disabled in the spawned application; the fixtures are synthetic. Browser verification is optional through an externally installed Playwright module.
- Added three executable safety-guard tests that reject absent configuration, remote database hosts and ordinary local database names before connecting. Added optional HOST binding; the integration application binds only to 127.0.0.1.

## Verification

Current results are recorded in DEVELOPMENT_TEST_RESULTS_2026-10-08.json.
- Automated suite: 184 passed, 0 failed, 0 skipped.
- TypeScript check: passed, including provisioning and schema-check scripts.
- Production frontend/backend and operator-tool builds: passed. Existing bundle-size warning remains; some frontend chunks exceed 500 kB.
- Production local smoke: /healthz and /login returned 200. Bundle import inspection found no development-only package imports.
- Browser: Playwright 1.56.1 / Chromium 141. Desktop 1440×1000, mobile 390×844, and document navigation at tablet 1024×768. The bundled newer Chromium was unavailable, so a compatible test browser was installed outside the project dependencies.
- Actual browser flow: login loads → unauthorized policy URL redirects to sign-in with return path → no policy query is issued before authentication → unconfigured login reports an error and clears the password. Mobile has no horizontal overflow. No uncaught page errors were observed.
- Additional browser check: with mocked authenticated API responses, the production policy-form UI keeps the account email read-only, shows the actual email-failure status, and preserves the copyable resume link. The dialog fits mobile. No external email or SMS was sent.
- The 184-test suite covers mocked database/provider boundaries. Checkpoint 4 additionally verifies the real MySQL/HTTP/browser boundaries listed below; live object-storage and messaging providers remain untested.

- Document browser flow (mocked account/storage boundaries): unauthorized redirect → list → filename/category filters → invalid-file rejection → failed upload → successful upload → download with expected filename → removal cancellation → failed removal → successful removal → failed-list refresh and recovery. Account-switch reload and cache discard also passed. No horizontal overflow at mobile/tablet; no uncaught page errors or framework overlay.
- Browser console exception: the external Google Fonts stylesheet returned ERR_EMPTY_RESPONSE in this environment (including after the account-switch reload). System fallback fonts rendered; application interactions passed. Browser plugin was unavailable, so the existing external Playwright installation was used.
- Document UI evidence is included in the archive's verification/ directory. Authenticated API and download responses were mocked; no live document was uploaded or removed.

## Real MySQL verification

All 21 checks passed. The JSON evidence is `verification/LTC_Portal_Database_Verification_2026-10-08.json` in the archive. The run covered fresh bootstrap, refusal to bootstrap a nonempty schema, column preflight, migration no-op after bootstrap, account provisioning and duplicate refusal, real HTTP login/cookies/persisted sessions, policy and strategy/task persistence and ownership, contacts, preference merging, owner-bound saved progress, chat isolation, document metadata/removal and private access checks, logout revocation, exactly-five-failure lockout, operator reset/session revocation, HTTP login throttling, lockout-window expiry, database session expiry, and real browser login/logout with two isolated account document views.

- 21/21 real MySQL integration checks, 184/184 existing automated tests, and 3/3 database safety-guard tests passed. TypeScript and production builds passed.
- Database: MySQL 8.0.46, global timezone SYSTEM, system timezone KST, verification session UTC; application connections now establish UTC independently. The verifier allows one second of rounding because the schema's TIMESTAMP columns have whole-second precision.
- Browser: Playwright 1.56.1 / Chromium 141, desktop 1440×1000, real application HTTP responses and MySQL data, no API mocks. The browser used the runtime's local timezone for displayed dates. No uncaught page errors or error overlay; page identity/content and sign-in/sign-out/account isolation passed. The external Google Fonts request was unavailable, so fallback fonts rendered; one image request was aborted during navigation.
- The document fixture is database metadata only; there is no matching live S3 upload. This verifies document persistence/access boundaries, not object upload/download delivery. All accounts and records were synthetic. No external messages were sent.

## Five remaining work groups

1. **Live database and legacy reconciliation.** Configure MySQL, back up any existing database, inspect its real schema/migration ledger, run the read-only preflight, and review migration execution. The inherited migration history contains divergent/untracked files. Do not blindly generate schema changes against existing data. Legacy user-1 records must be deliberately mapped; none were moved or assigned in this iteration. Fresh bootstrap and tracked-migration no-op were verified on disposable MySQL 8.0.46. Existing-database upgrade paths, actual legacy records and timestamp assumptions still require separate review; this run does not establish production migration readiness.
2. **Account and staff workflow rollout.** Provision the first accounts. The current UI is per-account and uses the existing user/admin roles. A staff workspace for multiple clients, invitations and self-service password reset are not implemented. Password reset currently uses the operator CLI. MFA is not implemented.
3. **Live integrations and document lifecycle.** The account document screen and protected APIs are connected. Task attachment uploads are implemented. Linking existing files to tasks, malware scanning/quarantine, and permanent file-retention/deletion administration remain unimplemented. Test real S3, AI, SMTP/Zapier, PDF delivery and optional SMS with approved test data. Provider acceptance/failure semantics are now corrected and tested with mocks; actual inbox/phone delivery, webhook field mappings, provider callbacks and automatic SMS scheduling still need implementation/configuration and live verification. Private S3 bucket access policies also require configuration.
4. **Hosting verification.** Choose/confirm the deployment target, configure TLS, APP_PUBLIC_URL, exact CORS origins and trusted proxy hops, build/run the Docker image on Node 22, and verify all workflows through the hosted address. Current checks used Node 24.19.0. No production URL is established.
5. **Legacy content and media.** The recovered bundle has 19 referenced media files. The older environment reference says 20; the missing original education-video.mp4 uses the existing fallback. Historical template/content correctness and all legacy UI workflows have not been comprehensively audited in this pass.

## Data preservation

Original source assets and media are included. No production database rows or credentials were supplied, copied, migrated, or modified. Checkpoint 4 created synthetic records only in a private local verification database. New account/ownership tables are additive. Legacy data is never automatically assigned to newly provisioned accounts.
