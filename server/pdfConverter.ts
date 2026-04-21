// Use named import which works reliably in both ESM and CJS contexts
import { jsPDF } from "jspdf";

// Visiting Angels brand colors
const VA_NAVY: [number, number, number] = [0, 51, 102];
const VA_GOLD: [number, number, number] = [253, 185, 19];
const VA_LIGHT_BLUE: [number, number, number] = [0, 153, 204];

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface PdfData {
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

export function generatePdfBuffer(data: PdfData): Buffer {
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
    doc.setFillColor(...VA_GOLD);
    doc.rect(0, 18, pageWidth, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LTC Insurance Strategy Guide', margin, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prepared for ${data.insuredName}`, pageWidth - margin, 12, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y = 28;
  }

  function drawFooter(pageNum: number) {
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Powered by Visiting Angels | www.visitingangels.com', margin, pageHeight - 10);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  function sectionTitle(title: string) {
    checkPageBreak(15);
    doc.setFillColor(...VA_NAVY);
    doc.rect(margin, y, contentWidth, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 4, y + 6.5);
    doc.setTextColor(0, 0, 0);
    y += 13;
  }

  function addWrappedText(text: string, fontSize: number = 10, bold: boolean = false) {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += fontSize * 0.45;
    }
    y += 2;
  }

  // ---- PAGE 1: Cover Page ----
  doc.setFillColor(...VA_NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(...VA_GOLD);
  doc.rect(0, pageHeight * 0.42, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONALIZED LTC', pageWidth / 2, pageHeight * 0.25, { align: 'center' });
  doc.text('INSURANCE STRATEGY', pageWidth / 2, pageHeight * 0.33, { align: 'center' });

  doc.setTextColor(...VA_GOLD);
  doc.setFontSize(26);
  doc.text('CLAIM STRATEGY GUIDE', pageWidth / 2, pageHeight * 0.40, { align: 'center' });

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  y = pageHeight * 0.52;
  doc.text(`Prepared for: ${data.insuredName}`, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.text(`Policy: ${data.policyNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.text(`Carrier: ${data.carrierName}`, pageWidth / 2, y, { align: 'center' });
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Powered by Visiting Angels', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
  drawFooter(1);

  // ---- PAGE 2: Executive Summary ----
  doc.addPage();
  drawHeader();
  sectionTitle('EXECUTIVE SUMMARY');
  addWrappedText(`This personalized strategy guide has been created specifically for ${data.insuredName} to help navigate the long-term care insurance claim process with ${data.carrierName}. This document outlines a comprehensive three-stage approach designed to maximize benefits, minimize claim denials, and ensure seamless access to quality home care services.`);
  y += 4;

  // Benefits summary
  checkPageBreak(30);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...VA_NAVY);
  const colW = contentWidth / 3;
  doc.text('DAILY MAXIMUM', margin + colW * 0 + colW / 2, y + 8, { align: 'center' });
  doc.text('MONTHLY MAXIMUM', margin + colW * 1 + colW / 2, y + 8, { align: 'center' });
  doc.text('LIFETIME MAXIMUM', margin + colW * 2 + colW / 2, y + 8, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(...VA_GOLD);
  doc.text(formatCurrency(data.dailyMaximum), margin + colW * 0 + colW / 2, y + 20, { align: 'center' });
  doc.text(formatCurrency(data.monthlyMaximum), margin + colW * 1 + colW / 2, y + 20, { align: 'center' });
  doc.text(formatCurrency(data.lifetimeMaximum), margin + colW * 2 + colW / 2, y + 20, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 34;
  drawFooter(2);

  // ---- PAGE 3: Policy Overview ----
  doc.addPage();
  drawHeader();
  sectionTitle('POLICY OVERVIEW');
  const overviewItems = [
    ['Insured Name', data.insuredName],
    ['Policy Number', data.policyNumber],
    ['Insurance Carrier', data.carrierName],
    ['Daily Maximum', formatCurrency(data.dailyMaximum)],
    ['Monthly Maximum', formatCurrency(data.monthlyMaximum)],
    ['Lifetime Maximum', formatCurrency(data.lifetimeMaximum)],
    ['Primary Diagnosis', data.diagnosis],
  ];
  for (const [label, value] of overviewItems) {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...VA_NAVY);
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(value, margin + 55, y);
    y += 7;
  }
  y += 4;

  if (data.adlLimitations.length > 0) {
    sectionTitle('QUALIFYING CONDITIONS');
    for (const adl of data.adlLimitations) {
      checkPageBreak(7);
      doc.setFillColor(...VA_GOLD);
      doc.circle(margin + 3, y - 1.5, 1.5, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(adl, margin + 8, y);
      y += 7;
    }
  }
  drawFooter(3);

  // ---- PAGE 4: Care Recommendations ----
  if (data.careRecommendations) {
    doc.addPage();
    drawHeader();
    sectionTitle('CARE RECOMMENDATIONS');
    addWrappedText(data.careRecommendations);
    drawFooter(4);
  }

  // ---- PAGES 5-6: Three-Stage Strategy ----
  const stages = [
    { title: 'STAGE 1: PRIOR TO CLAIM (Days 1-17)', desc: 'Gather documentation, establish medical necessity, and set up care providers before initiating your claim.', tasks: data.stage1Tasks },
    { title: 'STAGE 2: FILING THE CLAIM (Days 18-48)', desc: 'Submit your complete claim packet and track the 30-day insurance review window.', tasks: data.stage2Tasks },
    { title: 'STAGE 3: POST-APPROVAL (Day 49+)', desc: 'Manage ongoing benefits, submit invoices, and maintain documentation for continued coverage.', tasks: data.stage3Tasks },
  ];

  doc.addPage();
  drawHeader();
  sectionTitle('THREE-STAGE CLAIM STRATEGY');
  addWrappedText('Your personalized strategy follows a proven three-stage approach to maximize your chances of claim approval and ensure continued coverage.');
  y += 4;

  let pageNum = data.careRecommendations ? 5 : 4;
  for (const stage of stages) {
    checkPageBreak(20);
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    doc.setFillColor(...VA_NAVY);
    doc.roundedRect(margin, y, 4, 12, 1, 1, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...VA_NAVY);
    doc.text(stage.title, margin + 8, y + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(stage.desc, margin + 8, y + 10);
    doc.setTextColor(0, 0, 0);
    y += 16;

    for (const task of stage.tasks) {
      checkPageBreak(7);
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + 4, y - 3.5, 3.5, 3.5);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const taskLines = doc.splitTextToSize(task, contentWidth - 14);
      doc.text(taskLines[0], margin + 10, y);
      y += 6;
      if (taskLines.length > 1) {
        for (let i = 1; i < taskLines.length; i++) {
          checkPageBreak(5);
          doc.text(taskLines[i], margin + 10, y);
          y += 5;
        }
      }
    }
    y += 6;
  }
  drawFooter(pageNum);

  // ---- HOME CARE PAGE ----
  doc.addPage();
  drawHeader();
  pageNum++;
  sectionTitle('HOME CARE WITH VISITING ANGELS');
  addWrappedText('Visiting Angels provides professional, compassionate home care services to support your loved ones through their long-term care journey. Our experienced caregivers are trained to work within the LTC insurance framework to ensure your benefits are maximized.');
  y += 4;

  const careTypes = [
    { title: 'Personal Care', desc: 'Assistance with ADLs including bathing, dressing, grooming, toileting, and mobility.' },
    { title: 'Companion Care', desc: 'Social engagement, meal preparation, light housekeeping, and transportation.' },
    { title: 'Specialized Care', desc: 'Alzheimer\'s and dementia care, post-surgery recovery, and chronic condition management.' },
    { title: 'Respite Care', desc: 'Temporary relief for family caregivers, available on flexible schedules.' },
  ];

  for (const ct of careTypes) {
    checkPageBreak(16);
    doc.setFillColor(232, 244, 248);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
    doc.setFillColor(...VA_LIGHT_BLUE);
    doc.rect(margin, y, contentWidth, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...VA_NAVY);
    doc.text(ct.title, margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(ct.desc, margin + 4, y + 11);
    doc.setTextColor(0, 0, 0);
    y += 18;
  }

  y += 6;
  addWrappedText('Contact Information:', 10, true);
  addWrappedText('Visiting Angels: www.visitingangels.com');
  addWrappedText('SC Visiting Angels: www.scvisitingangels.com');
  drawFooter(pageNum);

  // ---- DISCLAIMER PAGE ----
  doc.addPage();
  drawHeader();
  pageNum++;
  sectionTitle('IMPORTANT LEGAL DISCLAIMERS');

  const disclaimers = [
    'This document is provided for informational and educational purposes only. It is not legal advice, medical advice, or a guarantee of insurance benefits.',
    'Each long-term care insurance policy is unique. The strategies outlined in this document are general guidelines and may not apply to every situation.',
    'Always consult with your insurance carrier directly to confirm all details specific to your policy, including coverage limits, elimination periods, and benefit triggers.',
    'The information about Visiting Angels services is provided for reference only. Availability of services may vary by location.',
    'This document does not create any legal, fiduciary, or professional relationship between the user and Visiting Angels or any affiliated entity.',
    'Insurance regulations and benefits may change. Please verify all information with your insurance carrier before making any decisions.',
  ];

  for (const d of disclaimers) {
    checkPageBreak(12);
    doc.setFillColor(255, 240, 240);
    const lines = doc.splitTextToSize(d, contentWidth - 12);
    const boxH = lines.length * 4.5 + 6;
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'F');
    doc.setFillColor(204, 0, 0);
    doc.rect(margin, y, 3, boxH, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 0, 0);
    doc.text(lines, margin + 8, y + 5);
    doc.setTextColor(0, 0, 0);
    y += boxH + 4;
  }
  drawFooter(pageNum);

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

// Keep backward compatibility
export async function convertHtmlToPdf(_html: string): Promise<Buffer> {
  // This is a stub - the actual PDF generation now uses jsPDF directly
  // The strategyPdfGenerator should call generatePdfBuffer instead
  throw new Error("Use generatePdfBuffer() instead of convertHtmlToPdf()");
}
