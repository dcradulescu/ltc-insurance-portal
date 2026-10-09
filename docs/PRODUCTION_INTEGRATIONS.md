# Production integration inventory

Status: **inventory complete for the inspected repository; production implementation and acceptance remain in progress**. This fulfills the user’s clarified request to list mocked integrations requiring real production connections. It does not certify those connections as working.

Scope: all 196 application/support/test source files present at the start of this pass were scanned for external requests, environment configuration, mocks and browser boundaries (275 references in 58 files); active routes and relevant callers were then inspected. All **37 registered tRPC procedures** are mapped below. New regression test files added in this pass are not part of that initial source count. Disabled and unmounted implementations were retained in the inventory, not silently omitted.

The inventory has **39 records: 22 active integration/implementation areas, 3 browser/local capability areas, and 14 removed/dormant exceptions**. These records group related operations; they are not 39 vendors and are not 39 new TODO entries. The downloadable CSV contains the same records.

## What still needs a production decision

The source still contains Manus/Forge dependencies for model calls, owner alerts, media and legacy identity. The user has discontinued Manus; the code has not yet been fully migrated. No replacement provider, production domain, booking link or credentials were invented. Changing providers is implementation work in addition to setting environment variables.

Document uploads are intentionally excluded: canonical TODO entries at original lines 28 and 293 record removal by user request. Old upload code is not mounted and must not be restored automatically. EmailDelivery and SSN-bearing alternate forms are also documented as superseded or removed.

Mocked tests validate contracts and failure behavior; they do not prove a MySQL transaction, inbox arrival, handset receipt, booking or third-party playback. There is no production-readiness endpoint: `/healthz` and `system.health` report process availability.

## Complete integration and exception list

### Active

