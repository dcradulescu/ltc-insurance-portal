# LTC Portal public education — approved privacy and UX scope

Date: 2026-10-11. Development branch: `feature/public-education-strategy-20261011`.
**Scope: LTC Insurance Portal only.** None of the Visiting Angels Assessment, Plan of Care, Home Care Evaluator, BillBridge, or other applications are changed.

## Decisions and field disposition
| Decision | Field / function | Web portal | Original 18-page PDF |
|---|---|---|---|
| 1–12 | Name; insured email/phone/DOB/address; POA name/relationship; policy and claim numbers; case manager name; free-text Diagnosis Notes and Care Notes | Removed | Retain blank writable entries/sections |
| 13 | Additional Notes | **Keep**, local browser draft only | Preserve the original notes section |
| 14 | POA Present | Remove | Blank section |
| 15 | Case Manager Assigned | Remove | Blank section |
| 16–18 | Insurance carrier address, phone, fax | **Keep** | Keep |
| 19 | Diagnoses and cognitive impairment checkboxes | **Keep** | Keep |
| 20 | Email Save & Return link | Remove | N/A |
| 21 | PDF email | **Keep**: explicit email-service delivery and ongoing disclosed Visiting Angels office copy | Original approved 18-page report attached |
| 22 | Mandatory account registration / sign-in | Remove | N/A |
| 23 | Insurance/medical document upload | Remove from public portal | N/A |
| 24 | Contact Us form (voluntary name, email, phone, message) | **Keep** | N/A |
| 25 | AI Support Chat | **Keep**: anonymous, in-memory chat history and no policy-context auto injection | N/A |

No other insurance financial/care inputs are to be removed without fresh approval.

## Non-negotiable UI and computation invariants
- Preserve the existing SC Visiting Angels LTC Portal layout, colors, typography, illustrations, navigation style, page rhythm, and approved original report theme. No redesign.
- Preserve the original flow: Education -> Policy Form -> Strategy (including original calculator) -> 18-page downloadable/emailable PDF. Do not create a separate calculator page.
- Preserve `shared/careCalculator.ts` and its formulas, defaults, calculation rules, warnings, and outputs **unchanged**. `client/src/components/CareCalculator.tsx` adds only a non-visual local draft persistence callback, not financial logic.
- Preserve original PDF template source and fingerprint `sc-visiting-angels-ltc-original-18-v1`, exactly 18 pages. Missing removed fields are blank/writable, never replaced with fabricated identity.
- Original authenticated endpoints, database schema, Zapier connectors, backups, feature-history and checkpoint remain in the repository for separate decommission approval. Public form does not call those endpoints.

## Approved browser-only persistence
- Invisible, persistent, same-browser `localStorage` saves every Policy Form field, step, checklist completion, timeline planning date, calculator draft and saved scenario.
- On return, load the same data automatically; no user-visible Save/Restore/Backup control. Clear All Data removes visitor drafts.
- Local storage is **not encrypted**. A shared or compromised browser/device exposes the data. Private browsing, clearing site data, storage restrictions or changing browsers/devices can erase/lose progress. This is not cross-device sync.

## Explicit service exceptions
- Strategy generation: sends a whitelist of non-identifying policy/carrier/care/diagnosis selections to an external AI service. Automatically sends the completed Strategy, generated checklist, and structured selections to the Visiting Angels support mailbox with the visitor's random support reference. Do **not** send browser-local Additional Notes or unsubmitted drafts.
- Support Chat: transmits deliberately typed questions (and only its in-memory recent chat messages) to an AI service. Do not persist transcripts in the portal DB or automatically attach policy context. Inform users not to type identifiers.
- PDF: render the approved 18 pages temporarily in server memory; download from transient base64, no portal object-storage URL. Every successful public PDF generation also attempts to email an identical PDF attachment and the matching structured support summary to Visiting Angels.
- Email PDF: explicit recipient input and acknowledgement, identical SMTP PDF attachment to visitor and to Visiting Angels via BCC at `daniel@scvisitingangels.com` by default. The same email contains the support reference and structured answer summary, so the office sees the exact attachment the visitor sees. Display clear disclosure before the visitor requests an email. `LTC_SUPPORT_EMAIL` configures the office mailbox and `LTC_SUPPORT_COPY_ENABLED=false` is an explicit maintenance off switch; technical release preflight flags disabled copies as incomplete. SMTP acceptance is **not** proof of inbox receipt. Provider may retain message content/delivery logs.
- Contact Us: retain voluntary contact form, separate from anonymous local policy state. Do not silently attach draft/diagnosis data.
- Security/HIPAA: external providers, BAAs where legally necessary, SMTP, anti-abuse measures, legal privacy copy and operational logging require environment-appropriate validation **before public launch**. Code changes alone do not certify compliance.

