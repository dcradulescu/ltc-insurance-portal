import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { trpc } from '@/lib/trpc';

interface PdfDeliveryPanelProps {
  policyData: {
    // Insured
    insuredName: string;
    insuredDob?: string;
    insuredPhone?: string;
    insuredEmail?: string;
    insuredAddress?: string;
    // Policy
    policyNumber: string;
    claimNumber?: string;
    carrierName: string;
    carrierPhone?: string;
    // Coverage
    eliminationPeriod?: string;
    dailyMaximum: number;
    monthlyMaximum: number;
    lifetimeMaximum: number;
    minAdlsRequired?: number;
    waiverOfPremium?: string;
    assignmentOfBenefits?: string;
    // Qualifying
    adlLimitations: string[];
    diagnosisCheckboxes?: string[];
    cognitiveImpairmentTrigger?: string;
    // Tasks
    stage1Tasks: string[];
    stage2Tasks: string[];
    stage3Tasks: string[];
    // Extra
    careRecommendations: string;
    strategyContent: string;
    diagnosis?: string;
    caseManagerName?: string;
    thirdPartyAssessmentRequired?: string;
  };
}

// Brand colors
const VA_NAVY = [0, 51, 102] as const;
const VA_GOLD = [253, 185, 19] as const;
const VA_LIGHT_BLUE = [0, 153, 204] as const;

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function generatePdfDocument(data: PdfDeliveryPanelProps['policyData']): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
  }

  function drawHeader() {
    doc.setFillColor(...VA_NAVY);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('LTC NAVIGATOR', margin, 12);
    doc.setFont('helvetica', 'normal');
    doc.text('Powered by Visiting Angels', pageWidth - margin, 12, { align: 'right' });
    doc.setDrawColor(...VA_GOLD);
    doc.setLineWidth(1);
    doc.line(0, 18, pageWidth, 18);
    y = 28;
  }

  function drawFooter(pageNum: number) {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Confidential - For Personal Use Only', pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  function sectionTitle(title: string) {
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.setTextColor(...VA_NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(...VA_GOLD);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;
  }

  function subTitle(title: string) {
    checkPageBreak(12);
    doc.setFontSize(12);
    doc.setTextColor(...VA_LIGHT_BLUE);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 7;
  }

  function bodyText(text: string, indent = 0) {
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, margin + indent, y);
      y += 5;
    }
    y += 2;
  }

  function bulletList(items: string[], indent = 5) {
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'normal');
    for (const item of items) {
      const lines = doc.splitTextToSize(item, contentWidth - indent - 5);
      checkPageBreak(lines.length * 5 + 3);
      doc.setFillColor(...VA_GOLD);
      doc.circle(margin + indent, y - 1.5, 1, 'F');
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], margin + indent + 4, y);
        y += 5;
      }
      y += 1;
    }
    y += 2;
  }

  function highlightBox(lines: string[]) {
    const boxHeight = lines.length * 6 + 10;
    checkPageBreak(boxHeight);
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, y - 3, contentWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(...VA_GOLD);
    doc.setLineWidth(0.8);
    doc.line(margin, y - 3, margin, y - 3 + boxHeight);
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    y += 3;
    for (const line of lines) {
      doc.text(line, margin + 6, y);
      y += 6;
    }
    y += 5;
  }

  function stageBox(title: string, description: string, tasks: string[]) {
    const estimatedHeight = 20 + tasks.length * 8;
    checkPageBreak(Math.min(estimatedHeight, 60));
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(...VA_NAVY);
    doc.setLineWidth(0.5);
    const boxY = y - 3;
    // Draw title bar
    doc.setFillColor(...VA_NAVY);
    doc.roundedRect(margin, boxY, contentWidth, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 5, boxY + 7);
    y = boxY + 14;
    // Description
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text(description, margin + 5, y);
    y += 7;
    // Tasks as checklist
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    for (const task of tasks) {
      const lines = doc.splitTextToSize(task, contentWidth - 15);
      checkPageBreak(lines.length * 5 + 3);
      // Checkbox
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.rect(margin + 5, y - 3, 3.5, 3.5);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], margin + 12, y);
        y += 4.5;
      }
      y += 1;
    }
    y += 5;
  }

  // ===== PAGE 1: TITLE PAGE =====
  let pageNum = 1;
  doc.setFillColor(...VA_NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  // Gold accent bar
  doc.setFillColor(...VA_GOLD);
  doc.rect(0, pageHeight * 0.4, pageWidth, 3, 'F');
  // Title
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONALIZED LTC', pageWidth / 2, pageHeight * 0.25, { align: 'center' });
  doc.text('INSURANCE', pageWidth / 2, pageHeight * 0.25 + 14, { align: 'center' });
  doc.setFontSize(32);
  doc.setTextColor(...VA_GOLD);
  doc.text('CLAIM STRATEGY GUIDE', pageWidth / 2, pageHeight * 0.25 + 32, { align: 'center' });
  // Info
  doc.setFontSize(14);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  const infoY = pageHeight * 0.55;
  doc.text(`Prepared for: ${data.insuredName}`, pageWidth / 2, infoY, { align: 'center' });
  doc.text(`Policy: ${data.policyNumber}`, pageWidth / 2, infoY + 10, { align: 'center' });
  doc.text(`Carrier: ${data.carrierName}`, pageWidth / 2, infoY + 20, { align: 'center' });
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(...VA_LIGHT_BLUE);
  doc.setFont('helvetica', 'italic');
  doc.text('Prepared by LTC Navigator', pageWidth / 2, pageHeight - 30, { align: 'center' });
  doc.text('Compassionate In-Home Senior Care', pageWidth / 2, pageHeight - 24, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 18, { align: 'center' });

  // ===== PAGE 2: EXECUTIVE SUMMARY =====
  doc.addPage();
  pageNum++;
  drawHeader();
  drawFooter(pageNum);

  sectionTitle('Executive Summary');
  bodyText(`This personalized strategy guide has been created specifically for ${data.insuredName} to help navigate the long-term care insurance claim process. This document outlines a comprehensive three-stage approach designed to maximize benefits, minimize claim denials, and ensure seamless access to quality home care services.`);

  subTitle('Key Benefits Summary');
  highlightBox([
    `Daily Maximum: ${formatCurrency(data.dailyMaximum)}`,
    `Monthly Maximum: ${formatCurrency(data.monthlyMaximum)}`,
    `Lifetime Maximum: ${formatCurrency(data.lifetimeMaximum)}`,
  ]);

  // ===== PAGE 3: POLICY OVERVIEW =====
  sectionTitle('Policy Overview');
  subTitle('Insured Information');
  highlightBox([
    `Name: ${data.insuredName}`,
    `Policy Number: ${data.policyNumber}`,
    `Insurance Carrier: ${data.carrierName}`,
  ]);

  subTitle('Coverage Details');
  highlightBox([
    `Daily Maximum Benefit: ${formatCurrency(data.dailyMaximum)}`,
    `Monthly Maximum Benefit: ${formatCurrency(data.monthlyMaximum)}`,
    `Lifetime Maximum Benefit: ${formatCurrency(data.lifetimeMaximum)}`,
  ]);

  // ===== CARE RECOMMENDATIONS =====
  doc.addPage();
  pageNum++;
  drawHeader();
  drawFooter(pageNum);

  sectionTitle('Care Recommendations');
  subTitle('Primary Diagnosis');
  bodyText(data.diagnosis || 'LTC Insurance Claim');

  if (data.adlLimitations.length > 0) {
    subTitle('ADL Limitations');
    bulletList(data.adlLimitations);
  }

  if (data.careRecommendations) {
    subTitle('Care Recommendations');
    bodyText(data.careRecommendations);
  }

  // ===== THREE-STAGE STRATEGY =====
  doc.addPage();
  pageNum++;
  drawHeader();
  drawFooter(pageNum);

  sectionTitle('Three-Stage Strategy');

  if (data.stage1Tasks.length > 0) {
    stageBox(
      'Stage 1: Prior to Claim Submission',
      'Critical preparation phase to gather documentation and establish medical necessity.',
      data.stage1Tasks
    );
  }

  if (data.stage2Tasks.length > 0) {
    stageBox(
      'Stage 2: Claim Submission',
      'Formal submission of claim with all required documentation in a single packet.',
      data.stage2Tasks
    );
  }

  if (data.stage3Tasks.length > 0) {
    stageBox(
      'Stage 3: Post-Approval',
      'Management of ongoing benefits, invoicing, and documentation requirements.',
      data.stage3Tasks
    );
  }

  // ===== HOME CARE OPTIONS =====
  doc.addPage();
  pageNum++;
  drawHeader();
  drawFooter(pageNum);

  sectionTitle('Home Care Options with Visiting Angels');
  bodyText('Visiting Angels offers a comprehensive range of home care services tailored to your specific needs:');

  const careTypes = [
    { title: 'Companion Care', desc: 'Non-medical assistance with daily activities, errands, and social engagement.' },
    { title: 'Personal Care', desc: 'Assistance with bathing, dressing, grooming, and personal hygiene.' },
    { title: 'Specialized Care', desc: 'Specialized services for Alzheimer\'s, dementia, Parkinson\'s, and end-of-life care.' },
    { title: '24-Hour Care', desc: 'Round-the-clock care and live-in options for comprehensive support.' },
  ];

  for (const care of careTypes) {
    checkPageBreak(16);
    doc.setFillColor(232, 244, 248);
    doc.roundedRect(margin, y - 3, contentWidth, 14, 2, 2, 'F');
    doc.setDrawColor(...VA_LIGHT_BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 3, margin, y + 11);
    doc.setFontSize(11);
    doc.setTextColor(...VA_GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text(care.title, margin + 5, y + 2);
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'normal');
    doc.text(care.desc, margin + 5, y + 8);
    y += 18;
  }

  y += 5;
  highlightBox([
    'To get started with Visiting Angels home care services:',
    'Call: 1-800-365-4189',
    'Website: www.visitingangels.com',
    'SC Location: www.scvisitingangels.com',
  ]);

  // ===== LEGAL DISCLAIMERS =====
  doc.addPage();
  pageNum++;
  drawHeader();
  drawFooter(pageNum);

  sectionTitle('Legal Disclaimers & Important Information');

  // Red disclaimer box
  checkPageBreak(30);
  doc.setFillColor(255, 230, 230);
  doc.setDrawColor(204, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y - 3, contentWidth, 25, 2, 2, 'FD');
  doc.setFontSize(11);
  doc.setTextColor(204, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT: PLEASE READ CAREFULLY', margin + 5, y + 3);
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'normal');
  const disclaimerLines = doc.splitTextToSize(
    'This document is provided for informational and educational purposes only. It is not legal advice, medical advice, or a guarantee of insurance benefits. Each situation is unique and individual circumstances may vary significantly.',
    contentWidth - 10
  );
  for (let i = 0; i < disclaimerLines.length; i++) {
    doc.text(disclaimerLines[i], margin + 5, y + 10 + i * 4);
  }
  y += 32;

  const disclaimers = [
    { title: 'Visiting Angels Disclaimer', text: 'Visiting Angels is not responsible for the accuracy, completeness, or applicability of this strategy guide. Insurance policies, coverage limits, and claim requirements vary by carrier and policy. We strongly recommend consulting with your insurance carrier directly to confirm all details and requirements specific to your policy.' },
    { title: 'No Guarantee of Benefits', text: 'This guide does not guarantee approval of your claim or payment of benefits. Insurance carriers make independent determinations based on policy terms, medical necessity, and other factors. Claim approval is never guaranteed.' },
    { title: 'Professional Consultation Recommended', text: 'For complex situations, we recommend consulting with an elder law attorney, financial advisor, or insurance professional who can review your specific policy and circumstances.' },
    { title: 'Limitation of Liability', text: 'Visiting Angels and its representatives shall not be liable for any damages, losses, or claims arising from the use or reliance on this document, including but not limited to direct, indirect, incidental, consequential, or punitive damages.' },
  ];

  for (const d of disclaimers) {
    subTitle(d.title);
    bodyText(d.text);
  }

  // Final footer
  checkPageBreak(20);
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString()} | This is a confidential document intended for the use of the named individual only.`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`© ${new Date().getFullYear()} Visiting Angels. All rights reserved.`, pageWidth / 2, y, { align: 'center' });

  return doc;
}

export function PdfDeliveryPanel({ policyData }: PdfDeliveryPanelProps) {
  const [activeTab, setActiveTab] = useState<'download' | 'email'>('download');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const generatePdfMutation = trpc.pdfDelivery.generatePdf.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `LTC-Strategy-${policyData.insuredName.replace(/\s+/g, '-')}.pdf`;
        link.target = '_blank';
        link.click();
        setStatus({ type: 'success', message: 'PDF downloaded successfully!' });
      }
    },
    onError: (error) => {
      setStatus({ type: 'error', message: `Failed to generate PDF: ${error.message}` });
    },
    onSettled: () => setLoading(false),
  });

  const handleDownloadPdf = async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });
    generatePdfMutation.mutate(policyData);
  };

  const sendEmailMutation = trpc.pdfDelivery.sendPdfByEmail.useMutation({
    onSuccess: (data) => {
      setStatus({ type: 'success', message: data.message });
      setRecipientEmail('');
      setRecipientName('');
      setMessage('');
    },
    onError: (error) => {
      setStatus({ type: 'error', message: `Failed to send email: ${error.message}` });
    },
    onSettled: () => setLoading(false),
  });

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientName) {
      setStatus({ type: 'error', message: 'Please enter recipient email and name' });
      return;
    }
    setLoading(true);
    setStatus({ type: null, message: '' });
    sendEmailMutation.mutate({
      recipientEmail,
      recipientName,
      message,
      ...policyData,
    });
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          Download or Share Your Strategy
        </CardTitle>
        <CardDescription>Get your personalized LTC insurance strategy as a professional PDF</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tab Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Button
            variant={activeTab === 'download' ? 'default' : 'outline'}
            onClick={() => setActiveTab('download')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Download size={18} />
            Download PDF
          </Button>
          <Button
            variant={activeTab === 'email' ? 'default' : 'outline'}
            onClick={() => setActiveTab('email')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Mail size={18} />
            Email to Someone
          </Button>
        </div>

        {/* Download Tab */}
        {activeTab === 'download' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700 mb-4">
                Your personalized strategy PDF includes:
              </p>
              <ul className="text-sm text-gray-700 space-y-2 ml-4">
                <li>✓ Executive Summary with your policy benefits</li>
                <li>✓ Complete policy overview</li>
                <li>✓ Care recommendations based on your diagnosis</li>
                <li>✓ Three-stage claim strategy with checklists</li>
                <li>✓ Home care options with Visiting Angels</li>
                <li>✓ Important legal disclaimers</li>
              </ul>
            </div>

            <Button
              onClick={handleDownloadPdf}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
            >
              {loading ? 'Generating PDF...' : 'Download Your Strategy PDF'}
            </Button>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700 mb-4">
                Share your strategy PDF with family members, caregivers, or advisors
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient's Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient's Name *
                </label>
                <Input
                  type="text"
                  placeholder="John Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optional Message
                </label>
                <Textarea
                  placeholder="Add a personal message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  className="w-full min-h-24"
                />
              </div>

              <Button
                onClick={handleSendEmail}
                disabled={loading || !recipientEmail || !recipientName}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg font-semibold"
              >
                {loading ? 'Sending Email...' : 'Send Strategy PDF by Email'}
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status.type && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
              status.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <p className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {status.message}
            </p>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-xs text-gray-700">
            <strong>Legal Notice:</strong> This PDF is provided for informational purposes only and is not legal or medical advice. 
            Each situation is unique. Please consult with your insurance carrier to confirm all details specific to your policy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