| ID / feature | Current state and source | Configuration | Required work and acceptance |
|---|---|---|---|
| A01 — MySQL persistence and migrations | Router/DB adapters are mocked in tests; no real database verified. Source: `server/db.ts; drizzle/schema.ts; drizzle/meta/_journal.json; drizzle/*.sql` | DATABASE_URL | **Work:** Reconcile schema, migration journal and deployed schema. Several SQL files are not journaled. Review legacy shared records and retention before migration. **Verify:** Create/update/reload policy, strategy, task, profile, contact, chat and recovery records; verify owner isolation, indexes, backups and recovery. |
| A02 — Private visitor sessions and HTTPS deployment | Signed visitor tokens exist; browser suites bypass the real session/database boundary. Source: `server/_core/visitorSession.ts; context.ts; trpc.ts; index.ts; cookies.ts` | JWT_SECRET; DATABASE_URL; APP_URL; NODE_ENV; PORT | **Work:** Configure strong signing secret and HTTPS origin; verify proxy, CORS and IP-rate-limit behavior in the actual deployment. /healthz is process-only. **Verify:** Two independent browser sessions cannot read or change each other’s data; cookie tampering/expiry/restart behavior and actual database ownership pass. |
| A03 — Legacy account OAuth | Callback and SDK remain registered; no current login entry point or live provider acceptance verified. Source: `server/_core/oauth.ts; sdk.ts; context.ts` | OAUTH_SERVER_URL; VITE_APP_ID; JWT_SECRET; OWNER_OPEN_ID | **Work:** Resolve the discontinued Manus identity dependency before enabling account login. Signing now rejects weak secrets/wrong app IDs; callback return paths stay local. State/nonce and account migration still need a complete review. **Verify:** Approved provider callback, account sync, logout, expired token and CSRF/state rejection tested on HTTPS. |
| A04 — AI strategy generation and both chat widgets | invokeLLM and browser replies are mocked. Adapter defaults to Forge/Manus and a hardcoded model. Source: `server/_core/llm.ts; server/routers.ts; server/routers/chat.ts` | BUILT_IN_FORGE_API_URL; BUILT_IN_FORGE_API_KEY | **Work:** Select/configure the supported production provider and model; verify request/response compatibility, bounded timeouts, error redaction and approved data handling. No replacement provider chosen in this pass. **Verify:** Real strategy and two-turn chat with approved test data; provider failure, quota and latency handling; no cross-owner policy context. |
| A05 — Chat knowledge retrieval and seed data | Keyword retrieval is implemented but DB queries are mocked; management UI and old RAG module are disconnected. Source: `server/routers/chat.ts; server/seed-rag*.mjs; drizzle/schema.ts` | DATABASE_URL; legacy seed also uses DB_HOST/DB_USER/DB_PASSWORD/DB_NAME | **Work:** Use current schema-compatible imports. Legacy seed creates string IDs/docId while current schema uses integer IDs/documentId and owner IDs. Owner/active filters added; public/shared knowledge needs an explicit visibility model. **Verify:** Known owned active document is retrieved; inactive and other-owner records are excluded; empty/unavailable knowledge uses built-in context; verify imported content and provenance. |
| A06 — Project-owner alerts | notifyOwner is mocked; strategy generation treats it as best effort. This is not recipient email delivery. Source: `server/_core/notification.ts; systemRouter.ts; server/routers.ts` | BUILT_IN_FORGE_API_URL; BUILT_IN_FORGE_API_KEY; admin identity for system.notifyOwner | **Work:** Replace or explicitly configure the legacy owner-notification service and connect desired preference controls. **Verify:** Approved owner receives one notification; failure does not lose a saved strategy or masquerade as email receipt. |
| A07 — Comprehensive policy/strategy office handoff | All four triggers and legacy mappings have mocked HTTP coverage; real receiver absent. Source: `server/routers/policyForm.ts; server/_core/delivery.ts` | ZAPIER_WEBHOOK_URL (legacy VITE_ZAPIER_WEBHOOK_URL alias exists) | **Work:** Configure receiver for _meta, user, policyForm, unsavedFormData, matching strategy/tasks, documents and contacts. Define deduplication/retry behavior for exit/timeout submissions. **Verify:** All trigger types accepted once as intended; zero values and explicit task unchecking preserved; failure and receiver routing verified. |
| A08 — Strategy PDF email — two sending controls | Real PDF bytes are generated, but sendStrategy/sendPdfByEmail use mocked delivery. Source: `server/routers.ts email.sendStrategy; server/routers/pdfDelivery.ts` | ZAPIER_WEBHOOK_URL; receiver email account/templates | **Work:** Receiver must accept both explicit recipients[] and single recipientEmail contracts, decode attachmentBase64 and attach the file. **Verify:** Approved recipient receives correct saved-policy PDF; sender identity, attachment, recipients, failure and bounce paths checked. |
| A09 — Education/Academy page-content email | page_content payload tested with mocked fetch. Source: `server/routers.ts email.sendPageContent; Education.tsx; Academy.tsx` | ZAPIER_WEBHOOK_URL; receiver email account/templates | **Work:** Connect page-content routing, formatting and explicit recipients. **Verify:** Each supported page sends readable content to the approved recipients; invalid recipients and failures remain visible. |
| A10 — Contact form and Education questions | Client failure/retry and contact_form payload tested; no inbox acceptance. Source: `server/routers.ts email.sendContactForm; Contact.tsx; Education.tsx` | ZAPIER_WEBHOOK_URL; CONTACT_EMAIL; receiver template | **Work:** Configure the intended office inbox and safe reply-to behavior. Default address exists in code but has not been used for live testing. **Verify:** Submit both entry points with approved data; office receipt, sender details, message, retry and failure are correct. |
| A11 — Save-and-return email and token storage | Trusted-origin contract and browser restoration tested with mocked delivery/storage. Source: `server/routers.ts email.sendSaveLink/getResumeData; server/db.ts` | APP_URL; DATABASE_URL; ZAPIER_WEBHOOK_URL | **Work:** Configure email and token persistence, retention and revocation policy. Tokens currently remain reusable until their 30-day expiry. **Verify:** Open a real received link in a fresh browser; restore known fields/step without transferring ownership; test invalid/expired/revoked tokens and delivery failure. |
| A12 — Per-step progress email | step_progress payload tested with mocked fetch. Source: `server/routers.ts email.notifyStepProgress; PolicyForm.tsx` | ZAPIER_WEBHOOK_URL; CONTACT_EMAIL | **Work:** Connect office routing and duplicates/failure handling for every form step; ensure only intended data leaves the portal. **Verify:** Advance all six steps with approved data and verify the exact events/office messages the workflow is intended to produce. |
| A13 — Manual and bulk SMS | Twilio is mocked. Responses now distinguish acceptance from handset arrival, reject failed receipts and redact provider errors. Source: `server/smsNotification.ts; server/routers.ts sms` | TWILIO_ACCOUNT_SID; TWILIO_AUTH_TOKEN; TWILIO_PHONE_NUMBER | **Work:** Configure approved sender/recipients, permissions and rate limits, delivery receipts and opt-out/help handling. The generic visitor endpoints currently accept caller-supplied recipients; do not expose unrestricted paid sending. **Verify:** Approved test phone receives the right message; provider rejection, undelivered status, duplicate requests, unauthorized recipients and partial bulk failure pass. |
| A14 — SMS preferences and additional recipients | Preference save writes to profile JSON; widget initializes defaults and has no preference-load query. Additional-recipient checkboxes stay local and have no phone routing. Source: `client/src/components/SMSNotificationManager.tsx; server/routers.ts sms.savePreferences` | DATABASE_URL; recipient mapping and consent records | **Work:** Implement load/save/reload for all preference fields and explicit recipient identities/phone numbers. Saving preferences must not imply reminders are scheduled. **Verify:** Change every preference and recipient selection, reload and verify persistence; no send to an unconfigured or unapproved recipient. |
| A15 — Automatic task reminders | In-memory scheduler is not started or connected to durable schedules. Schedule/cancel helpers previously returned false success; now report unavailable. Source: `server/taskReminderScheduler.ts; server/smsNotification.ts` | Persistent schedule storage; selected worker/queue; SMS provider | **Work:** Implement durable owner-scoped jobs, task binding, timezone, cancellation, retries and deduplication. Starting the existing empty in-memory timer is insufficient. **Verify:** One reminder at each configured time across restart/multiple workers; completion/cancellation prevents sending; failures can retry without duplicates. |
| A16 — Profile notifications and automatic CCs | Profile settings persist; automatic policy/strategy/contact notifications are not wired. CC flags appear in handoff only; strategy recipients are explicit. Source: `Profile.tsx; server/routers.ts auth.updateProfile; server/routers/policyForm.ts` | DATABASE_URL; receiver rules; chosen notification transport | **Work:** Wire the intended events to saved preferences, with deduplication and recipient resolution. **Verify:** Toggle each preference/CC and verify permitted notifications and suppressed notifications using approved recipients. |
| A17 — Original images behind /manus-storage | Public media proxy still requires Forge credentials; original images were not replaced. Source: `server/_core/storageProxy.ts; client page/component image references` | BUILT_IN_FORGE_API_URL; BUILT_IN_FORGE_API_KEY or an approved original-asset hosting migration | **Work:** Restore access or migrate identical authorized original assets while retaining the UI/UX. Restrict the public proxy to intended public assets; do not expose private uploads through it. **Verify:** Every existing image path returns the expected image with correct MIME type, size and caching; arbitrary/private keys remain inaccessible. |
| A18 — Direct CDN images and MP4 players | Original files.manuscdn.com and CloudFront URLs remain. Browser suites block them; media APIs are mocked in control tests. Source: `VideoPlaceholder.tsx; RightHelperPanel.tsx; page image/video references` | Availability of original assets; approved replacement hosting if needed | **Work:** Verify every referenced original file and migrate exact assets if needed. No visual substitutes added. **Verify:** All original images load and all MP4s play, pause, seek, mute and recover from errors on supported desktop/mobile browsers. |
| A19 — YouTube sample lessons and external video links | Iframe selection/navigation tested; actual third-party playback not verified. Source: `YouTubeLesson.tsx; LTCAcademyPlayer.tsx; PolicyForm.tsx` | Public video availability and embed permission | **Work:** Verify all lesson IDs/fallback links and the generic field-video links; keep existing presentation. **Verify:** Each intended lesson plays on desktop/mobile; blocked/unavailable content has a working fallback. |
| A20 — External web fonts | Google Fonts requested by client/index.html; browser fixture suites block external requests. Source: `client/index.html; client/src/index.css` | fonts.googleapis.com and fonts.gstatic.com availability or exact-font hosting | **Work:** Verify the existing fonts load in production; retain typography if hosting changes. **Verify:** Computed font faces and weights match the established theme on supported devices; fallback behavior checked offline. |
| A21 — Appointment booking | Phone fallback tested; no real booking URL configured. Source: `client/src/pages/Contact.tsx` | VITE_BOOKING_URL | **Work:** Supply the actual authorized LTC consultation booking URL, not a generic calendar home page. **Verify:** CTA opens the correct service/calendar and creates the intended test booking with timezone/confirmation behavior. |
| A22 — Public origin, legal links and social metadata | Core external sites were retrievable in prior pass. Canonical/OG/JSON-LD and Privacy page still reference the old manus.space origin. Source: `client/index.html; PrivacyPolicy.tsx; Layout.tsx; SiteFooter.tsx; shared/resourceGuides.ts` | APP_URL; approved production public URL; original OG assets | **Work:** Confirm intended public deployment domain; update origin references consistently once known. Validate external resources, telephone and mail links. **Verify:** Canonical, share cards, legal links and public URLs identify the deployed LTC portal; no invented replacement domain. |

