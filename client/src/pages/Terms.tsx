import { Layout } from "@/components/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-navy mb-3">Terms of Use & Disclaimer</h1>
          <p className="text-slate-500 text-sm">Last updated: June 2026 · SC Visiting Angels, Columbia, SC</p>
        </div>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          {/* Educational Purpose */}
          <section className="bg-teal-50 border border-teal-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-teal-800 mb-3">📚 Educational Purpose Only</h2>
            <p>
              This website, the LTC Insurance Navigator tool, all guides, checklists, timelines, calculators, and
              any other content provided by SC Visiting Angels (hereinafter "the Company") are provided
              <strong> solely for educational and informational purposes</strong>. Nothing on this website
              constitutes legal advice, financial advice, medical advice, or insurance advice.
            </p>
            <p className="mt-3">
              The information presented is intended to help individuals and families better understand
              long-term care insurance concepts and the general claims process. Individual policies, carriers,
              and circumstances vary significantly. Always consult with a licensed insurance professional,
              attorney, or financial advisor before making any decisions based on information found on this site.
            </p>
          </section>

          {/* No Guarantees */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-amber-800 mb-3">⚠️ No Guarantees of Outcome</h2>
            <p>
              SC Visiting Angels makes <strong>no representations, warranties, or guarantees</strong> — express
              or implied — regarding the accuracy, completeness, timeliness, or suitability of any information
              on this site. The Company does not guarantee that following any strategy, checklist, or
              recommendation on this site will result in approval of an LTC insurance claim.
            </p>
            <p className="mt-3">
              Insurance claim outcomes depend entirely on the specific terms of the individual's policy,
              the carrier's determination, the claimant's medical condition, and many other factors outside
              the Company's control. Past results do not guarantee future outcomes.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-red-800 mb-3">🛡️ Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, SC Visiting Angels, its owners, employees,
              agents, and affiliates shall <strong>not be liable</strong> for any direct, indirect, incidental,
              special, consequential, or punitive damages arising from:
            </p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                "Your use of, or inability to use, this website or its tools",
                "Any errors, omissions, or inaccuracies in the content",
                "Any decisions made based on information found on this site",
                "Denial of an LTC insurance claim",
                "Any loss of data, revenue, or profits",
                "Any third-party conduct or content linked from this site",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-red-400 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Not a Licensed Insurance Agency */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">🏢 Not a Licensed Insurance Agency</h2>
            <p>
              SC Visiting Angels is a <strong>licensed home care agency</strong>, not a licensed insurance
              agency, broker, or financial advisor. The Company does not sell, underwrite, or administer
              insurance policies. All references to specific insurance carriers, policy types, or benefit
              structures are for illustrative and educational purposes only.
            </p>
            <p className="mt-3">
              For questions about your specific policy, contact your insurance carrier directly or consult
              a licensed insurance professional.
            </p>
          </section>

          {/* Privacy & Data */}
          <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-blue-800 mb-3">🔒 Privacy & Data Use</h2>
            <p>
              Unsubmitted Policy Form drafts remain stored on your device. When you generate a Strategy
              or PDF, selected coverage and care information may be processed by an AI or PDF service,
              and a support copy of the completed output and structured selections is emailed to
              SC Visiting Angels to help with follow-up questions. Optional personal notes remain local
              unless you deliberately share them elsewhere. We do not sell this information for marketing.
            </p>
            <p className="mt-3">
              Browsing the portal does not enroll you in follow-up calls or messages. If you voluntarily
              submit a Contact Us or Education question form, we may reply using the contact details you
              provide. When you request PDF email delivery, the report is sent to the designated recipient
              and the disclosed testing BCC if enabled. For privacy questions, contact
              <a href="mailto:info@scvisitingangels.com" className="text-blue-700 underline">info@scvisitingangels.com</a>.
            </p>
          </section>

          {/* Acceptance */}
          <section className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-green-800 mb-3">✅ Acceptance of Terms</h2>
            <p>
              By accessing or using this website and its tools, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Use. If you do not agree with any
              part of these terms, please discontinue use of this website immediately.
            </p>
            <p className="mt-3">
              SC Visiting Angels reserves the right to modify these Terms of Use at any time without
              prior notice. Continued use of the website following any changes constitutes acceptance
              of the revised terms.
            </p>
          </section>

          {/* Contact */}
          <section className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Questions about these terms? Contact us at{" "}
              <a href="mailto:info@scvisitingangels.com" className="text-teal-600 hover:underline">
                info@scvisitingangels.com
              </a>{" "}
              or call{" "}
              <a href="tel:8642446300" className="text-teal-600 hover:underline">
                (864) 244-6300
              </a>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              SC Visiting Angels · Columbia, SC · scvisitingangels.com
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
