# LTC Insurance Portal — Checkpoint 14: Carrier Evidence and Claim Milestones
**Date:** October 10, 2026  
**Status:** Locally implemented, offline-tested, **not deployed / not connected to a live MySQL database**  
**Source:** `C:\Users\Daniel\Documents\Codex\LTC-Portal-Continuation-2026-10-10\workspace\ltc-portable`  
**Baseline:** Checkpoint 13 archive is retained without modification.

## Implemented
1. **Stage 3 evidence requirement.** `strategy.recordCarrierApproval` accepts an actual decision date, carrier claim/decision reference, uploaded PDF/JPEG/PNG document ID and explicit user attestation. The server validates owning strategy and policy, document ownership/scope/type and historical-date format. A basic confirmation dialog or `updateTasks(carrierApprovalConfirmed:true)` can no longer mark a claim approved.
2. **Transactional approval record.** `server/claimMilestones.ts` serializes the write under the owning strategy's InnoDB row lock and writes a **user-submitted, append-only** approval event and `currentStage=3, claimStatus=approved` in the same transaction. The nullable unique `approvalDedupeKey` prevents duplicate approval events even under concurrent writers.
3. **Document retention.** Evidence files referenced by a milestone are protected from ordinary app deletion/detachment/reassignment. The proposed DB schema additionally restricts direct deletion of a referenced `documentUploads.id` through an InnoDB foreign key.
4. **Real-event history.** Account-scoped API supports append-only, **user-reported** claim notice, claim submission, actual care start, elimination evidence sent and first payment received dates, with optional reference and a linked document. These dates are not assumed to establish benefits or insurer approval.
5. **Existing branded UI.** `ClaimMilestonePanel.tsx` adds a compact "Record Carrier Approval" dialog on Stage 2 and a dated Claim Milestone History section beneath the timeline. Existing palette, typography, Gantt, checklist and exported PDF engine are preserved; a separate 18-page report is not silently substituted.
6. **Migration preparedness.** New `claimMilestoneEvents` table in Drizzle schema and **fresh database** SQL baseline, with indexes, foreign key and unique approval dedupe key. Existing database uses dedicated guarded `upgrade-claim-milestones.mjs` with `--inspect` read-only; `--apply` requires backup verification and a named explicit approval flag. Migration journal remains unchanged. Database readiness requires the table, expected indexes and FK, and InnoDB.
7. **Defense in depth.** Existing approved records cannot be downgraded through ordinary checklist updates; Stage 3 task completion checks the recorded approval event. All new API routes require authenticated ownership and strict input validation. Documents cannot be reassigned once part of the claim history.
8. **Test harness.** Added unit tests for reference/date validation, linked-document scope, evidence immutability, duplicate approval, transactional transition and migration safety. Updated the existing disposable-database integration script to exercise carrier approval and document retention, but it has **not** been executed against an actual MySQL service.

## Verification
- **473 Vitest tests passed across 28 files** (final checkpoint14 full suite after additional route and evidence tests)
- TypeScript compilation passed, production Vite/esbuild bundle completed (existing >500 kB chunk warning remains)
- New carrier panel browser QA: **9/9** Chromium, Firefox, WebKit × mobile 390×844, tablet 768×1024 and desktop 1440×900. Tested required fields, selection of a mock previously uploaded PDF, user attestation, one approval API mutation, update of history, a second care-start event, and global overflow. All used synthetic data and intercepted API responses, not an authenticated production environment.
- PDF route and master have not been changed by this checkpoint; prior 3 synthetic report scenarios remained 19/20/19 pages, not exact parity with the separate 18-page template.
- Source archives and original legacy records have not been overwritten or deleted.

## Critical remaining release gates — count 8
1. **Live database migration & concurrency.** Three existing-schema upgrades (Checkpoint 13 unique task index, schedule date column, new claim milestone table) have **not** been applied. No real InnoDB concurrency/persistence stress test or duplicate-data reconciliation has been completed.
2. **Independent carrier verification.** A document/reference uploaded by the user is recorded as `user_submitted`, not insurer-validated. Office/carrier validation, disputed/revoked approvals and correction/supersession workflow remain missing. User-submitted documentation must not be represented as independent confirmation.
3. **Policy-specific milestones & elimination rules.** The portal does not determine official claim-approval date, benefit payable date, calendar- vs service-day waiting terms or credit/lookback rules without the carrier-issued contract. Event logging does not compute eligibility.
4. **18-page custom report parity.** The active jsPDF report is not the original HTML/PDFMonkey 18-page master. Financial scenarios, full original page mapping, typography and graphics remain unimplemented; canonical report-engine choice needs explicit approval.
5. **Assessment/Service Agreement handoff.** No authenticated, secure cross-origin transfer has been implemented. Live URLs/hosting and authorized field and consent contracts remain required.
6. **Deployment.** Public domain, TLS, deployment environment, Node 22 runtime and backup/restore procedures are not confirmed. No production deployment or GitHub overwrite performed.
7. **External integrations.** Live SMTP, PDF storage/S3, Zapier, SMS, AI, insurer billing and delivery receipt confirmations have not been exercised.
8. **Production security / real end-to-end testing.** No full authenticated browser scenario, live claim upload and PDF export, real account retention/privacy review or production database integration was executed. PHI-bearing records need access, encryption, backup, retention and compliance review.

## Important migration order
1. Back up the real database and verify restore capabilities; inspect duplicate task records without deleting anything.
2. Apply the unique-completion index and nullable schedule-start-date changes from Checkpoint 13 **only after explicit authorization**.
3. Run `corepack pnpm db:milestones:inspect`; obtain authorization and execute `db:milestones:apply` with backup verification and explicit flag.
4. Run `corepack pnpm db:check`. Do not deploy a code version requiring the new table before applying the migration.
5. Use a **new empty local MySQL** `ltc_verify_*` database for `corepack pnpm test:database`. No production data may be used in the disposable integration test.

**Result: Local development complete with documented exceptions. Not production-ready.**
