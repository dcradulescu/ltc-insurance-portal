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
| 21 | PDF email | **Keep**: explicit email-service delivery; test BCC | Original approved 18-page report attached |
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
- Strategy generation: sends a whitelist of non-identifying policy/carrier/care/diagnosis selections to an external AI service. Do **not** send local Additional Notes by default.
- Support Chat: transmits deliberately typed questions (and only its in-memory recent chat messages) to an AI service. Do not persist transcripts in the portal DB or automatically attach policy context. Inform users not to type identifiers.
- PDF: render the approved 18 pages temporarily in server memory; download from transient base64, no portal object-storage URL.
- Email PDF: explicit recipient input, acknowledgement, SMTP attachment. Temporary testing BCC `daniel@scvisitingangels.com`. Show BCC disclosure to sender; `LTC_TEST_BCC_ENABLED=true` enables it in any environment, whereas production defaults off. A successful SMTP acceptance is **not** proof of inbox receipt. Provider may retain message content/delivery logs.
- Contact Us: retain voluntary contact form, separate from anonymous local policy state. Do not silently attach draft/diagnosis data.
- Security/HIPAA: external providers, BAAs where legally necessary, SMTP, anti-abuse measures, legal privacy copy and operational logging require environment-appropriate validation **before public launch**. Code changes alone do not certify compliance.

## QA and rollout restrictions
- H: backup/source intact; GitHub canonical development only on feature branch. Do not merge `main`, overwrite checkpoint, delete DB, destroy files, migrate, or deploy production without separate authorization.
- Verified source-scope regression suite: 35 suites / 568 tests passed (2026-10-11). New public privacy tests added. Full legacy GitHub-only suite includes older incompatible tests and unrelated TypeScript errors.
- Vite application build successful; original 18-page synthetic PDF rendered and validated against source fingerprint; sampled pages have blank identity fields. Desktop/mobile Chrome guest-access and save/restore smoke is available under local QA directory.
- Browser tests and mocked mail tests are not a substitute for live SMTP and legal/operational compliance testing. Testing BCC remains environment configurable.
