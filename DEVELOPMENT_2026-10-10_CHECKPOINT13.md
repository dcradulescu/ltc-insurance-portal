# LTC Insurance Portal — Development Checkpoint 13
**Date:** October 10, 2026
**Status:** Code implemented; offline validation passed; no production deployment or live database migration
**Supersedes:** Checkpoint 12 only for the modules described here, not for unrelated calculator or provider functionality
**Workspace:** `C:\Users\Daniel\Documents\Codex\LTC-Portal-Continuation-2026-10-10\workspace\ltc-portable`

## Changes since Checkpoint 12
1. **Atomic task-completion writes:** Extracted `server/taskCompletionAtomic.ts`. Uses an InnoDB transaction and `SELECT ... FOR UPDATE` on the owned strategy record, then inserts or updates a single completion record. Rejects historical duplicate records instead of deleting or arbitrarily reconciling them.
2. **Database-level uniqueness:** New `uq_task_completions_owner_strategy_task` index on `(userId,strategyId,taskId)` is declared in Drizzle schema and fresh-bootstrap baseline. The separately guarded `scripts/upgrade-task-completion-index.mjs` must be applied **only after backup and duplicate preflight** for existing MySQL databases. Live migration **not run**.
3. **Safety-first migration:** Default index inspection is read-only and reports duplicate group counts, excess rows, unique index status and InnoDB status without printing patient details. `--apply` demands both `--backup-verified` and `LTC_APPROVE_COMPLETION_INDEX_MIGRATION=YES`. No automated legacy deduplication or deletion.
4. **Runtime schema readiness:** `scripts/check-database.ts` now requires the unique completion index, `scheduleStartDate` column and InnoDB engines for `strategies` and `taskCompletions`. A missing migration fails the readiness check.
5. **Editable planning start date:** Added `strategies.scheduleStartDate` nullable date-string, account-scoped `strategy.updateScheduleStartDate` route, and a small date picker/Save control in the existing Strategy Timeline header. No other theme/layout redesign. This is the user's *planning anchor*, explicitly not the insurer's claim, care-service, elimination or approval date.
6. **One source of schedule truth:** Gantt, chronological checklist and all PDF delivery payloads now use persisted `scheduleStartDate` when present, otherwise the original strategy timestamp; both UI views receive the same persisted task-completion dates.
7. **Guarded start-date schema migration:** New `scripts/upgrade-strategy-schedule.mjs` checks the nullable varchar(10) column. Existing DB updates require `--backup-verified` and `LTC_APPROVE_STRATEGY_SCHEDULE_MIGRATION=YES`; nothing is applied automatically.
8. **Fresh database bootstrap sync:** `scripts/schema-baseline.sql` and its SHA-256 manifest were updated to include the two additive changes. Existing migration history was **not rewritten**. Existing DBs require the dedicated upgrades; `pnpm db:migrate` alone does not provide these two changes.
9. **Synthetic MySQL verification script:** Updated `scripts/verify-database.mjs` to seed canonical task IDs and to check planning-date persistence, cross-account denial and impossible-date rejection on a disposable local database. This script was syntax/build-tested but was **not executed against MySQL**: no disposable local test database is configured.
10. **Report parity audit:** `workspace\verification\18_page_report_parity_2026-10-10.md` compares each original custom-template page to the active jsPDF output. The 18-page master has not been replaced or silently approximated.

## Verification
- **TypeScript:** passed (`corepack pnpm check`)
- **Vitest:** **430 passed**, **0 failures**, across **26 suites** (`corepack pnpm test`)
- **Production build:** passed; inherited Vite main-chunk >500 kB warning remains
- **Database guard unit tests:** 3 passed (`node --test scripts/verify-database-guards.test.mjs`)
- **Atomic persistence mock tests:** 5 passed, including concurrent synthetic requests; **not a real InnoDB concurrency stress test**
- **Migration guard tests:** 7 index tests + 6 schedule-column tests passed
- **Account/date tests:** 89 access-control tests including invalid and leap dates
- **Synthetic PDFs:** 3 policy variants generated; all **43/49/48** expected task IDs retained, 18 glossary terms retained, 0 off-page text, 0 nearly empty pages; **19/20/19 pages**, not the original 18-page master
- **Browser compatibility:** Previous checkpoint's 9/9 component QA cases (Chromium/Firefox/WebKit x mobile/tablet/desktop) passed. The newly added authenticated Strategy date picker has **not** been independently rerun against a real HTTP/MySQL session.

## Release gates still open
| Gate | Status / limitation |
|---|---|
| Actual carrier timing & elimination rules | Unknown; may depend on service-day rules, credits and policy-specific approval |
| Carrier approval evidence | User attestation exists but insurer verification and approved-document audit trail do not |
| Exact 18-page custom report | **Not in parity**; active 19-20-page jsPDF does not implement all 18 template pages |
| Existing-MySQL migration | **Not applied**; duplicate count is unverified and data changes are blocked |
| Live MySQL concurrency tests | **Not run**; no isolated test server. InnoDB assumptions must be checked |
| Hosting, public domain, TLS & Node 22 Docker | **Not verified/deployed** |
| SMTP, storage, AI, Zapier, SMS, carrier integration | **Not live-tested** |
| Assessment/Service Agreement app integration | **Not implemented**; deployment URLs and authorized data-transfer contract are missing |
| Full authenticated browser persistence and end-to-end workflow | **Not run** against a real environment |

## Safe deployment sequence for a future approved window
1. Obtain actual destination URLs and the current authorized assessment / agreement source, verify secure hosting and backup procedures.
2. Inspect the existing database with **read-only** `pnpm db:completions:inspect` and `pnpm db:schedule:inspect` using authorized `DATABASE_URL`.
3. If duplicate completion groups exist, pause; preserve and manually adjudicate records under a reviewed remediation plan. Do **not** delete/overwrite them automatically.
4. Verify restorable MySQL backup and a write maintenance window; run the two explicit additive upgrade commands with the required approval flags.
5. Check `pnpm db:check` readiness (required columns, indexes, InnoDB engines), then verify real HTTP/account/browser behavior and live providers.
6. Treat exact 18-page template replacement, externally verified carrier approval, and cross-origin assessment handoff as separately gated integration work.

**Conclusion:** Local implementation and offline tests are complete. **The production release is blocked by the gates above; no deployment or user-data migration is claimed.**