### Browser/local

| ID / feature | Current state and source | Configuration | Required work and acceptance |
|---|---|---|---|
| B01 — Local drafts, terms, Academy completion and celebration flags | Real browser storage exercised, including blocked storage, but tests usually preaccept terms. No cloud service connection needed. Source: `TermsGate.tsx; policyFormState.ts; PolicyForm.tsx; LTCAcademyPlayer.tsx; Strategy.tsx` | Browser localStorage/sessionStorage/cookies | **Work:** Verify actual terms-gate acceptance and storage behavior in supported browsers; per-device progress is not cross-device database persistence. **Verify:** Fresh browser, rejection/acceptance, reload, private mode, blocked storage and old/corrupt values behave correctly. |
| B02 — Share sheet, clipboard, media/fullscreen APIs | Clipboard/share/media APIs are mocked in focused tests. No paid service integration needed. Source: `client/src/lib/shareResource.ts; VideoPlaceholder.tsx; scripts/qa-interactions.cjs` | HTTPS browser context and user gesture/permissions | **Work:** Verify native platform behavior and permission denial/cancellation on target devices. **Verify:** Actual copy/share works; cancellation is quiet; denied clipboard/fullscreen/play does not create a false success state. |
| B03 — PDF/Word download and browser printing | Real local PDF generation and resource downloads pass. No S3 upload is needed for current downloads. Physician letter generation is local code. Source: `server/pdfConverter.ts; routers/pdfDelivery.ts; physicianLetterGenerator.ts; client/src/lib/downloadResource.ts` | Node runtime; bundled fonts; browser download/print support | **Work:** Complete all-page, long-value, Unicode and Word/print layout acceptance without changing the established theme. **Verify:** Correct policy data in downloads; files open/print on target devices; page breaks and all supported text render correctly. |

