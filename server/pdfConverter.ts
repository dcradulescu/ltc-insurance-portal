// ─────────────────────────────────────────────────────────────────────────────
// SC Visiting Angels — Personalized LTC Insurance Planner
// Landscape letter, full VA brand aesthetic, embedded logo, pastel section
// boxes, literal checkboxes, notes lines, educational section, zero wasted space
// ─────────────────────────────────────────────────────────────────────────────
import { jsPDF } from "jspdf";
import { VA_LOGO_BASE64 } from "./vaLogoBase64";
import { buildClaimSchedule, parseEliminationDays } from "../shared/claimSchedule";
import type { CareInputs } from "../shared/careCalculator";

// ── Brand palette (Visiting Angels exact colors) ──────────────────────────────
const VA_TEAL:    [number,number,number] = [59,  191, 191];  // #3BBFBF
const VA_NAVY:    [number,number,number] = [27,  79,  138];  // #1B4F8A
const VA_LTBLUE:  [number,number,number] = [230, 244, 250];  // pastel blue
const VA_LTGREEN: [number,number,number] = [225, 245, 235];  // pastel green
const VA_CREAM:   [number,number,number] = [255, 252, 240];  // warm cream
const VA_LAVEND:  [number,number,number] = [240, 235, 255];  // soft lavender
const VA_AMBER:   [number,number,number] = [255, 248, 220];  // soft amber
const VA_ROSE:    [number,number,number] = [255, 235, 235];  // soft rose
const WHITE:      [number,number,number] = [255, 255, 255];
const DARK:       [number,number,number] = [40,  40,  40];
const MID:        [number,number,number] = [90,  90,  90];
const RULE:       [number,number,number] = [200, 215, 225];

