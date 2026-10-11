# LTC Insurance Portal — Data-flow and client-side architecture audit
**Date:** October 11, 2026
**Status:** READ-ONLY CODE AUDIT; recommendation pending business/legal decision; NOT IMPLEMENTED or deployed.
**Workspace:** H:\LTC-Insurance-Portal\Development\LTC-Portal-Continuation-2026-10-10\workspace\ltc-portable
**Approved visual baseline:** sc-visiting-angels-ltc-original-18-v1 (18 original HTML pages: DO NOT MODIFY).

## Business purpose and constraints
Visiting Angels provides nonmedical home care and LTC insurance education. When a client chooses and authorizes it, Visiting Angels may also submit invoices and caregiver care notes to the LTC insurer seeking reimbursement. User asked whether sensitive/medical information could remain only in the client's browser instead of on the server. No change to storage, PDF design, production environment, or client records has been authorized by that question alone.

## Scope of this review
Static inspection of the current DEVELOPMENT source code and prior local QA artifacts. No runtime credentials, actual client data, webhooks, insurer connections, SMTP, SMS, or cloud storage inspected or contacted. This is not a penetration test, legal opinion, compliance certification, or production audit.

## Specific observed code paths
| ID | Severity | Source | Observed behavior | Exposure / required decision |
|---|---|---|---|---|
| P-01 | CRITICAL | `server/routers/policyForm.ts:25-185` | `sendComprehensiveToZapier` builds user profile, policy, Medicare/Medicaid identifiers, diagnosis, ADLs, strategy text, document metadata/URLs, contacts, and unsaved form data, then posts JSON to an externally configured Zapier webhook. | Violates a true browser-only/sensitive-data-local promise. Must define transfer authorization, vendor/privacy requirements, least-data scope, retention and destination controls before production. |
| P-02 | CRITICAL | `client/src/pages/PolicyForm.tsx:520-585`, `client/src/pages/Strategy.tsx:155-182` | Attempts comprehensive webhook on completion, timeout, navigation/unload. Strategy component cleanup can trigger on route change. | A user could transmit partially entered health and insurance data without a separate explicit submission choice. |
| P-03 | HIGH | `server/routers/policyForm.ts:200-285` | Legacy webhook method transmits raw saved policy object and arbitrary formData; duplication of risk if one route is fixed and the other is not. | Both endpoints need aligned transfer restrictions and regression testing; do not silently remove backwards compatibility. |
| P-04 | HIGH | `server/routers/chat.ts:156-204` | Policy-specific chat prompt can contain insured name, policy number, carrier, benefits, and conversation history, sent via `server/_core/llm.ts` to configured AI API. | Require affirmative disclosure and purpose-specific consent or remove identity and policy number from AI payload; review external provider contract/retention. |
| P-05 | HIGH | `server/routers/documents.ts:13-83,115-182` | Portal accepts health records, assessments, ID, bank records and insurance policies; uploads document content to S3 and stores account-scoped metadata in MySQL/MariaDB. | Contradicts local-only architecture and prior feature notes recording removal of sensitive document uploads; clarify desired operating mode before modifying. |
| P-06 | HIGH | `server/routers.ts:48-214`, `drizzle/schema.ts` | Policy persistence accepts insured identity and address, Medicare/Medicaid numbers, diagnosis/medical details and care needs; saves to database. | Local-only operation requires isolating or eliminating the server persistence of sensitive fields while preserving claims workflow when authorized. |
| P-07 | MEDIUM | `client/src/lib/accountStorage.ts:1-12` | Account-scoped draft/session information is stored using browser `sessionStorage`, not encrypted at the application layer. | Storage remains exposed to same-origin script execution, browser profiles/extensions and shared device access; no cross-device resume. |
| P-08 | MEDIUM | `client/src/components/TermsGate.tsx:15-143` | Generic Terms of Use acceptance stored in `localStorage`; the visible text is about education/disclaimer, not separate claim-submission or data-sharing authorization. | Consent required for operational transmissions is not substantiated by this flag alone. |
| P-09 | MEDIUM | `server/_core/index.ts:83-100` | Helmet enabled but Content-Security-Policy completely disabled, citing Vite inline bootstrap scripts. | Hardening must preserve working scripts/assets but cannot claim a robust CSP exists today. |
| P-10 | MEDIUM | `server/_core/requestSecurity.ts:9-35` | API responses use `Cache-Control: private, no-store`; protected HTTP procedures and request verification/rate limits are in place. | Positive control but does not prevent transmission/storage of sensitive payloads. |
| P-11 | MEDIUM | `START_HERE.md` | Document removal revokes portal mapping but underlying stored object is retained; signed URLs may remain valid until expiry. | A deletion request cannot currently be represented as guaranteed permanent erasure. |
| P-12 | REQUIRES VERIFICATION | `server/strategyPdfGenerator.ts`, `server/canonicalReportPdf.ts` | Approved 18-page report is rendered server-side and uploaded through object storage. | Searchable overlay and visual lock passed synthetic QA; report handling itself contradicts strict client-only data processing. |