### Removed/dormant

| ID / feature | Current state and source | Configuration | Required work and acceptance |
|---|---|---|---|
| D01 — Private document upload router | Not mounted. The canonical TODO explicitly says uploads were removed by user request (baseline lines 28 and 293). Legacy code still uses user ID 1. Source: `server/routers/documents.ts; server/routers.ts; todo.md` | None for current production scope | **Work:** Keep excluded. Do not wire storage/upload APIs back into the app without a new instruction. If ever reintroduced, redesign ownership, private access and the 50 MB versus 1 MB body-limit mismatch first. **Verify:** Verify no public tRPC document-upload endpoint or upload UI is exposed. |
| D02 — RAG document management UI and old module | RAGDocumentManager shows mock success; it is not mounted. Old rag.ts and its test are disabled. Active retrieval is tracked in A05. Source: `RAGDocumentManager.tsx; server/rag.ts.disabled; server/rag.test.ts.disabled` | No configuration can make the mock admin UI persist data | **Work:** If administration is required, implement authenticated CRUD and schema-compatible imports; do not claim the existing mock manager works. **Verify:** Approved administrator creates/deactivates a document and active retrieval reflects it; users cannot edit other owners’ material. |
| D03 — Care provider forms/license upload | CareProviderForms is not mounted. Drafts are in component memory, license selection is local, save button has no handler. SSN field remains in unused code. Source: `CareProviderForms.tsx; todo.md removal notes` | None for current production scope | **Work:** Keep excluded under prior document/SSN removal directions. Local text exports are not official provider documents or online persistence. **Verify:** No disconnected upload/save or legacy SSN collection is exposed in current routes. |
| D04 — Old EmailDelivery component | Not imported. Its handler calls owner notification and then claims email sent; selected attachments are not actually delivered. Superseded in canonical TODO. Source: `EmailDelivery.tsx; todo.md baseline line 521` | None; active delivery uses A08 | **Work:** Do not reactivate. Continue using the actual PDF-delivery endpoints; remove or repair this legacy code only as an explicit maintenance change. **Verify:** Current routes use PdfDeliveryPanel/Strategy email, not the legacy false-success component. |
| D05 — Old physician-letter export component | Not mounted. Email Letter only copies text; Download PDF opens browser printing. Active letter APIs generate local HTML/text. Source: `PhysicianLetterExport.tsx; server/routers.ts physicianLetter/strategy.generatePhysicianLetter` | None for current mounted UI | **Work:** If reintroduced, wire actual delivery and handle clipboard/print failures; review HTML escaping. **Verify:** Do not present a copied letter as delivered email or printed page as a generated attachment. |
| D06 — SMTP helper | No active caller. Non-production branch logs and returns a synthetic message ID. Current email flow uses the webhook. Source: `server/_core/email.ts` | SMTP_HOST; SMTP_PORT; SMTP_SECURE; SMTP_USER; SMTP_PASS; SMTP_FROM only if selected | **Work:** Not required for current webhook architecture. If selected later, connect a real caller and distinguish dev logging from delivery. **Verify:** No active feature claims a dev-mode synthetic ID proves recipient delivery. |
| D07 — Maps proxy and Map component | Neither mounted/called by active routes. Still depends on a legacy Forge maps proxy. Source: `server/_core/map.ts; client/src/components/Map.tsx` | BUILT_IN_FORGE_API_URL/KEY; VITE_FRONTEND_FORGE_API_URL/KEY only if enabled | **Work:** No maps integration required by current portal flows. Review public-key restrictions and provider migration before activation. **Verify:** If enabled, actual map/geocoding results and script-failure handling verified. |
| D08 — Runtime image generation helper | No active caller. Legacy ImageService plus storagePut, not the portal’s existing static artwork. Source: `server/_core/imageGeneration.ts` | BUILT_IN_FORGE_API_URL; BUILT_IN_FORGE_API_KEY only if enabled | **Work:** Not needed to preserve current UI/UX; no runtime image generation enabled. **Verify:** If later requested, authenticate generation/storage and inspect the actual generated asset. |
| D09 — Voice transcription helper | No active caller. Fetches audio URL and calls legacy transcription service. Source: `server/_core/voiceTranscription.ts` | BUILT_IN_FORGE_API_URL; BUILT_IN_FORGE_API_KEY only if enabled | **Work:** No voice integration required for current UI; URL access and provider review needed before activation. **Verify:** If enabled, authorized audio, size/content limits, actual transcript and failure handling verified. |
| D10 — Generic external data API helper | No active caller. Routes through legacy WebDevService/CallApi. Source: `server/_core/dataApi.ts` | BUILT_IN_FORGE_API_URL; BUILT_IN_FORGE_API_KEY only if enabled | **Work:** Do not configure a paid data service without a concrete portal feature requirement. **Verify:** Any future caller has approved API IDs, bounded input and verified response handling. |
| D11 — Direct client-side webhook helper | sendToZapier in formPersistence is unused; active forms use server procedures. Its VITE-prefixed URL would be exposed if invoked/bundled. Source: `client/src/lib/formPersistence.ts; server/_core/env.ts` | No client webhook secret; use server-only ZAPIER_WEBHOOK_URL | **Work:** Keep direct browser delivery unused. Remove obsolete VITE-prefixed configuration from deployment once compatibility has been reconciled. **Verify:** Inspect production assets to ensure no receiving-webhook credential is shipped to browsers. |
| D12 — Component showcase simulated AI | ComponentShowcase contains demo responses and sample links but is not a registered app route. Source: `client/src/pages/ComponentShowcase.tsx; client/src/App.tsx` | None | **Work:** Keep the demonstration outside production user routes. **Verify:** No placeholder/demo response can be mistaken for a live portal model response. |
| D13 — Legacy alternate policy/chat implementation | PolicyFormComprehensive and disabled old chat files are not mounted. Legacy policy trigger API remains registered and is covered in A07. Source: `PolicyFormComprehensive.tsx; ChatWidget.tsx.disabled; server/routers/chat.ts.disabled` | None for unused components | **Work:** Keep superseded components out of current navigation; never re-enable old shared-user/SSN behavior as a shortcut. **Verify:** Current PolicyForm and chat router remain the only mounted implementations. |
| D14 — Analytics/debug platform runtime | Unconfigured analytics request and Manus production runtime injection were removed in earlier commits. The unused debug-collector.js public file remains; it is not referenced by the application and must not be reinjected. Source: `vite.config.ts; client/index.html; client/public/__manus__/debug-collector.js; docs/DEVELOPMENT_REVIEW.md` | None currently | **Work:** No analytics service is needed for existing functionality. Adding analytics is a separate requirement; do not revive the debug runtime. **Verify:** Production build has no unexpected debug/runtime injection or blank analytics URL. |

