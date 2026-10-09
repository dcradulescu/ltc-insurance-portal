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

## Continuation — policy form restoration, validation and saving

GitHub head b0ad44d was checked before this pass. **19 of the original 61 open TODO entries now have completion evidence; 42 remain open.** Historical checkmarks remain unverified unless their ledger entry says otherwise.

Newly identified and fixed:

- The initial local-storage effect always marked loading complete, preventing database policy hydration. Draft restoration now fills missing defaults, accepts only correctly typed known fields, clamps step numbers, preserves legal-name casing and ignores injected record IDs. Late database or recovery responses preserve edits already made by the user. Invalid/expired recovery links retain the local draft and report the problem.
- Concurrent step saves could create duplicate records before the first response supplied an ID. Saves now execute in order and reuse the returned ID; the ID is restored from the visitor-owned policy after reload.
- Policy JSON metadata was saved but not exposed when reloading a form, losing visible POA/care/inflation answers. The API now hydrates an allowlist of extended fields; partial updates retain prior extended answers. The metadata allowlist cannot replace IDs or ownership.
- Local-storage failures could crash navigation or the terms gate. Writes now report failure without blocking editing, and clearing a draft resets all local form snapshots without claiming that online records were deleted. Clear is disabled during an active save.
- Validation previously accepted zero/negative benefits and invalid dates, and restored data could reach final submission without checking prior steps. Shared validation now checks all relevant steps, dates, required selections, benefit amounts, waiting-day integers, ADL counts and inflation rates. Final submission checks all prior steps. Error summaries link to invalid fields; fields expose their invalid state to assistive technology.
- A failed manual save could be followed by a false "link sent" message. Recovery drafts are stored independently and report provider acceptance accurately. Office delivery failures remain distinct from successful private saving. Background save failures are visible, and unload payloads now use the actual batched tRPC format.
- ADL guidance no longer presents this form as a coverage determination; cognitive triggers and insurer confirmation are acknowledged. Placeholder field-video buttons now link to a clearly labelled general LTC overview. These are not represented as custom field-specific videos.

Verification: **106 tests pass across 14 files, no skips**; TypeScript and production build pass. Added 24 draft/validation tests, two metadata safety tests and an actual router save/read/partial-update round-trip test with mocked storage. The real database remains unconfigured.

Eight Playwright scenarios passed against the production frontend with mocked tRPC transport: (1) all six steps, required errors, negative-benefit rejection, ordered saves, reload and final navigation; (2) database-response hydration; (3) protection against late-response overwrites; (4) corrupt JSON and invalid step recovery; (5) resume restoration without reusing old ownership; (6) expired-link draft preservation; (7) blocked local storage; (8) failed online saving with independent recovery-link acceptance. These do not prove live email delivery, database persistence or model generation. Repeated the 30 page/viewport smoke checks with no uncaught errors or horizontal overflow.

Remaining gates include a real database round-trip and migration review, configured receiving automation and inbox verification, complete conditional-field/tooltip/accessibility testing, all external assets/links, third-party video playback, full PDF stress and Word rendering acceptance, AI/SMS/booking integration, and reconciliation of the 670 inherited checkmarks. Main is unchanged and no deployment or live messages were performed.

## Continuation — Strategy, Contact and Profile workflows

Canonical branch head e0b6068 was verified before this pass. **22 of the original 61 open TODO entries now have completion evidence; 39 remain open.** This closes the Profile page interaction test and the two Strategy PDF generation/download checks. Profile transport is mocked; real database persistence is still open under the separate persistence checklist item. The 670 inherited checks are not counted as newly verified.

Defects fixed:

- Strategy preferred arbitrary local-storage contents, often without an ID, and queried the most recent strategy independently of the selected policy. It now loads the visitor-owned saved policy and that policy's strategy, with explicit loading, missing-data and service-error states. The frontend and generation endpoint apply the same form validation. A completed form with zero elimination days and no listed ADLs is not rejected by a separate eligibility gate; this is form completeness validation, not an insurance determination.
- Explicit incomplete task records were overridden by legacy completed flags. Saved false values now take precedence; repeated clicks on a pending task are guarded, successful changes update cached progress, and failed mutations leave the previous state. The API verifies the task belongs to the selected stage and uses its stored title. Stage/task payloads have bounded schemas. Task-progress loading errors are visible.
- Strategy's changing mutation-object dependency could run exit handoffs on ordinary rerenders. The callback is now stable, failed handoffs do not permanently mark delivery successful, and unload requests use the batched tRPC endpoint. Browser tests send no live handoffs.
- Profile query refreshes could replace unsaved name/email edits. Drafts now survive refreshes; invalid or blank names/emails are rejected, pending edits are locked, and failed loads are distinguished from empty records. Contact edits preserve an intentionally cleared relationship; CC/update/delete controls have accessible names and pending guards. Missing or unowned contact updates/deletions return a failure instead of false success.
- Contact submission accepted whitespace-only required fields. Shared client/server validation trims input, bounds field lengths and validates email. Failed submissions retain the draft; fields cannot be edited while sending. The unconfigured calendar continues to expose a phone scheduling fallback.
- Strategy email sharing silently discarded invalid recipients and retained surrounding whitespace. Every entered address is now checked; addresses are trimmed and deduplicated, with a ten-recipient limit. PDF sharing has equivalent name/email validation and associated field labels. Removed the unused, divergent client PDF generator; both active download controls use the server generator.
- Profile copy incorrectly promised automatic notification delivery, PDF branding from the operator profile, and automatic strategy CCs. These are not implemented by the current server. The screen now describes the saved preferences and office-handoff behavior accurately; implementation and live acceptance remain future work.

Verification:

- **123 tests pass across 15 files, with no skips.** Added 17 regression tests for validation, normalized delivery contracts, contact ownership arguments and missing records, task identity/unchecking, saved-policy completeness and recipient handling. Updated an old strategy fixture that incorrectly described a partially filled policy as valid. Router persistence and delivery are mocked.
- TypeScript and production client/server build pass. The existing large client-chunk warning remains.
- Added `scripts/qa-workflows.cjs` and `pnpm test:workflows`. Six production-frontend scenarios pass: profile editing/refetch/reload and complete contact management; visible profile-service failure; contact validation/failure/retry and scheduling fallback; rejection of local-only strategy data; saved-policy generation with blocked browser storage and task uncheck/reload/failure behavior; real PDF downloads plus mocked email acceptance and recipient checks. Tests cover 390px mobile and 1440px desktop with no uncaught page errors or document overflow in those scenarios.
- Both Strategy controls generated and downloaded actual local-server PDFs. Each has 19 landscape pages and contains the saved policy's name/number, not the stale local fixture. Inspected the rendered cover. This establishes generation/download functionality; comprehensive PDF content and layout stress review is still open.
- Repeated the 30 page/viewport smoke checks: no uncaught page errors or horizontal document overflow.

Remaining gates are unchanged: configured MySQL persistence/migrations and retention, receiving-automation and inbox verification, AI/SMS/booking integrations, all external assets/video playback, full accessibility/conditional-field coverage, PDF/Word layout and medical/insurance content review, and historical checklist reconciliation. No live messages, main-branch merge or deployment was performed.

## Continuation — UI/UX preservation, navigation, chat and handoff contracts

GitHub branch head `8e4e1de` was verified before continuing. The latest user instruction is to **retain UI/UX**. This pass preserves existing page structure, colors, typography, artwork references and video-player presentation. Changes repair behavior and accessibility within the existing components. Two missing resources use the existing resource-page and download layout.

**29 of the original 61 open TODO entries now have completion evidence; 32 remain open.** The seven newly completed entries cover footer links, navigation testing, issue documentation, broken internal links, page flow, scroll reset and webhook payload verification. `TODO_CONTINUATION.md` explicitly reconciles all 39 entries that were open before this pass. Historical visual redesign requests remain open under the latest preservation instruction. The 670 inherited checkmarks are still not newly certified.

### Prioritized findings

