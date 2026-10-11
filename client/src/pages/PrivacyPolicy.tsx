import { Layout } from "@/components/Layout";

const VA_TEAL = "#34B1C4";
const VA_CHARCOAL = "#393F43";
const VA_GREY_BG = "#F2F6FA";
const VA_HEADING = "#454545";
const VA_BODY = "#555555";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>{title}</h2>
      {children}
    </div>
  );
}

function VAList({ items }: { items: string[] }) {
  return (
    <ul className="va-checklist mb-4">
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ul>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>{children}</p>;
}

export default function PrivacyPolicy() {
  return (
    <Layout>
      {/* Hero */}
      <section className="text-white py-14" style={{ background: VA_CHARCOAL }}>
        <div className="container max-w-3xl">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}>Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>Privacy Policy</h1>
          <p className="text-white/85 text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>Effective Date: October 11, 2026 &nbsp;·&nbsp; Last Updated: October 11, 2026</p>
          <div className="flex items-center gap-3 mt-5">
            <div style={{ height: 2, width: 40, background: VA_TEAL }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: VA_TEAL }} />
            <div style={{ height: 2, width: 40, background: VA_TEAL }} />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12" style={{ background: '#ffffff' }}>
        <div className="container max-w-3xl">
          <P>
            SC Visiting Angels ("we," "us," or "our") operates the LTC Insurance Navigator at{" "}
            <a href="/" className="hover:underline font-semibold" style={{ color: VA_TEAL }}>LTC Insurance Navigator</a>{" "}
            (the "Site"). This Privacy Policy explains how we collect, use, and protect information you provide when using the Site.
            By using the Site, you agree to the practices described in this policy.
          </P>

          <Section title="1. Information We Collect">
            <P>The public LTC Policy Form does not request an insured person’s name, phone number, email address, date of birth, home address, policy number, claim number, or case manager name.</P>
            <VAList items={[
              "Coverage and carrier details you enter for educational planning",
              "Selections about diagnoses, cognitive impairment, ADLs, and care requirements",
              "Financial and calculator inputs and optional personal learning notes saved on your device",
              "Name, email address, phone number, and message only if you voluntarily use Contact Us",
              "Recipient email address only when you request PDF email delivery",
            ]} />
            <P>Our website servers may receive technical metadata, including IP address, request times and browser information, for hosting, reliability, rate limits and security. Do not enter Social Security numbers or financial account numbers.</P>
          </Section>

          <Section title="2. How We Use Your Information">
            <VAList items={[
              "Restore your Policy Form and calculations automatically in the same browser",
              "Generate your educational LTC Strategy from non-identifying coverage and care selections",
              "Provide an AI support chat in response to questions you choose to submit",
              "Generate your original 18-page PDF when you request it",
              "Email your PDF only to recipients you specify, with temporary testing BCC disclosed before submission",
              "Respond to your voluntary Contact Us inquiries",
            ]} />
            <P>Information entered in the public Policy Form is not automatically transmitted to our team, Zapier, or a claim management database. We do not sell this information for advertising.</P>
          </Section>

          <Section title="3. Data Storage and Security">
            <P>Draft Policy Form answers, Additional Notes, care-calculator drafts, checklist progress, and strategy progress are stored automatically in your browser's persistent local storage. This storage is not an encrypted backup and can be accessible to others who use the same browser or device. We recommend using a private, password-protected device for health-related information.</P>
            <P>Progress normally returns when you revisit in the same browser. Clearing website data, private browsing, browser restrictions, or switching devices may erase or prevent restoration. The Clear All Data control deletes this public portal's locally stored drafts.</P>
            <P>The public flow does not create a long-term server record of these drafts or completed PDFs. Strategy generation, PDF generation, and email delivery can temporarily process information on servers or service providers when you explicitly use those functions. Earlier authenticated portal records, if any, are not deleted or silently migrated by this change.</P>
            <P>We use HTTPS for transmission where deployed securely. No method of electronic processing or storage is perfectly secure.</P>
          </Section>

          <Section title="4. Third-Party Services">
            <VAList items={[
              "<strong>AI processing provider</strong> — processes approved, non-identifying coverage and care selections to generate the Strategy, and processes questions deliberately submitted to Support Chat",
              "<strong>Email delivery provider</strong> — sends requested PDF reports and Contact Us replies, and may retain copies or delivery logs under its own terms",
              "<strong>Infrastructure provider</strong> — hosts the website, processes temporary PDF rendering, and supports service security",
            ]} />
            <P>AI prompts and chat messages may be processed outside your browser. The portal does not automatically send your personal Additional Notes or your saved chat history with policy data. Do not type names, policy numbers, claim numbers or detailed private medical records into Support Chat.</P>
            <P>When testing BCC is enabled, an additional copy of an emailed PDF is sent to daniel@scvisitingangels.com. This is disclosed in the sending interface. BCC recipients are hidden from other recipients, but are not hidden from the sender or the email service. Email providers and recipients may retain copies after sending.</P>
          </Section>

          <Section title="5. Cookies and Session Data">
            <P>The portal uses browser local storage to remember the accepted Terms of Use and silently restore your form. Account registration and sign-in are not required in the public flow. Browser features and infrastructure services may still use essential technical cookies or security signals. We do not intentionally use advertising cookies to profile your insurance details.</P>
          </Section>

          <Section title="6. Your Rights">
            <VAList items={[
              "Clear public Policy Form, calculator, and strategy progress through the Clear All Data control on the Policy Form",
              "Stop using optional AI chat and PDF email delivery at any time",
              "Request information about separately submitted contact messages and emailed reports",
              "Request correction or deletion of records retained by our office, subject to applicable retention obligations",
            ]} />
            <P>To learn about contact or email records or request assistance, use the Contact Us page or call our office. Browser-local drafts are under the control of the person using that browser; we cannot retrieve them from our servers.</P>
          </Section>

          <Section title="7. Children's Privacy">
            <P>
              The Site is intended for use by adults managing long-term care insurance matters. We do not knowingly
              collect personal information from children under the age of 13.
            </P>
          </Section>

          <Section title="8. Changes to This Policy">
            <P>
              We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date
              at the top of this page. Continued use of the Site after any changes constitutes acceptance of the revised policy.
            </P>
          </Section>

          <Section title="9. Contact Us">
            <P>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:</P>
            <div className="rounded border p-5 text-sm space-y-1" style={{ background: VA_GREY_BG, borderColor: '#d8d4d4', fontFamily: "'Open Sans', sans-serif" }}>
              <p className="font-bold" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>SC Visiting Angels</p>
              <p style={{ color: VA_BODY }}>Greenville, South Carolina</p>
              <p style={{ color: VA_BODY }}>
                Phone:{" "}
                <a href="tel:+18642446300" className="hover:underline font-semibold" style={{ color: VA_TEAL }}>(864) 244-6300</a>
              </p>
              <p style={{ color: VA_BODY }}>
                Website:{" "}
                <a href="https://www.scvisitingangels.com" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: VA_TEAL }}>
                  www.scvisitingangels.com
                </a>
              </p>
            </div>
          </Section>
        </div>
      </section>
    </Layout>
  );
}
