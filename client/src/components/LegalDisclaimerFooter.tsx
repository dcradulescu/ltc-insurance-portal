import React from 'react';

export function LegalDisclaimerFooter() {
  return (
    <footer className="py-8 px-4" style={{ background: '#2e3338', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Main Disclaimer */}
          <div>
            <h3
              className="font-bold text-base mb-3"
              style={{ fontFamily: "'Roboto', sans-serif", color: '#34B1C4' }}
            >
              Important Legal Disclaimer
            </h3>
            <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: "'Open Sans', sans-serif", color: 'rgba(255,255,255,0.65)' }}>
              This website and all materials provided are for <strong className="text-white/80">informational and educational purposes only</strong>.
              They are not legal advice, medical advice, or a guarantee of insurance benefits.
            </p>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: 'rgba(255,255,255,0.65)' }}>
              <strong className="text-white/80">Each situation is unique.</strong> Individual circumstances, insurance policies, coverage limits,
              and claim requirements vary significantly by carrier and policy. We strongly recommend consulting with your
              insurance carrier directly to confirm all details specific to your policy.
            </p>
          </div>

          {/* Right Column - Visiting Angels Disclaimer */}
          <div>
            <h3
              className="font-bold text-base mb-3"
              style={{ fontFamily: "'Roboto', sans-serif", color: '#34B1C4' }}
            >
              SC Visiting Angels Disclaimer
            </h3>
            <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: "'Open Sans', sans-serif", color: 'rgba(255,255,255,0.65)' }}>
              SC Visiting Angels is not responsible for the accuracy, completeness, or applicability of any information
              provided on this website or in any strategy documents generated.
            </p>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: 'rgba(255,255,255,0.65)' }}>
              <strong className="text-white/80">No guarantee of benefits.</strong> Claim approval is never guaranteed. Insurance carriers make
              independent determinations based on policy terms, medical necessity, and other factors beyond our control.
            </p>
          </div>
        </div>

        {/* Professional Consultation */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="rounded px-4 py-3 mb-6" style={{ background: 'rgba(52,177,196,0.12)', borderLeft: '3px solid #34B1C4' }}>
            <p className="text-sm" style={{ fontFamily: "'Open Sans', sans-serif", color: 'rgba(255,255,255,0.75)' }}>
              <strong className="text-white/90">Professional Consultation Recommended:</strong> For complex situations, we recommend consulting with
              an elder law attorney, financial advisor, insurance professional, or your insurance carrier's claims department
              who can review your specific policy and circumstances.
            </p>
          </div>

          {/* Footer Info */}
          <div className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Open Sans', sans-serif" }}>
            <p>
              © {new Date().getFullYear()} SC Visiting Angels. All rights reserved.&nbsp;|&nbsp;
              <span>This is a confidential document intended for personal use only.</span>
            </p>
            <p className="mt-2">
              For questions about SC Visiting Angels home care services, visit{' '}
              <a
                href="https://www.visitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-white/80"
                style={{ color: '#34B1C4' }}
              >
                www.visitingangels.com
              </a>
              {' '}or{' '}
              <a
                href="https://www.scvisitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-white/80"
                style={{ color: '#34B1C4' }}
              >
                www.scvisitingangels.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