## Legal/regulatory decision is separate from technical hosting
HIPAA is NOT automatically applicable merely because the website asks about medical conditions or assists with LTC forms. For providers, coverage generally depends on performing HIPAA-standard electronic transactions; a business associate is defined by certain services for/on behalf of a covered entity. Some LTC insurers are HIPAA-covered health plans (nursing-home fixed-indemnity exception is specifically identified by CMS). Ordinary LTC reimbursement invoices and notes should not be assumed to be HIPAA-standard EDI. The exact relationship, insurer product, billing channels, payer contracts and other agency business lines must be reviewed by qualified counsel.
Do not state 'not covered by HIPAA' as a final legal conclusion. Non-HIPAA does not mean no privacy duties: state privacy/breach rules and applicable FTC rules may still apply.
Official references:
- HHS covered entities: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html
- HHS covered provider transactions: https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html
- HHS business associates: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html
- HHS payer/provider relationship: https://www.hhs.gov/hipaa/for-professionals/faq/is-health-care-provider-considered-to-be-a-business-associate/index.html
- CMS transaction FAQs (LTC fixed indemnity exception): https://www.cms.gov/priorities/key-initiatives/burden-reduction/administrative-simplification/transactions/faqs
- FTC Health Breach Notification Rule overview: https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0

## Recommended target design: two deliberately separated modes
### Mode A: Education and planning (browser-local)
- Public information, glossary and sample insurance strategy are stateless/anonymous.
- Benefit projections can use numeric benefit inputs without identifying insured; no SSN, Medicare number or diagnoses needed.
- For a client-specific calculator, keep unnecessary health identifiers out of API calls and avoid any automatic Zapier/AI/upload transfer.
- If durable private drafts are required, design encrypted client-controlled export/import or an explicitly approved encrypted account service; do not claim current `sessionStorage` is encrypted or cross-device portable.
- The approved 18-page PDF look must remain untouched. Producing a personalized, fully browser-local PDF is a distinct engineering project; the current PDF pipeline renders server-side and writes to storage.

### Mode B: Optional explicitly authorized claim assistance
- Separate, unmistakable consent/authorization action immediately before any insurer-facing invoice/care-note upload or external vendor transmission. Never infer approval from completing the education form, timeout, or exiting a tab.
- Show destination, data categories, purpose, retention, revocation/deletion limits, and the submitting organization. Capture auditable authorization where legally appropriate.
- Transmit only necessary invoice and caregiver-note elements; direct carrier submission or a suitably secured short-lived transfer service, not comprehensive customer/session dossiers.
- Do not route medical/claim attachments through Zapier, email, general AI, or routine analytics without separate review and configured protections.
- If the agency is required to keep billing/clinical/business records, maintain them in its separately governed records system with its actual retention obligations; a 'zero retention' portal setting must not erase legally required records.
- If backend transient processing is required, it still touches sensitive data; secure endpoints, memory/temp files, logs, buffers, backups, observability, and provider contracts must be verified.

## Proposed engineering acceptance criteria (NOT yet implemented)
1. Map every DB field to one of: anonymous planning; account metadata; sensitive identifiable; document attachment; insurer-submission payload.
2. No identifiable health, insurance number, payment, care-note or unsaved form payload leaves Mode A upon input, completion, timeout, route change or browser unload.
3. Both modern and legacy Zapier handlers enforced by an identical server-side rule; UI-only suppression is insufficient.
4. External AI receives no insured name, policy number, diagnosis, or free-text care notes by default in education mode.
5. No sensitive document auto-upload to S3 from Mode A; optional submission is action-gated and destination-restricted.
6. Generated PDFs follow the selected privacy mode; exact 18-page branding unchanged; 18/18 visual checksum/geometry and searchable-layer QA rerun.
7. Formal clear-draft, logout, tab close, shared-device and cross-account isolation tests.
8. Consent and insurer-submission event has minimal audit trail; denied/no-consent cases remain private.
9. Security review covers CSP, transport encryption, encrypted storage/backups, operator access, vendor contracts, deletion schedule, incident response, and non-HIPAA state/FTC requirements.
10. All existing software regressions rerun against synthetic test data only. No production or real-client testing without separate approval.

## Deployment blockers / decision gate
The current code cannot truthfully be described as 'sensitive client data stays entirely on the client'. An architectural change is required. Approval needed on whether to (A) make all client-specific data browser-only by default with optional authorized claim handoff, or (B) retain the authenticated MySQL/S3 account workflow with stronger security controls and explicit external transfer rules. This document does not authorize removing previously requested features or changing the approved UI design.

## Latest pre-audit local QA evidence
- October 11, 2026: 566 Vitest tests passed, 27 MySQL/HTTP integration checks passed, TypeScript check passed, build passed (per H:\LTC-Insurance-Portal\QA\checkpoint17_* logs).
- Searchable 18-page sample PDF visual diff: all pages pixel-identical to image-based reference; 6,018 searchable words; PDF/UA accessibility not certified (verification/canonical-searchable/searchable_text_visual_regression.json).
- No code, live database, PDF template, integrations or production resources were changed by this audit.