// ── Page geometry (landscape letter) ─────────────────────────────────────────
const PW = 279.4;
const PH = 215.9;
const M  = 14;       // left/right margin
const CW = PW - M * 2;
const HEADER_H = 16;
const FOOTER_H = 10;
const CONTENT_TOP = HEADER_H + 6;
const CONTENT_BOT = PH - FOOTER_H - 4;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(val: number): string {
  if (!val || isNaN(val)) return "N/A";
  return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(d: Date): string {
  const mo = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${mo[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Full data interface ───────────────────────────────────────────────────────
export interface PdfData {
  insuredName: string;
  insuredDob?: string;
  insuredPhone?: string;
  insuredEmail?: string;
  insuredAddress?: string;
  policyNumber: string;
  claimNumber?: string;
  carrierName: string;
  carrierPhone?: string;
  eliminationPeriod?: string;
  dailyMaximum: number;
  monthlyMaximum: number;
  lifetimeMaximum: number;
  minAdlsRequired?: number;
  waiverOfPremium?: string;
  assignmentOfBenefits?: string;
  adlLimitations: string[];
  diagnosisCheckboxes?: string[];
  cognitiveImpairmentTrigger?: string;
  stage1Tasks: string[];
  stage2Tasks: string[];
  stage3Tasks: string[];
  stage1TaskIds?: string[];
  stage2TaskIds?: string[];
  stage3TaskIds?: string[];
  planStartDate?: string;
  taskCompletionDates?: Array<{ taskId: string; completed: boolean; completedAt?: string | null }>;
  careRecommendations?: string;
  strategyContent?: string;
  diagnosis?: string;
  caseManagerName?: string;
  thirdPartyAssessmentRequired?: string;
  careInputs?: CareInputs;
  issueDate?: string;
  policyStatus?: string;
  benefitPeriod?: string;
  inflationRate?: number;
  claimsAddress1?: string;
  claimsAddress2?: string;
  claimsCityStateZip?: string;
  claimsFax?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function generatePdfBuffer(data: PdfData): Buffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  let y = CONTENT_TOP;
  let pageNum = 0;

  // ── Page header ─────────────────────────────────────────────────────────────
  function drawHeader(sectionTitle = "") {
    // Teal top bar
    doc.setFillColor(...VA_TEAL);
    doc.rect(0, 0, PW, HEADER_H, "F");
    // Navy left accent stripe
    doc.setFillColor(...VA_NAVY);
    doc.rect(0, 0, 5, HEADER_H, "F");
    // Logo text
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("SC Visiting Angels", 9, 7);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("www.scvisitingangels.com  ·  Living Assistance Services", 9, 13);
    // Section title centre
    if (sectionTitle) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(sectionTitle.toUpperCase(), PW / 2, 9.5, { align: "center" });
    }
    // Right: insured name + page
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 245, 245);
    doc.text(`${data.insuredName}  ·  Policy ${data.policyNumber}`, PW - M, 7, { align: "right" });
    doc.text(`Page ${pageNum}`, PW - M, 13, { align: "right" });
    doc.setTextColor(...DARK);
  }

  // ── Page footer ─────────────────────────────────────────────────────────────
  function drawFooter() {
    const fy = PH - FOOTER_H - 1;
    doc.setFillColor(245, 250, 252);
    doc.rect(0, fy, PW, FOOTER_H + 1, "F");
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(M, fy + 1, PW - M, fy + 1);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MID);
    doc.text(
      "This planner is for educational and informational purposes only. It is not legal or medical advice. SC Visiting Angels · www.scvisitingangels.com",
      PW / 2, fy + 5.0, { align: "center" }
    );
    doc.text(
      `Generated ${fmtDate(new Date())}  ·  Confidential — Prepared exclusively for ${data.insuredName}`,
      PW / 2, fy + 9.0, { align: "center" }
    );
    doc.setTextColor(...DARK);
  }

  // ── New page ─────────────────────────────────────────────────────────────────
  let currentSection = "";
  function newPage(sectionTitle?: string) {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    if (sectionTitle) currentSection = sectionTitle;
    drawHeader(currentSection);
    drawFooter();
    y = CONTENT_TOP;
  }

  function checkBreak(needed: number) {
    if (y + needed > CONTENT_BOT) newPage();
  }

  // ── Section heading (full-width pastel band) ─────────────────────────────────
  function sectionHeading(title: string, icon: string, bgColor: [number,number,number] = VA_LTBLUE, textColor: [number,number,number] = VA_NAVY) {
    checkBreak(13);
    doc.setFillColor(...bgColor);
    doc.roundedRect(M, y, CW, 11, 2, 2, "F");
    doc.setFillColor(...VA_TEAL);
    doc.rect(M, y, 4, 11, "F");
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textColor);
    const safeIcon = /^[!-~]{1,3}$/.test(icon) ? icon : "";
    doc.text(safeIcon ? safeIcon + "  " + title : title, M + 8, y + 7.5);
    doc.setTextColor(...DARK);
    y += 15;
  }

  // ── Sub-heading ──────────────────────────────────────────────────────────────
  function subHeading(title: string, color: [number,number,number] = VA_NAVY) {
    checkBreak(9);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(title, M, y);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.35);
    doc.line(M, y + 1.5, M + CW, y + 1.5);
    doc.setTextColor(...DARK);
    y += 7;
  }

  // ── Body text ────────────────────────────────────────────────────────────────
  function bodyText(text: string, indent = 0, fontSize = 9, color: [number,number,number] = DARK) {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW - indent);
    for (const line of lines) {
      checkBreak(5.5);
      doc.text(line, M + indent, y);
      y += 5;
    }
    y += 1.5;
  }

  // ── Pastel info card ─────────────────────────────────────────────────────────
  function infoCard(lines: string[], bg: [number,number,number], accent: [number,number,number], icon = "") {
    const lineH = 4.6;
    doc.setFontSize(8.4);
    doc.setFont("helvetica", "normal");
    const wrapped = lines.flatMap(line => doc.splitTextToSize(line, CW - (icon ? 27 : 12)));
    const boxH = wrapped.length * lineH + 9;
    checkBreak(boxH);
    doc.setFillColor(...bg);
    doc.roundedRect(M, y, CW, boxH, 2.5, 2.5, "F");
    doc.setFillColor(...accent);
    doc.rect(M, y, 4, boxH, "F");
    doc.setTextColor(...DARK);
    if (icon && /^[!-~]{1,3}$/.test(icon)) {
      doc.setFontSize(9);
      doc.text(icon, M + 7, y + 6);
    }
    doc.setFontSize(8.4);
    for (let i = 0; i < wrapped.length; i++) {
      doc.text(wrapped[i], M + (icon ? 16 : 7), y + 5.5 + i * lineH);
    }
    y += boxH + 3;
  }

  // ── Two-column layout helpers ────────────────────────────────────────────────
  const COL2W = (CW - 6) / 2;
  const COL2R = M + COL2W + 6;

  function twoColRow(leftLabel: string, leftVal: string, rightLabel: string, rightVal: string, bg?: [number,number,number]) {
    type Cell = { x: number; label: string; valueLines: string[]; stacked: boolean; width: number; height: number };
    const cell = (x: number, label: string, value: string): Cell => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const width = doc.getTextWidth(label + ":");
      const stacked = width > 32;
      doc.setFont("helvetica", "normal");
      const available = stacked ? COL2W - 6 : COL2W - width - 10;
      const valueLines = doc.splitTextToSize(value || "—", Math.max(12, available));
      const height = Math.max(7.5, (stacked ? 5 : 0) + valueLines.length * 4 + 2.8);
      return { x, label, valueLines, stacked, width, height };
    };
    const left = cell(M, leftLabel, leftVal);
    const right = cell(COL2R, rightLabel, rightVal);
    const rowH = Math.max(left.height, right.height);
    checkBreak(rowH);
    if (bg) {
      doc.setFillColor(...bg);
      doc.roundedRect(M, y - 1, CW, rowH, 1, 1, "F");
    }
    for (const current of [left, right]) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...VA_NAVY);
      doc.text(current.label + ":", current.x + 2, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      const valX = current.stacked ? current.x + 2 : current.x + current.width + 7;
      const valY = y + (current.stacked ? 8.8 : 4);
      current.valueLines.forEach((line, i) => doc.text(line, valX, valY + 4 * i));
    }
    y += rowH;
  }

  // ── Literal checkbox row ─────────────────────────────────────────────────────
  function checkRow(task: string, critical = false, indent = 0, note = "") {
    const availW = CW - indent - 10;
    doc.setFontSize(8.3);
    const lines = doc.splitTextToSize(task, availW - (critical ? 18 : 0));
    const lineH = 4.25;
    const rowH = Math.max(lines.length * lineH + 2.2, 6.5);
    checkBreak(rowH + (note ? 5 : 0));
    const cx = M + indent + 1;
    const cy = y + 0.8;
    doc.setDrawColor(...VA_NAVY);
    doc.setLineWidth(0.4);
    doc.rect(cx, cy, 4.2, 4.2);
    doc.setFont("helvetica", critical ? "bold" : "normal");
    doc.setTextColor(critical ? VA_NAVY[0] : DARK[0], critical ? VA_NAVY[1] : DARK[1], critical ? VA_NAVY[2] : DARK[2]);
    for (let i = 0; i < lines.length; i++) doc.text(lines[i], cx + 7, cy + 3.4 + i * lineH);
    if (critical) {
      doc.setFontSize(6.5);
      doc.setTextColor(...VA_TEAL);
      const textW = doc.getTextWidth(lines[0]);
      if (textW + 25 < availW) doc.text("PRIORITY", cx + 9 + textW, cy + 3.4);
      doc.setTextColor(...DARK);
    }
    y += rowH;
    if (note) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...MID);
      doc.text(note, cx + 7, y);
      y += 5;
    }
  }

  // ── Notes lines ──────────────────────────────────────────────────────────────
  function notesLines(count = 3, label = "Notes:") {
    // Do not create orphan pages solely for optional blank note lines.
    const numberOfLines = Math.min(count, Math.floor((CONTENT_BOT - y - 9) / 7));
    if (numberOfLines < 1) return;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VA_NAVY);
    doc.text(label, M, y + 4);
    y += 7;
    for (let i = 0; i < numberOfLines; i++) {
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.25);
      doc.line(M + 18, y + 4, M + CW, y + 4);
      y += 7;
    }
    y += 1;
  }

  // ── Benefit box (large card) ─────────────────────────────────────────────────
  function benefitBox(x: number, bw: number, label: string, value: string, sub: string, bg: [number,number,number], accent: [number,number,number]) {
    const bh = 30;
    doc.setFillColor(...bg);
    doc.roundedRect(x, y, bw, bh, 3, 3, "F");
    doc.setFillColor(...accent);
    doc.roundedRect(x, y, bw, 7, 3, 3, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(label.toUpperCase(), x + bw / 2, y + 5, { align: "center" });
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...accent);
    doc.text(value, x + bw / 2, y + 20, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    doc.text(sub, x + bw / 2, y + 27, { align: "center" });
  }

  // ── Stage header band ────────────────────────────────────────────────────────
  function stageHeader(num: number, title: string, desc: string, bg: [number,number,number], accent: [number,number,number]) {
    checkBreak(20);
    doc.setFillColor(...bg);
    doc.roundedRect(M, y, CW, 16, 2.5, 2.5, "F");
    doc.setFillColor(...accent);
    doc.roundedRect(M, y, 10, 16, 2.5, 2.5, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(String(num), M + 5, y + 11, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...accent);
    doc.text(title, M + 14, y + 7);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const descLines = doc.splitTextToSize(desc, CW - 16);
    doc.text(descLines[0], M + 14, y + 13);
    y += 20;
  }

  // ── Gantt ruler ──────────────────────────────────────────────────────────────
  const gLabelW   = 115;
  const gBarAreaW = CW - gLabelW - 4;
  const gBarX     = M + gLabelW + 4;
  const gRowH     = 6.35;
  const gRulerH   = 11;

  function drawGanttRuler(totalDays: number, markers: number[]) {
    doc.setFillColor(225, 240, 248);
    doc.rect(M, y, CW, gRulerH, "F");
    doc.setFillColor(200, 225, 240);
    doc.rect(M, y, gLabelW, gRulerH, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VA_NAVY);
    doc.text("Task / Action Item", M + 3, y + gRulerH / 2 + 2);
    doc.setTextColor(60, 80, 120);
    let lastLabelX = -Infinity;
    for (const md of markers) {
      const mx = gBarX + (md / totalDays) * gBarAreaW;
      if (mx - lastLabelX < 13) continue;
      lastLabelX = mx;
      doc.text(`Day ${md}`, mx, y + gRulerH / 2 + 2, { align: "center" });
      doc.setDrawColor(160, 190, 210);
      doc.setLineWidth(0.15);
      doc.line(mx, y + gRulerH, mx, y + gRulerH + 2);
    }
    doc.setTextColor(...DARK);
    y += gRulerH + 2;
  }

  function drawGanttRow(label: string, startDay: number, durDays: number, totalDays: number, color: [number,number,number], rowIdx: number, markers: number[]) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const labelLines = doc.splitTextToSize(label, gLabelW - 6);
    const rowH = Math.max(gRowH, labelLines.length * 3.15 + 1.7);
    if (y + rowH + 1 > CONTENT_BOT) {
      newPage("Claim Timeline");
      sectionHeading("CLAIM TIMELINE (continued)", "", VA_LTBLUE, VA_NAVY);
      drawGanttRuler(totalDays, markers);
    }
    if (rowIdx % 2 === 0) {
      doc.setFillColor(248, 253, 255);
      doc.rect(M, y, CW, rowH, "F");
    }
    doc.setDrawColor(210, 225, 235);
    doc.setLineWidth(0.1);
    for (const md of markers) {
      const mx = gBarX + (md / totalDays) * gBarAreaW;
      doc.line(mx, y, mx, y + rowH);
    }
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(labelLines, M + 3, y + 3.2);
    const trackY = y + rowH / 2 - 2.35;
    doc.setFillColor(215, 228, 238);
    doc.roundedRect(gBarX, trackY, gBarAreaW, 4.7, 1.0, 1.0, "F");
    const barStartX = gBarX + (startDay / totalDays) * gBarAreaW;
    const barW = Math.max((durDays / totalDays) * gBarAreaW, 4);
    doc.setFillColor(...color);
    doc.roundedRect(barStartX, trackY, barW, 4.7, 1.0, 1.0, "F");
    if (barW > 18) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(String(startDay) + "-" + String(startDay + durDays) + "d", barStartX + barW / 2, trackY + 3.3, { align: "center" });
    }
    doc.setDrawColor(200, 215, 225);
    doc.setLineWidth(0.1);
    doc.line(M, y + rowH, M + CW, y + rowH);
    doc.setTextColor(...DARK);
    y += rowH + 0.55;
  }

  // ── Education block ──────────────────────────────────────────────────────────
  function eduBlock(title: string, body: string, bg: [number,number,number], accent: [number,number,number]) {
    const blines = doc.splitTextToSize(body, CW - 14);
    const bh = blines.length * 4.8 + 13;
    checkBreak(bh);
    doc.setFillColor(...bg);
    doc.roundedRect(M, y, CW, bh, 2.5, 2.5, "F");
    doc.setFillColor(...accent);
    doc.rect(M, y, 4, bh, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VA_NAVY);
    doc.text(title, M + 7, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 60);
    doc.text(blines, M + 7, y + 12);
    y += bh + 4;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 1 — COVER
  // ─────────────────────────────────────────────────────────────────────────────
  pageNum++;
  // Full teal-to-navy gradient simulation (two rects)
  doc.setFillColor(...VA_NAVY);
  doc.rect(0, 0, PW, PH, "F");
  doc.setFillColor(...VA_TEAL);
  doc.rect(0, 0, PW, PH * 0.45, "F");
  // White diagonal divider
  doc.setFillColor(...WHITE);
  const diagPoints = [[0, PH * 0.42], [PW, PH * 0.35], [PW, PH * 0.45], [0, PH * 0.52]];
  // Simulate diagonal with a polygon using lines
  doc.setFillColor(255, 255, 255);
  doc.rect(0, PH * 0.42, PW, PH * 0.1, "F");

  // VA Logo (top left)
  try {
    doc.addImage(VA_LOGO_BASE64, "JPEG", 12, 8, 55, 34);
  } catch {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("Visiting Angels", 14, 20);
  }

  // Planner title
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("PERSONALIZED LTC", PW / 2, PH * 0.18, { align: "center" });
  doc.text("INSURANCE PLANNER", PW / 2, PH * 0.18 + 14, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(210, 240, 240);
  doc.setFont("helvetica", "normal");
  doc.text("Your Step-by-Step Guide to Navigating Your Claim", PW / 2, PH * 0.18 + 26, { align: "center" });

  // Personalized info block (on white band)
  const infoY = PH * 0.46;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...VA_NAVY);
  doc.text("Prepared exclusively for:", PW / 2, infoY + 4, { align: "center" });
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...VA_TEAL);
  doc.text(data.insuredName, PW / 2, infoY + 14, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  doc.text(`Policy #: ${data.policyNumber}  ·  Carrier: ${data.carrierName}  ·  Generated: ${fmtDate(new Date())}`, PW / 2, infoY + 21, { align: "center" });

  // Bottom navy section — what's inside
  const botY = PH * 0.62;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 220, 220);
  doc.text("THIS PLANNER INCLUDES:", PW / 2, botY, { align: "center" });
  const sections = [
    "Executive Summary  ·  Policy Summary  ·  Benefit Summary",
    "Qualifying Conditions  ·  Three-Stage Claim Checklist",
    "Gantt Timeline  ·  Care Services Guide  ·  Glossary of Terms",
    "LTC Education & Resources  ·  Legal Disclaimers"
  ];
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(210, 235, 235);
  for (let i = 0; i < sections.length; i++) {
    doc.text(sections[i], PW / 2, botY + 7 + i * 6, { align: "center" });
  }

  // SC Visiting Angels footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...VA_TEAL);
  doc.text("SC Visiting Angels  ·  www.scvisitingangels.com  ·  America's Choice in Home Care®", PW / 2, PH - 8, { align: "center" });

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 2 — EXECUTIVE SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Executive Summary");
  sectionHeading("EXECUTIVE SUMMARY", "★", VA_LTBLUE, VA_NAVY);

  bodyText(
    `This personalized LTC Insurance Planner has been prepared exclusively for ${data.insuredName} to guide you through every step of your long-term care insurance claim with ${data.carrierName}. ` +
    `This planner is a planning reference — from gathering documents before you file, through the formal claim submission, to managing ongoing benefits after approval.`
  );
  y += 2;

  // 3-column benefit summary cards
  checkBreak(36);
  const bw3 = (CW - 8) / 3;
  const bgs: [number,number,number][] = [VA_LTBLUE, VA_LTGREEN, VA_CREAM];
  const accents: [number,number,number][] = [VA_TEAL, [60,160,100], [200,150,40]];
  const bLabels = ["Daily Maximum", "Monthly Maximum", "Lifetime Maximum"];
  const bVals = [fmtCurrency(data.dailyMaximum), fmtCurrency(data.monthlyMaximum), fmtCurrency(data.lifetimeMaximum)];
  const bSubs = ["Max paid per day", "Max paid per month", "Total benefit pool"];
  for (let i = 0; i < 3; i++) {
    benefitBox(M + i * (bw3 + 4), bw3, bLabels[i], bVals[i], bSubs[i], bgs[i], accents[i]);
  }
  y += 36;

  // Key policy facts
  subHeading("Key Policy Facts");
  twoColRow("Insurance Carrier", data.carrierName, "Policy Number", data.policyNumber, VA_LTBLUE);
  twoColRow("Elimination Period", `${data.eliminationPeriod || "N/A"} days`, "Min. ADLs Required", data.minAdlsRequired !== undefined ? `${data.minAdlsRequired} ADL(s)` : "N/A");
  twoColRow("Waiver of Premium", data.waiverOfPremium === "yes" ? "Possible waiver; confirm activation" : data.waiverOfPremium === "no" ? "No" : "N/A", "Assignment of Benefits", data.assignmentOfBenefits === "yes" ? "Potential direct billing; verify acceptance" : data.assignmentOfBenefits === "no" ? "No — reimbursement" : "N/A", VA_LTBLUE);
  twoColRow("Case Manager", data.caseManagerName || "Not yet assigned", "Carrier Phone", data.carrierPhone || "N/A");
  y += 2;

  if (data.strategyContent) {
    subHeading("Strategy Overview");
    const stripped = data.strategyContent.replace(/[#*`_~\[\]]/g, "").substring(0, 600);
    bodyText(stripped + (data.strategyContent.length > 600 ? "…" : ""), 0, 9);
  }

  infoCard([
    "IMPORTANT: Keep this planner in a safe, accessible location. Share a copy with your Power of Attorney and",
    "primary family caregiver. Review it before every call with your insurance carrier."
  ], VA_AMBER, [200, 150, 30], "!");
  notesLines(2, "Your notes:");

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 3 — POLICY SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Policy Summary");
  sectionHeading("POLICY SUMMARY", "📋", VA_LTGREEN, VA_NAVY);

  subHeading("Insured Information");
  twoColRow("Full Legal Name", data.insuredName, "Date of Birth", data.insuredDob || "—", VA_LTBLUE);
  twoColRow("Phone Number", data.insuredPhone || "—", "Email Address", data.insuredEmail || "—");
  twoColRow("Mailing Address", data.insuredAddress || "—", "Claim / Pre-Claim #", data.claimNumber || "Not yet assigned", VA_LTBLUE);
  y += 3;

  subHeading("Insurance Carrier Information");
  twoColRow("Carrier Name", data.carrierName, "Claims Phone", data.carrierPhone || "—", VA_LTBLUE);
  twoColRow("Policy Number", data.policyNumber, "Case Manager", data.caseManagerName || "Not yet assigned");
  twoColRow("Third-Party Assessment", data.thirdPartyAssessmentRequired === "yes" ? "Required — schedule promptly" : data.thirdPartyAssessmentRequired === "no" ? "Not required" : "—", "Assessment Status", "[ ] Scheduled  [ ] Completed", VA_LTBLUE);
  y += 3;

  subHeading("Coverage Details");
  twoColRow("Elimination Period", `${data.eliminationPeriod || "N/A"} days`, "Daily Maximum Benefit", fmtCurrency(data.dailyMaximum), VA_LTBLUE);
  twoColRow("Monthly Maximum Benefit", fmtCurrency(data.monthlyMaximum), "Lifetime Maximum Benefit", fmtCurrency(data.lifetimeMaximum));
  twoColRow("Minimum ADLs to Qualify", data.minAdlsRequired !== undefined ? `${data.minAdlsRequired} of 6 ADLs` : "—", "Cognitive Impairment Trigger", data.cognitiveImpairmentTrigger === "yes" ? "Potential cognitive trigger; verify severity" : data.cognitiveImpairmentTrigger === "no" ? "No" : "—", VA_LTBLUE);
  twoColRow("Waiver of Premium", data.waiverOfPremium === "yes" ? "Yes" : data.waiverOfPremium === "no" ? "No" : "—", "Assignment of Benefits (AOB)", data.assignmentOfBenefits === "yes" ? "Potential AOB; confirm carrier and provider" : data.assignmentOfBenefits === "no" ? "No — reimbursement model" : "—");
  y += 3;

  notesLines(3, "Policy notes:");

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 4 — BENEFIT SUMMARY & QUALIFYING CONDITIONS
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Benefit Summary");
  sectionHeading("BENEFIT SUMMARY", "💰", VA_CREAM, VA_NAVY);

  // Large benefit cards
  checkBreak(36);
  for (let i = 0; i < 3; i++) {
    benefitBox(M + i * (bw3 + 4), bw3, bLabels[i], bVals[i], bSubs[i], bgs[i], accents[i]);
  }
  y += 36;

  // Benefit detail rows
  subHeading("How Your Benefits Work");
  const elimDays = parseEliminationDays(data.eliminationPeriod);
  const eliminationLabel = elimDays === null ? "unverified" : String(elimDays);
  infoCard([
    "Elimination period: " + eliminationLabel + " days; counting may be calendar days or qualifying service days depending on the issued policy.",
    "The waiting period does not itself establish benefits. Carrier approval and other policy requirements must be verified.",
    "Maximum daily projection over 30 days: " + (data.dailyMaximum > 0 ? fmtCurrency(data.dailyMaximum * 30) : "unavailable") +
      (data.monthlyMaximum > 0 ? ". A separately stated monthly cap of " + fmtCurrency(data.monthlyMaximum) + " may limit payments." : ". Confirm whether a monthly cap applies."),
  ], VA_LTBLUE, VA_TEAL);

  if (data.assignmentOfBenefits === "yes") {
    infoCard([
      "The intake indicates that an Assignment of Benefits provision may be available.",
      "Direct carrier payment is not confirmed until the carrier accepts the AOB and recognizes the selected provider.",
      "The insured may still owe the provider until direct payment is verified."
    ], VA_LTGREEN, [60, 160, 100] as [number,number,number]);
  }

  sectionHeading("QUALIFYING CONDITIONS", "✓", VA_LAVEND, VA_NAVY);
  subHeading("ADL Deficits (Activities of Daily Living)");
  if (data.adlLimitations && data.adlLimitations.filter(a => !a.startsWith("None")).length > 0) {
    const adls = data.adlLimitations.filter(a => !a.startsWith("None"));
    const cols = 3;
    const adlW = CW / cols;
    checkBreak(Math.ceil(adls.length / cols) * 8 + 4);
    for (let i = 0; i < adls.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ax = M + col * adlW;
      const ay = y + row * 8;
      doc.setDrawColor(...VA_NAVY);
      doc.setLineWidth(0.5);
      doc.rect(ax + 1, ay, 4.5, 4.5);
      doc.setFillColor(...VA_TEAL);
      doc.rect(ax + 1, ay, 4.5, 4.5, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text("X", ax + 2.5, ay + 3.5);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(adls[i], ax + 8, ay + 3.5);
    }
    y += Math.ceil(adls.length / cols) * 8 + 6;
  } else {
    bodyText("No ADL deficits recorded.", 0, 9, MID);
  }

  if (data.diagnosisCheckboxes && data.diagnosisCheckboxes.length > 0) {
    subHeading("Primary Diagnoses");
    for (const dx of data.diagnosisCheckboxes) {
      checkBreak(7);
      doc.setDrawColor(...VA_NAVY);
      doc.setLineWidth(0.5);
      doc.rect(M + 1, y - 1, 4.5, 4.5);
      doc.setFillColor(...VA_TEAL);
      doc.rect(M + 1, y - 1, 4.5, 4.5, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text("X", M + 2.5, y + 2.5);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(dx, M + 8, y + 2.5);
      y += 7;
    }
    y += 3;
  }

  if (data.cognitiveImpairmentTrigger === "yes") {
    infoCard([
      "The intake indicates a possible cognitive-impairment benefit provision.",
      "Benefit eligibility depends on severity, supervision needs, policy language and the carrier's review.",
      "A diagnosis alone does not establish approval. Document limitations with treating providers."
    ], VA_AMBER, [200, 150, 30] as [number,number,number]);
  }

  if (y + 16 < CONTENT_BOT) notesLines(1, "Qualifying condition notes:");

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGES 5-7 — THREE-STAGE CLAIM CHECKLIST
  // ─────────────────────────────────────────────────────────────────────────────
  const stageConfig = [
    {
      num: 1,
      title: "STAGE 1: PRIOR TO CLAIM SUBMISSION",
      desc: `Gather documentation, establish medical necessity, and verify filing prerequisites.`,
      tasks: data.stage1Tasks,
      bg: VA_LTBLUE as [number,number,number],
      accent: VA_TEAL as [number,number,number],
      noteLabel: "Stage 1 notes:"
    },
    {
      num: 2,
      title: "STAGE 2: FILING THE CLAIM",
      desc: `Assemble and submit the claim packet; carrier review duration varies.`,
      tasks: data.stage2Tasks,
      bg: VA_LTGREEN as [number,number,number],
      accent: [60, 160, 100] as [number,number,number],
      noteLabel: "Stage 2 notes:"
    },
    {
      num: 3,
      title: "STAGE 3: POST-APPROVAL & ONGOING CARE",
      desc: `After confirmed carrier approval, maintain benefits and documentation.`,
      tasks: data.stage3Tasks,
      bg: VA_LAVEND as [number,number,number],
      accent: [120, 80, 200] as [number,number,number],
      noteLabel: "Stage 3 notes:"
    }
  ];

  for (const stage of stageConfig) {
    newPage("Claim Checklist");
    sectionHeading(`${stage.title}`, "☑", stage.bg, VA_NAVY);
    bodyText(stage.desc, 0, 9, MID);
    y += 2;
    for (const task of stage.tasks) {
      const isCritical = /carrier|physician|assessment|packet|submit|elimination|invoice|aob|hipaa|claim number|authorization/i.test(task);
      checkRow(task, isCritical);
    }
    y += 3;
    if (y + 16 < CONTENT_BOT) notesLines(1, stage.noteLabel);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGES — GANTT TIMELINE (one page per stage)
  // ─────────────────────────────────────────────────────────────────────────────
  const idGroups = [data.stage1TaskIds, data.stage2TaskIds, data.stage3TaskIds];
  const knownIds = idGroups.flatMap(group => group ?? []);
  const schedule = buildClaimSchedule(elimDays, {
    planStartDate: data.planStartDate,
    completedTasks: data.taskCompletionDates,
    activeTaskIds: knownIds.length > 0 ? knownIds : undefined,
  });
  const mapTasks = (labels: string[], ids: string[] | undefined) => labels.map((label, i) => {
    const id = ids?.[i];
    const known = !!(id && schedule[id]);
    const [start, dur] = known ? schedule[id!] : [0, 1];
    return { label: known ? label : label + " (date unverified)", start, dur, known };
  });
  const ganttStages = [
    {
      stageNum: 1, title: "Stage 1: Prior to Claim",
      desc: "Estimated preparation dates; prerequisite completion may move dependent activities.",
      color: VA_TEAL as [number,number,number],
      tasks: mapTasks(data.stage1Tasks, data.stage1TaskIds),
    },
    {
      stageNum: 2, title: "Stage 2: Filing the Claim",
      desc: "Estimated packet preparation, submission and review; carrier response times are unverified.",
      color: [60, 160, 100] as [number,number,number],
      tasks: mapTasks(data.stage2Tasks, data.stage2TaskIds),
    },
    {
      stageNum: 3, title: "Stage 3: Post-Approval",
      desc: "Estimated activities only. Carrier claim approval is NOT confirmed by this schedule.",
      color: [120, 80, 200] as [number,number,number],
      tasks: mapTasks(data.stage3Tasks, data.stage3TaskIds),
    },
  ];
  const totalDays = Math.max(90, ...ganttStages.flatMap(stage => stage.tasks.map(t => t.start + t.dur + 7)));
  const allMarkers = [0, 7, 14, 21, 28, 35, 42, 56, 70, 90, 120, 150, 180, 270, 365];
  const gMarkers = allMarkers.filter(d => d <= totalDays);

  for (const gs of ganttStages) {
    newPage("Claim Timeline");
    sectionHeading(`CLAIM TIMELINE — ${gs.title.toUpperCase()}`, "📅", VA_LTBLUE, VA_NAVY);
    bodyText(gs.desc, 0, 9, MID);
    y += 2;
    bodyText("Plan day 0 = selected planning date (strategy creation fallback). Dates are estimates, not carrier determinations. Elimination days are not presumed calendar days.", 0, 7.2, MID);
    drawGanttRuler(totalDays, gMarkers);
    gs.tasks.forEach((t, idx) => drawGanttRow(t.label, t.start, t.dur, totalDays, gs.color, idx, gMarkers));
    y += 4;

  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE — SC VISITING ANGELS HOME CARE SERVICES
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Care Services");
  sectionHeading("HOME CARE WITH SC VISITING ANGELS", "🏠", VA_LTGREEN, VA_NAVY);
  bodyText(
    "SC Visiting Angels provides professional, compassionate home care services tailored to your long-term care insurance policy. " +
    "Our experienced caregivers are trained to work within the LTC insurance framework — ensuring your benefits are maximized, " +
    "documentation requirements are met, and your loved one receives the highest quality of care at home."
  );
  y += 2;

  const careServices = [
    { title: "Personal Care (ADL Assistance)", desc: "Hands-on help with bathing, dressing, grooming, toileting, feeding, and safe mobility/transferring. Directly supports ADL benefit triggers.", bg: VA_LTBLUE as [number,number,number], accent: VA_TEAL as [number,number,number] },
    { title: "Companion Care (IADL Support)", desc: "Meal preparation, medication reminders, light housekeeping, laundry, grocery shopping, errands, and transportation to appointments.", bg: VA_LTGREEN as [number,number,number], accent: [60,160,100] as [number,number,number] },
    { title: "Alzheimer's & Dementia Care", desc: "Specialized cognitive care, memory support, behavioral management, safety supervision, and structured daily routines for cognitive conditions.", bg: VA_LAVEND as [number,number,number], accent: [120,80,200] as [number,number,number] },
    { title: "Respite Care", desc: "Temporary relief for family caregivers — available on flexible hourly or daily schedules to prevent caregiver burnout.", bg: VA_CREAM as [number,number,number], accent: [180,130,30] as [number,number,number] },
    { title: "24-Hour & Live-In Care", desc: "Round-the-clock care for complex needs, post-surgery recovery, fall risk, or end-of-life support.", bg: VA_ROSE as [number,number,number], accent: [180,60,60] as [number,number,number] },
    { title: "LTC Insurance Documentation Support", desc: "We help maintain care logs, activity records, and invoices in the exact format required by your insurance carrier for claim compliance.", bg: VA_LTBLUE as [number,number,number], accent: VA_TEAL as [number,number,number] },
  ];

  const csW = (CW - 6) / 2;
  for (let i = 0; i < careServices.length; i += 2) {
    const pair = careServices.slice(i, i + 2);
    const descriptions = pair.map(cs => doc.splitTextToSize(cs.desc, csW - 10));
    const cardH = Math.max(...descriptions.map(lines => lines.length * 4.5 + 14));
    checkBreak(cardH + 4);
    const rowY = y;
    pair.forEach((cs, col) => {
      const cx = col === 0 ? M : M + csW + 6;
      doc.setFillColor(...cs.bg);
      doc.roundedRect(cx, rowY, csW, cardH, 2, 2, "F");
      doc.setFillColor(...cs.accent);
      doc.rect(cx, rowY, csW, 3, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...VA_NAVY);
      doc.text(cs.title, cx + 4, rowY + 9);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(descriptions[col], cx + 4, rowY + 14.5);
    });
    y += cardH + 4;
  }
  y += 4;

  // Contact card
  checkBreak(16);
  doc.setFillColor(...VA_TEAL);
  doc.roundedRect(M, y, CW, 14, 2.5, 2.5, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("Contact SC Visiting Angels Today", PW / 2, y + 6, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("www.scvisitingangels.com  ·  www.visitingangels.com  ·  America's Choice in Home Care®", PW / 2, y + 11, { align: "center" });
  doc.setTextColor(...DARK);
  y += 18;

  notesLines(2, "Care service notes:");

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE — GLOSSARY OF TERMS
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Glossary of Terms");
  sectionHeading("GLOSSARY OF TERMS", "📖", VA_CREAM, VA_NAVY);
  bodyText("Use this glossary as a quick reference when reviewing your policy, speaking with your carrier, or working through this planner.");
  y += 2;

  const glossary = [
    { term: "Activities of Daily Living (ADLs)", def: "Six fundamental self-care tasks: Bathing, Dressing, Toileting, Feeding, Continence, and Transferring. Most LTC policies require 2–3 ADLs to be in deficit before benefits begin." },
    { term: "Instrumental Activities of Daily Living (IADLs)", def: "Household and management tasks: Meal Preparation, Medication Management, Housekeeping, Laundry, Shopping, Transportation, Money Management, and Telephone Use. Important for care planning but generally not counted as ADL benefit triggers." },
    { term: "Elimination Period", def: "The policy-defined waiting requirement before benefits can become payable. Some policies count calendar days; others count qualifying paid service days. Verify the issued contract." },
    { term: "Daily Maximum Benefit", def: "The maximum dollar amount the insurance company will pay per day of qualifying care. Care costs above this limit are the client's responsibility." },
    { term: "Monthly Maximum Benefit", def: "The maximum dollar amount the insurance company will pay per calendar month of qualifying care." },
    { term: "Lifetime Maximum Benefit", def: "The total cumulative amount the policy will pay over its lifetime. Once exhausted, no further benefits are available." },
    { term: "Benefit Trigger", def: "The qualifying condition(s) that must be met before the policy pays benefits. Policy triggers depend on the issued contract and can include specified ADL loss or qualifying severe cognitive impairment requiring supervision." },
    { term: "Cognitive Impairment Trigger", def: "A severe cognitive impairment benefit trigger may apply even without the required ADL deficits when the policy's supervision, certification, and eligibility tests are met." },
    { term: "Claim / Pre-Claim Number", def: "A carrier may issue a reference or claim number during intake or review; use the number confirmed by the carrier for each communication." },
    { term: "Case Manager", def: "A carrier representative or clinical case manager may handle assessment, service authorizations and communications; role and authority vary by carrier." },
    { term: "Third-Party Assessment", def: "An independent RN assessment ordered by the carrier to verify the patient's condition and ADL deficits. Consistency between your documentation and the assessor's findings is critical." },
    { term: "Waiver of Premium", def: "A policy provision that may waive premiums after its specified claim/benefit eligibility conditions are met; verify the effective date and carrier approval." },
    { term: "Assignment of Benefits (AOB)", def: "An authorization for eligible carrier payments to a provider where the contract allows, the carrier accepts the assignment, and the provider is eligible; client payment responsibility can remain." },
    { term: "Plan of Care", def: "A written document, typically prepared by a physician or RN, describing the insured's care needs, recommended services, and required hours. Most carriers require this before approving a claim." },
    { term: "HIPAA Authorization", def: "A signed authorization for sharing protected medical information where legally and operationally needed; verify the carrier's required form and authorized recipients." },
    { term: "Care Notes / Activity Log", def: "Daily records kept by the caregiver documenting services provided, hours worked, and the client's condition. Required by most carriers for ongoing billing and compliance." },
    { term: "Inflation Protection Rider", def: "An optional policy feature that increases benefit amounts over time (typically 3–5% per year) to keep pace with rising care costs." },
    { term: "Reimbursement Model", def: "A claims payment method where the insured pays the care provider first, then submits receipts to the carrier for reimbursement. Contrast with Assignment of Benefits (direct billing)." },
  ];

  const gColW = (CW - 6) / 2;
  let gCol = 0;
  let gColY = y;
  let gRightY = y;

  for (const g of glossary) {
    const termLines = doc.splitTextToSize(g.term, gColW - 6);
    const defLines = doc.splitTextToSize(g.def, gColW - 6);
    const entryH = (termLines.length + defLines.length) * 4.5 + 8;
    const gx = gCol === 0 ? M : M + gColW + 6;
    const gy = gCol === 0 ? gColY : gRightY;

    if (gy + entryH > CONTENT_BOT) {
      const alternate = 1 - gCol;
      const alternateY = alternate === 0 ? gColY : gRightY;
      if (alternateY + entryH <= CONTENT_BOT) {
        gCol = alternate;
      } else {
        newPage("Glossary of Terms");
        sectionHeading("GLOSSARY OF TERMS (continued)", "", VA_CREAM, VA_NAVY);
        gColY = y;
        gRightY = y;
        gCol = 0;
      }
    }

    const gxF = gCol === 0 ? M : M + gColW + 6;
    const gyF = gCol === 0 ? gColY : gRightY;
    doc.setFillColor(248, 252, 252);
    doc.roundedRect(gxF, gyF, gColW, entryH, 2, 2, "F");
    doc.setFillColor(...VA_TEAL);
    doc.rect(gxF, gyF, 3, entryH, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VA_NAVY);
    doc.text(termLines, gxF + 6, gyF + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(55, 55, 65);
    doc.text(defLines, gxF + 6, gyF + 5.5 + termLines.length * 4.5);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE — LTC EDUCATION & RESOURCES
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("LTC Education");
  sectionHeading("UNDERSTANDING LONG-TERM CARE INSURANCE", "🎓", VA_LTBLUE, VA_NAVY);
  bodyText(
    "Long-term care insurance is one of the most complex financial products available. This section is designed to help you and your family understand how your policy works, what to expect during the claims process, and how to protect your benefits.",
    0, 9
  );
  y += 2;

  eduBlock(
    "What Is Long-Term Care Insurance?",
    "Long-term care (LTC) insurance is a policy designed to cover the cost of care when a person can no longer perform basic daily activities independently due to illness, disability, or cognitive decline. Unlike health insurance, which covers medical treatment, LTC insurance covers custodial care — the ongoing assistance with daily living that most people need as they age. Policies typically pay for care provided at home, in an assisted living facility, or in a nursing home.",
    VA_LTBLUE, VA_TEAL
  );

  eduBlock(
    "How the Claim Process Works",
    "Step 1: Contact your carrier to report a potential claim and request a claim packet. Step 2: Obtain a physician's certification of need (Plan of Care). Step 3: Complete and submit the claim packet with all required documentation. Step 4: The carrier may order a third-party RN assessment. Step 5: The carrier reviews the claim according to applicable policy terms and law; request a case-specific timeline. Step 6: Care may begin before carrier approval; after approval and satisfaction of all policy requirements, eligible benefits may become payable. Step 7: Submit invoices and care logs according to the carrier's approved billing cadence.",
    VA_LTGREEN, [60,160,100] as [number,number,number]
  );

  eduBlock(
    "The Elimination Period — What You Need to Know",
    "The intake lists an elimination period of " + eliminationLabel +
    " days. Each issued policy defines how days are counted: calendar days, qualifying paid service days or special credits. " +
    "Keep complete care and payment records and verify with the carrier the applicable counting method, remaining qualifying days, and claim approval status. " +
    "Neither a service start date nor this planner establishes a guaranteed insurance payment date.",
    VA_CREAM, [180,130,30] as [number,number,number]
  );

  eduBlock(
    "ADLs vs. IADLs — Understanding the Difference",
    "ADLs (Activities of Daily Living) are the six basic personal care tasks that most LTC policies use as benefit triggers: Bathing, Dressing, Eating/Feeding, Toileting, Transferring, and Continence. To qualify for benefits, you typically must be unable to perform 2 or 3 of these without substantial assistance. IADLs (Instrumental Activities of Daily Living) are household and management tasks — Meal Preparation, Medication Management, Housekeeping, Laundry, Shopping, Transportation, Money Management, and Telephone Use. While IADLs are important for care planning, they generally do not count toward the ADL benefit trigger in most policies.",
    VA_LAVEND, [120,80,200] as [number,number,number]
  );

  newPage("LTC Education");
  sectionHeading("TIPS FOR A SUCCESSFUL CLAIM", "💡", VA_LTGREEN, VA_NAVY);

  const tips = [
    { title: "Document Everything", body: "Keep a daily log of all care provided, including the date, time, type of care, and caregiver name. Most carriers require this for ongoing reimbursement. Ask your care provider and carrier to confirm the specific care-log format and records required." },
    { title: "Communicate in Writing", body: "Whenever possible, follow up phone calls with your carrier in writing (email or certified mail). Keep copies of everything. Note the name of every representative you speak with, the date, and what was discussed." },
    { title: "Know Your Deadlines", body: "Most LTC policies have specific deadlines for filing claims, submitting invoices, and responding to carrier requests. Missing a deadline can result in claim denial. Review your policy for all applicable timeframes." },
    { title: "Get Your Physician Involved Early", body: "Your physician's certification of medical necessity is the cornerstone of your claim. Schedule an appointment early to discuss the claim process and ensure your physician documents ADL deficits and diagnosis clearly and specifically." },
    { title: "Understand the Third-Party Assessment", body: "If your carrier orders an independent RN assessment, prepare carefully. The assessor will observe the insured performing ADLs. Do not minimize limitations — demonstrate the actual level of difficulty or inability. Inconsistencies between your documentation and the assessment can lead to denial." },
    { title: "Appeal Denials Promptly", body: "If your claim is denied, you have the right to appeal. Request the denial in writing, understand the specific reason, gather additional supporting documentation, and submit a formal appeal within the applicable deadline. Verify the specific deadline in the denial notice, policy, and applicable law." },
    { title: "Keep Your Policy Documents Safe", body: "Store your original policy, all correspondence with the carrier, claim documents, and care logs in a secure, organized location. Consider keeping digital copies in a secure cloud storage service. Share the location with your Power of Attorney." },
    { title: "Use Assignment of Benefits When Available", body: "If Assignment of Benefits (AOB) is permitted, request the required carrier and provider forms, verify acceptance, and confirm any payment obligations before relying on direct provider billing." },
  ];

  const tipW = (CW - 6) / 2;
  for (let i = 0; i < tips.length; i += 2) {
    const pair = tips.slice(i, i + 2);
    const bodies = pair.map(tip => doc.splitTextToSize(tip.body, tipW - 10));
    const cardH = Math.max(...bodies.map(lines => lines.length * 4.5 + 14));
    checkBreak(cardH + 4);
    const rowY = y;
    pair.forEach((tip, col) => {
      const index = i + col;
      const cx = col === 0 ? M : M + tipW + 6;
      const bg: [number,number,number] = [index % 4 === 0 ? 230 : index % 4 === 1 ? 225 : index % 4 === 2 ? 255 : 240,
                                           index % 4 === 0 ? 244 : index % 4 === 1 ? 245 : index % 4 === 2 ? 252 : 235,
                                           index % 4 === 0 ? 250 : index % 4 === 1 ? 235 : index % 4 === 2 ? 240 : 255];
      const acc: [number,number,number] = [index % 4 === 0 ? VA_TEAL[0] : index % 4 === 1 ? 60 : index % 4 === 2 ? 180 : 120,
                                            index % 4 === 0 ? VA_TEAL[1] : index % 4 === 1 ? 160 : index % 4 === 2 ? 130 : 80,
                                            index % 4 === 0 ? VA_TEAL[2] : index % 4 === 1 ? 100 : index % 4 === 2 ? 30 : 200];
      doc.setFillColor(...bg);
      doc.roundedRect(cx, rowY, tipW, cardH, 2, 2, "F");
      doc.setFillColor(...acc);
      doc.rect(cx, rowY, 4, cardH, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...VA_NAVY);
      doc.text(tip.title, cx + 7, rowY + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 60);
      doc.text(bodies[col], cx + 7, rowY + 12.5);
    });
    y += cardH + 4;
  }
  y += 4;

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE — CAREGIVER RESOURCES & FAMILY GUIDE
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Family & Caregiver Guide");
  sectionHeading("FAMILY & CAREGIVER GUIDE", "❤", VA_ROSE, VA_NAVY);
  bodyText("Caring for a loved one is one of the most meaningful — and challenging — roles a family member can take on. This section provides guidance for family caregivers navigating the LTC insurance process.", 0, 9);
  y += 2;

  eduBlock(
    "Roles and Responsibilities",
    "Primary Caregiver: Coordinates day-to-day care, maintains care logs, and communicates with SC Visiting Angels and the insurance carrier. Power of Attorney (POA): Has legal authority to make financial and healthcare decisions on behalf of the insured. The carrier will require a copy of the POA document before speaking with anyone other than the insured. Family Coordinator: Keeps other family members informed, helps with logistics, and provides emotional support. SC Visiting Angels Care Manager: Your dedicated point of contact for scheduling, documentation, and carrier compliance.",
    VA_ROSE, [180,60,60] as [number,number,number]
  );

  eduBlock(
    "Preventing Caregiver Burnout",
    "Family caregiving is physically and emotionally demanding. SC Visiting Angels offers respite care services specifically designed to give family caregivers a break. Signs of caregiver burnout include exhaustion, withdrawal from social activities, feeling overwhelmed, and neglecting your own health. If you recognize these signs, contact SC Visiting Angels to discuss a respite care schedule. Your loved one's LTC policy may cover respite care — check the policy's covered services section.",
    VA_LAVEND, [120,80,200] as [number,number,number]
  );

  eduBlock(
    "Important Documents to Gather",
    "Before filing your claim, locate and organize the following: (1) Original LTC insurance policy and all riders/amendments. (2) Most recent premium billing statement (confirms policy is in force). (3) Power of Attorney document (if applicable). (4) Physician's contact information and medical records release form. (5) Medicare and Medicaid cards (if enrolled). (6) List of all current medications and treating physicians. (7) Recent hospital or rehabilitation discharge summary (if applicable). (8) Carrier's claims department address, phone, and fax number.",
    VA_CREAM, [180,130,30] as [number,number,number]
  );

  eduBlock(
    "Questions to Ask Your Insurance Carrier",
    "When you call to initiate a claim, ask: (1) What is the exact process for filing a claim under this policy? (2) What documentation is required in the initial claim packet? (3) Will you be ordering a third-party assessment? If so, when? (4) What is the expected timeline for claim review and approval? (5) Does this policy include Assignment of Benefits — can SC Visiting Angels bill you directly? (6) What care log format do you require for ongoing reimbursement? (7) Is there a dedicated case manager assigned to this claim? (8) What is the appeals process if the claim is denied?",
    VA_LTGREEN, [60,160,100] as [number,number,number]
  );

  if (y + 16 < CONTENT_BOT) notesLines(1, "Family notes:");

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE — LEGAL DISCLAIMERS
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Legal Disclaimers");
  sectionHeading("IMPORTANT LEGAL DISCLAIMERS", "⚠", VA_ROSE, VA_NAVY);

  infoCard([
    "IMPORTANT — PLEASE READ CAREFULLY",
    "This planner is provided for informational and educational purposes only.",
    "It is not legal advice, medical advice, or a guarantee of insurance benefits.",
    "Individual policy terms and circumstances may vary significantly."
  ], VA_ROSE, [180, 60, 60] as [number,number,number]);

  const disclaimers = [
    { title: "No Guarantee of Benefits", text: "This planner does not guarantee approval of your claim or payment of benefits. Insurance carriers make independent determinations based on policy terms, medical necessity, and other factors. Claim approval is never guaranteed, and benefit amounts are subject to the specific terms of your individual policy." },
    { title: "Policy-Specific Terms Apply", text: "Each long-term care insurance policy is unique. The strategies outlined in this planner are general guidelines and may not apply to every situation. Always consult your policy documents and your insurance carrier directly to confirm all details specific to your policy." },
    { title: "SC Visiting Angels Disclaimer", text: "SC Visiting Angels is not responsible for the accuracy, completeness, or applicability of this planner to your specific situation. We strongly recommend consulting with your insurance carrier, an elder law attorney, or a licensed insurance professional who can review your specific policy and circumstances." },
    { title: "Professional Consultation Recommended", text: "For complex situations, we recommend consulting with an elder law attorney, financial advisor, or licensed insurance professional before making any decisions based on this planner." },
    { title: "Limitation of Liability", text: "SC Visiting Angels and its representatives shall not be liable for any damages, losses, or claims arising from the use or reliance on this planner, including but not limited to direct, indirect, incidental, consequential, or punitive damages." },
    { title: "Regulatory Notice", text: "Insurance regulations, coverage terms, and benefit amounts may change. Please verify all information with your insurance carrier. This planner reflects information provided at the time of generation and may not reflect subsequent policy changes or regulatory updates." },
    { title: "Educational Purpose", text: "This planner is intended solely as an educational resource to help individuals and families understand the LTC insurance claim process. It does not constitute professional insurance, legal, or financial advice. SC Visiting Angels is a home care provider, not an insurance company or legal firm." },
  ];

  for (const d of disclaimers) {
    const dlines = doc.splitTextToSize(d.text, CW - 12);
    const dH = dlines.length * 4.5 + 11;
    checkBreak(dH);
    doc.setFillColor(252, 252, 253);
    doc.roundedRect(M, y, CW, dH, 2, 2, "F");
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.25);
    doc.roundedRect(M, y, CW, dH, 2, 2, "D");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VA_NAVY);
    doc.text(d.title, M + 5, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 70);
    doc.text(dlines, M + 5, y + 11.5);
    y += dH + 4;
  }

  // Final signature / closing
  checkBreak(22);
  y += 4;
  doc.setFillColor(...VA_TEAL);
  doc.roundedRect(M, y, CW, 16, 2.5, 2.5, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("SC Visiting Angels — America's Choice in Home Care®", PW / 2, y + 6.5, { align: "center" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("www.scvisitingangels.com  ·  www.visitingangels.com", PW / 2, y + 12, { align: "center" });
  doc.setTextColor(...DARK);
  y += 20;

  checkBreak(10);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...MID);
  doc.text(
    `Generated: ${fmtDate(new Date())}  ·  Prepared for: ${data.insuredName}  ·  Policy: ${data.policyNumber}  ·  Carrier: ${data.carrierName}`,
    PW / 2, y, { align: "center" }
  );
  y += 5;
  doc.text(
    `© ${new Date().getFullYear()} SC Visiting Angels  ·  All rights reserved.  ·  This document is confidential and intended solely for the named recipient.`,
    PW / 2, y, { align: "center" }
  );

  // ── Return buffer ─────────────────────────────────────────────────────────────
  const ab = doc.output("arraybuffer");
  return Buffer.from(ab);
}

// Backward-compat stub
export async function convertHtmlToPdf(_html: string): Promise<Buffer> {
  throw new Error("Use generatePdfBuffer() instead of convertHtmlToPdf()");
}
