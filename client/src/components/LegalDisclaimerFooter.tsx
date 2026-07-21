import React from 'react';

export function LegalDisclaimerFooter() {
  return (
    <footer className="py-section" style={{ background: '#ffffff', borderTop: '1px solid #e8e8e8' }}>
      <div className="container">

        {/* Two disclaimer cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Card - Main Disclaimer */}
          <div
            className="rounded-lg p-5"
            style={{
              background: '#fffde7',
              border: '1px solid #f9c2c2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            }}
          >
            <h3
              className="font-bold text-base mb-3"
              style={{ fontFamily: "'Roboto', sans-serif", color: '#34B1C4' }}
            >
              Important Legal Disclaimer
            </h3>
            <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: "'Open Sans', sans-serif", color: '#555' }}>
              This website and all materials provided are for <strong style={{ color: '#333' }}>informational and educational purposes only</strong>.
              They are not legal advice, medical advice, or a guarantee of insurance benefits.
            </p>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: '#555' }}>
              <strong style={{ color: '#333' }}>Each situation is unique.</strong> Individual circumstances, insurance policies, coverage limits,
              and claim requirements vary significantly by carrier and policy. We strongly recommend consulting with your
              insurance carrier directly to confirm all details specific to your policy.
            </p>
          </div>

          {/* Right Card - SC Visiting Angels Disclaimer */}
          <div
            className="rounded-lg p-5"
            style={{
              background: '#fffde7',
              border: '1px solid #f9c2c2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            }}
          >
            <h3
              className="font-bold text-base mb-3"
              style={{ fontFamily: "'Roboto', sans-serif", color: '#34B1C4' }}
            >
              SC Visiting Angels Disclaimer
            </h3>
            <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: "'Open Sans', sans-serif", color: '#555' }}>
              SC Visiting Angels is not responsible for the accuracy, completeness, or applicability of any information
              provided on this website or in any strategy documents generated.
            </p>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: '#555' }}>
              <strong style={{ color: '#333' }}>No guarantee of benefits.</strong> Claim approval is never guaranteed. Insurance carriers make
              independent determinations based on policy terms, medical necessity, and other factors beyond our control.
            </p>
          </div>
        </div>

        {/* Professional Consultation — pastel pink, dashed red border, shadow */}
        <div
          className="rounded-lg px-5 py-4"
          style={{
            background: '#fff0f3',
            border: '1.5px dashed #e57373',
            boxShadow: '0 2px 10px rgba(229,115,115,0.12)',
          }}
        >
          <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: '#555' }}>
            <strong style={{ color: '#c62828' }}>Professional Consultation Recommended:</strong> For complex situations, we recommend consulting with
            an elder law attorney, financial advisor, insurance professional, or your insurance carrier's claims department
            who can review your specific policy and circumstances.
          </p>
        </div>
      </div>
    </footer>
  );
}