## Registered API coverage

All 37 runtime procedures were read from `appRouter._def.procedures` and matched against this mapping. No document or RAG-admin router is registered.

| Procedure | Type | Inventory coverage |
|---|---|---|
| `system.health` | query | A02 (process-only health; no provider readiness) |
| `system.notifyOwner` | mutation | A06 |
| `policyForm.sendComprehensiveToZapier` | mutation | A07 |
| `policyForm.sendToZapier` | mutation | A07 |
| `pdfDelivery.generatePdf` | mutation | B03 (real local generator) |
| `pdfDelivery.sendPdfByEmail` | mutation | A08 |
| `pdfDelivery.validateEmail` | query | B03 (local syntax validation only) |
| `chat.send` | mutation | A01/A02/A04/A05 |
| `chat.getHistory` | query | A01/A02 |
| `physicianLetter.generate` | mutation | B03 (local template) |
| `auth.me` | query | A02/A03 |
| `auth.logout` | mutation | A02/A03 |
| `auth.getProfile` | query | A01/A02/A16 |
| `auth.updateProfile` | mutation | A01/A02/A16 |
| `policy.get` | query | A01/A02 |
| `policy.save` | mutation | A01/A02 |
| `strategy.getByPolicy` | query | A01/A02 |
| `strategy.getMine` | query | A01/A02 |
| `strategy.getTaskCompletions` | query | A01/A02 |
| `strategy.saveTaskCompletion` | mutation | A01/A02 |
| `strategy.updateTasks` | mutation | A01/A02 |
| `strategy.generate` | mutation | A01/A02/A04/A06 |
| `strategy.get` | query | A01/A02 |
| `strategy.generatePhysicianLetter` | mutation | A01/A02/B03 |
| `contacts.list` | query | A01/A02 |
| `contacts.add` | mutation | A01/A02 |
| `contacts.update` | mutation | A01/A02 |
| `contacts.delete` | mutation | A01/A02 |
| `sms.sendNotification` | mutation | A13 |
| `sms.sendBulk` | mutation | A13 |
| `sms.savePreferences` | mutation | A01/A14 |
| `email.sendStrategy` | mutation | A08 |
| `email.sendPageContent` | mutation | A09 |
| `email.sendContactForm` | mutation | A10 |
| `email.sendSaveLink` | mutation | A11 |
| `email.getResumeData` | query | A11 |
| `email.notifyStepProgress` | mutation | A12 |

