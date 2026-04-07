import { storagePut } from "./storage";
import { convertHtmlToPdf } from "./pdfConverter";

// Visiting Angels brand colors
const VA_NAVY = "#003366";
const VA_GOLD = "#FDB913";
const VA_LIGHT_BLUE = "#0099CC";
const VA_LIGHT_BG = "#F0F0F0";

interface StrategyPdfData {
  insuredName: string;
  policyNumber: string;
  carrierName: string;
  dailyMaximum: number;
  monthlyMaximum: number;
  lifetimeMaximum: number;
  diagnosis: string;
  adlLimitations: string[];
  stage1Tasks: string[];
  stage2Tasks: string[];
  stage3Tasks: string[];
  careRecommendations: string;
  strategyContent: string;
}

export async function generateStrategyPdf(data: StrategyPdfData): Promise<{ url: string; key: string }> {
  const html = generateStrategyHtml(data);
  const pdfBuffer = await convertHtmlToPdf(html);
  
  const fileName = `LTC-Strategy-${data.insuredName.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  const result = await storagePut(
    `strategies/${fileName}`,
    pdfBuffer,
    "application/pdf"
  );

  return result;
}

function generateStrategyHtml(data: StrategyPdfData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LTC Insurance Strategy - ${data.insuredName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      background: white;
    }
    
    .page {
      page-break-after: always;
      padding: 40px;
      min-height: 11in;
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    /* Header */
    .header {
      text-align: center;
      border-bottom: 3px solid ${VA_GOLD};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: ${VA_NAVY};
      font-size: 28px;
      margin-bottom: 5px;
    }
    
    .header .tagline {
      color: ${VA_GOLD};
      font-size: 24px;
      font-weight: bold;
    }
    
    /* Title Page */
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 11in;
    }
    
    .title-page h1 {
      color: ${VA_NAVY};
      font-size: 48px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    
    .title-page h2 {
      color: ${VA_GOLD};
      font-size: 42px;
      margin-bottom: 60px;
      font-weight: bold;
    }
    
    .title-page .info {
      font-size: 16px;
      margin: 10px 0;
      color: #333;
    }
    
    .title-page .footer-info {
      margin-top: 100px;
      font-size: 12px;
      color: ${VA_LIGHT_BLUE};
      font-style: italic;
    }
    
    /* Sections */
    h2 {
      color: ${VA_NAVY};
      font-size: 24px;
      margin-top: 30px;
      margin-bottom: 20px;
      border-bottom: 2px solid ${VA_GOLD};
      padding-bottom: 10px;
    }
    
    h3 {
      color: ${VA_LIGHT_BLUE};
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section p {
      margin-bottom: 15px;
      text-align: justify;
    }
    
    /* Highlights */
    .highlight-box {
      background: #F0F8FF;
      border-left: 4px solid ${VA_GOLD};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .highlight-box strong {
      color: ${VA_GOLD};
    }
    
    /* Lists */
    ul, ol {
      margin: 15px 0 15px 40px;
    }
    
    li {
      margin-bottom: 10px;
    }
    
    /* Benefits Summary */
    .benefits-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    
    .benefit-card {
      background: ${VA_LIGHT_BG};
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid ${VA_LIGHT_BLUE};
    }
    
    .benefit-card .label {
      font-weight: 600;
      color: ${VA_NAVY};
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .benefit-card .value {
      font-size: 20px;
      font-weight: bold;
      color: ${VA_GOLD};
    }
    
    /* Stage Boxes */
    .stage-box {
      background: ${VA_LIGHT_BG};
      border: 2px solid ${VA_NAVY};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .stage-box h3 {
      color: ${VA_NAVY};
      margin-top: 0;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .stage-box .description {
      font-style: italic;
      color: #666;
      margin-bottom: 15px;
      font-size: 14px;
    }
    
    .stage-box ul {
      margin-left: 20px;
    }
    
    .stage-box li {
      margin-bottom: 8px;
    }
    
    /* Checklist */
    .checklist {
      margin: 20px 0;
    }
    
    .checklist-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding: 10px;
      background: #fafafa;
      border-radius: 4px;
    }
    
    .checklist-item input[type="checkbox"] {
      margin-right: 15px;
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: ${VA_GOLD};
    }
    
    /* Home Care Section */
    .home-care-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    
    .care-type {
      background: #E8F4F8;
      padding: 15px;
      border-radius: 4px;
      border-top: 3px solid ${VA_LIGHT_BLUE};
    }
    
    .care-type h4 {
      color: ${VA_GOLD};
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .care-type p {
      font-size: 13px;
      color: #333;
      margin: 0;
    }
    
    /* Disclaimers */
    .disclaimer-section {
      background: #FFE6E6;
      border: 2px solid #CC0000;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .disclaimer-section h3 {
      color: #CC0000;
      margin-top: 0;
    }
    
    .disclaimer-section p {
      margin-bottom: 15px;
      font-size: 13px;
      line-height: 1.5;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #999;
    }
    
    /* Print Styles */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .page {
        page-break-after: always;
        padding: 40px;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <!-- Title Page -->
  <div class="page title-page">
    <h1>PERSONALIZED LTC INSURANCE</h1>
    <h2>CLAIM STRATEGY GUIDE</h2>
    
    <div style="margin-top: 60px;">
      <div class="info"><strong>For:</strong> ${data.insuredName}</div>
      <div class="info"><strong>Policy Number:</strong> ${data.policyNumber}</div>
      <div class="info"><strong>Carrier:</strong> ${data.carrierName}</div>
    </div>
    
    <div class="footer-info">
      <p>Prepared by Visiting Angels</p>
      <p>Compassionate In-Home Senior Care</p>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
  
  <!-- Executive Summary -->
  <div class="page">
    <h2>Executive Summary</h2>
    
    <div class="section">
      <p>This personalized strategy guide has been created specifically for <strong>${data.insuredName}</strong> to help navigate the long-term care insurance claim process. This document outlines a comprehensive three-stage approach designed to maximize benefits, minimize claim denials, and ensure seamless access to quality home care services.</p>
      
      <h3>Key Benefits Summary</h3>
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="label">Daily Maximum</div>
          <div class="value">$${data.dailyMaximum.toLocaleString()}</div>
        </div>
        <div class="benefit-card">
          <div class="label">Monthly Maximum</div>
          <div class="value">$${data.monthlyMaximum.toLocaleString()}</div>
        </div>
      </div>
      <div class="benefit-card" style="grid-column: 1 / -1;">
        <div class="label">Lifetime Maximum</div>
        <div class="value">$${data.lifetimeMaximum.toLocaleString()}</div>
      </div>
    </div>
  </div>
  
  <!-- Policy Overview -->
  <div class="page">
    <h2>Policy Overview</h2>
    
    <h3>Insured Information</h3>
    <div class="highlight-box">
      <p><strong>Name:</strong> ${data.insuredName}</p>
      <p><strong>Policy Number:</strong> ${data.policyNumber}</p>
      <p><strong>Insurance Carrier:</strong> ${data.carrierName}</p>
    </div>
    
    <h3>Coverage Details</h3>
    <div class="highlight-box">
      <p><strong>Daily Maximum Benefit:</strong> $${data.dailyMaximum.toLocaleString()}</p>
      <p><strong>Monthly Maximum Benefit:</strong> $${data.monthlyMaximum.toLocaleString()}</p>
      <p><strong>Lifetime Maximum Benefit:</strong> $${data.lifetimeMaximum.toLocaleString()}</p>
    </div>
  </div>
  
  <!-- Care Recommendations -->
  <div class="page">
    <h2>Care Recommendations</h2>
    
    <h3>Primary Diagnosis</h3>
    <p><strong>${data.diagnosis}</strong></p>
    
    <h3>ADL Limitations</h3>
    <ul>
      ${data.adlLimitations.map(adl => `<li>${adl}</li>`).join('')}
    </ul>
    
    <h3>Recommended Care Plan</h3>
    <p>${data.careRecommendations}</p>
  </div>
  
  <!-- Three-Stage Strategy -->
  <div class="page">
    <h2>Three-Stage Strategy</h2>
    
    <div class="stage-box">
      <h3>Stage 1: Prior to Claim Submission</h3>
      <div class="description">Critical preparation phase to gather documentation and establish medical necessity.</div>
      <ul>
        ${data.stage1Tasks.map(task => `<li>${task}</li>`).join('')}
      </ul>
    </div>
  </div>
  
  <div class="page">
    <div class="stage-box">
      <h3>Stage 2: Claim Submission</h3>
      <div class="description">Formal submission of claim with all required documentation in a single packet.</div>
      <ul>
        ${data.stage2Tasks.map(task => `<li>${task}</li>`).join('')}
      </ul>
    </div>
    
    <div class="stage-box">
      <h3>Stage 3: Post-Approval</h3>
      <div class="description">Management of ongoing benefits, invoicing, and documentation requirements.</div>
      <ul>
        ${data.stage3Tasks.map(task => `<li>${task}</li>`).join('')}
      </ul>
    </div>
  </div>
  
  <!-- Home Care Options -->
  <div class="page">
    <h2>Home Care Options with Visiting Angels</h2>
    
    <p>Visiting Angels offers a comprehensive range of home care services tailored to your specific needs:</p>
    
    <div class="home-care-grid">
      <div class="care-type">
        <h4>Companion Care</h4>
        <p>Non-medical assistance with daily activities, errands, and social engagement.</p>
      </div>
      <div class="care-type">
        <h4>Personal Care</h4>
        <p>Assistance with bathing, dressing, grooming, and personal hygiene.</p>
      </div>
      <div class="care-type">
        <h4>Specialized Care</h4>
        <p>Specialized services for Alzheimer's, dementia, Parkinson's, and end-of-life care.</p>
      </div>
      <div class="care-type">
        <h4>24-Hour Care</h4>
        <p>Round-the-clock care and live-in options for comprehensive support.</p>
      </div>
    </div>
    
    <div class="highlight-box">
      <p><strong>To get started with Visiting Angels home care services:</strong></p>
      <p>Call: 1-800-365-4189<br>
      Website: www.visitingangels.com<br>
      SC Location: www.scvisitingangels.com</p>
    </div>
  </div>
  
  <!-- Legal Disclaimers -->
  <div class="page">
    <h2>Legal Disclaimers & Important Information</h2>
    
    <div class="disclaimer-section">
      <h3>IMPORTANT: PLEASE READ CAREFULLY</h3>
      <p>This document is provided for informational and educational purposes only. It is not legal advice, medical advice, or a guarantee of insurance benefits. Each situation is unique and individual circumstances may vary significantly.</p>
    </div>
    
    <h3>Visiting Angels Disclaimer</h3>
    <p>Visiting Angels is not responsible for the accuracy, completeness, or applicability of this strategy guide. Insurance policies, coverage limits, and claim requirements vary by carrier and policy. We strongly recommend consulting with your insurance carrier directly to confirm all details and requirements specific to your policy.</p>
    
    <h3>No Guarantee of Benefits</h3>
    <p>This guide does not guarantee approval of your claim or payment of benefits. Insurance carriers make independent determinations based on policy terms, medical necessity, and other factors. Claim approval is never guaranteed.</p>
    
    <h3>Professional Consultation Recommended</h3>
    <p>For complex situations, we recommend consulting with an elder law attorney, financial advisor, or insurance professional who can review your specific policy and circumstances.</p>
    
    <h3>Limitation of Liability</h3>
    <p>Visiting Angels and its representatives shall not be liable for any damages, losses, or claims arising from the use or reliance on this document, including but not limited to direct, indirect, incidental, consequential, or punitive damages.</p>
    
    <div class="footer">
      <p>Generated: ${new Date().toLocaleDateString()} | This is a confidential document intended for the use of the named individual only.</p>
      <p>© ${new Date().getFullYear()} Visiting Angels. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
