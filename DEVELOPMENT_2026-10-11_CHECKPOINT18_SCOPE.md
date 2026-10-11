# LTC Insurance Navigator — Checkpoint 18, Original Public Strategy Flow
**Date:** October 11, 2026
**Status:** Visitor workflow reconciled with user direction. Calculator, approved visual design, Zapier, and existing production connections UNCHANGED. No production deployment.

## Binding user direction
The app is a publicly accessible LTC insurance education and financial-planning resource for any visitor, not just Visiting Angels clients. Follow its ORIGINAL integrated journey:

1. **Home / Education** — Explain policy terms and options.
2. **Policy Form** — Collect policy benefit terms and a hypothetical home-care need/cost scenario appropriate for public visitors; preserve the multi-step wizard/progress UI.
3. **Strategy** — Show the individualized educational strategy with the EXISTING calculator in its ORIGINAL place: hours/day, care days/week, hourly cost, carrier benefit caps/remaining pool, waiting period, premium waiver, inflation, estimated insurer reimbursement, family costs, and benefit duration. Strategy also includes timeline, checklist and approved 18-page Visiting Angels PDF.
4. Additional pages/links remain in their existing location until explicitly reviewed; do not create a separate calculator or replace the strategy workflow.

### Strict locks
- **Do not change existing calculators**: no formulas, limits, validation rules, fields, defaults, display, layout, calculation semantics, data model or tests without explicit new instruction.
- **Do not change canonical 18-page original HTML designs, branding, colors or approved PDF appearance**.
- **Do not remove or alter Zapier now**. User explicitly wants to finish application and review it before cutting Zapier.
- No production changes, client/PHI testing, external webhook calls, or migrations without authorization.
- Preserve C: original, previous H: archives and current H: working source. No undocumented deletions or scope substitutions.

## Work completed in this correction
- Restored EXACT original `client/src/components/CareCalculator.tsx`, `client/src/App.tsx` and `client/src/components/Layout.tsx` from independent H: checkpoint18 backups. SHA-256 compared, identical.
- Archived (moved, not deleted) an experimental separate public projections page and its local draft-storage helper to `H:\LTC-Insurance-Portal\QA\checkpoint18-public-projections-backup\`. These files are NOT active routes or app components.
- No report template, server routes, Zapier modules, database schemas, or original source calculator files changed.

## Blocking gaps observed in CURRENT code: NOT yet fixed
| ID | Severity | File(s) | Verified issue | Required acceptance |
|---|---|---|---|---|
| V-01 | P0 | `client/src/App.tsx` | Both `/policy-form` and `/strategy` render inside `PrivatePage`, redirecting unauthenticated strangers to sign-in. | Original public journey available without account. Must preserve private account isolation and server defenses when changing gating. |
| V-02 | P0 | `client/src/pages/PolicyForm.tsx` | Step 1 requires insured legal name, personal email and phone; step 3 requires policy number; step 5 requires a diagnosis/condition. | Public hypothetical education scenario must not require personally identifiable data or diagnosis. Preserve wizard look/feel and necessary policy benefit fields. |
| V-03 | P0 | `client/src/pages/PolicyForm.tsx`, `client/src/pages/Strategy.tsx`, `server/routers/policyForm.ts` | Completion, page exit, inactivity and generation attempt automatic comprehensive Zapier transfer; PolicyForm also sends progress notification with form. | User chose to RETAIN Zapier temporarily. Do not promise browser-only privacy while these paths remain. Plan suppression/authorization with separate approval at final switch-over. |
| V-04 | P0 | `client/src/pages/Strategy.tsx`, `server/routers.ts` | `strategy.generate`, `policy.get`, `strategy.getMine`, care-scenario save and report generation rely on signed-in MySQL policy and strategy. | Merely removing `PrivatePage` will NOT make flow function; requires equivalent anonymous session model and compatible public strategy/PDF data contract without changing calculator. |
| V-05 | P1 | `client/src/pages/Strategy.tsx` | The original Strategy's financial calculator is already in its `financial` plan tab; its confirmed scenario is saved by account-scoped backend mutation. | Preserve existing financial tab, calculation fields and outcomes; design anonymous persistence without changing component implementation. |
| V-06 | P1 | `server/canonicalReportPdf.ts` and `server/strategyPdfGenerator.ts` | Current 18-page PDF is generated on server and uploaded, though original user eventually wants local-only. | Retain existing implementation until an exact visually equivalent browser implementation is verified; no silent fallback or design changes. |
| V-07 | P1 | `client/src/pages/PrivacyPolicy.tsx` | Existing policy describes collection, remote saving and Zapier; do not claim all-entered data stays in browser until code behavior and policy match. | Audit actual data flows and legal disclosures before anonymous public launch. |

## Explicit scope order
1. Lock the existing integrated UX and calculator; audit Home → Education → Policy Form → Strategy → report, including form validation/progress, browser responsiveness, and save/resume. Fix no financial logic.
2. Design a complete anonymous usage path through ORIGINAL Policy Form and Strategy, not a standalone calculator or stripped-down alternative. The app must not require login or identity to use educational benefits/projections.
3. Preserve existing private account routes and data isolation until anonymous flow is complete, verified and explicitly accepted.
4. Verify anonymous data is handled consistently; privacy safeguards and data-flow disclosures must accurately state what the current app does. Do not promise local-only data while external sends remain.
5. Test full workflow on mobile/tablet/desktop and Chromium/Firefox/WebKit; run unit, type check and build. Avoid real client data.
6. Keep current server PDF and Zapier integration functional until user reviews completed application and expressly approves conversion/decommissioning.

## Completion criteria
No 'complete' claim until anonymous Policy Form and Strategy journey, all existing calculator behavior, visually approved 18-page output, navigation/form validation, cross-browser device tests, safe data-flow boundaries, and the documented integration transition have been verified. Record each exception if blocked.

## Baseline verification
The post-rollback type check on October 11 completed with exit code 0. Full regression suite completed successfully: 566/566 tests, 35/35 test files, exit code 0. Original approved 18-page template lock verified in the build preflight. Full production-code build completed with exit code 0. Pre-existing Vite warning persists for client chunks above 500 kB. All tests used synthetic data; no real client records, live webhook, live insurer, production deployment or live database migrations were touched.
