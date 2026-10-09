// ─────────────────────────────────────────────────────────────────────────────
// SC Visiting Angels — Personalized LTC Insurance Planner
// Landscape letter, full VA brand aesthetic, embedded logo, pastel section
// boxes, literal checkboxes, notes lines, educational section, zero wasted space
// ─────────────────────────────────────────────────────────────────────────────
import { jsPDF } from "jspdf";
import { VA_LOGO_BASE64 } from "./vaLogoBase64";

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
  careRecommendations?: string;
  strategyContent?: string;
  diagnosis?: string;
  caseManagerName?: string;
  thirdPartyAssessmentRequired?: string;
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
    const fy = PH - FOOTER_H + 2;
    doc.setFillColor(245, 250, 252);
    doc.rect(0, fy - 1, PW, FOOTER_H + 1, "F");
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(M, fy, PW - M, fy);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MID);
    doc.text(
      "This planner is for educational and informational purposes only. It is not legal or medical advice. SC Visiting Angels · www.scvisitingangels.com",
      PW / 2, fy + 4, { align: "center" }
    );
    doc.text(
      `Generated ${fmtDate(new Date())}  ·  Confidential — Prepared exclusively for ${data.insuredName}`,
      PW / 2, fy + 8, { align: "center" }
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
    doc.text(title, M + 8, y + 7.5);
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
    const lineH = 5;
    const boxH = lines.length * lineH + 9;
    checkBreak(boxH);
    doc.setFillColor(...bg);
    doc.roundedRect(M, y, CW, boxH, 2.5, 2.5, "F");
    doc.setFillColor(...accent);
    doc.rect(M, y, 4, boxH, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    if (icon) {
      doc.setFontSize(10);
      doc.text(icon, M + 7, y + 6);
      for (let i = 0; i < lines.length; i++) {
        doc.setFontSize(9);
        doc.text(lines[i], M + 16, y + 5.5 + i * lineH);
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], M + 7, y + 5.5 + i * lineH);
      }
    }
    y += boxH + 4;
  }

  // ── Two-column layout helpers ────────────────────────────────────────────────
  const COL2W = (CW - 6) / 2;
  const COL2R = M + COL2W + 6;

  function twoColRow(leftLabel: string, leftVal: string, rightLabel: string, rightVal: string, bg?: [number,number,number]) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const leftLines = doc.splitTextToSize(leftVal || "Not provided", COL2W - 8);
    const rightLines = doc.splitTextToSize(rightVal || "Not provided", COL2W - 8);
    const height = 10 + Math.max(leftLines.length, rightLines.length) * 3.8;
    checkBreak(height);
    if (bg) { doc.setFillColor(...bg); doc.roundedRect(M, y, CW, height, 1, 1, "F"); }
    doc.setFont("helvetica", "bold"); doc.setTextColor(...VA_NAVY);
    doc.text(leftLabel, M + 3, y + 4);
    doc.text(rightLabel, COL2R + 3, y + 4);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    doc.text(leftLines, M + 3, y + 8, {lineHeightFactor: 1.3});
    doc.text(rightLines, COL2R + 3, y + 8, {lineHeightFactor: 1.3});
    y += height + 1;
  }

  // ── Literal checkbox row ─────────────────────────────────────────────────────
  function checkRow(task: string, critical = false, indent = 0, note = "") {
    const availW = CW - indent - 10;
    const lines = doc.splitTextToSize(task, availW - (critical ? 18 : 0));
    const rowH = Math.max(lines.length * 5 + 3, 8);
    checkBreak(rowH + (note ? 5 : 0));
    const cx = M + indent + 1;
    const cy = y + 1.5;
    // Draw checkbox square
    doc.setDrawColor(...VA_NAVY);
    doc.setLineWidth(0.5);
    doc.rect(cx, cy, 4.5, 4.5);
    // Task text
    doc.setFontSize(9);
    doc.setFont("helvetica", critical ? "bold" : "normal");
    doc.setTextColor(critical ? VA_NAVY[0] : DARK[0], critical ? VA_NAVY[1] : DARK[1], critical ? VA_NAVY[2] : DARK[2]);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], cx + 7, cy + 3.5 + i * 5);
    }
    if (critical) {
      doc.setFontSize(7);
      doc.setTextColor(...VA_TEAL);
      const tw = doc.getTextWidth(lines[0]);
      doc.text("  ★ PRIORITY", cx + 7 + tw, cy + 3.5);
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
    checkBreak(count * 7 + 8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VA_NAVY);
    doc.text(label, M, y + 4);
    y += 7;
    for (let i = 0; i < count; i++) {
      checkBreak(7);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.25);
      doc.line(M + 18, y + 4, M + CW, y + 4);
      y += 7;
    }
    y += 2;
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
  const gRowH     = 10;
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
    for (const md of markers) {
      const mx = gBarX + (md / totalDays) * gBarAreaW;
      doc.text(`Day ${md}`, mx, y + gRulerH / 2 + 2, { align: "center" });
      doc.setDrawColor(160, 190, 210);
      doc.setLineWidth(0.15);
      doc.line(mx, y + gRulerH, mx, y + gRulerH + 2);
    }
    doc.setTextColor(...DARK);
    y += gRulerH + 2;
  }

  function drawGanttRow(label: string, startDay: number, durDays: number, totalDays: number, color: [number,number,number], rowIdx: number, markers: number[]) {
    checkBreak(gRowH + 1);
    if (rowIdx % 2 === 0) {
      doc.setFillColor(248, 253, 255);
      doc.rect(M, y, CW, gRowH, "F");
    }
    doc.setDrawColor(210, 225, 235);
    doc.setLineWidth(0.1);
    for (const md of markers) {
      const mx = gBarX + (md / totalDays) * gBarAreaW;
      doc.line(mx, y, mx, y + gRowH);
    }
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const truncated = doc.splitTextToSize(label, gLabelW - 5)[0];
    doc.text(truncated, M + 3, y + gRowH / 2 + 1.5);
    // Bar track
    doc.setFillColor(215, 228, 238);
    doc.roundedRect(gBarX, y + 2, gBarAreaW, gRowH - 4, 1.2, 1.2, "F");
    // Colored bar
    const barStartX = gBarX + (startDay / totalDays) * gBarAreaW;
    const barW = Math.max((durDays / totalDays) * gBarAreaW, 4);
    doc.setFillColor(...color);
    doc.roundedRect(barStartX, y + 2, barW, gRowH - 4, 1.2, 1.2, "F");
    if (barW > 18) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(`${startDay}–${startDay + durDays}d`, barStartX + barW / 2, y + gRowH / 2 + 1.5, { align: "center" });
    }
    doc.setDrawColor(200, 215, 225);
    doc.setLineWidth(0.1);
    doc.line(M, y + gRowH, M + CW, y + gRowH);
    doc.setTextColor(...DARK);
    y += gRowH + 1;
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
    `This planner is your complete reference — from gathering documents before you file, through the formal claim submission, to managing ongoing benefits after approval.`
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
  twoColRow("Waiver of Premium", data.waiverOfPremium === "yes" ? "Yes — premiums waived during claim" : data.waiverOfPremium === "no" ? "No" : "N/A", "Assignment of Benefits", data.assignmentOfBenefits === "yes" ? "Yes — direct billing" : data.assignmentOfBenefits === "no" ? "No — reimbursement" : "N/A", VA_LTBLUE);
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
  twoColRow("Minimum ADLs to Qualify", data.minAdlsRequired !== undefined ? `${data.minAdlsRequired} of 6 ADLs` : "—", "Cognitive Impairment Trigger", data.cognitiveImpairmentTrigger === "yes" ? "Yes — qualifies independently" : data.cognitiveImpairmentTrigger === "no" ? "No" : "—", VA_LTBLUE);
  twoColRow("Waiver of Premium", data.waiverOfPremium === "yes" ? "Yes" : data.waiverOfPremium === "no" ? "No" : "—", "Assignment of Benefits (AOB)", data.assignmentOfBenefits === "yes" ? "Yes — direct billing to provider" : data.assignmentOfBenefits === "no" ? "No — reimbursement model" : "—");
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
  const elimDays = data.eliminationPeriod ? parseInt(data.eliminationPeriod, 10) || 90 : 90;
  infoCard([
    `Elimination Period: ${elimDays} days — You pay out-of-pocket for the first ${elimDays} days of qualifying care.`,
    "After the elimination period is satisfied, your policy begins reimbursing covered care costs.",
    `At your daily maximum of ${fmtCurrency(data.dailyMaximum)}, your monthly benefit is approximately ${fmtCurrency(data.dailyMaximum * 30)}.`,
  ], VA_LTBLUE, VA_TEAL);

  if (data.assignmentOfBenefits === "yes") {
    infoCard([
      "Assignment of Benefits (AOB) is ACTIVE on your policy.",
      "SC Visiting Angels will bill your insurance carrier directly — you do not need to pay upfront and seek reimbursement.",
      "Confirm AOB is on file with your carrier before care begins."
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
      doc.text("✓", ax + 2.5, ay + 3.5);
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
      doc.text("✓", M + 2.5, y + 2.5);
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
      "★  Cognitive Impairment Trigger is ACTIVE on this policy.",
      "A diagnosis of Alzheimer's disease, dementia, or similar cognitive condition may qualify for benefits",
      "independently — even if fewer than the required number of ADLs are in deficit.",
      "Document all cognitive symptoms thoroughly with your physician."
    ], VA_AMBER, [200, 150, 30] as [number,number,number]);
  }

  notesLines(2, "Qualifying condition notes:");

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGES 5-7 — THREE-STAGE CLAIM CHECKLIST
  // ─────────────────────────────────────────────────────────────────────────────
  const stageConfig = [
    {
      num: 1,
      title: "STAGE 1: PRIOR TO CLAIM SUBMISSION",
      desc: `Days 1–25 — Gather documentation, establish medical necessity, and set up care providers before initiating your claim.`,
      tasks: data.stage1Tasks,
      bg: VA_LTBLUE as [number,number,number],
      accent: VA_TEAL as [number,number,number],
      noteLabel: "Stage 1 notes:"
    },
    {
      num: 2,
      title: "STAGE 2: FILING THE CLAIM",
      desc: `Days 26–63 — Assemble and submit your complete claim packet. Track the carrier's 30-day review window.`,
      tasks: data.stage2Tasks,
      bg: VA_LTGREEN as [number,number,number],
      accent: [60, 160, 100] as [number,number,number],
      noteLabel: "Stage 2 notes:"
    },
    {
      num: 3,
      title: "STAGE 3: POST-APPROVAL & ONGOING CARE",
      desc: `Day 64+ — Manage ongoing benefits, submit invoices on time, and maintain documentation for continued coverage.`,
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
    notesLines(3, stage.noteLabel);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGES — GANTT TIMELINE (one page per stage)
  // ─────────────────────────────────────────────────────────────────────────────
  const p = 25;
  const s2End = p + 8 + 30;
  const totalDays = s2End + elimDays + 30;
  const allMarkers = [0, 7, 14, 21, 28, 35, 42, 56, 70, 90, 120, 150, 180];
  const gMarkers = allMarkers.filter(d => d <= totalDays);

  const ganttStages = [
    {
      stageNum: 1,
      title: "Stage 1: Prior to Claim",
      desc: "Days 1–25 — Gather documentation, establish medical necessity, and set up care providers.",
      color: VA_TEAL as [number,number,number],
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
      title: "Stage 2: Filing the Claim",
      desc: "Days 26–63 — Submit your complete claim packet and track the 30-day insurance review window.",
      color: [60, 160, 100] as [number,number,number],
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
      title: "Stage 3: Post-Approval",
      desc: `Day 64+ — Manage ongoing benefits, submit invoices, and maintain documentation. Elimination period: ${elimDays} days.`,
      color: [120, 80, 200] as [number,number,number],
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

  for (const gs of ganttStages) {
    newPage("Claim Timeline");
    sectionHeading(`CLAIM TIMELINE — ${gs.title.toUpperCase()}`, "📅", VA_LTBLUE, VA_NAVY);
    bodyText(gs.desc, 0, 9, MID);
    y += 2;
    drawGanttRuler(totalDays, gMarkers);
    gs.tasks.forEach((t, idx) => drawGanttRow(t.label, t.start, t.dur, totalDays, gs.color, idx, gMarkers));
    y += 4;
    // Legend
    checkBreak(12);
    doc.setFillColor(240, 248, 252);
    doc.roundedRect(M, y, CW, 10, 2, 2, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MID);
    doc.text(
      `Day 0 = process start  ·  Bar = working window in days  ·  Elimination period: ${elimDays} days  ·  Estimated total timeline: ~${totalDays} days`,
      PW / 2, y + 6.5, { align: "center" }
    );
    doc.setTextColor(...DARK);
    y += 14;
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
  for (let i = 0; i < careServices.length; i++) {
    const cs = careServices[i];
    const col = i % 2;
    const cx = col === 0 ? M : M + csW + 6;
    const dlines = doc.splitTextToSize(cs.desc, csW - 10);
    const cardH = dlines.length * 4.5 + 14;
    if (col === 0) checkBreak(cardH);
    const cardY = col === 0 ? y : y - cardH; // right col aligns with left
    if (col === 0) {
      // Draw left card
      doc.setFillColor(...cs.bg);
      doc.roundedRect(cx, y, csW, cardH, 2, 2, "F");
      doc.setFillColor(...cs.accent);
      doc.rect(cx, y, csW, 3, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...VA_NAVY);
      doc.text(cs.title, cx + 4, y + 9);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(dlines, cx + 4, y + 14.5);
      // Store y for right card
    } else {
      // Draw right card at same y as left
      const leftCardY = y - cardH;
      doc.setFillColor(...cs.bg);
      doc.roundedRect(cx, leftCardY, csW, cardH, 2, 2, "F");
      doc.setFillColor(...cs.accent);
      doc.rect(cx, leftCardY, csW, 3, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...VA_NAVY);
      doc.text(cs.title, cx + 4, leftCardY + 9);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.text(dlines, cx + 4, leftCardY + 14.5);
      y += 4; // gap between rows
    }
    if (col === 0) y += cardH;
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
    { term: "Elimination Period", def: "The policy waiting period before benefits begin. It may count service days or calendar days; confirm the applicable rules and exceptions with the carrier." },
    { term: "Daily Maximum Benefit", def: "The maximum dollar amount the insurance company will pay per day of qualifying care. Care costs above this limit are the client's responsibility." },
    { term: "Monthly Maximum Benefit", def: "The maximum dollar amount the insurance company will pay per calendar month of qualifying care." },
    { term: "Lifetime Maximum Benefit", def: "The total cumulative amount the policy will pay over its lifetime. Once exhausted, no further benefits are available." },
    { term: "Benefit Trigger", def: "The qualifying condition(s) that must be met before the policy pays benefits. Most policies use ADL deficits (2 or more) or a cognitive impairment diagnosis as triggers." },
    { term: "Cognitive Impairment Trigger", def: "A separate benefit trigger. A diagnosis of Alzheimer's, dementia, or similar cognitive condition may qualify independently of ADL deficits." },
    { term: "Claim / Pre-Claim Number", def: "When a claim is initiated, the carrier issues a pre-claim number. Upon approval, this becomes the official claim number used on all invoices and correspondence." },
    { term: "Case Manager", def: "An RN or licensed professional assigned by the LTC insurance company to determine approved hours of care, review documentation, and serve as your primary carrier contact." },
    { term: "Third-Party Assessment", def: "An independent RN assessment ordered by the carrier to verify the patient's condition and ADL deficits. Consistency between your documentation and the assessor's findings is critical." },
    { term: "Waiver of Premium", def: "A policy feature that suspends premium payments once you begin receiving benefits. Not all policies include this — check your policy documents." },
    { term: "Assignment of Benefits (AOB)", def: "A provision directing the insurance company to pay the care provider directly, eliminating the need for the client to pay upfront and seek reimbursement." },
    { term: "Plan of Care", def: "A written document, typically prepared by a physician or RN, describing the insured's care needs, recommended services, and required hours. Most carriers require this before approving a claim." },
    { term: "HIPAA Authorization", def: "A signed release allowing healthcare providers to share medical records with the insurance carrier and SC Visiting Angels. Required for claim processing." },
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
      if (gCol === 0) {
        gCol = 1;
        gRightY = y;
        continue;
      } else {
        newPage("Glossary of Terms");
        sectionHeading("GLOSSARY OF TERMS (continued)", "📖", VA_CREAM, VA_NAVY);
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
    "Step 1: Contact your carrier to report a potential claim and request a claim packet. Step 2: Obtain a physician's certification of need (Plan of Care). Step 3: Complete and submit the claim packet with all required documentation. Step 4: The carrier may order a third-party RN assessment. Step 5: The carrier reviews your claim (typically 30–45 days). Step 6: Upon approval, care begins and benefits are paid per your policy terms. Step 7: Submit invoices and care logs monthly for ongoing reimbursement.",
    VA_LTGREEN, [60,160,100] as [number,number,number]
  );

  eduBlock(
    "The Elimination Period — What You Need to Know",
    `Your policy has an elimination period of ${elimDays} days. This means you must personally pay for ${elimDays} days of qualifying care before your insurance begins to pay. Some policies count service days; others count calendar days. Confirm which rule applies. For a service-day policy, 5 care days per week would take approximately 18 weeks to satisfy 90 service days. Keep detailed records of every day of care during this period — your carrier will require proof. Some policies allow a 'lookback period' where care received before the claim was filed may count toward the elimination period.`,
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
    { title: "Document Everything", body: "Keep a daily log of all care provided, including the date, time, type of care, and caregiver name. Most carriers require this for ongoing reimbursement. SC Visiting Angels provides care logs in the format required by your carrier." },
    { title: "Communicate in Writing", body: "Whenever possible, follow up phone calls with your carrier in writing (email or certified mail). Keep copies of everything. Note the name of every representative you speak with, the date, and what was discussed." },
    { title: "Know Your Deadlines", body: "Most LTC policies have specific deadlines for filing claims, submitting invoices, and responding to carrier requests. Missing a deadline can result in claim denial. Review your policy for all applicable timeframes." },
    { title: "Get Your Physician Involved Early", body: "Your physician's certification of medical necessity is the cornerstone of your claim. Schedule an appointment early to discuss the claim process and ensure your physician documents ADL deficits and diagnosis clearly and specifically." },
    { title: "Understand the Third-Party Assessment", body: "If your carrier orders an independent RN assessment, prepare carefully. The assessor will observe the insured performing ADLs. Do not minimize limitations — demonstrate the actual level of difficulty or inability. Inconsistencies between your documentation and the assessment can lead to denial." },
    { title: "Appeal Denials Promptly", body: "If your claim is denied, you have the right to appeal. Request the denial in writing, understand the specific reason, gather additional supporting documentation, and submit a formal appeal within the timeframe specified in your policy (typically 60–180 days)." },
    { title: "Keep Your Policy Documents Safe", body: "Store your original policy, all correspondence with the carrier, claim documents, and care logs in a secure, organized location. Consider keeping digital copies in a secure cloud storage service. Share the location with your Power of Attorney." },
    { title: "Use Assignment of Benefits When Available", body: "If your policy includes Assignment of Benefits (AOB), activate it. This allows SC Visiting Angels to bill your carrier directly, eliminating the need for you to pay out of pocket and wait for reimbursement — significantly reducing financial stress during an already difficult time." },
  ];

  const tipW = (CW - 6) / 2;
  for (let i = 0; i < tips.length; i++) {
    const tip = tips[i];
    const col = i % 2;
    const cx = col === 0 ? M : M + tipW + 6;
    const tlines = doc.splitTextToSize(tip.body, tipW - 10);
    const cardH = tlines.length * 4.5 + 14;
    if (col === 0) checkBreak(cardH);
    const cardY = col === 0 ? y : y - cardH;
    const drawY = col === 0 ? y : cardY;
    const bg: [number,number,number] = [i % 4 === 0 ? 230 : i % 4 === 1 ? 225 : i % 4 === 2 ? 255 : 240,
                                         i % 4 === 0 ? 244 : i % 4 === 1 ? 245 : i % 4 === 2 ? 252 : 235,
                                         i % 4 === 0 ? 250 : i % 4 === 1 ? 235 : i % 4 === 2 ? 240 : 255];
    const acc: [number,number,number] = [i % 4 === 0 ? VA_TEAL[0] : i % 4 === 1 ? 60 : i % 4 === 2 ? 180 : 120,
                                          i % 4 === 0 ? VA_TEAL[1] : i % 4 === 1 ? 160 : i % 4 === 2 ? 130 : 80,
                                          i % 4 === 0 ? VA_TEAL[2] : i % 4 === 1 ? 100 : i % 4 === 2 ? 30 : 200];
    doc.setFillColor(...bg);
    doc.roundedRect(cx, drawY, tipW, cardH, 2, 2, "F");
    doc.setFillColor(...acc);
    doc.rect(cx, drawY, 4, cardH, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VA_NAVY);
    doc.text(tip.title, cx + 7, drawY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 60);
    doc.text(tlines, cx + 7, drawY + 12.5);
    if (col === 0) y += cardH;
    else y += 4;
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

  notesLines(3, "Family notes:");

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE — LEGAL DISCLAIMERS
  // ─────────────────────────────────────────────────────────────────────────────
  newPage("Your Claim Journey");
  sectionHeading("Your claim journey", "", VA_LTBLUE);
  const journey = [
    {title:"1. Understand your policy", text:"Confirm benefit triggers, covered providers, elimination-period rules and notice deadlines with the carrier."},
    {title:"2. Prepare documentation", text:"Gather the plan of care, relevant clinical evidence, carrier forms and any required authorizations."},
    {title:"3. Submit and track", text:"Keep dated copies, confirm receipt and respond to requests. Follow the carrier's stated review and appeal deadlines."},
    {title:"4. Manage ongoing care", text:"Maintain service records and invoices. Reconcile payments and track remaining benefits against the policy."},
  ];
  const center = PW / 2;
  const top = y + 3;
  doc.setDrawColor(...VA_TEAL); doc.setLineWidth(1);
  doc.line(center, top + 8, center, top + 110);
  journey.forEach((step, index) => {
    const sy = top + index * 34;
    const width = CW / 2 - 12;
    const sx = index % 2 === 0 ? M : center + 12;
    doc.setFillColor(...(index % 2 === 0 ? VA_LTBLUE : VA_LTGREEN));
    doc.roundedRect(sx, sy, width, 29, 3, 3, "F");
    doc.setFillColor(...VA_TEAL); doc.circle(center, sy + 8, 3, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...VA_NAVY);
    doc.text(step.title, sx + 4, sy + 6);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(step.text, width - 8), sx + 4, sy + 12);
  });

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