Additional HTTP surfaces: `/api/oauth/callback` maps to A03; `/manus-storage/*` to A17; `/healthz` to A02; static HTML/resources and external browser requests to A18–A22 and B01–B03.

## Configuration presence

Presence only was inspected; no secret values were read into this report. In this execution environment, all 27 named service/configuration variables below were absent. This says nothing about another deployment’s secret store.

| Variable | Present here |
|---|---|
| `APP_URL` | No |
| `DATABASE_URL` | No |
| `JWT_SECRET` | No |
| `VITE_APP_ID` | No |
| `OAUTH_SERVER_URL` | No |
| `OWNER_OPEN_ID` | No |
| `BUILT_IN_FORGE_API_URL` | No |
| `BUILT_IN_FORGE_API_KEY` | No |
| `ZAPIER_WEBHOOK_URL` | No |
| `VITE_ZAPIER_WEBHOOK_URL` | No |
| `CONTACT_EMAIL` | No |
| `TWILIO_ACCOUNT_SID` | No |
| `TWILIO_AUTH_TOKEN` | No |
| `TWILIO_PHONE_NUMBER` | No |
| `VITE_BOOKING_URL` | No |
| `SMTP_HOST` | No |
| `SMTP_PORT` | No |
| `SMTP_SECURE` | No |
| `SMTP_USER` | No |
| `SMTP_PASS` | No |
| `SMTP_FROM` | No |
| `VITE_FRONTEND_FORGE_API_URL` | No |
| `VITE_FRONTEND_FORGE_API_KEY` | No |
| `DB_HOST` | No |
| `DB_USER` | No |
| `DB_PASSWORD` | No |
| `DB_NAME` | No |