| Priority | Finding | Resolution / remaining gate |
|---|---|---|
| High | The save schema silently discarded 12 current form fields: separate insured/carrier address parts, care-log requirement, claim-packet source/submission method and reimbursement delay | Added these to validated input and the existing metadata allowlist. A regression saves and reloads all 66 sample fields, then verifies partial updates preserve untouched values, false booleans and empty arrays. Only real table columns reach the DB adapter. Real MySQL acceptance remains open. |
| High | Comprehensive handoffs omitted form metadata and email/phone, could select an unrelated latest strategy and did not reflect saved task unchecking | Hydrates allowlisted policy metadata, chooses the strategy by saved policy and owner, merges task records and preserves explicit zero values. Draft identifiers/unknown keys are discarded. Both trigger APIs now share the HTTPS, timeout and no-redirect transport. Live receiver acceptance remains open. |
| Medium | Thirteen helper resource links were placeholders | Linked matching resources, education definitions and contact information. Added a carrier-confirmed claim timeline worksheet and a clearly fictional 66-field completed-form example using existing download components. |
| Medium | Competing route scroll effects and missing education fragments caused unreliable positioning | One route scroll owner, fixed-header offsets, definition expansion and same-path/history listeners. Mobile menu exposes expanded state and its closed content is inert. Layout and animation classes are retained. |
| Medium | Suggested chat buttons sent stale input; helper inputs remounted on each keystroke; messages could scroll the whole page | Explicit prompt argument, stable helper render tree, pane-only scrolling, duplicate-send guards, stable session ID and policy context. Both widgets support Escape and labelled controls. Real model responses remain unconfigured. |
| Medium | Sharing APIs could reject without feedback; cancelled native sharing should not be an error | Shared helper confirms clipboard success, handles unavailable/denied APIs, and quietly accepts user cancellation. |
| Medium | Video play failures showed misleading playing state and could reject without handling | Playback state follows media events, failure copy appears in the existing overlay, timers are cleaned up, seeking is bounded/keyboard accessible and fullscreen failures are caught. Media-control tests use fixtures; original external playback is still unverified. |
| Low | Resource pages had an empty document title and a hardcoded guide count | Render a single title string and the current guide count. |

No stylesheet or theme changes were made. Original media was not substituted. External media availability still blocks full visual acceptance. Public SC Visiting Angels, Visiting Angels and NAIC reference pages were retrievable; that does not establish media or booking availability.

### Verification and limits

- **141 tests pass across 16 files, with no skips.** This includes 17 handoff trigger/ownership/payload/failure tests, six email contract tests with genuine PDF attachments and mocked fetch, and the 66-field router round-trip regression with mocked persistence.
- TypeScript and production client/server build pass. The existing large client-chunk warning remains.
- The six existing production browser workflow scenarios pass again, including both real local PDF download controls, profile/contact editing and strategy task behavior. The eight policy-form restoration/save/validation scenarios also pass again with mocked transport.
- Fourteen focused interaction checks pass: all six suggested prompts, provider failure/retry, duplicate sends, sharing success/denial/cancellation, all mobile-menu destinations, helper Escape and video controls/errors. Media APIs and model responses are mocked.
- The two added resource PDFs and the claim-timeline Word worksheet downloaded successfully. Full PDF/Word typography and all-page acceptance remain open; download success is not a layout certification.
- Final production navigation run: **72 route/viewport checks**, **798 distinct internal-link transitions**, **42 deep-link checks**, three same-path/back/forward history scenarios and three helper-chat scenarios passed. Tested widths are 1440, 768 and 390. All 24 public content/resource routes had a title, heading, no horizontal document overflow and no uncaught JavaScript errors. Every route received a fixture chat reply without moving the page. The 404 fallback and legacy static print guide are outside this chat/viewport matrix; the print-guide link itself is included in transition checks. External media requests are blocked in this fixture suite, so it is not visual/media acceptance.

Configured database, receiving automation, inbox/template, live model, SMS and booking acceptance remain outstanding. No live messages, main-branch merge or deployment were performed.

## Continuation — production integration inventory and backend repairs

Canonical GitHub head `3f71b09` was verified before this pass. The user clarified the new TODO request as **mocked integrations requiring real production connections** and reiterated that UI/UX must not be adjusted. No client component, page, style, asset or layout file changed in this pass.

The inventory request is complete: `PRODUCTION_INTEGRATIONS.md` and its CSV cover all **37 registered tRPC procedures** and **39 integration/capability records**: 22 active areas, three browser/local areas and 14 explicitly identified removed/dormant exceptions. The initial source scan covered all 196 application/support/test sources then present, finding 275 boundary references in 58 files. The API coverage table has no unmapped procedure. Configuration presence was checked without displaying values: all 27 named service/configuration variables were absent here. This is not a statement about another deployment.

