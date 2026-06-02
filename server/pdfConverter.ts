// Comprehensive SC Visiting Angels – LTC Navigator PDF Generator
// Landscape letter, all sections: cover, executive summary, benefit summary,
// policy summary, qualifying conditions, 3-stage checklist, Gantt timeline,
// care recommendations, glossary, disclaimers.
import { jsPDF } from "jspdf";

// ── Brand colours ────────────────────────────────────────────────────────────
const NAVY:  [number, number, number] = [26,  58,  74];   // #1a3a4a
const TEAL:  [number, number, number] = [0,  140, 130];   // #008C82
const GOLD:  [number, number, number] = [253, 185,  19];  // #FDB913
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT: [number, number, number] = [240, 248, 248];
const GREY:  [number, number, number] = [100, 100, 100];
const DARK:  [number, number, number] = [33,  33,  33];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(val: number): string {
  if (!val || isNaN(val)) return "N/A";
  return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Full data interface ───────────────────────────────────────────────────────
export interface PdfData {
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
  careRecommendations?: string;
  strategyContent?: string;
  diagnosis?: string;
  caseManagerName?: string;
  thirdPartyAssessmentRequired?: string;
}

// ── Page dimensions (landscape letter) ───────────────────────────────────────
const PW = 279.4; // mm
const PH = 215.9; // mm
const M  = 16;    // margin
const CW = PW - M * 2;

// ── Main export ───────────────────────────────────────────────────────────────
export function generatePdfBuffer(data: PdfData): Buffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  let y = 0;
  let pageNum = 0;

  // ── Page management ─────────────────────────────────────────────────────────
  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    // Navy header bar
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PW, 14, "F");
    // Gold accent line
    doc.setFillColor(...GOLD);
    doc.rect(0, 14, PW, 2, "F");
    // Logo text left
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("SC VISITING ANGELS", M, 9.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("www.scvisitingangels.com", M, 13);
    // Right: insured name + page
    doc.setFontSize(8);
    doc.text(`${data.insuredName}  |  Policy: ${data.policyNumber}`, PW - M, 9.5, { align: "right" });
    doc.text(`Page ${pageNum}`, PW - M, 13, { align: "right" });
    doc.setTextColor(...DARK);
    y = 22;
  }

  function checkBreak(needed: number) {
    if (y + needed > PH - 14) newPage();
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  function drawFooter() {
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text(
      `SC Visiting Angels  ·  www.scvisitingangels.com  ·  Confidential — For Personal Use Only  ·  Generated ${new Date().toLocaleDateString()}`,
      PW / 2, PH - 5, { align: "center" }
    );
    doc.setTextColor(...DARK);
  }

  // ── Section heading ─────────────────────────────────────────────────────────
  function sectionHeading(title: string, icon = "") {
    checkBreak(14);
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, CW, 10, 1.5, 1.5, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(`${icon}  ${title}`.trim(), M + 5, y + 7);
    doc.setTextColor(...DARK);
    y += 14;
  }

  // ── Sub-heading ─────────────────────────────────────────────────────────────
  function subHeading(title: string) {
    checkBreak(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL);
    doc.text(title, M, y);
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.4);
    doc.line(M, y + 1.5, M + CW, y + 1.5);
    doc.setTextColor(...DARK);
    y += 7;
  }

  // ── Body text (wrapped) ─────────────────────────────────────────────────────
  function bodyText(text: string, indent = 0, fontSize = 9.5) {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, CW - indent);
    for (const line of lines) {
      checkBreak(6);
      doc.text(line, M + indent, y);
      y += 5;
    }
    y += 1.5;
  }

  // ── Bullet list ─────────────────────────────────────────────────────────────
  function bulletList(items: string[], indent = 4) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    for (const item of items) {
      const lines = doc.splitTextToSize(item, CW - indent - 6);
      checkBreak(lines.length * 5 + 2);
      doc.setFillColor(...GOLD);
      doc.circle(M + indent + 1.5, y - 1.5, 1.2, "F");
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], M + indent + 5, y);
        y += 4.5;
      }
      y += 1;
    }
    y += 2;
  }

  // ── Info row (label: value) ──────────────────────────────────────────────────
  function infoRow(label: string, value: string, col = 0, colCount = 1) {
    const colW = CW / colCount;
    const x = M + col * colW;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(label + ":", x, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(value || "N/A", colW - 40);
    doc.text(lines[0], x + 38, y);
    return 5.5;
  }

  // ── Highlight box ────────────────────────────────────────────────────────────
  function highlightBox(lines: string[], bgColor: [number,number,number] = LIGHT, accentColor: [number,number,number] = TEAL) {
    const lineH = 5.5;
    const boxH = lines.length * lineH + 8;
    checkBreak(boxH);
    doc.setFillColor(...bgColor);
    doc.roundedRect(M, y, CW, boxH, 2, 2, "F");
    doc.setFillColor(...accentColor);
    doc.rect(M, y, 3, boxH, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], M + 7, y + 5.5 + i * lineH);
    }
    y += boxH + 4;
  }

  // ── Checklist task row ───────────────────────────────────────────────────────
  function taskRow(task: string, completed: boolean, critical: boolean) {
    const lines = doc.splitTextToSize(task, CW - 16);
    const rowH = lines.length * 4.5 + 4;
    checkBreak(rowH);
    // Checkbox
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(M + 2, y - 3, 3.5, 3.5);
    if (completed) {
      doc.setDrawColor(...TEAL);
      doc.setLineWidth(0.6);
      doc.line(M + 2.4, y - 1.2, M + 3.5, y - 0.2);
      doc.line(M + 3.5, y - 0.2, M + 5.3, y - 3.3);
    }
    // Task label
    doc.setFontSize(8.5);
    doc.setFont("helvetica", critical ? "bold" : "normal");
    doc.setTextColor(completed ? 150 : critical ? 160 : 50, completed ? 150 : critical ? 100 : 50, completed ? 150 : critical ? 0 : 50);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], M + 8, y + i * 4.5);
    }
    if (critical && !completed) {
      doc.setFontSize(7);
      doc.setTextColor(180, 100, 0);
      doc.text("★ Critical", M + 8 + doc.getTextWidth(lines[0]) + 3, y);
    }
    doc.setTextColor(...DARK);
    y += rowH;
  }

  // ── Stage box header ─────────────────────────────────────────────────────────
  function stageHeader(title: string, desc: string, color: [number,number,number]) {
    checkBreak(18);
    doc.setFillColor(...color);
    doc.roundedRect(M, y, CW, 14, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(title, M + 6, y + 6);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(230, 230, 230);
    doc.text(desc, M + 6, y + 11.5);
    doc.setTextColor(...DARK);
    y += 18;
  }

  // ── Gantt bar row ────────────────────────────────────────────────────────────
  function ganttRow(label: string, startDay: number, durDays: number, totalDays: number, color: [number,number,number], completed: boolean) {
    const labelW = 100;
    const barAreaW = CW - labelW - 4;
    const barX = M + labelW + 4;
    const barStartX = barX + (startDay / totalDays) * barAreaW;
    const barW = Math.max((durDays / totalDays) * barAreaW, 2);
    checkBreak(7);
    // Label
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const truncated = doc.splitTextToSize(label, labelW - 4)[0];
    doc.text(truncated, M + 2, y);
    // Bar background
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(barX, y - 3.5, barAreaW, 4.5, 0.8, 0.8, "F");
    // Bar fill
    doc.setFillColor(completed ? 100 : color[0], completed ? 160 : color[1], completed ? 100 : color[2]);
    doc.roundedRect(barStartX, y - 3.5, barW, 4.5, 0.8, 0.8, "F");
    y += 6;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════════════════════════════════════════
  pageNum++;
  // Full navy background
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, PH, "F");
  // Gold diagonal accent
  doc.setFillColor(...GOLD);
  doc.rect(0, PH * 0.55, PW, 4, "F");
  // Teal side accent
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, 8, PH, "F");

  // Title
  doc.setTextColor(...WHITE);
  doc.setFontSize(38);
  doc.setFont("helvetica", "bold");
  doc.text("PERSONALIZED LTC", PW / 2, PH * 0.22, { align: "center" });
  doc.text("INSURANCE STRATEGY", PW / 2, PH * 0.22 + 16, { align: "center" });
  doc.setFontSize(22);
  doc.setTextColor(...GOLD);
  doc.text("CLAIM STRATEGY GUIDE", PW / 2, PH * 0.22 + 34, { align: "center" });

  // Insured info block
  doc.setFontSize(13);
  doc.setTextColor(200, 230, 230);
  doc.setFont("helvetica", "normal");
  const iy = PH * 0.62;
  doc.text(`Prepared for: ${data.insuredName}`, PW / 2, iy, { align: "center" });
  doc.text(`Policy #: ${data.policyNumber}  |  Carrier: ${data.carrierName}`, PW / 2, iy + 9, { align: "center" });
  if (data.eliminationPeriod) doc.text(`Elimination Period: ${data.eliminationPeriod} days`, PW / 2, iy + 18, { align: "center" });

  // Branding footer
  doc.setFontSize(10);
  doc.setTextColor(...TEAL);
  doc.setFont("helvetica", "italic");
  doc.text("SC Visiting Angels  ·  www.scvisitingangels.com", PW / 2, PH - 18, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(150, 180, 180);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, PW / 2, PH - 12, { align: "center" });
  drawFooter();

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  newPage();
  sectionHeading("EXECUTIVE SUMMARY");
  bodyText(
    `This personalized LTC Insurance Strategy Guide has been prepared exclusively for ${data.insuredName} to help navigate the long-term care insurance claim process with ${data.carrierName}. ` +
    `The guide presents a comprehensive three-stage approach designed to maximize your policy benefits, minimize the risk of claim denials, and ensure seamless access to quality home care services through SC Visiting Angels.`
  );
  y += 2;
  bodyText(
    `Your policy provides a daily maximum benefit of ${fmtCurrency(data.dailyMaximum)}, a monthly maximum of ${fmtCurrency(data.monthlyMaximum)}, and a lifetime maximum of ${fmtCurrency(data.lifetimeMaximum)}. ` +
    `The elimination period is ${data.eliminationPeriod || "N/A"} days, meaning you must pay out-of-pocket for that many days of service before benefits begin. ` +
    `This guide walks you through every step — from gathering documentation before filing, through the formal claim submission, to managing ongoing benefits after approval.`
  );

  // Key facts 3-column highlight
  checkBreak(28);
  const colW3 = CW / 3;
  const kfY = y;
  const kfH = 22;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, kfY, CW, kfH, 2, 2, "F");
  doc.setFillColor(...TEAL);
  doc.roundedRect(M, kfY, CW, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("DAILY MAXIMUM", M + colW3 * 0 + colW3 / 2, kfY + 5.5, { align: "center" });
  doc.text("MONTHLY MAXIMUM", M + colW3 * 1 + colW3 / 2, kfY + 5.5, { align: "center" });
  doc.text("LIFETIME MAXIMUM", M + colW3 * 2 + colW3 / 2, kfY + 5.5, { align: "center" });
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text(fmtCurrency(data.dailyMaximum), M + colW3 * 0 + colW3 / 2, kfY + 17, { align: "center" });
  doc.text(fmtCurrency(data.monthlyMaximum), M + colW3 * 1 + colW3 / 2, kfY + 17, { align: "center" });
  doc.text(fmtCurrency(data.lifetimeMaximum), M + colW3 * 2 + colW3 / 2, kfY + 17, { align: "center" });
  doc.setTextColor(...DARK);
  y = kfY + kfH + 8;

  if (data.strategyContent) {
    subHeading("Strategy Overview");
    // Strip markdown and print first 800 chars
    const stripped = data.strategyContent.replace(/[#*`_~\[\]]/g, "").substring(0, 800);
    bodyText(stripped + (data.strategyContent.length > 800 ? "…" : ""));
  }
  drawFooter();

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3 — POLICY SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  newPage();
  sectionHeading("POLICY SUMMARY");

  // Two-column layout
  const half = CW / 2 - 4;
  const col2X = M + half + 8;

  subHeading("Insured Information");
  const insuredRows = [
    ["Full Name", data.insuredName],
    ["Date of Birth", data.insuredDob || "N/A"],
    ["Phone", data.insuredPhone || "N/A"],
    ["Email", data.insuredEmail || "N/A"],
    ["Address", data.insuredAddress || "N/A"],
  ];
  const policyRows = [
    ["Policy Number", data.policyNumber],
    ["Claim / Pre-Claim #", data.claimNumber || "N/A"],
    ["Insurance Carrier", data.carrierName],
    ["Carrier Phone", data.carrierPhone || "N/A"],
    ["Case Manager", data.caseManagerName || "Not assigned"],
  ];
  const startY3 = y;
  for (const [lbl, val] of insuredRows) {
    checkBreak(6);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(lbl + ":", M + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(val, M + 42, y);
    y += 5.5;
  }
  const leftEndY = y;
  y = startY3;
  for (const [lbl, val] of policyRows) {
    checkBreak(6);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(lbl + ":", col2X, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(val, col2X + 42, y);
    y += 5.5;
  }
  y = Math.max(leftEndY, y) + 4;

  subHeading("Coverage Details");
  const covRows = [
    ["Elimination Period", `${data.eliminationPeriod || "N/A"} days`],
    ["Daily Maximum Benefit", fmtCurrency(data.dailyMaximum)],
    ["Monthly Maximum Benefit", fmtCurrency(data.monthlyMaximum)],
    ["Lifetime Maximum Benefit", fmtCurrency(data.lifetimeMaximum)],
    ["Minimum ADLs Required", data.minAdlsRequired !== undefined ? String(data.minAdlsRequired) : "N/A"],
    ["Waiver of Premium", data.waiverOfPremium || "N/A"],
    ["Assignment of Benefits (AOB)", data.assignmentOfBenefits === "yes" ? "Yes — Provider billed directly" : data.assignmentOfBenefits === "no" ? "No — Reimbursement model" : "N/A"],
    ["Third-Party Assessment", data.thirdPartyAssessmentRequired === "yes" ? "Required" : data.thirdPartyAssessmentRequired === "no" ? "Not required" : "N/A"],
  ];
  const covStartY = y;
  for (let i = 0; i < covRows.length; i++) {
    const [lbl, val] = covRows[i];
    const xPos = i % 2 === 0 ? M + 2 : col2X;
    if (i % 2 === 0 && i > 0) y += 5.5;
    if (i % 2 === 0) {
      checkBreak(6);
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(lbl + ":", xPos, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(val, xPos + 52, y);
    if (i % 2 === 1) y += 5.5;
  }
  y += 6;

  // Qualifying conditions
  sectionHeading("QUALIFYING CONDITIONS");
  if (data.adlLimitations && data.adlLimitations.length > 0) {
    subHeading("ADL Deficits");
    bulletList(data.adlLimitations);
  }
  if (data.diagnosisCheckboxes && data.diagnosisCheckboxes.length > 0) {
    subHeading("Primary Diagnoses");
    bulletList(data.diagnosisCheckboxes);
  }
  if (data.cognitiveImpairmentTrigger === "yes") {
    highlightBox(["★  Cognitive Impairment Trigger: This policy includes a cognitive impairment benefit trigger. A diagnosis of Alzheimer's, dementia, or similar condition may qualify independently of ADL deficits."], [255, 248, 220], GOLD);
  }
  if (data.careRecommendations) {
    subHeading("Care Recommendations");
    bodyText(data.careRecommendations);
  }
  drawFooter();

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGES 4-6 — THREE-STAGE CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════════
  const stages = [
    {
      title: "STAGE 1: PRIOR TO CLAIM SUBMISSION (Days 1–25)",
      desc: "Gather documentation, establish medical necessity, and set up care providers before initiating your claim.",
      tasks: data.stage1Tasks,
      color: [0, 100, 160] as [number,number,number],
    },
    {
      title: "STAGE 2: FILING THE CLAIM (Days 26–63)",
      desc: "Submit your complete claim packet and track the 30-day insurance review window.",
      tasks: data.stage2Tasks,
      color: [160, 100, 0] as [number,number,number],
    },
    {
      title: "STAGE 3: POST-APPROVAL (Day 64+)",
      desc: "Manage ongoing benefits, submit invoices, and maintain documentation for continued coverage.",
      tasks: data.stage3Tasks,
      color: [0, 120, 80] as [number,number,number],
    },
  ];

  newPage();
  sectionHeading("THREE-STAGE CLAIM CHECKLIST");
  bodyText("The following checklist guides you through every action required to initiate and maintain your LTC insurance claim. Work through each stage in order. Critical items are marked with ★.");
  y += 2;

  for (const stage of stages) {
    stageHeader(stage.title, stage.desc, stage.color);
    for (const task of stage.tasks) {
      const isCritical = /carrier|physician|assessment|packet|submit|elimination|invoice|aob|hipaa/i.test(task);
      taskRow(task, false, isCritical);
    }
    y += 4;
  }
  drawFooter();

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGES — GANTT TIMELINE  (one dedicated page per stage, tall readable rows)
  // ═══════════════════════════════════════════════════════════════════════════
  const elimDays = data.eliminationPeriod ? parseInt(data.eliminationPeriod, 10) || 90 : 90;
  const p = 25;
  const s2End = p + 8 + 30;
  const totalDays = s2End + elimDays + 30;

  // Gantt layout constants
  const gLabelW   = 120;   // task-label column width
  const gBarAreaW = CW - gLabelW - 6;
  const gBarX     = M + gLabelW + 6;
  const gRowH     = 10;   // tall rows for readability
  const gRulerH   = 12;   // day-ruler band height

  // Choose marker days that fit within totalDays
  const allMarkers = [0, 7, 14, 21, 28, 35, 42, 56, 70, 90, 120, 150, 180];
  const gMarkers = allMarkers.filter(d => d <= totalDays);

  function drawGanttRuler() {
    // Ruler background
    doc.setFillColor(232, 240, 248);
    doc.rect(gBarX, y, gBarAreaW, gRulerH, "F");
    // Label column header
    doc.setFillColor(220, 228, 240);
    doc.rect(M, y, gLabelW, gRulerH, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Task", M + 3, y + gRulerH / 2 + 2);
    // Day markers
    doc.setTextColor(...GREY);
    for (const md of gMarkers) {
      const mx = gBarX + (md / totalDays) * gBarAreaW;
      doc.text(`Day ${md}`, mx, y + gRulerH / 2 + 2, { align: "center" });
      doc.setDrawColor(160, 180, 200);
      doc.setLineWidth(0.15);
      doc.line(mx, y + gRulerH, mx, y + gRulerH + 2);
    }
    doc.setTextColor(...DARK);
    y += gRulerH + 3;
  }

  function drawGanttTaskRow(
    label: string,
    startDay: number,
    durDays: number,
    color: [number, number, number],
    rowIndex: number
  ) {
    checkBreak(gRowH + 2);
    // Alternating row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 252, 255);
      doc.rect(M, y, CW, gRowH, "F");
    }
    // Vertical grid lines at each marker
    doc.setDrawColor(210, 220, 230);
    doc.setLineWidth(0.1);
    for (const md of gMarkers) {
      const mx = gBarX + (md / totalDays) * gBarAreaW;
      doc.line(mx, y, mx, y + gRowH);
    }
    // Task label (truncated to fit column)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const truncated = doc.splitTextToSize(label, gLabelW - 5)[0];
    doc.text(truncated, M + 3, y + gRowH / 2 + 1.5);
    // Bar track (grey background)
    doc.setFillColor(218, 226, 236);
    doc.roundedRect(gBarX, y + 2, gBarAreaW, gRowH - 4, 1.2, 1.2, "F");
    // Coloured bar fill
    const barStartX = gBarX + (startDay / totalDays) * gBarAreaW;
    const barW = Math.max((durDays / totalDays) * gBarAreaW, 4);
    doc.setFillColor(...color);
    doc.roundedRect(barStartX, y + 2, barW, gRowH - 4, 1.2, 1.2, "F");
    // Day-range label inside bar (if wide enough)
    if (barW > 16) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(`${startDay}–${startDay + durDays}d`, barStartX + barW / 2, y + gRowH / 2 + 1.5, { align: "center" });
    }
    // Row separator
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.1);
    doc.line(M, y + gRowH, M + CW, y + gRowH);
    doc.setTextColor(...DARK);
    y += gRowH + 1;
  }

  const ganttStages = [
    {
      stageNum: 1,
      label: "Stage 1: Prior to Claim",
      desc: "Days 1–25 — Gather documentation, establish medical necessity, and set up care providers before initiating your claim.",
      color: [0, 100, 160] as [number,number,number],
      tasks: data.stage1Tasks.map((t, i) => {
        const sched: Record<number, [number, number]> = {
          0:[0,3],1:[0,3],2:[0,3],3:[2,7],4:[2,7],5:[3,5],6:[5,5],7:[5,10],8:[7,7],9:[7,10],
          10:[5,10],11:[10,5],12:[10,7],13:[12,7],14:[10,5],15:[14,5],16:[18,elimDays],17:[3,5],18:[3,7],19:[10,5],20:[10,5],
        };
        const [s, d] = sched[i] || [0, 7];
        return { label: t, start: s, dur: d };
      }),
    },
    {
      stageNum: 2,
      label: "Stage 2: Filing the Claim",
      desc: "Days 26–63 — Submit your complete claim packet and track the 30-day insurance review window.",
      color: [160, 100, 0] as [number,number,number],
      tasks: data.stage2Tasks.map((t, i) => {
        const sched: Record<number, [number, number]> = {
          0:[p,5],1:[p+3,3],2:[p+2,2],3:[p+2,2],4:[p+3,2],5:[p+3,2],6:[p+3,2],7:[p+4,2],
          8:[p+4,3],9:[p+6,2],10:[p+7,1],11:[p+10,5],12:[p+10,5],13:[p+10,5],14:[p+10,5],15:[p+10,5],16:[p+8,30],17:[p+8,30],
        };
        const [s, d] = sched[i] || [p, 5];
        return { label: t, start: s, dur: d };
      }),
    },
    {
      stageNum: 3,
      label: "Stage 3: Post-Approval",
      desc: `Day 64+ — Manage ongoing benefits, submit invoices, and maintain documentation. Elimination period: ${elimDays} days.`,
      color: [0, 120, 80] as [number,number,number],
      tasks: data.stage3Tasks.map((t, i) => {
        const sched: Record<number, [number, number]> = {
          0:[s2End,elimDays],1:[s2End,elimDays],2:[s2End,elimDays],3:[s2End+14,14],4:[s2End+14,14],
          5:[s2End+7,21],6:[s2End+14,21],7:[s2End+21,21],8:[s2End,30],9:[s2End,30],
        };
        const [s, d] = sched[i] || [s2End, 14];
        return { label: t, start: s, dur: d };
      }),
    },
  ];

  // One dedicated page per stage — overflow to additional pages automatically
  for (const gs of ganttStages) {
    newPage();
    sectionHeading(`CLAIM TIMELINE — ${gs.label.toUpperCase()}`);
    bodyText(gs.desc);
    y += 2;
    drawGanttRuler();
    gs.tasks.forEach((t, idx) => drawGanttTaskRow(t.label, t.start, t.dur, gs.color, idx));
    // Legend footer band
    y += 4;
    checkBreak(14);
    doc.setFillColor(240, 248, 248);
    doc.roundedRect(M, y, CW, 12, 2, 2, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GREY);
    doc.text(
      `Day 0 = process start date  ·  Bar length = working window in days  ·  Elimination period: ${elimDays} days  ·  Total estimated timeline: ~${totalDays} days`,
      PW / 2, y + 7.5, { align: "center" }
    );
    doc.setTextColor(...DARK);
    y += 16;
    drawFooter();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE — BENEFIT SUMMARY & CARE RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  newPage();
  sectionHeading("BENEFIT SUMMARY");

  // Large benefit boxes
  checkBreak(40);
  const bw = (CW - 8) / 3;
  const benefits = [
    { label: "Daily Maximum", value: fmtCurrency(data.dailyMaximum), note: "Max paid per day of care" },
    { label: "Monthly Maximum", value: fmtCurrency(data.monthlyMaximum), note: "Max paid per calendar month" },
    { label: "Lifetime Maximum", value: fmtCurrency(data.lifetimeMaximum), note: "Total lifetime benefit pool" },
  ];
  for (let i = 0; i < benefits.length; i++) {
    const bx = M + i * (bw + 4);
    doc.setFillColor(...NAVY);
    doc.roundedRect(bx, y, bw, 34, 3, 3, "F");
    doc.setFillColor(...TEAL);
    doc.roundedRect(bx, y + 28, bw, 6, 1, 1, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GOLD);
    doc.text(benefits[i].label, bx + bw / 2, y + 8, { align: "center" });
    doc.setFontSize(18);
    doc.setTextColor(...WHITE);
    doc.text(benefits[i].value, bx + bw / 2, y + 21, { align: "center" });
    doc.setFontSize(7.5);
    doc.setTextColor(200, 240, 240);
    doc.text(benefits[i].note, bx + bw / 2, y + 32, { align: "center" });
  }
  doc.setTextColor(...DARK);
  y += 40;

  // Additional benefit details
  const benefitDetails = [
    ["Elimination Period", `${data.eliminationPeriod || "N/A"} days — You pay out-of-pocket until this many service days are met`],
    ["Waiver of Premium", data.waiverOfPremium === "yes" ? "Yes — Premium payments stop once care begins under this policy" : data.waiverOfPremium === "no" ? "No — Premiums continue during claim" : "N/A"],
    ["Assignment of Benefits", data.assignmentOfBenefits === "yes" ? "Yes — Carrier pays SC Visiting Angels directly (no reimbursement needed)" : data.assignmentOfBenefits === "no" ? "No — You pay provider, then submit invoices for reimbursement" : "N/A"],
    ["Minimum ADLs Required", data.minAdlsRequired !== undefined ? `${data.minAdlsRequired} ADL(s) must be in deficit to qualify for benefits` : "N/A"],
  ];
  for (const [lbl, val] of benefitDetails) {
    checkBreak(8);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(lbl + ":", M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const vlines = doc.splitTextToSize(val, CW - 60);
    doc.text(vlines[0], M + 58, y);
    y += 6;
  }
  y += 4;

  // SC Visiting Angels services
  sectionHeading("HOME CARE WITH SC VISITING ANGELS");
  bodyText("SC Visiting Angels provides professional, compassionate home care services tailored to your long-term care insurance policy. Our experienced caregivers are trained to work within the LTC insurance framework to ensure your benefits are maximized and documentation requirements are met.");
  y += 2;

  const careTypes = [
    { title: "Personal Care", desc: "Assistance with ADLs: bathing, dressing, grooming, toileting, feeding, and mobility/transferring." },
    { title: "Companion Care", desc: "Social engagement, meal preparation, light housekeeping, medication reminders, and transportation." },
    { title: "Alzheimer's & Dementia Care", desc: "Specialized cognitive care, memory support, behavioral management, and safety supervision." },
    { title: "Respite Care", desc: "Temporary relief for family caregivers, available on flexible hourly or daily schedules." },
    { title: "24-Hour & Live-In Care", desc: "Round-the-clock care for complex needs, post-surgery recovery, or end-of-life support." },
  ];
  const ctW = (CW - 8) / 2;
  let ctRow = 0;
  for (let i = 0; i < careTypes.length; i++) {
    const cx = i % 2 === 0 ? M : M + ctW + 8;
    if (i % 2 === 0) {
      checkBreak(18);
      ctRow = y;
    }
    doc.setFillColor(232, 248, 248);
    doc.roundedRect(cx, ctRow, ctW, 16, 2, 2, "F");
    doc.setFillColor(...TEAL);
    doc.rect(cx, ctRow, ctW, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(careTypes[i].title, cx + 4, ctRow + 7);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const dlines = doc.splitTextToSize(careTypes[i].desc, ctW - 8);
    doc.text(dlines[0], cx + 4, ctRow + 13);
    if (i % 2 === 1) y = ctRow + 20;
  }
  if (careTypes.length % 2 !== 0) y = ctRow + 20;
  y += 4;

  checkBreak(14);
  doc.setFillColor(240, 255, 250);
  doc.roundedRect(M, y, CW, 12, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL);
  doc.text("Contact SC Visiting Angels:", M + 5, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text("www.scvisitingangels.com  |  www.visitingangels.com", M + 5, y + 10);
  y += 16;
  drawFooter();

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE — GLOSSARY OF TERMS
  // ═══════════════════════════════════════════════════════════════════════════
  newPage();
  sectionHeading("GLOSSARY OF TERMS");
  bodyText("The following definitions will help you understand the key terms used in your LTC insurance policy and throughout this strategy guide.");
  y += 2;

  const glossary = [
    { term: "Activities of Daily Living (ADLs)", def: "Six fundamental self-care activities: Bathing, Dressing, Toileting, Feeding, Continence, and Transferring. Most LTC policies require 2–3 ADLs to be in deficit before benefits begin." },
    { term: "Elimination Period", def: "The number of service days you must pay out of pocket before your LTC policy begins to pay. This counts days of actual service received, not calendar days since the onset of illness." },
    { term: "Daily Maximum Benefit", def: "The maximum dollar amount the insurance company will pay per day of qualifying care. Any care costs above this limit are the client's responsibility." },
    { term: "Monthly Maximum Benefit", def: "The maximum dollar amount the insurance company will pay per calendar month of qualifying care." },
    { term: "Lifetime Maximum Benefit", def: "The total cumulative amount the policy will pay over its entire lifetime. Once this pool is exhausted, no further benefits are available under the policy." },
    { term: "Claim / Pre-Claim Number", def: "When a claim is initiated, the carrier issues a pre-claim number. Upon approval, this becomes the official claim number used on all invoices and correspondence." },
    { term: "Case Manager", def: "An RN or licensed professional assigned by the LTC insurance company to determine the approved hours of care, review documentation, and serve as your primary carrier contact." },
    { term: "Third-Party Assessment", def: "An independent RN assessment ordered by the carrier to verify the patient's condition and ADL deficits. The assessor looks for consistency between medical documentation and the observed condition." },
    { term: "Waiver of Premium", def: "A policy feature that suspends (waives) your premium payments once you begin receiving benefits under the policy. Not all policies include this feature — check your policy documents." },
    { term: "Assignment of Benefits (AOB)", def: "A provision that directs the insurance company to send payment directly to the care provider (e.g., SC Visiting Angels) instead of the insured. This eliminates the need for the client to pay upfront and seek reimbursement." },
    { term: "Benefit Trigger", def: "The qualifying condition(s) that must be met before the policy will pay benefits. Most policies use ADL deficits (2 or more) or a cognitive impairment diagnosis as benefit triggers." },
    { term: "Cognitive Impairment Trigger", def: "A separate benefit trigger available in many policies. A diagnosis of Alzheimer's disease, dementia, or similar cognitive condition may qualify independently of ADL deficits." },
    { term: "Plan of Care", def: "A written document, typically prepared by a physician or RN, describing the insured's care needs, recommended services, and required hours. Most carriers require this before approving a claim." },
    { term: "HIPAA Authorization", def: "A signed release allowing your healthcare providers to share medical records with the insurance carrier and SC Visiting Angels. Required for claim processing." },
    { term: "Care Notes / Activity Log", def: "Daily records kept by the caregiver documenting services provided, hours worked, and the client's condition. Required by most carriers for ongoing billing and compliance." },
    { term: "Inflation Protection Rider", def: "An optional policy feature that increases your benefit amounts over time (typically 3–5% per year) to keep pace with rising care costs." },
  ];

  // Two-column glossary
  const gColW = (CW - 6) / 2;
  let gCol = 0;
  let gColY = y;
  let gRightY = y;

  for (const g of glossary) {
    const termLines = doc.splitTextToSize(g.term, gColW - 4);
    const defLines = doc.splitTextToSize(g.def, gColW - 4);
    const entryH = (termLines.length + defLines.length) * 4.5 + 6;
    const gx = gCol === 0 ? M : M + gColW + 6;
    const gy = gCol === 0 ? gColY : gRightY;

    if (gy + entryH > PH - 18) {
      if (gCol === 0) {
        gCol = 1;
        gRightY = y;
        const gx2 = M + gColW + 6;
        const gy2 = gRightY;
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...NAVY);
        doc.text(termLines, gx2, gy2 + 4.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(defLines, gx2, gy2 + 4.5 + termLines.length * 4.5);
        gRightY = gy2 + entryH;
        continue;
      } else {
        newPage();
        sectionHeading("GLOSSARY OF TERMS (continued)");
        gColY = y;
        gRightY = y;
        gCol = 0;
      }
    }

    const gxFinal = gCol === 0 ? M : M + gColW + 6;
    const gyFinal = gCol === 0 ? gColY : gRightY;
    doc.setFillColor(248, 252, 252);
    doc.roundedRect(gxFinal, gyFinal, gColW, entryH, 1.5, 1.5, "F");
    doc.setFillColor(...TEAL);
    doc.rect(gxFinal, gyFinal, 2.5, entryH, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(termLines, gxFinal + 5, gyFinal + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(defLines, gxFinal + 5, gyFinal + 5 + termLines.length * 4.5);

    if (gCol === 0) {
      gColY += entryH + 3;
      gCol = 1;
    } else {
      gRightY += entryH + 3;
      gCol = 0;
      y = Math.max(gColY, gRightY);
    }
  }
  y = Math.max(gColY, gRightY) + 4;
  doc.setTextColor(...DARK);
  drawFooter();

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE — LEGAL DISCLAIMERS
  // ═══════════════════════════════════════════════════════════════════════════
  newPage();
  sectionHeading("IMPORTANT LEGAL DISCLAIMERS");

  // Red warning box
  checkBreak(22);
  doc.setFillColor(255, 235, 235);
  doc.roundedRect(M, y, CW, 18, 2, 2, "F");
  doc.setFillColor(200, 0, 0);
  doc.rect(M, y, 3, 18, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 0, 0);
  doc.text("IMPORTANT — PLEASE READ CAREFULLY", M + 7, y + 6);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 0, 0);
  doc.text("This document is provided for informational and educational purposes only. It is not legal advice, medical advice,", M + 7, y + 12);
  doc.text("or a guarantee of insurance benefits. Individual circumstances may vary significantly.", M + 7, y + 16.5);
  doc.setTextColor(...DARK);
  y += 24;

  const disclaimers = [
    {
      title: "No Guarantee of Benefits",
      text: "This guide does not guarantee approval of your claim or payment of benefits. Insurance carriers make independent determinations based on policy terms, medical necessity, and other factors. Claim approval is never guaranteed.",
    },
    {
      title: "Policy-Specific Terms Apply",
      text: "Each long-term care insurance policy is unique. The strategies outlined in this document are general guidelines and may not apply to every situation. Always consult your policy documents and your insurance carrier directly to confirm all details specific to your policy.",
    },
    {
      title: "SC Visiting Angels Disclaimer",
      text: "SC Visiting Angels is not responsible for the accuracy, completeness, or applicability of this strategy guide to your specific situation. We strongly recommend consulting with your insurance carrier, an elder law attorney, or a licensed insurance professional who can review your specific policy and circumstances.",
    },
    {
      title: "Professional Consultation Recommended",
      text: "For complex situations, we recommend consulting with an elder law attorney, financial advisor, or licensed insurance professional who can review your specific policy and circumstances before making any decisions.",
    },
    {
      title: "Limitation of Liability",
      text: "SC Visiting Angels and its representatives shall not be liable for any damages, losses, or claims arising from the use or reliance on this document, including but not limited to direct, indirect, incidental, consequential, or punitive damages.",
    },
    {
      title: "Regulatory Notice",
      text: "Insurance regulations, coverage terms, and benefit amounts may change. Please verify all information with your insurance carrier before making any decisions. This document reflects information provided at the time of generation and may not reflect subsequent policy changes.",
    },
  ];

  for (const d of disclaimers) {
    const dlines = doc.splitTextToSize(d.text, CW - 12);
    const dH = dlines.length * 4.5 + 10;
    checkBreak(dH);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(M, y, CW, dH, 2, 2, "F");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, dH, 2, 2, "D");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(d.title, M + 5, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(dlines, M + 5, y + 11);
    y += dH + 4;
  }

  // Final signature line
  checkBreak(20);
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + CW, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}  |  Prepared for: ${data.insuredName}  |  Policy: ${data.policyNumber}  |  Carrier: ${data.carrierName}`,
    PW / 2, y, { align: "center" }
  );
  y += 5;
  doc.text(
    `© ${new Date().getFullYear()} SC Visiting Angels  ·  www.scvisitingangels.com  ·  All rights reserved.`,
    PW / 2, y, { align: "center" }
  );
  drawFooter();

  // ── Return buffer ────────────────────────────────────────────────────────────
  const ab = doc.output("arraybuffer");
  return Buffer.from(ab);
}

// Keep backward compat stub
export async function convertHtmlToPdf(_html: string): Promise<Buffer> {
  throw new Error("Use generatePdfBuffer() instead of convertHtmlToPdf()");
}