`NODE_ENV` and `PORT` are ordinary runtime selectors, not secret-service credentials. Tests set explicit local values. `CONTACT_EMAIL` has an existing code fallback, and the LLM adapter has an existing Forge URL fallback; neither makes the corresponding service configured.

## Test evidence and limits

Existing coverage: delivery contracts use mocked fetch; policy/contact/strategy/chat tests use mocked database operations; Twilio is mocked; browser suites intercept private/messaging tRPC and block external HTTPS. The workflow suite deliberately allows the real local `pdfDelivery.generatePdf` call. Local PDF/Word generation, calculation functions and signed-token cryptography run for real. No live messages were sent.

This pass adds actual JWT verification and callback-handler tests, SMS provider-receipt/redaction/stub tests, and SQL-predicate checks for owner-scoped active knowledge retrieval. These are still not a live provider/database acceptance test.

Official SMS reference: https://www.twilio.com/docs/messaging/api/message-resource — message creation/status and downstream delivery are different stages. The server now reports acceptance without claiming handset arrival.

## Completion rule

A production connection may be accepted only after its own verification column has evidence from the intended environment and approved test data/recipients. A documented removed/dormant item does not need a live account merely to exist in the source tree. Activating one requires an explicit feature requirement and its listed repairs. The inventory itself is complete; the application remains in progress.
