import React from 'react';

export function LegalDisclaimerFooter() {
  return (
    <footer className="bg-red-50 border-t-2 border-red-200 py-8 px-4 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Main Disclaimer */}
          <div>
            <h3 className="text-red-700 font-bold text-lg mb-3">⚠️ Important Legal Disclaimer</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              This website and all materials provided are for <strong>informational and educational purposes only</strong>. 
              They are not legal advice, medical advice, or a guarantee of insurance benefits.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Each situation is unique.</strong> Individual circumstances, insurance policies, coverage limits, 
              and claim requirements vary significantly by carrier and policy. We strongly recommend consulting with your 
              insurance carrier directly to confirm all details specific to your policy.
            </p>
          </div>

          {/* Right Column - Visiting Angels Disclaimer */}
          <div>
            <h3 className="text-red-700 font-bold text-lg mb-3">SC Visiting Angels Disclaimer</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              SC Visiting Angels is not responsible for the accuracy, completeness, or applicability of any information 
              provided on this website or in any strategy documents generated.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>No guarantee of benefits.</strong> Claim approval is never guaranteed. Insurance carriers make 
              independent determinations based on policy terms, medical necessity, and other factors beyond our control.
            </p>
          </div>
        </div>

        {/* Bottom Section - Professional Consultation */}
        <div className="mt-6 pt-6 border-t border-red-200">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-gray-800">
              <strong>Professional Consultation Recommended:</strong> For complex situations, we recommend consulting with 
              an elder law attorney, financial advisor, insurance professional, or your insurance carrier's claims department 
              who can review your specific policy and circumstances.
            </p>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-xs text-gray-600">
            <p>
              © {new Date().getFullYear()} SC Visiting Angels. All rights reserved. | 
              <span className="mx-2">This is a confidential document intended for personal use only.</span>
            </p>
            <p className="mt-2">
              For questions about SC Visiting Angels home care services, visit{' '}
              <a 
                href="https://www.visitingangels.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                www.visitingangels.com
              </a>
              {' '}or{' '}
              <a 
                href="https://www.scvisitingangels.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
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
