import { Layout } from "@/components/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a3a4a] to-[#2c5060] text-white py-14">
        <div className="container max-w-3xl">
          <p className="text-teal text-xs uppercase tracking-widest font-semibold mb-3">Legal</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-white/70 text-sm">Effective Date: June 1, 2025 &nbsp;·&nbsp; Last Updated: June 1, 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container max-w-3xl">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 text-base leading-relaxed mb-8">
              SC Visiting Angels ("we," "us," or "our") operates the LTC Insurance Navigator at{" "}
              <a href="https://ltcportal.manus.space" className="text-teal hover:underline">ltcportal.manus.space</a>{" "}
              (the "Site"). This Privacy Policy explains how we collect, use, and protect information you provide when using the Site.
              By using the Site, you agree to the practices described in this policy.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">1. Information We Collect</h2>
            <p className="text-slate-600 mb-4">
              We collect information you voluntarily provide through the Policy Intake Form, including:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-1 mb-4">
              <li>Name, email address, and phone number of the insured person</li>
              <li>Insurance carrier name, policy number, and coverage details</li>
              <li>Medical information including diagnoses, ADL limitations, and care needs</li>
              <li>Contact information for care providers and family members</li>
            </ul>
            <p className="text-slate-600 mb-4">
              We also collect limited technical data automatically, including your browser type and approximate geographic region,
              solely for the purpose of improving site performance. We do not use tracking cookies or advertising pixels.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">2. How We Use Your Information</h2>
            <p className="text-slate-600 mb-4">We use the information you provide to:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-1 mb-4">
              <li>Generate your personalized LTC insurance claim strategy</li>
              <li>Deliver your strategy document by email when requested</li>
              <li>Send you a "Save &amp; Resume" link to restore your form progress</li>
              <li>Contact you in response to inquiries submitted through the Contact form</li>
              <li>Notify our team of new form submissions so we can provide follow-up support</li>
            </ul>
            <p className="text-slate-600 mb-4">
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">3. Data Storage and Security</h2>
            <p className="text-slate-600 mb-4">
              Form data you enter is stored in your browser's local storage and, when you use the Save &amp; Resume feature,
              in our secure database. We use industry-standard encryption (TLS/HTTPS) for all data in transit.
              Stored data is retained for up to 90 days unless you request earlier deletion.
            </p>
            <p className="text-slate-600 mb-4">
              While we take reasonable precautions to protect your information, no method of electronic transmission
              or storage is 100% secure. We encourage you to avoid entering sensitive financial account numbers
              or Social Security numbers into the form.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">4. Third-Party Services</h2>
            <p className="text-slate-600 mb-4">
              We use the following third-party services to operate the Site:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-1 mb-4">
              <li><strong>Zapier</strong> — used to route form submission notifications to our team's email</li>
              <li><strong>Manus Platform</strong> — provides hosting, database, and AI strategy generation infrastructure</li>
            </ul>
            <p className="text-slate-600 mb-4">
              These services receive only the data necessary to perform their function and are bound by their own privacy policies.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">5. Cookies and Session Data</h2>
            <p className="text-slate-600 mb-4">
              The Site uses a single session cookie to remember that you have accepted the Terms of Use during your visit.
              This cookie does not contain personally identifiable information and is cleared when you close your browser.
              We do not use analytics cookies, advertising cookies, or cross-site tracking.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">6. Your Rights</h2>
            <p className="text-slate-600 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-1 mb-4">
              <li>Request a copy of the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data from our systems</li>
              <li>Withdraw consent at any time by ceasing use of the Site</li>
            </ul>
            <p className="text-slate-600 mb-4">
              To exercise any of these rights, please contact us at the information below.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">7. Children's Privacy</h2>
            <p className="text-slate-600 mb-4">
              The Site is intended for use by adults managing long-term care insurance matters. We do not knowingly
              collect personal information from children under the age of 13.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">8. Changes to This Policy</h2>
            <p className="text-slate-600 mb-4">
              We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date
              at the top of this page. Continued use of the Site after any changes constitutes acceptance of the revised policy.
            </p>

            <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">9. Contact Us</h2>
            <p className="text-slate-600 mb-4">
              If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:
            </p>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-slate-700 text-sm space-y-1">
              <p className="font-semibold text-slate-900">SC Visiting Angels</p>
              <p>Greenville, South Carolina</p>
              <p>
                Phone:{" "}
                <a href="tel:+18642446300" className="text-teal hover:underline">(864) 244-6300</a>
              </p>
              <p>
                Website:{" "}
                <a href="https://www.scvisitingangels.com" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                  www.scvisitingangels.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
