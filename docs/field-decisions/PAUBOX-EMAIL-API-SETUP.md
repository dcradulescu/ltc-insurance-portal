# LTC Portal — Paubox Email API setup (preferred)

**Status: Code implemented on isolated LTC Portal development branch. No Paubox account, BAA execution, API key, DNS change, real email, or deployment was completed by this work.**

**Your existing GoDaddy Microsoft 365 mailbox remains the inbox** for daniel@scvisitingangels.com. No GoDaddy mailbox migration, Microsoft Entra application registration, Gmail connection, or Microsoft mailbox password is required for Paubox outbound sending.

## What sends and where

| Visitor action | Office copy |
|---|---|
| Generate an LTC Strategy | Visiting Angels receives generated Strategy text, its three-stage checklist, selected structured coverage/care fields, and an anonymous support reference. |
| Download the original 18-page PDF | Visiting Angels receives the **identical PDF attachment bytes**, selected structured fields, and the same support reference. |
| Request the 18-page PDF by email | **One Paubox message:** visitor in To, Visiting Angels in BCC. Both receive the same attachment and coverage summary, subject and reference. |

Office address: **daniel@scvisitingangels.com**. Support reference example: LTC-123456ABCDEF. The visitor can supply the reference during a support call; the office can search its received messages by reference.

**Only generated outputs are sent to the office.** Unsubmitted browser drafts and optional Additional Notes are not copied. Structured diagnoses, benefits, and ADL choices can still be sensitive despite the absence of a name or policy number; the portal discloses the office-copy process.

## Simple setup checklist

1. **Create a Paubox Email API account:** [Paubox Email API](https://www.paubox.com/products/paubox-email-api/). Paubox advertises a BAA with Email API plans. Verify your account's applicable BAA before any real client data is transmitted. Its September 2026 support guide notes a possible initial **24-hour verification hold** for new Freemium accounts. Confirm pricing and possible usage charges.
2. **Verify the sending domain:** Sign in to the [Paubox dashboard](https://next.paubox.com/users/sign_in); under **Settings → Domains**, add scvisitingangels.com. Paubox will show exactly which SPF/TXT and DKIM entries to add. Have whoever maintains your domain DNS update those records **where DNS is actually hosted**, which may or may not be GoDaddy. **Do not change Microsoft 365 MX records.**
3. **Preserve existing SPF:** There should be only one SPF TXT record for the domain. Merge Paubox's include with Microsoft 365 and any other legitimate existing senders, rather than adding a second SPF record or replacing existing entries. Paubox gives the simple M365 example: v=spf1 include:spf.protection.outlook.com include:_spf.paubox.com -all. That is an example, **not an instruction to overwrite other existing permitted senders**.
4. **Generate an API key:** In Paubox **Settings → API Keys**, choose the **Paubox Email API** scope for the verified domain. Save the key in a secure **server-side environment/secret manager**, never in GitHub, frontend code, screenshots, chats or emails.
5. **Configure a test/staging copy of the LTC Portal** with these server-only settings:
   - LTC_MAIL_TRANSPORT = paubox
   - PAUBOX_API_KEY = (securely stored secret)
   - PAUBOX_SENDER_EMAIL = daniel@scvisitingangels.com
   - LTC_SUPPORT_EMAIL = daniel@scvisitingangels.com
   - LTC_SUPPORT_COPY_ENABLED = true

The GoDaddy/Microsoft 365 mailbox continues to **receive replies and office copies**. No Microsoft Entra credentials, Office 365 SMTP app password, or Gmail account is required for this transport.

## Technical details / acceptance tests

- REST endpoint: https://api.paubox.com/v1/email/messages
- Authentication: Authorization Bearer token; server-side only.
- Attachments: Base64 of the **exact in-memory original PDF**, using Paubox fields fileName, contentType and content. A conservative 45 MiB attachment cap is enforced, below Paubox's 50 MB documented limit.
- BCC: transmitted as a BCC recipient in the **same request**, not a second visitor message.
- A Paubox HTTP 200 with sourceTrackingId establishes **provider acceptance only**, not inbox delivery. The tracking ID can be used with Paubox disposition tools. No automatic retries after unknown/ambiguous provider errors.
- No non-TLS downgrade setting is enabled. When a recipient cannot accept directly encrypted email, Paubox may deliver a secure pickup notification rather than a direct attachment; verify the visitor experience with a controlled test.
- When a user generates a Strategy or PDF, Paubox receives only the outbound generated artifact and permitted structured selections. Browser-local drafts and arbitrary Additional Notes are not sent. The protected data may still be PHI or sensitive information.

Run these staging checks (no production deployment or live data):

1. Run the build and existing Vitest regression suite.
2. Run the additional Paubox provider and configuration tests, and the local readiness check.
3. Create a fake policy and generate a Strategy; verify the Visiting Angels office inbox receives its summary and reference.
4. Generate and download the synthetic 18-page PDF; verify the identical PDF is attached to the office email.
5. Email the PDF to a controlled synthetic recipient; verify the visitor and office BCC copies, matching PDF attachment checksums and support reference, and Paubox tracking/disposition.
6. Verify that all removed identifying fields, browser-only drafts and Additional Notes are excluded from email transmissions.
7. Review service agreements, HIPAA applicability, approved disclosures, mailbox access/retention, domain authentication, and security before public deployment.

**No production deployment, domain DNS edit, GoDaddy mailbox change, database deletion, account deletion, Zapier removal, or BAA acceptance has been authorized or performed by this integration work.**

## Vendor references

- [Paubox current REST quickstart](https://docs.paubox.com/email-api/quickstart)
- [Paubox messages endpoint, BCC, and tracking reference](https://docs.paubox.com/email-api/messages)
- [Paubox attachments and 50 MB limit](https://docs.paubox.com/email-api/attachments)
- [Paubox September 2026 domain verification and DKIM setup](https://support.paubox.com/kb/paubox-email-api-rest-api-setup)
- [Paubox Email API plans and BAA](https://www.paubox.com/products/paubox-email-api/)
