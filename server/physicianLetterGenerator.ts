/**
 * Physician Letter Generator
 * Dynamically generates customized physician letters based on policy form data
 * for LTC insurance claim support
 */

export interface PhysicianLetterData {
  // Patient Information
  patientFullName: string;
  patientDob: string; // MM/DD/YYYY format
  diagnosis: string;
  lastVisitDate?: string; // MM/DD/YYYY format

  // Physician Information (optional - for letterhead)
  physicianName?: string;
  physicianCredentials?: string;
  practiceName?: string;
  streetAddress?: string;
  cityStateZip?: string;
  phone?: string;
  fax?: string;

  // Clinical Information
  adlLimitations: string[]; // Array of selected ADLs
  cognitiveImpairmentTrigger: boolean;
  cognitiveRisks?: string[]; // Array of cognitive risks if applicable
  minAdlsRequired: number;

  // Additional context
  prognosis?: string; // "indefinite" or specific timeframe
}

export interface GeneratedLetter {
  html: string;
  text: string;
  markdown: string;
}

/**
 * Generate a physician letter in multiple formats
 */
export function generatePhysicianLetter(data: PhysicianLetterData): GeneratedLetter {
  const {
    patientFullName,
    patientDob,
    diagnosis,
    lastVisitDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    physicianName = "[PHYSICIAN NAME, CREDENTIALS]",
    physicianCredentials = "",
    practiceName = "[MEDICAL PRACTICE NAME]",
    streetAddress = "[STREET ADDRESS]",
    cityStateZip = "[CITY, STATE ZIP]",
    phone = "[PHONE NUMBER]",
    fax = "[FAX NUMBER]",
    adlLimitations,
    cognitiveImpairmentTrigger,
    cognitiveRisks = [],
    minAdlsRequired,
    prognosis = "indefinitely",
  } = data;

  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

  // Generate ADL checklist
  const allAdls = ["Bathing", "Dressing", "Toileting", "Transferring", "Continence / Incontinence Care", "Eating / Feeding"];
  const adlCheckboxes = allAdls
    .map(adl => `${adlLimitations?.includes(adl) ? "☑" : "☐"} ${adl}`)
    .join("\n");

  // Generate cognitive risks checklist
  const allCognitiveRisks = [
    "Wandering",
    "Personal injury due to impaired judgment or disorientation",
    "Falls",
    "Inability to respond appropriately in an emergency",
    "Medication mismanagement",
    "Other",
  ];
  const cognitiveRiskCheckboxes = allCognitiveRisks
    .map(risk => `${cognitiveRisks?.includes(risk) ? "☑" : "☐"} ${risk}`)
    .join("\n");

  // Plain text version
  const textLetter = `${physicianName}${physicianCredentials ? ", " + physicianCredentials : ""}
${practiceName}
${streetAddress}
${cityStateZip}
Phone: ${phone}
Fax: ${fax}

Date: ${today}

Re: ${patientFullName}
DOB: ${patientDob}

To Whom It May Concern:

I am the treating physician for the above-referenced patient and have evaluated this patient as part of ongoing medical care, including the most recent visit on ${lastVisitDate}.

In my professional medical opinion, the patient has a chronic, ongoing medical condition diagnosed as ${diagnosis}, resulting in persistent cognitive and/or functional impairment. These impairments are expected to persist ${prognosis === 'indefinitely' ? 'indefinitely' : prognosis} and are not temporary in nature.

As a result of this condition, the patient requires either substantial supervision due to severe cognitive decline and associated safety risks, and/or caregiver assistance with two or more Activities of Daily Living. The patient currently requires assistance with the following:

${adlCheckboxes}

${
  cognitiveImpairmentTrigger
    ? `If applicable, the patient also requires substantial supervision due to cognitive impairment, including risk of:

${cognitiveRiskCheckboxes}

`
    : ""
}Based upon the patient's diagnosis, clinical condition, and resulting limitations, care and supervision are medically necessary and may be required up to 24 hours per day for the patient's health, safety, and daily functioning. Without appropriate caregiver assistance and supervision, the patient is at significant risk for injury, decline in personal care, medical complications, and other adverse outcomes.

It is my professional medical opinion that the patient has a chronic, ongoing need for long-term care services that is expected to persist ${prognosis}. Accordingly, I recommend approval of long-term care insurance benefits and immediate caregiver support consistent with the patient's diagnosis, level of impairment, and ongoing need for assistance and supervision. Please contact my office if additional documentation is needed.

Sincerely,

${physicianName}${physicianCredentials ? ", " + physicianCredentials : ""}

Signature: _________________________

Date: _____________________________`;

  // HTML version (for display/preview)
  const htmlLetter = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 8.5in; margin: 0.5in; }
    .header { margin-bottom: 2rem; }
    .letterhead { font-size: 14px; margin-bottom: 1rem; }
    .date-line { margin-bottom: 2rem; }
    .re-line { margin-bottom: 2rem; }
    .paragraph { margin-bottom: 1rem; text-align: justify; }
    .checklist { margin: 1rem 0; padding-left: 2rem; }
    .checklist-item { margin: 0.25rem 0; }
    .signature-block { margin-top: 2rem; }
    .signature-line { margin-top: 1rem; border-top: 1px solid #000; width: 3in; }
  </style>
</head>
<body>
  <div class="letterhead">
    <strong>${physicianName}${physicianCredentials ? ", " + physicianCredentials : ""}</strong><br>
    ${practiceName}<br>
    ${streetAddress}<br>
    ${cityStateZip}<br>
    Phone: ${phone}<br>
    Fax: ${fax}
  </div>

  <div class="date-line">
    <strong>Date:</strong> ${today}
  </div>

  <div class="re-line">
    <strong>Re:</strong> ${patientFullName}<br>
    <strong>DOB:</strong> ${patientDob}
  </div>

  <p>To Whom It May Concern:</p>

  <p class="paragraph">
    I am the treating physician for the above-referenced patient and have evaluated this patient as part of ongoing medical care, including the most recent visit on <strong>${lastVisitDate}</strong>.
  </p>

  <p class="paragraph">
    In my professional medical opinion, the patient has a chronic, ongoing medical condition diagnosed as <strong>${diagnosis}</strong>, resulting in persistent cognitive and/or functional impairment. These impairments are expected to persist indefinitely and are not temporary in nature.
  </p>

  <p class="paragraph">
    As a result of this condition, the patient requires either substantial supervision due to severe cognitive decline and associated safety risks, and/or caregiver assistance with two or more Activities of Daily Living. The patient currently requires assistance with the following:
  </p>

  <div class="checklist">
    ${allAdls.map(adl => `<div class="checklist-item">${adlLimitations?.includes(adl) ? "☑" : "☐"} ${adl}</div>`).join("")}
  </div>

  ${
    cognitiveImpairmentTrigger
      ? `
  <p class="paragraph">
    If applicable, the patient also requires substantial supervision due to cognitive impairment, including risk of:
  </p>

  <div class="checklist">
    ${allCognitiveRisks.map(risk => `<div class="checklist-item">${cognitiveRisks?.includes(risk) ? "☑" : "☐"} ${risk}</div>`).join("")}
  </div>
  `
      : ""
  }

  <p class="paragraph">
    Based upon the patient's diagnosis, clinical condition, and resulting limitations, care and supervision are medically necessary and may be required up to 24 hours per day for the patient's health, safety, and daily functioning. Without appropriate caregiver assistance and supervision, the patient is at significant risk for injury, decline in personal care, medical complications, and other adverse outcomes.
  </p>

  <p class="paragraph">
    It is my professional medical opinion that the patient has a chronic, ongoing need for long-term care services that is expected to persist ${prognosis}. Accordingly, I recommend approval of long-term care insurance benefits and immediate caregiver support consistent with the patient's diagnosis, level of impairment, and ongoing need for assistance and supervision. Please contact my office if additional documentation is needed.
  </p>

  <div class="signature-block">
    <p>Sincerely,</p>
    <p><strong>${physicianName}${physicianCredentials ? ", " + physicianCredentials : ""}</strong></p>
    <p>Signature: <span class="signature-line"></span></p>
    <p>Date: <span class="signature-line"></span></p>
  </div>
</body>
</html>`;

  // Markdown version (for email/sharing)
  const markdownLetter = `# Physician Letter

**${physicianName}${physicianCredentials ? ", " + physicianCredentials : ""}**  
${practiceName}  
${streetAddress}  
${cityStateZip}  
Phone: ${phone}  
Fax: ${fax}

**Date:** ${today}

**Re:** **${patientFullName}**  
**DOB:** ${patientDob}

---

To Whom It May Concern:

I am the treating physician for the above-referenced patient and have evaluated this patient as part of ongoing medical care, including the most recent visit on **${lastVisitDate}**.

In my professional medical opinion, the patient has a chronic, ongoing medical condition diagnosed as **${diagnosis}**, resulting in persistent cognitive and/or functional impairment. These impairments are expected to persist indefinitely and are not temporary in nature.

As a result of this condition, the patient requires either substantial supervision due to severe cognitive decline and associated safety risks, and/or caregiver assistance with two or more Activities of Daily Living. The patient currently requires assistance with the following:

${allAdls.map(adl => `- ${adlLimitations?.includes(adl) ? "✓" : "○"} ${adl}`).join("\n")}

${
  cognitiveImpairmentTrigger
    ? `
If applicable, the patient also requires substantial supervision due to cognitive impairment, including risk of:

${allCognitiveRisks.map(risk => `- ${cognitiveRisks?.includes(risk) ? "✓" : "○"} ${risk}`).join("\n")}

`
    : ""
}Based upon the patient's diagnosis, clinical condition, and resulting limitations, care and supervision are medically necessary and may be required up to 24 hours per day for the patient's health, safety, and daily functioning. Without appropriate caregiver assistance and supervision, the patient is at significant risk for injury, decline in personal care, medical complications, and other adverse outcomes.

It is my professional medical opinion that the patient has a chronic, ongoing need for long-term care services that is expected to persist ${prognosis}. Accordingly, I recommend approval of long-term care insurance benefits and immediate caregiver support consistent with the patient's diagnosis, level of impairment, and ongoing need for assistance and supervision. Please contact my office if additional documentation is needed.

Sincerely,

**${physicianName}${physicianCredentials ? ", " + physicianCredentials : ""}**

Signature: ___________________________

Date: ___________________________`;

  return {
    html: htmlLetter,
    text: textLetter,
    markdown: markdownLetter,
  };
}

/**
 * Generate a physician letter and return as PDF-ready HTML
 * This can be passed to a PDF generation service
 */
export function generatePhysicianLetterPdf(data: PhysicianLetterData): string {
  const letter = generatePhysicianLetter(data);
  return letter.html;
}

/**
 * Generate a physician letter and return as downloadable text file content
 */
export function generatePhysicianLetterText(data: PhysicianLetterData): string {
  const letter = generatePhysicianLetter(data);
  return letter.text;
}
