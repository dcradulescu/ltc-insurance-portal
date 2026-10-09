# Development review — 2026-10-09

Status: **in progress; not ready to merge or deploy**.

Canonical source: `dcradulescu/ltc-insurance-portal`, main commit `504c690157f71b09b2e8a1d70464597d2bfe1ac2`. All 273 baseline files were downloaded and checked against their Git blob SHA. The pre-existing local project was archived separately before editing; none of its application code was imported. Development branch: `codex/ltc-todo-completion-20261009`.

## Scope and accounting

The actual checklist is `todo.md` (lowercase): 731 entries at baseline, 670 previously checked and 61 open. `TODO_REVIEW.csv` inventories every entry with its original line and status. An inherited check is historical evidence only, not a new verification result. This change does not certify all 731 requirements. Open items stay open unless the evidence below supports completion. Overlapping and superseded historical requirements are preserved, not silently deleted.

## Findings and implementation

| Priority | Finding | Change / remaining work |
|---|---|---|
| Critical | Private policies, strategies and contacts used a shared public user ID | Signed, HTTP-only visitor sessions; queries/mutations scoped to owner; cross-owner tests. Requires database and secret configuration. Existing shared records need an explicit ownership migration; never automatically assign them to a new visitor. |
| High | Email endpoints could report success after delivery failure | Shared HTTPS delivery adapter, 15-second timeout, no redirects, explicit missing-configuration and provider errors. Response means provider accepted, not inbox delivery. Live receipt and templates remain unverified. |
| High | Client supplied the origin for recovery links | Server APP_URL determines origin; bearer tokens are not returned or logged; restored data cannot choose a policy ID or owner. Recovery links remain reusable for 30 days; stronger revocation/single-use policy needs further implementation. |
| High | Model-generated HTML was rendered unsanitized | DOMPurify on strategy HTML; chat escapes markup before formatting. Remaining HTML sinks and generated letters require a complete review. |
| High | PDF generation uploaded private data just to download it | Download API returns PDF bytes as base64 directly; email endpoints supply attachment bytes to the configured webhook. Confirm the receiving automation supports this new attachment contract before enabling delivery. |
| High | Rate-limit prefixes missed dotted and batched tRPC paths | Inspect each procedure, cap batch size at 10, apply heavy-route limits and a consistent 1 MB input limit. CORS uses APP_URL; request logs omit query parameters and credentials. |
| High | Premium waiver incorrectly extended the benefit pool | Shared real calculation functions separate premiums from covered care. Projection caps payments by daily limit, cost and remaining pool; invalid inputs rejected. Explicit illustrative assumptions replace unsupported growth claims. |
| Medium | Academy navigation falsely completed lessons; placeholder clips and dead resources | Explicit persisted completion checkbox; next/previous preserve completion; linked step expansion; external sample video embeds with fallback links. Twelve substantive guides now download as PDF; four also as Word worksheets. Actual third-party playback is not verified. |
| Medium | PDF form rows discarded wrapped values | Full-value rows, additional alternating process timeline, clearer policy-dependent wording. Pagination and typography still need a complete all-page pass. |
| Medium | Calendar link was generic; SMS preferences only logged | Booking uses VITE_BOOKING_URL with a phone fallback. SMS preferences persist under the visitor when storage is configured; aggregate failures no longer claim success. Live scheduling/SMS remain unverified. |
| Medium | Production imported dev tooling and emitted an invalid analytics URL | Deferred dev imports, removed Manus runtime/debug injection from Vite configuration, removed unconfigured analytics script, added /healthz. |
| Medium | Navigation order and page state were inconsistent | Shared six-step journey, aligned previous/next order, scroll reset, responsive wrapping, policy form simplification, reduced-motion support. |

## Executed verification

- TypeScript check passed after the changes.
- Production client/server build passed; large JavaScript chunk warning remains.
- 74 tests passed across 11 files; two inherited chat tests remain skipped and are **not** counted as verified chat behavior.
- Browser plugin unavailable: used installed Playwright Chromium against the actual production build.
- 30 page/viewport combinations rendered headings with no uncaught JavaScript errors: Home, Education, Academy, Policy Form, Strategy, Contact, Profile, Resources, Terms, Privacy at widths 1440, 768 and 390.
- That smoke pass found horizontal overflow on Home at 768/390 and Education at 390. A subsequent clipping change needs re-verification; these are not closed based on a smoke test alone.
- Verified Academy explicit completion survives reload; Next does not complete the next lesson, opens Step 2, and loads its matching privacy-enhanced video iframe. This does not establish that YouTube permits playback.
- Downloaded all 12 resource PDFs and all four Word worksheets successfully in the browser. Inspected one resource PDF visually; remaining resource layout and Word rendering checks are pending.
- Generated a 22-page landscape strategy PDF including long-name data; inspected selected policy/disclaimer pages. Found excess spill pages and imperfect typography. Complete visual acceptance remains open.
- No real messages were sent. Delivery tests mock fetch; ownership tests mock persistence. They do not verify a deployed database or receiving automation.