The inventory distinguishes tested mocks from real local code and external acceptance. It exposes remaining Manus/Forge dependencies, incompatible legacy RAG seeding, unconnected notification preferences/automatic recipients, absent durable reminder scheduling, external media/fonts/booking, legacy public-origin metadata and real database/inbox/model/SMS gates. Document uploads are **intentionally removed by prior user direction**, as recorded in original TODO lines 28 and 293; these exclusions were reverified, and the unused public/shared-user upload router was not enabled. Other dormant implementations are not silently counted as required live services.

Backend repairs made during the audit:

| Priority | Defect | Change and limit |
|---|---|---|
| High | Chat keyword retrieval searched all knowledge rows without owner or active-status restrictions | Query now requires both the current owner and an active record. Tests inspect the actual generated SQL and prompt injection. The schema has no public/shared flag; an explicit shared-knowledge design is still required before using cross-owner material. Built-in context remains available. |
| High | Legacy OAuth JWT code allowed weak configured keys and did not enforce the current application ID | Signing requires at least 32 bytes and the configured app ID; verification rejects wrong-app, weak-key, expired, malformed and tampered tokens. This does not certify the full legacy OAuth state/nonce flow. |
| High | OAuth callback accepted arbitrary off-site return URLs | Return destination must resolve locally; external, protocol-relative, backslash/control-character and non-string inputs fall back to home. Callback-handler regressions verify this. |
| Medium | SMS creation was described as completed delivery; provider errors could expose details; domestic 1-prefix numbers were rejected inconsistently | Return acceptance separately from handset arrival; reject failed/undelivered/canceled or incomplete receipts; redact provider errors and remove recipient logging; normalize accepted domestic prefixes. Live delivery, authorization/consent and receipts remain open. |
| Medium | Unconnected reminder schedule/cancel helpers returned success without changing any schedule | They now report unavailable and explicitly state that nothing was scheduled or changed. The disconnected in-memory scheduler was not started. |
| Low | RAG dry-run script claimed database population and deployment readiness | Console output now identifies the dry run and says no records were created or changed. No real schema or data import was attempted. |

Verification: **165 tests pass across 19 files, no skips**; TypeScript and production client/server build pass. Added 24 focused regression cases across OAuth, SMS and knowledge retrieval. The RAG dry-run script executes and accurately states that it makes no database writes. The existing bundle-size warning remains. Frontend/browser suites were not rerun because no client files changed; their prior evidence and limitations remain in the preceding section.

Accounting: the original 61 open requirements remain **29 completed / 32 open**. The new inventory request is a separate completed item, bringing the ledger to **732 entries**. The 670 inherited checks are still not broadly certified; two intentional upload-removal entries were specifically reverified. Inventory completion does not mean production integration completion. No live messages, database migrations, merge or deployment were performed.


## Continuation — wizard validation, recovery and browser/device compatibility

Canonical GitHub head `7a76fa9` was verified before editing. The user requested a step-by-step UI walkthrough, required-field validation, synchronized progress, reliable re-entry, and then cross-browser and mobile/tablet/PC compatibility checks. Existing page structure, artwork references, colors and typography are retained. Functional changes use the existing controls and feedback. At tablet widths, the existing collapsed navigation now remains active below 1024px: screenshot review found that the previous 768px breakpoint crowded the brand and links even though the document had no horizontal overflow.

### Six-step walkthrough

| Step | Required input and validation | Transition/re-entry result |
|---|---|---|
| 1 — Insured Person | Full name; valid email; 10-digit US phone (optional leading 1). Optional DOB must be a real nonfuture date; supplied state and ZIP must match the displayed US formats. POA details remain optional. | Blank/invalid entries stop Next, focus the error and remain editable. Name casing and typed values persist. |
| 2 — LTC Ins Company | Carrier name. Supplied phone/fax, state and ZIP are validated; blank optional contacts/addresses remain allowed. | Blank carrier and malformed optional contact fields block progression. |
| 3 — Policy Info | Policy number. Claim number, case-manager and packet instructions remain optional. | Missing policy number blocks Next; conditional case-manager edits survive re-entry. |
| 4 — Coverage Details | Positive daily/lifetime limits; whole elimination days 0–999; ADL count 0–6; explicit waiver, AOB and cognitive-trigger Yes/No. Care Notes Required is mandatory only while Home Care Covered is Yes. Optional monthly limits and visible day overrides are checked; days-per-week is 1–7. | Previously unanswered selects no longer display an unsaved No/Yes. Currency formats on blur without losing typed digits. Negative/fractional day inputs are retained for correction rather than stripped into different values. |
| 5 — Care Needs | At least one nonblank diagnosis/condition and an ADL selection or explicit None. None cannot coexist with a selected ADL. | Required checkbox collections have focusable, labelled error targets. The existing informational ADL advisory supports both exiting and continuing. This is input validation, not coverage determination. |
| 6 — Review & Submit | Rechecks steps 1–5 before the final save. Review includes the actual address parts, email and phone entered. | Valid save goes to Strategy. Failed save stays on Review, preserves answers and does not claim office delivery. |