## QA and rollout restrictions
- H: backup/source intact; GitHub canonical development only on feature branch. Do not merge `main`, overwrite checkpoint, delete DB, destroy files, migrate, or deploy production without separate authorization.
- Verified source-scope regression suite: 35 suites / 568 tests passed (2026-10-11). New public privacy tests added. Full legacy GitHub-only suite includes older incompatible tests and unrelated TypeScript errors.
- Vite application build successful; original 18-page synthetic PDF rendered and validated against source fingerprint; sampled pages have blank identity fields. Desktop/mobile Chrome guest-access and save/restore smoke is available under local QA directory.
- Browser tests and mocked mail tests are not a substitute for live SMTP and legal/operational compliance testing. Visiting Angels office copies remain configurable through LTC_SUPPORT_EMAIL and LTC_SUPPORT_COPY_ENABLED.

## Continuation verification and hardening (2026-10-11)
- **586 tests across 38 active-source/public QA suites passed**. The locked original 18-page report and the financial calculation formulas remain unmodified.
- A full mock-driven six-step workflow passed in Chrome and Edge: Education, Policy Form, cognitive-impairment pathway without meeting ADL minimum, Strategy, saved calculator draft, PDF download, explicit BCC acknowledgement, chat prompts, Contact Us, and responsive mobile/tablet checks. Final Chrome also verified Clear All Data does not restore a draft during pagehide.
- `shared/ltcBenefitPathways.ts` treats Alzheimer's/dementia as a **potential alternative pathway**, never automatic benefit eligibility: policy trigger language, substantial supervision, appropriate evidence, and carrier approval are still required.
- Corrected the policy waiver default so the stored answer matches the already-visible original 'No' selection. Corrected suggested AI chat prompt click handling. Reduced forwarded claim-submission free text to safe channel labels.
- Security hardening: SMTP TLS 1.2+ required, sender BCC acknowledged, public email/strategy/chat/PDF rate limits, max two concurrent anonymous PDF renderings, and cached strategy markup restricted to harmless paragraph/line-break tags.
- Full repository `tsc --noEmit` still finds **23 inherited errors solely in five older GitHub-only files** (`server/_core/dataApi.ts`, `imageGeneration.ts`, `map.ts`, `oauth.ts`, `voiceTranscription.ts`); zero error locations in the newly changed public workflow. Do not claim a clean full-repository TypeScript check.
- Local `node scripts/check-public-ltc-readiness.mjs` reports missing `OPENAI_API_KEY`, `OPENAI_MODEL`, `SMTP_HOST`, `SMTP_FROM`. Chrome executable and canonical template lock are present. **No real AI, inbox delivery or testing BCC receipt has been verified.**
- QA commands on an authorized environment: `corepack pnpm build`, existing active-source Vitest suite, `BASE_URL=http://127.0.0.1:5195 node scripts/anonymous-guest-browser.qa.mjs` (mock network), and `node scripts/check-public-ltc-readiness.mjs`. For cross-browser runs, set `CHROME_PATH` to Edge/Chromium and `LTC_QA_DIR` for screenshot output.
- No production deployment, database deletion, Zapier disconnection, or irreversible changes to the saved rollback checkpoint are permitted without separate authorization.

## 2026-10-12: Automatic Visiting Angels support copies for every generated output
- The visitor's device gets a randomly generated and locally restored `LTC-XXXXXXXXXXXX` reference (48 bits of random data); it is shown on the Strategy screen and included in downloaded PDF filenames and emailed PDF subjects/filenames.
- When a visitor clicks **Generate My Strategy**, the server generates the same text/checklist and emails the Strategy and structured policy/care selections to the Visiting Angels support address. The anonymous visitor still receives their Strategy even when the email is unavailable, with explicit support-copy failure status.
- When a visitor **downloads a PDF**, the office receives the **exact same PDF buffer** as an SMTP attachment, with the reference and structured answer summary, provided SMTP delivery is available. The visitor's PDF download is not blocked by office email failure.
- When a visitor **emails a PDF**, the existing delivery request sends an identical PDF attachment and readable structured answer summary in one message, with the visitor as To: recipient and Visiting Angels as BCC. Both parties can match the same support reference. The recipient is told on the portal that Visiting Angels receives a copy, but the BCC address is not displayed in the recipient list.
- The default office destination is `daniel@scvisitingangels.com`; `LTC_SUPPORT_EMAIL` overrides it. Copies are enabled by default through `LTC_SUPPORT_COPY_ENABLED`, with an explicit emergency off switch. Readiness preflight flags disabled support copies, missing SMTP credentials, and missing AI credentials.
- **Unsubmitted browser drafts, `additionalNotes`, arbitrary free-text entries, and AI chat transcripts are not replicated to the office.** The office summary selects structured policy and care answers only; the generated PDF or Strategy itself is also supplied. A caller can supply their reference to locate the matching emailed support copies. There is no remote-draft lookup account or permanent portal database.
- Diagnoses, ADLs, care selections, policy provisions, and recipient email are still potentially sensitive even without formal name/DOB/policy-number fields. Visitor disclosures were updated. Legal/privacy review and appropriate agreements remain deployment prerequisites.
- SMTP accepted status never establishes recipient inbox delivery. A controlled real-world recipient + office test remains necessary. Do not claim automatic support emails are functioning live until configured and delivered.

