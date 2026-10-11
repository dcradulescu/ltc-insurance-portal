# LTC Insurance Portal — Public Education and Cost Projection Scope
**Decision recorded:** October 11, 2026
**Source:** User directive in LTC Resume conversation.
**Scope status:** Approved product direction; architecture/code conversion is NOT implemented; this note is not a HIPAA legal determination.
**Canonical UI baseline:** Preserve approved visuals, and preserve locked original 18-page report HTML source unchanged.

## What the public application IS
- Public-access, non-client-only educational website for ANY visitor, including strangers.
- Teach insurance policy terms and what benefits could mean for long-term home-care spending.
- Provide hypothetical, interactive home-care cost and insurance-benefit projections, including policy limit, elimination period, reimbursement type, inflation, premium-waiver and likely out-of-pocket expense.
- Explain projections as conditional estimates, not guarantees of coverage, carrier eligibility, approval, payment or medical advice.
- Visitors do not need a user account, family name, patient name, email address, insurer policy number, or any medical document.

## Explicitly OUT OF SCOPE for the PUBLIC web application
- Claim submission or claim orchestration, insurer API/webhook delivery, invoices or caregiver notes submission.
- Client intake, patient assessment, care plans, physician letters, medical records, case management, claims status, insurer document management.
- External submission of full policy forms or comprehensive records on completion, page exit, timeout or strategy generation.
- Collecting or storing sensitive identifiable health information for public calculations.
- Public user authentication, account-scoped server database histories and S3 uploads if solely required to support disallowed public functions.
- Any optional 'Mode B' insurer-facing workflow in the prior privacy audit is explicitly NOT requested.

## Input data specification for anonymous educational calculator
| Classification | Data | Treatment |
|---|---|---|
| Recommended | Policy payout type (reimbursement/indemnity), daily/monthly maximum, remaining/lifetime benefit pool, elimination period amount and counting method, rider/inflation %, benefit growth, premium amount and waiver assumption, home-care hourly rate, hours/day, days/week, annual cost escalation, projection start month/timeframe | Allow browser-only, local computation, no automatic collection/storage/transmission. |
| Optional with caution | Age bracket, personal ADL limitation counts, cognitive impairment trigger, statement that home-care assistance is needed, condition-related care descriptions | Prefer hypothetical/unknown/multiple-choice rather than asking about a real identifiable person; browser only; never send to AI, analytics or server; health sensitivity is still real even if no name is provided. |
| Not needed / do not request | Real name, exact birthdate, physical/mailing address, phone, email, policy/claim number, SSN, Medicare/Medicaid number, unique identifier, physician information, diagnosis details, actual caregiver notes, medical file uploads, photo ID, bank statements | Omit from public calculator. Optional contact inquiry must be a separate form with separate notice and no projection or medical context. |

## Required data-flow/acceptance conditions BEFORE public deployment
1. No auto-sending complete/partial form data to Zapier, emails, AI systems or server on completion, timeout, unload, strategy generation or any other calculator activity; server endpoints must enforce blocking, not just UI removal.
2. No remote persistence of calculator inputs or individualized report text. Client-side calculator and optionally client-side PDF generation/print; preserve original approved 18-page visuals if retained. Existing backend 18-page PDF is NOT browser-only.
3. No visitor login required to learn or project costs.
4. No third-party analytics/pixels, session replay, tags or scripts observing calculator inputs or correlating sensitive input with visitor IP/browser IDs. Audit CDN/server access logs separately; public webpage visits/IP alone are not automatically PHI.
5. Do not represent localStorage or sessionStorage as encrypted; sensitive optional values should be ephemeral in browser memory unless user consciously exports a local file. Clear/Reset action.
6. Confirm calculator can model unknown rules correctly: calendar-vs-service elimination, reimbursement vs indemnity, policy benefit caps, riders, total vs remaining pool, prior benefits paid, and reimbursement eligibility; unknown terms produce 'carrier verification required,' not guessed payouts.
7. A plain-language notice truthfully reflects actual code: site provides estimates, no account needed, no insurer contact; describe cookies/analytics and server logs accurately.
8. Test phone/tablet/desktop and browsers, keyboard accessibility, calculation accuracy, visual unchanged report, and negative network capture for all input/exit/timeout/send flows.
9. Conduct independent applicability review of HIPAA as to the actual Visiting Angels legal entity and its other operations; inspect FTC Act/Health Breach Notification Rule and applicable state privacy rules. Do not claim a product is 'HIPAA certified' on field choice alone.
10. No production deployment and no real client data testing until above acceptance conditions are verified.

## Existing code conflicts (observed October 11, 2026)
- `server/routers/policyForm.ts`: sends comprehensive policy, user, medical and document metadata to Zapier including the legacy method.
- `client/src/pages/PolicyForm.tsx` and `client/src/pages/Strategy.tsx`: automatic Zapier transmit on completion/exit/timeout/generation.
- `server/routers/chat.ts`: AI provider receives identifiable saved policy context where supplied.
- `server/routers/documents.ts`: supports medical document uploads to S3.
- `server/routers.ts`: saves policy details (including identifiers/clinical fields) to server database.
- `server/canonicalReportPdf.ts` and `server/strategyPdfGenerator.ts`: personalized PDF is currently generated on server and stored; changes are required if browser-local is mandated.
- `server/_core/index.ts`: CSP not configured. Address in release security work.

## Legal interpretation sources
- HHS Covered Entities and Business Associates: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html
- HHS De-identification Guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html
- HHS Online Tracking Guidance (note June 20, 2024 partial judicial vacatur): https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-online-tracking/index.html
- FTC Consumer Health Information: https://www.ftc.gov/business-guidance/resources/collecting-using-or-sharing-consumer-health-information-look-hipaa-ftc-act-health-breach
- FTC Health Breach Notification Rule: https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0

**Status: Product scope clarified and documented. Existing application still contains out-of-scope functionality; code not yet remediated.**
