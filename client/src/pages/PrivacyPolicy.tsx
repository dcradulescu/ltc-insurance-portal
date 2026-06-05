import { Layout } from "@/components/Layout";

const VA_TEAL = "#34B1C4";
const VA_CHARCOAL = "#393F43";
const VA_GREY_BG = "#ECE8E8";
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
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif" }}>Privacy Policy</h1>
          <p className="text-white/85 text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>Effective Date: June 1, 2025 &nbsp;·&nbsp; Last Updated: June 1, 2025</p>
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
            <a href="https://ltcportal.manus.space" className="hover:underline font-semibold" style={{ color: VA_TEAL }}>ltcportal.manus.space</a>{" "}
            (the "Site"). This Privacy Policy explains how we collect, use, and protect information you provide when using the Site.
            By using the Site, you agree to the practices described in this policy.
          </P>

          <Section title="1. Information We Collect">
            <P>We collect information you voluntarily provide through the Policy Intake Form, including:</P>
            <VAList items={[
              "Name, email address, and phone number of the insured person",
              "Insurance carrier name, policy number, and coverage details",
              "Medical information including diagnoses, ADL limitations, and care needs",
              "Contact information for care providers and family members",
            ]} />
            <P>
              We also collect limited technical data automatically, including your browser type and approximate geographic region,
              solely for the purpose of improving site performance. We do not use tracking cookies or advertising pixels.
            </P>
          </Section>

          <Section title="2. How We Use Your Information">
            <P>We use the information you provide to:</P>
            <VAList items={[
              "Generate your personalized LTC insurance claim strategy",
              "Deliver your strategy document by email when requested",
              "Send you a \"Save &amp; Resume\" link to restore your form progress",
              "Contact you in response to inquiries submitted through the Contact form",
              "Notify our team of new form submissions so we can provide follow-up support",
            ]} />
            <P>We do not sell, rent, or share your personal information with third parties for marketing purposes.</P>
          </Section>

          <Section title="3. Data Storage and Security">
            <P>
              Form data you enter is stored in your browser's local storage and, when you use the Save &amp; Resume feature,
              in our secure database. We use industry-standard encryption (TLS/HTTPS) for all data in transit.
              Stored data is retained for up to 90 days unless you request earlier deletion.
            </P>
            <P>
              While we take reasonable precautions to protect your information, no method of electronic transmission
              or storage is 100% secure. We encourage you to avoid entering sensitive financial account numbers
              or Social Security numbers into the form.
            </P>
          </Section>

          <Section title="4. Third-Party Services">
            <P>We use the following third-party services to operate the Site:</P>
            <VAList items={[
              "<strong>Zapier</strong> — used to route form submission notifications to our team's email",
              "<strong>Manus Platform</strong> — provides hosting, database, and AI strategy generation infrastructure",
            ]} />
            <P>These services receive only the data necessary to perform their function and are bound by their own privacy policies.</P>
          </Section>

          <Section title="5. Cookies and Session Data">
            <P>
              The Site uses a single session cookie to remember that you have accepted the Terms of Use during your visit.
              This cookie does not contain personally identifiable information and is cleared when you close your browser.
              We do not use analytics cookies, advertising cookies, or cross-site tracking.
            </P>
          </Section>

          <Section title="6. Your Rights">
            <P>You have the right to:</P>
            <VAList items={[
              "Request a copy of the personal information we hold about you",
              "Request correction of inaccurate information",
              "Request deletion of your data from our systems",
              "Withdraw consent at any time by ceasing use of the Site",
            ]} />
            <P>To exercise any of these rights, please contact us at the information below.</P>
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
