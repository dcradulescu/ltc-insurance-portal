# LTC Insurance Portal — Checkpoint 15: Approved 18-Page Dynamic PDF

**Date:** October 10, 2026
**Status:** Locally implemented and offline-tested; NOT production deployed.
**Canonical visual template:** sc-visiting-angels-ltc-original-18-v1
**Source:** original-templates/01-Cover.html through 18-Help-Navigating-The-Process.html
**Prior releases:** Checkpoints 13 and 14 preserved unchanged.

## Implementation completed in local source

1. Verified the original 18 standalone HTML pages against the SHA-256 canonical lock. The pages, branding, colors, layout, headings, graphics, page order, Gantt styling, checklists and financial layouts remain untouched.
2. Added a separate data-binding engine (server/canonicalReportModel.ts and canonicalReportBinder.ts). This injects the current insured/policy fields, zero/nonzero elimination periods, task status, schedule offsets, cost tables and 1/2/3-year modeled calculations into rendered COPIES. It does not rewrite the originals.
3. Reuses the existing shared care calculator (shared/careCalculator.ts) and Gantt scheduler (shared/claimSchedule.ts). Numerical projections require a successfully validated submitted care scenario and must agree with the saved policy's daily/monthly caps and lifetime pool. A conflicting or incomplete scenario results in "Not calculated"/"Carrier verification required", not fabricated payouts.
4. Added secure local Chromium rendering (server/canonicalReportPdf.ts) that checks every HTML hash at runtime, removes original scripts, blocks outbound requests, binds data with textContent, validates page image/geometry, and produces EXACTLY 18 PDF pages or raises an error without partial upload.
5. Important: original HTML has screen-layout overflow and native Chrome PDF truncates several pages. The renderer captures complete full-page screenshots, uniformly fits each onto a PDF page (page 13 landscape), and writes an 18-page image-based PDF via pdf-lib. This preserves content and visual design but produces NOT-searchable, NOT-selectable text; tagged/accessibility requirements are NOT met.
6. Activated this 18-page renderer as the local PDF download and email attachment/link pipeline in server/strategyPdfGenerator.ts. No automatic fallback to the old 19–20 page jsPDF design remains; that older generator file is retained unchanged for reference.
7. Updated PDF transport schema to carry actual validated care scenario, policy dates, carrier details and schedule IDs. Updated CareCalculator.tsx so only a confirmed valid scenario is sent for report generation, invalidating it on edits.
8. Added server-side identity and benefit guard in generateStrategyPdf: the insured name, policy number, carrier and submitted daily/monthly/lifetime amounts must match the account's saved policy before rendering. Uploaded PDF keys remain scoped to account and stored using existing authenticated object storage.
9. Updated the Dockerfile to include Chromium, browser support libraries and locked template HTML files in the production image; the runtime is configured for a non-root app user. Docker build and sandbox behavior are still UNTESTED in this workstation.
10. Added 26 report-model tests and 7 report-generation tests for reconciliation, ownership, missing data and no silent fallback. Existing tests and designs retained.

## Verification

- TypeScript: PASS.
- Vitest: **506 passed / 0 failed** in **30 suites**, final full suite.
- Production client/server build: PASS (original source lock verified in prebuild). Preexisting warning remains: main client bundle >500 kB.
- 18 source template hashes: PASS, unchanged.
- Two synthetic 18-page report cases: PASS (one withholding costs, one with confirmed sample care model and zero-day policy). Exactly 18 pages and 18 raster page images each; no unverified client identity or known sample amount tokens in the bound DOM audit.
- Full per-page DOM audit of all 18 original pages: PASS for known source sample identity, policy and reviewed figures. Does NOT equal exhaustive mapping of every provider/rider/policy field; the original 18-page HTML contains many fixed educational text blocks and generic instructions.
- The PDF QA fixtures and rendered page images are located at workspace/verification/canonical-report. The QA scripts are kept under workspace/qa-browser, OUTSIDE the release application tree.
- No real insurance documents or patient records used for the synthetic report tests.

## Remaining release blockers — 9 separately documented categories

**EX-01 Exact content mapping & atypical inputs:** Only the mapped canonical fields and known sample claims have been audited. Full per-field comparison with the original 18-page form is needed, including all policy riders, specialized insured/contact fields, long names/addresses and differing insurer products. Original dynamic text can change line wrapping; page fit for worst-case client data not exhaustively tested.

**EX-02 Searchable/accessible PDF:** Current visual preservation is image-based: all text is rasterized; cannot copy/search/read with screen readers. A text-layer or accessible vector reproduction must be designed and validated without changing the approved visuals.

**EX-03 Care-model persistence & partial-year periods:** Confirmed care scenario lives in the Strategy page React state and is not persisted across leaving/reloading. Mid-month simulation start dates are suppressed from 1–3-year financial summaries rather than mislabeling partial windows as full years. Durable account-scoped saving and correct rolling-year allocation remain needed.

**EX-04 Policy-specific claim rules:** Calendar vs paid-service elimination methods, lookback/credit rules, carrier decisions, benefit triggers, waiver/AOB provisions, inflation riders, denied/revoked claim states, and billed-vs-approved reimbursements need the actual issued policy and independent carrier confirmation.

**EX-05 Live MySQL migrations & concurrency:** Three previous additive MySQL changes (task unique index, scheduleStartDate, claim milestone evidence table) are prepared but NOT applied to any live database. No real InnoDB write races, data migration, and backup restore completed.

**EX-06 Assessment & service agreement integration:** No authenticated cross-origin transfer of the original assessment/plan-of-care/service agreement fields is live. URLs, ownership and consent contract still missing.

**EX-07 Browser and Docker production runtime:** Tested local installed Windows Chromium using a synthetic fixture with sandbox disabled. Docker runtime (Alpine Chromium as unprivileged user), server timeouts, large report performance, memory concurrency, TLS/domain and actual browser account session behavior have not been verified. The production image has not been built or launched on this workstation.

**EX-08 External services and security compliance:** Real S3 object storage, signed URL delivery, SMTP, Zapier, SMS, AI services, PHI retention, accessible disclosures, backup encryption and role-based audit controls not exercised in production.

**EX-09 Deployment and user acceptance:** No user-reviewed client-filled 18-page PDF, no live client-specific carrier verification, no production deployment/URL, no GitHub overwrite or rollout authorization. Exact visual style is approved; dynamic report content has not yet been approved after receiving live policy data.

## Next safe actions

1. Inventory remaining per-page policy fields, complete the mapping, and run extreme-length regression plus the actual 18-page design comparison.
2. Implement durable, account-scoped storage for verified care-calculator inputs, including accurate rolling 1/2/3-year windows for non-first-of-month start dates.
3. Develop a selectable/searchable accessibility-preserving output method or document its approved operational use as image-only.
4. Verify Node 22 + Alpine Chromium Docker startup, sandbox, memory use and SSR/browser timeouts in isolated staging.
5. Validate true authenticated HTTP account + storage + email + MySQL transactions on a disposable local database before using any real client.
6. Obtain the actual assessment/agreement deployment URLs and field contract, then integrate securely.
7. Keep all original HTML and previous checkpoint archives intact. Do not deploy or mutate live DB until separately approved and tested.

**Conclusion:** Checkpoint 15 dynamic 18-page report prototype and PDF routing are locally implemented and verified with synthetic data. Complete with 9 documented release-exception groups. NOT production-ready.