There are **14 always-required controls/groups and one conditionally required choice** in the active wizard. Optional POA, case-manager and notes fields were not made mandatory. Dormant inflation metadata has no editable control in this wizard and no longer creates an invisible navigation blocker; this does not certify legacy metadata or actuarial calculations.

The step label, bar width, accessible progress value and current-step marker now use the same six-step position. The percentage is labelled “through steps”; it does not imply submission or delivery. The unrelated “Step 2 of 3” label was removed. Future steps remain disabled; earlier steps can be revisited. Navigation clears old-step errors, focuses the new step and keeps the form in view. Repeated validation uses inline errors; the duplicate toast that could cover mobile Next was removed.

Local and emailed recovery data now reopen no later than the first invalid prerequisite. Orphaned step keys cannot open an empty Review page. Incomplete current steps still reopen at that current step. Expired links preserve the local draft, late server/recovery responses preserve current edits, and recovery data cannot restore another record's IDs. Blocked local storage is reported accurately, including in exit/email dialogs. Email wording describes a saved-step link and provider acceptance without claiming inbox arrival.

### Browser identification and module mapping

Browser plugin not available; regular Playwright 1.56.1 was used against the production client/server build. Browser identity and capabilities were measured in the page; a spoofed browser name was not used to claim another engine passed.

| Browser/engine | Observed result | Remaining gate |
|---|---|---|
| Chromium 141.0.7390.37, Linux headless | Complete local wizard, interaction and device matrix passed. Runtime UA/brands identify HeadlessChrome/Chromium 141. | This is not a branded Chrome/Edge, Windows or Android installation test. |
| Firefox 142.0.1 | Binary installed and engine handshake completed; content-page creation failed. Runtime reported `Sandbox: writing /proc/self/uid_map: EPERM` and child-process exits. | Execute the GitHub runner matrix; no Firefox UI pass is claimed here. |
| WebKit 26.0, build 2215 | Downloaded; launch blocked by missing GTK/GStreamer and other system libraries. System dependency installation failed on setgroups/setuid permissions. | Execute the GitHub runner matrix; no Safari/WebKit UI pass is claimed here. |
| Physical iPhone/iPad, Android and Windows/macOS devices | No physical devices attached. | Real OS keyboards, touch, native sharing, native video fullscreen and downloads remain acceptance work. |

| Module / browser capability | Behavior and verification |
|---|---|
| `PolicyForm.tsx`, `policyFormState.ts` / browser storage | Real localStorage save/read, corrupted data, blocked storage, route exit, reload and closed-tab re-entry tested. Private online persistence and recovery APIs used fixtures. |
| `Layout.tsx`, `JourneyNavigation.tsx`, `RouteScroll.tsx` / layout, inert and history | Current route/step states, existing mobile menu and header bounding boxes checked. Tablet header collision repaired with the existing menu breakpoint. |
| `shareResource.ts` / Web Share and Clipboard | Chooses APIs by capability; copy success, denied clipboard and cancelled sharing are fixture-tested. Real OS share sheets remain unverified. |
| `VideoPlaceholder.tsx`, `videoFullscreen.ts` / standard or native fullscreen | Prefers `requestFullscreen`; falls back to `webkitEnterFullscreen` when available. Unsupported and rejected calls reach existing feedback. Five unit regressions cover capability selection and failures; actual WebKit native fullscreen remains unverified. |
| `downloadResource.ts`, `PdfDeliveryPanel.tsx`, `Strategy.tsx` / Blob downloads | Both strategy buttons downloaded real PDFs from the local server. Cross-engine native download handling awaits runner/device evidence. |
| `useMobile.tsx`, styles / matchMedia, modern CSS | Chromium reports media-query events, inert, OKLCH and dynamic viewport units. Eight width/height combinations exercise existing responsive layouts. |
| `formPersistence.ts` / device identification | Existing user-agent-derived `isMobile` is submission metadata only. Behavior uses viewport/capability checks; it is not reliable proof of a physical device model, particularly desktop-mode tablets. |
| `TermsGate.tsx`, `ThemeContext.tsx`, legacy components | Terms storage failure is guarded. Theme switching is disabled in the mounted app; dormant legacy forms/exporters are outside this active-wizard certification. |