## 2026-10-12: GoDaddy-managed Microsoft 365 sending method
- Confirmed the office mailbox `daniel@scvisitingangels.com` is in the Microsoft 365 / GoDaddy environment. A connected Outlook integration in ChatGPT is not the standalone LTC application's mail authentication.
- Added an **explicit Microsoft Graph v1.0 / OAuth2 client-credentials transport** selected by `LTC_MAIL_TRANSPORT=graph`. It honors the existing To recipient(s), Visiting Angels BCC, identical PDF attachments, HTML support summary, and mailbox reference. No account-password SMTP fallback occurs in Graph mode.
- New secrets are **server-side only**: `MS365_TENANT_ID`, `MS365_CLIENT_ID`, `MS365_CLIENT_SECRET`, `MS365_SENDER_EMAIL`. The preferred sender is `daniel@scvisitingangels.com` initially.
- GoDaddy tenant/Entra app registration and Exchange `Mail.Send` application consent require authorized administrative action. Restrict the app to the designated sending mailbox via Exchange Application RBAC. **No tenant registration, consent grant, credentials, security-default change, real email, or live delivery has occurred yet.**
- Updated `.env.example`, staging preflight, and offline configuration validation for this transport. The existing SMTP transport remains an explicit legacy fallback, but Basic SMTP authentication is being phased out and GoDaddy warns that enabling it can weaken tenant security defaults; avoid doing so for this portal.
- Refer to `docs/field-decisions/GO-DADDY-M365-MAIL-SETUP.md` for the tested adapter configuration and controlled live test procedure.
- Graph JSON inline file attachments presently have a conservative 3 MiB cap; the verified synthetic canonical PDF was approximately 2.97 MB. Test representative reports before production; larger attachments need a reviewed provider-supported MIME or upload solution without silently omitting any report.
- Graph `202 Accepted` is provider acceptance only. Visitor and office inbox deliveries still require explicit confirmation using a controlled synthetic test.

## 2026-10-12: Paubox outbound email (approved replacement for GoDaddy Graph transport)
- Explicit user authorization: **switch the LTC Portal's outbound email delivery to Paubox**, keeping GoDaddy Microsoft 365 as the unchanged receiving mailbox.
- Implemented a server-only REST adapter at server/_core/pauboxMail.ts. Configured via LTC_MAIL_TRANSPORT=paubox, PAUBOX_API_KEY and PAUBOX_SENDER_EMAIL. Public API server routes continue to use the same application sendEmail function; no form or PDF layout change is necessary.
- Recipient email stays in To; daniel@scvisitingangels.com office copy stays in BCC in the same Paubox message. Strategy-generation and PDF-download office summaries continue to be separate emails using the shared anonymous LTC support reference.
- Paubox's current REST URL is https://api.paubox.com/v1/email/messages and uses Authorization: Bearer API_KEY. BCC and Base64 PDF attachments are supported, with a documented total attachment allowance of 50 MB. The implementation caps in-memory attachments conservatively at 45 MiB.
- Paubox reports HTTP 200 plus sourceTrackingId on acceptance. That reference is recorded only in the server response from the email helper; inbox delivery requires separate confirmation through provider disposition tracking and the receiving mailbox. No automatic retry or fallback to graph/smtp after ambiguous errors.
- Microsoft Graph integration remains in the branch as **unselected rollback support**; Microsoft Entra administrator approval is **not required** for Paubox mode. No Microsoft 365 mailbox migration/change or user mail password is needed.
- Setup prerequisites that **have not been performed**: create/activate Paubox Email API account, confirm applicable BAA, verify scvisitingangels.com sending domain, merge Paubox's SPF include into the existing M365 SPF record without altering MX, add DKIM, generate server-side API key, confirm permitted sender, and test synthetic recipient + office mailboxes.
- See docs/field-decisions/PAUBOX-EMAIL-API-SETUP.md. No production change, DNS change, existing database/Zapier deletion, or live client mailing has been performed.
