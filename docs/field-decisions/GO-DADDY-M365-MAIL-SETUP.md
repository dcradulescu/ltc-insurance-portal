# LTC Portal — GoDaddy Microsoft 365 delivery integration

**Status:** OAuth/Graph application support implemented in the LTC Portal feature branch; real mailbox authorization and end-to-end provider delivery are **not yet configured or verified**.

**Scope:** LTC Insurance Portal only. Main, production, original 18-page PDF, and rollback checkpoint must remain unchanged until separate rollout approval.

## Delivery behavior

The visitor's completed Strategy, 3-stage checklist, and later original 18-page PDF each produce an automatic support copy to **daniel@scvisitingangels.com** under the same locally generated reference, such as \`LTC-123456ABCDEF\`.

When the visitor explicitly emails their PDF:
- To: visitor-entered recipient address(es).
- BCC: configured Visiting Angels support mailbox.
- Both parties receive the **identical** 18-page PDF attachment and the same email summary of structured coverage/care selections.
- BCC is hidden in recipients' address headers. A clear office-copy disclosure remains on the website.
- The office emails are not database records: Outlook/Exchange mailboxes and provider retention policies apply.
- Never email unsubmitted drafts or optional personal Additional Notes.

## Preferred transport: Microsoft Graph v1.0 (OAuth 2.0)

This is a GoDaddy-hosted Microsoft 365 / Exchange Online mailbox; it is not GoDaddy Workspace Email. Basic SMTP user-password authentication should not be the long-term plan. Microsoft has announced it will disable SMTP AUTH Basic authentication by default in existing Exchange tenants at the end of December 2026, with eventual full retirement after a further announcement in 2027.

A connected Microsoft Outlook plugin in ChatGPT is **not** a credential usable by the standalone LTC web application. The website requires its own server-side, approved application registration.

### One-time Microsoft 365 / GoDaddy administrator authorization

1. In the GoDaddy [Email & Office Dashboard](https://email.godaddy.com/), sign in as an authorized Microsoft 365 administrator.
2. Open Advanced Admin Centers / Microsoft Entra administration, if available in your GoDaddy-managed subscription. In Microsoft Entra, register a single-tenant application named e.g. **SC Visiting Angels LTC Portal Email**. **If app registration or admin consent is unavailable**, stop and request the necessary administrative support from GoDaddy rather than weakening existing tenant security.
3. Save the **Directory (tenant) ID** and **Application (client) ID**. Configure a certificate or a time-limited client secret under Certificates & secrets. The current adapter uses a client secret, not a user password; certificate credentials are an optional later improvement.
4. Add Microsoft Graph **Application** permission \`Mail.Send\`; grant administrator consent. Application permissions can otherwise allow sending as any tenant user, so **restrict application mail-send access to the intended sending mailbox** using Exchange Online **RBAC for Applications**, and verify that scope before releasing the app.
5. Confirm the app is authorized to send as the intended Microsoft 365 mailbox. Initial sending mailbox: \`daniel@scvisitingangels.com\`. This may be changed later to a licensed dedicated \`ltcportal@\` mailbox. The receiving office copy remains \`daniel@scvisitingangels.com\`.
6. Store these values as protected environment variables in the web application's **server host / secret manager**, never in GitHub, the browser, screenshots, or chat:

    \`\`\`dotenv
    LTC_MAIL_TRANSPORT=graph
    MS365_TENANT_ID=<directory-tenant-id>
    MS365_CLIENT_ID=<app-registration-client-id>
    MS365_CLIENT_SECRET=<secure-client-secret-value>
    MS365_SENDER_EMAIL=daniel@scvisitingangels.com

    LTC_SUPPORT_EMAIL=daniel@scvisitingangels.com
    LTC_SUPPORT_COPY_ENABLED=true
    \`\`\`

7. Restart only the **approved test/staging** instance after securely applying variables. No production change is authorized by this document.

### What the code does

- Requests a short-lived access token from \`https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token\` using \`https://graph.microsoft.com/.default\`.
- Posts to \`https://graph.microsoft.com/v1.0/users/{sender}/sendMail\` with the exact \`toRecipients\`, \`bccRecipients\`, HTML summary, and approved PDF bytes (base64 encoded).
- A \`202 Accepted\` means Graph accepted processing; **not** confirmation of inbox delivery. Microsoft 365/Exchange still applies throttling, message limits and policy controls.
- In-memory tokens are reused before expiry. No password SMTP fallback is attempted in Graph mode.
- Standard single-call Graph attachment support currently caps file attachments at **3 MiB**. The original synthetic approved report was approximately 2.97 million bytes and was under this threshold. Verify representative report sizes before deployment. For larger attachments, a reviewed MIME or upload-session enhancement is needed; do not silently omit a PDF or claim success.

## Staging checks (no live delivery without credentials)

\`\`\`powershell
corepack pnpm build
corepack pnpm exec vitest run ./server/_core/microsoftGraphMail.test.ts ./server/publicLtc.test.ts ./server/ltcOfficeSupport.test.ts
node scripts/check-public-ltc-readiness.mjs
\`\`\`

Once admin consent and environment configuration are complete, use **synthetic-only** policy and care data to:
- Trigger Strategy creation; confirm the office receives the text, selected structured fields, 3-stage checklist and reference.
- Trigger an 18-page PDF download; confirm the office receives an **identical PDF attachment**.
- Email a PDF to a **controlled test recipient other than the sending office mailbox**, and verify the visitor's copy and the office BCC. Compare the attachment hashes and reference number.
- Confirm that Personal Additional Notes, a policy number, address, and other removed identifying fields were **not** sent.
- Confirm failure behavior: missing admin consent, rejected message, changed sender, office-mailbox retention, and size limits.
- Inspect inbox receipts and headers, not only a successful Graph \`202\`. The connected Outlook integration may be used to inspect the office inbox if explicitly requested.

## Optional legacy SMTP fallback (not recommended long term)

GoDaddy documents \`smtp.office365.com\`, port \`587\`, STARTTLS. Existing \`LTC_MAIL_TRANSPORT=smtp\` still invokes Nodemailer, but password SMTP AUTH is in deprecation and may be disabled by tenant policy. GoDaddy documentation notes enabling SMTP Authentication can disable Microsoft Entra security defaults for the organization; **do not disable security defaults or MFA to get this portal working**.

## Security, privacy and deployment prerequisites

Even an unnamed person's diagnosed conditions, age-related care needs and policy terms can be personally sensitive or identifiable in context. The automated mailbox copies do not prove HIPAA de-identification or legal compliance. Verify applicable legal requirements, third-party security agreements where necessary, Microsoft 365 retention/access controls, sender authorization, BCC disclosure, data-subject expectations and audit strategy with an appropriate specialist before public launch.

**No production deployment, database deletion, existing account deletion, Zapier decommissioning, or GoDaddy/Microsoft account security-settings changes are approved by this setup guide.**

## Official references

- [GoDaddy Microsoft 365 SMTP settings](https://www.godaddy.com/help/set-up-microsoft-365-email-with-smtp-on-a-multifunction-device-41962)
- [Microsoft Graph sendMail (v1.0)](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)
- [Microsoft Graph app-only access](https://learn.microsoft.com/en-us/graph/auth-v2-service)
- [Microsoft Graph Mail.Send permissions](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Exchange Online RBAC for Applications](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac)
- [January 2026 SMTP AUTH Basic retirement update](https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835)