### Standard-size matrix and evidence

| Device class (emulated) | CSS viewport | Touch / scale | Result |
|---|---|---|---|
| Small mobile | 360 × 800 | Touch, DPR 3 | 24 routes + 6 wizard steps pass |
| Mobile | 390 × 844 | Touch, DPR 3 | 24 routes + 6 wizard steps pass |
| Large mobile | 414 × 896 | Touch, DPR 3 | 24 routes + 6 wizard steps pass |
| Tablet portrait | 768 × 1024 | Touch, DPR 2 | 24 routes + 6 wizard steps pass |
| Large tablet portrait | 820 × 1180 | Touch, DPR 2 | 24 routes + 6 wizard steps pass |
| Tablet landscape | 1024 × 768 | Touch, DPR 2 | 24 routes + 6 wizard steps pass |
| Laptop | 1366 × 768 | Mouse, DPR 1 | 24 routes + 6 wizard steps pass |
| Desktop | 1920 × 1080 | Mouse, DPR 1 | 24 routes + 6 wizard steps pass |

The matrix checks page title/heading, no blank/framework error screen, no uncaught page errors, no horizontal overflow, header collision and step state. This totals **192 route states and 48 wizard states**. Touch contexts report coarse pointer/no hover; desktop contexts report mouse/hover. Screenshot inspection found and verified the tablet-header correction. Emoji glyphs are missing from this runner's font environment, and external media/fonts were blocked in fixture runs: screenshot evidence does not certify those assets or original video playback.

The detailed walkthrough independently passed **32 scenarios**, including all six steps at 1440×900, 768×1024 and 390×844. Each of the 18 step/viewport combinations preserved the draft through route exit, reload and closing/reopening a tab (54 re-entry actions). It also covered malformed values, conditional fields, typed currency, tooltip interaction, step backtracking, save failure, emailed resume data, stale/corrupt/expired recovery, late responses, blocked storage and both ADL-advisory choices. API fixtures never send live messages. One expected mutation-error console entry from deliberate save failure was distinguished from application errors.

**204 unit/integration tests pass across 20 files, no skips.** TypeScript and the production build pass. The six existing workflow scenarios and 14 existing interaction checks also pass; the existing large client-chunk warning remains. Browser scripts now accept `QA_BROWSER=chromium|firefox|webkit` and report the engine version. The new `Browser compatibility` GitHub Actions workflow installs isolated pinned Playwright tooling and runs navigation at 1440/768/390, workflows and interactions for each engine. Hosted-run results are pending publication/runner execution; configuring a workflow is not a passing cross-browser result.

Key local commands: `tsc --noEmit`, `vitest run`, `vite build`, `esbuild server/_core/index.ts`, `node scripts/qa-workflows.cjs`, `node scripts/qa-interactions.cjs`, and temporary wizard/device Playwright scripts outside the checkout. Temporary logs/screenshots are kept outside committed source. No production dependency, theme or artwork change was made.

The original 61-item ledger remains **29 complete / 32 open**. Original items 864, 871 and 899 retain the live-video/recovery, broader device/asset and real-database gates. The new browser-wizard request is complete within the stated local/fixture scope; the separate cross-browser certification request remains open pending usable Firefox/WebKit evidence. Including the earlier integration-inventory request, the ledger now has **734 entries**. No live messages, migration, main merge or deployment was performed.


Hosted follow-up: the first GitHub matrix successfully launched all three engines. Chromium and Firefox completed all 24 desktop route checks before finding a test-harness mismatch: the test still opened the menu only below 768px, while the repaired header correctly uses it below 1024px. The harness now uses the same breakpoint. The maintained workflow suite also now includes full six-step validation, typed currency, route/reload recovery at every step and final submission at 1440/768/390; all **nine** workflow scenarios pass locally. The hosted workflow continues independent workflow/media checks after a navigation failure, provided its build passed, so one test failure cannot hide unrelated compatibility results. Updated hosted results are pending.