## Blocking configuration (presence checked, values not inspected)

DATABASE_URL, JWT_SECRET, APP_URL, ZAPIER_WEBHOOK_URL (and legacy alias), BUILT_IN_FORGE_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and VITE_BOOKING_URL were absent in this environment. Do not paste credentials into issues or PR comments. Configure them in the deployment's secret store. Live service checks must use approved test data and recipients.

## Remaining development and acceptance work

1. Complete every remaining checklist item and reconcile historical checked claims with evidence. The ledger deliberately distinguishes unverified inherited checks.
2. Run database-backed create/update/reload, contacts, checklist, chat-session isolation and recovery tests; define migration/retention for legacy shared records and the old SSN column. Removing the TypeScript field does not delete stored data.
3. Verify webhook receiving contracts, attachment decoding, email templates, inbox arrival and failure paths with approved test recipients. Do not treat HTTP 2xx as successful delivery.
4. Complete all six form steps, tooltip/validation combinations, resume behavior, strategy generation and calculator UI tests. Existing tests do not cover every field.
5. Restore or migrate external images/logo/video dependencies. Legacy `/manus-storage` images failed to display without their configured provider. Missing assets prevent visual acceptance; no replacement assets were fabricated.
6. Finish PDF typography, sparse spill pages, long-value pagination, Gantt labels and all-page render review. Full medical/insurance content review is pending; some hardcoded timelines, blanket documentation rules and appeal assertions remain elsewhere.
7. Verify all links, footer externals, all CTAs, animation states, mobile/tablet layouts, keyboard access and chat on each page. A rendered heading is not a complete page-flow test.
8. Complete live AI, scheduling and SMS configuration and validation. No production deployment or main-branch merge performed.

Primary content reference used for the elimination-period qualification: https://www.tdi.texas.gov/pubs/consumer/cb032.html (service-day and calendar-day policies differ). The calculator is a bounded reimbursement illustration, not a coverage determination.

## Continuation — PDF rendering and chat coverage

The same GitHub branch was checked before continuing; its head was 147b5d7 and main had not changed. This continuation completes four additional originally open PDF layout items: varied layouts, landscape Gantt, alternating vertical timeline and form-style policy summary. **17 of the original 61 open items are now checked; 44 remain open.** The 670 inherited checkmarks still require re-verification.

- Embedded licensed DejaVu Sans subsets (Latin, Greek, Cyrillic and document punctuation) for consistent PDF typography. Font payload loads only when the browser generates a resource PDF. Other writing systems are not yet supported by these subsets.
- Wrapped policy values and Gantt labels; repeated rulers on continuation pages; spaced date labels to prevent collisions; moved optional notes to available space without creating mostly empty pages; expanded the cover name band. The long-name sample dropped from 22 to 19 pages. Inspected the all-page overview plus detailed policy, cover and Gantt renders. Complete stress-case acceptance remains pending.
- Replaced the two obsolete skipped chat tests with five active current-router tests. Corrected duplicate user-turn injection into model context. Tests cover two-user session isolation, other-user policy exclusion, provider failure, successful-turn persistence and session input limits. All **79 tests pass with no skips**.
- Repeated the 30 page/viewport smoke checks: all rendered headings, no uncaught JavaScript errors, and no horizontal document overflow. This supersedes the earlier overflow finding; complete field/CTA/accessibility and animation testing remains open.
- Repeated all 12 PDF and four Word downloads after the font change. Browser downloads succeeded. Comprehensive Word rendering remains pending.
- Reused the repository's existing logo as a self-contained SVG wrapper and switched the favicon to the existing local file. Other legacy images still depend on external storage and have not been replaced.

TypeScript and production build pass. Live-service configuration blockers and the no-deployment status remain unchanged. No new live messages were sent.
