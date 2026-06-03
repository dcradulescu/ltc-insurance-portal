# LTC Insurance Portal — Complete Manus Reconstruction Prompt

> **Instructions:** Copy everything between the triple backticks below and paste it as a single message into a new Manus conversation. Manus will rebuild the entire application from scratch.

---

```
Build a complete, production-ready web application called "LTC Insurance Portal" for SC Visiting Angels (www.scvisitingangels.com), a home care agency in South Carolina specializing in long-term care (LTC) insurance claims navigation. The app helps families understand their LTC insurance policy, prepare for a claim, and execute the 3-stage claims strategy. Brand everything after SC Visiting Angels: teal (#3BBFBF), navy blue (#1B4F8A), warm cream (#FFF8F0), dove icon, serif headings (Playfair Display), sans-serif body (Inter). Phone: (803) 749-0026. Email: info@scvisitingangels.com. Website: www.scvisitingangels.com.

Use the Manus "Web App (tRPC + Database + Auth)" template (React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL). All procedures should be public (no auth required). Use shadcn/ui components throughout.

---

## DATABASE SCHEMA (drizzle/schema.ts)

Create the following tables:

### policies (main table — 67 columns)
- id (int, auto-increment, primary key)
- Insured Person: insuredFullName (varchar 255), insuredDob (varchar 20), insuredEmail (varchar 255), insuredPhone (varchar 20), insuredAddress (text), insuredCity (varchar 100), insuredState (varchar 50), insuredZip (varchar 20), insuredSsn (varchar 20), insuredMedicare (varchar 50), insuredMedicaid (varchar 50)
- Policy Details: policyNumber (varchar 100), policyStartDate (varchar 20), policyEndDate (varchar 20), eliminationPeriod (varchar 50), minAdlsRequired (int, default 2), lookBackPeriod (varchar 50), policyType (varchar 50), cognitiveRider (boolean, default false), internationalCoverage (boolean, default false), sharedCare (boolean, default false)
- Carrier Info: carrierName (varchar 255), carrierPhone (varchar 20), carrierFax (varchar 20), carrierAddress (text), carrierCity (varchar 100), carrierState (varchar 50), carrierZip (varchar 20), carrierEmail (varchar 255), carrierWebsite (varchar 255), claimNumber (varchar 100), preClaimNumber (varchar 100), caseManagerName (varchar 255), caseManagerPhone (varchar 20), caseManagerEmail (varchar 255), aobStatus (varchar 50), paymentCycle (varchar 50), cnaRequired (boolean, default false)
- Benefits: dailyMaximum (varchar 50), monthlyMaximum (varchar 50), lifetimeMaximum (varchar 50), inflationRider (varchar 50), inflationRate (varchar 20), waiverOfPremium (boolean, default false), premiumAmount (varchar 50), premiumFrequency (varchar 50), benefitPeriod (varchar 50), poolOfMoney (varchar 50)
- Care Needs: qualifyingAdls (text — JSON array of strings), careNeeds (text — JSON array of strings), diagnosisCheckboxes (text — JSON array of strings), diagnosisNotes (text), careNotes (text)
- Provider Info: providerName (varchar 255), providerPhone (varchar 20), providerFax (varchar 20), providerAddress (text), providerLicenseNumber (varchar 100)
- Admin: createdAt (timestamp, default now), updatedAt (timestamp, default now, on update now)

### strategies
- id (int, auto-increment, primary key)
- policyId (int, foreign key → policies.id)
- stage1Tasks (text — JSON array of {id, title, description, dueDay, category, completed})
- stage2Tasks (text — same structure)
- stage3Tasks (text — same structure)
- executiveSummary (text)
- completedTasks (text — JSON array of task IDs)
- createdAt (timestamp, default now)
- updatedAt (timestamp, default now, on update now)

### chatMessages
- id (int, auto-increment, primary key)
- sessionId (varchar 100)
- role (enum: 'user', 'assistant')
- content (text)
- createdAt (timestamp, default now)

### ragDocuments
- id (int, auto-increment, primary key)
- title (varchar 255)
- content (text)
- category (varchar 100)
- createdAt (timestamp, default now)

### ragDocumentChunks
- id (int, auto-increment, primary key)
- documentId (int, foreign key → ragDocuments.id)
- content (text)
- chunkIndex (int)
- createdAt (timestamp, default now)

---

## PAGES & ROUTING (client/src/App.tsx)

Routes:
- / → Home
- /education → Education
- /policy-form → PolicyForm
- /strategy → Strategy
- /contact → Contact
- /terms → Terms

Wrap all routes (except /terms) in a TermsGate component that shows a Terms of Use acceptance modal on first visit (stored in localStorage key 'ltc-terms-accepted'). Add a floating ChatWidget component (bottom-right corner) inside the TermsGate. Use a global TooltipProvider with delayDuration=0.

---

## LAYOUT (client/src/components/Layout.tsx)

Create a Layout component that wraps every page with:

**Top bar:** Teal background (#3BBFBF). Left: "SC Visiting Angels" text in white with dove emoji. Right: phone "(803) 749-0026" and "info@scvisitingangels.com" in white.

**Navigation:** White background with navy border-bottom. Logo: dove emoji + "LTC Navigator" in navy (Playfair Display font). Nav links: Home, Education, Policy Form, Strategy, Contact. Mobile: hamburger menu that opens a slide-down menu. Right side: "Get Started" button (teal, links to /policy-form).

**Footer:** Navy background (#1B4F8A). Three columns: (1) SC Visiting Angels branding + description + contact info; (2) Quick Links (Home, Education, Policy Form, Strategy, Contact, Terms of Use); (3) "About LTC Insurance" with 4 bullet points. Bottom bar: copyright + "www.scvisitingangels.com". Add LegalDisclaimerFooter component below footer.

---

## HOME PAGE (client/src/pages/Home.tsx)

**Hero section:** Full-height (min-h-screen) with parallax background image (senior + caregiver photo). Overlay: navy gradient (opacity 0.7). Large white heading: "Your LTC Insurance Strategy, Simplified". Subheading about SC Visiting Angels. Two CTA buttons: "Start Your Strategy" (teal) and "Learn More" (outline white). Animated scroll indicator.

**Stats bar:** 4 stats: "6-Step Process", "3-Stage Strategy", "Personalized PDF", "Expert Guidance". Teal background.

**Features section:** 6 feature cards in a 3-column grid (1 column mobile). Cards with icons (emoji), title, description. Features: Policy Analysis, ADL Assessment, Claims Strategy, PDF Planner, Care Calculator, Expert Guidance.

**How It Works section:** 3 steps with numbered circles (teal). Step 1: Enter Policy Details. Step 2: AI Generates Strategy. Step 3: Download Your Planner.

**Testimonials section:** 3 testimonial cards with quotes from families who navigated LTC claims.

**CTA section:** Cream background. "Ready to Navigate Your LTC Claim?" heading. Two buttons.

**Footer:** Use Layout footer.

---

## EDUCATION PAGE (client/src/pages/Education.tsx)

Sections:
1. **Hero:** Navy background, "Understanding LTC Insurance" heading, subtitle.
2. **LTC Basics:** What is LTC insurance, who needs it, when to use it. Pastel teal info boxes.
3. **ADL Guide:** Full explanation of all 6 ADLs (Bathing, Dressing, Eating/Feeding, Toileting, Transferring, Continence) with descriptions. Teal card for each.
4. **IADL Guide:** All 8 IADLs (Meal Preparation, Medication Management, Housekeeping, Laundry, Shopping/Errands, Transportation, Money Management, Telephone Use). Lavender cards.
5. **Glossary of Terms:** Accordion with 20+ terms: Elimination Period, Daily Maximum, Monthly Maximum, Lifetime Maximum, ADL, IADL, Case Manager, Third-Party Assessment, Waiver of Premium, Assignment of Benefits (AOB), Claim Number, Pre-Claim Number, Payment Cycle, CNA Required, Plan of Care, Look-Back Period, Inflation Rider, Pool of Money, Shared Care Rider, Cognitive Rider.
6. **Resources section:** With anchors #elimination-period, #adl-guide, #claim-process, #policy-review, #care-planning, #glossary. Each with a card and description.
7. **CTA:** Link to Policy Form.

---

## POLICY FORM (client/src/pages/PolicyForm.tsx)

A 6-step form with progress bar, step icons, and completion percentage. Save all state to localStorage key 'ltc-policy-form'. On every Next click: (1) validate required fields, (2) save to database via trpc.policy.save, (3) send full form JSON to Zapier webhook via trpc.policyForm.sendComprehensiveToZapier, (4) send email notification to daniel@scvisitingangels.com via trpc.email.notifyStepProgress.

**Steps array (6 items):**
- Step 0: "Insured Person" (👤)
- Step 1: "Policy Details" (📋)
- Step 2: "Carrier Info" (🏢)
- Step 3: "Benefits" (💰)
- Step 4: "Care Needs" (🏥)
- Step 5: "Review" (✅)

**TooltipField component:** Wraps each form field with a label, required asterisk, info tooltip button (circle-i icon), and video icon button (play circle icon). Tooltip shows field explanation on hover and click. Video icon shows a "Video coming soon" toast on click.

**Step 0 — Insured Person:**
Required: insuredFullName, insuredEmail, insuredPhone. Optional: insuredDob (MM/DD/YYYY mask), insuredAddress, insuredCity, insuredState, insuredZip, insuredSsn, insuredMedicare, insuredMedicaid.

**Step 1 — Policy Details:**
Required: policyNumber. Optional: policyStartDate, policyEndDate, eliminationPeriod (select: 30, 60, 90, 100, 180, 365 days), minAdlsRequired (select: 1-6), lookBackPeriod, policyType (select: Individual, Shared Care, Group), cognitiveRider (checkbox), internationalCoverage (checkbox), sharedCare (checkbox).

**Step 2 — Carrier Information:**
Optional: carrierName, carrierPhone, carrierFax, carrierAddress, carrierCity, carrierState, carrierZip, carrierEmail, carrierWebsite, claimNumber, preClaimNumber, caseManagerName, caseManagerPhone, caseManagerEmail, aobStatus (select: Pending, Active, Not Required), paymentCycle (select: Monthly, Bi-weekly, Weekly), cnaRequired (checkbox).

**Step 3 — Benefits:**
Optional: dailyMaximum, monthlyMaximum, lifetimeMaximum, inflationRider (select: None, 3% Simple, 5% Simple, 3% Compound, 5% Compound, CPI), inflationRate, waiverOfPremium (checkbox), premiumAmount, premiumFrequency (select: Monthly, Quarterly, Semi-Annual, Annual), benefitPeriod, poolOfMoney.

**Step 4 — Care Needs:**
This step has three sections in this order:

1. **Diagnosis section** (at top): Heading "Primary Diagnosis or Condition" with tooltip explaining cognitive conditions may qualify separately. Checkbox grid of diagnoses: Alzheimer's Disease, Dementia/Cognitive Decline, Parkinson's Disease, Stroke/CVA, ALS/Lou Gehrig's Disease, Multiple Sclerosis, Traumatic Brain Injury, Hip Fracture/Replacement, Knee Replacement, COPD/Respiratory, Cancer, Diabetes with Complications, Heart Failure/Cardiac, Arthritis/Mobility Issues, Other. Plus a diagnosisNotes textarea.

2. **ADL section**: Heading "Activities of Daily Living (ADLs)" with tooltip. Checkbox grid: Bathing, Dressing, Eating/Feeding, Toileting, Transferring, Continence. Plus a "None of the above" checkbox (sentinel value "NoneADL") that: (a) clears all other ADL selections when checked, (b) restores previous ADL selections when unchecked, (c) triggers a qualification alert modal when checked saying "Important: If the insured does not have ADL deficits, they may not qualify for LTC benefits. Most policies require 2-3 ADL deficits. Do you want to continue anyway?" with Yes/No buttons. Yes advances to next step. No unchecks NoneADL and restores previous selections.

3. **IADL section**: Heading "Instrumental Activities of Daily Living (IADLs)" with tooltip. Checkbox grid: Meal Preparation, Medication Management, Housekeeping, Laundry, Shopping/Errands, Transportation, Money Management, Telephone Use. Plus a "None of the above" checkbox (sentinel value "NoneIADL") that clears/restores IADL selections but does NOT trigger any alert modal. Also a careNotes textarea.

**Step 5 — Review:**
Show all entered data in organized sections. "Submit & Generate Strategy" button that calls trpc.strategy.generate and navigates to /strategy.

**Bottom navigation:** Previous button (left), Save Progress button (center — opens a dialog asking for email address to send a resume link), Next/Submit button (right).

**Save & Return feature:** When user clicks "Save Progress", show a dialog with email input. On submit, call trpc.email.sendSaveLink which sends an email with a link like `${window.location.origin}/policy-form?resume=true` and the current form state encoded as a base64 URL parameter. On page load, if resume=true in URL, restore form state from URL parameter.

---

## STRATEGY PAGE (client/src/pages/Strategy.tsx)

Load policy from localStorage. If no policy, show "Please complete the Policy Form first" with a link.

Call trpc.strategy.generate on load (if no strategy cached). Show loading skeleton while generating.

Display in tabbed sections (accordion on mobile):

**Tab 1 — Overview:**
- PolicySummaryCard component: Shows carrier name, policy number, elimination period, daily/monthly/lifetime max, inflation rider, min ADLs required, waiver of premium.
- ExecutiveSummary: AI-generated text in a cream card.
- BenefitSummary: Pastel boxes showing each benefit amount with icon.

**Tab 2 — Strategy:**
- ChronologicalChecklist: 3-stage interactive checklist. Stage 1 (Days 1-25, teal), Stage 2 (Days 26-63, blue), Stage 3 (Day 64+, green). Each task has a checkbox, title, description, day range, and category badge. Tasks link to Education page anchors where relevant.
- Stage summary cards showing task count and completion percentage.

**Tab 3 — Timeline:**
- GanttTimeline: Interactive Gantt chart showing all tasks across 3 stages. X-axis: days (0 to 90+). Y-axis: task names. Colored bars by stage. Click task to toggle completion. Responsive with overflow-x-auto on mobile.

**Tab 4 — Calculator:**
- CareCalculator: 
  - Inputs: hours per day of care needed, hourly care rate (default $25), inflation rate (use policy's inflation rate or default 3%), years to project (1-10).
  - Outputs: Monthly care cost, annual care cost, benefit pool remaining over time (chart), estimated months of coverage.
  - Show a Recharts line chart with two lines: "Care Cost" and "Benefit Pool Remaining" over the projection years.
  - Apply inflation multiplier to both care costs and benefit pool.

**Bottom section:**
- PdfDeliveryPanel: Two tabs — Download PDF and Email to Someone.
- SMSNotificationManager: Setup Twilio SMS notifications for task reminders.

---

## CONTACT PAGE (client/src/pages/Contact.tsx)

**Hero:** Navy background, "Contact SC Visiting Angels" heading.

**Contact info cards:** Phone (803) 749-0026, Email info@scvisitingangels.com, Address (Columbia, SC), Hours (Mon-Fri 8am-6pm, Sat 9am-3pm).

**Contact form:** Name, email, phone, subject (select: General Inquiry, LTC Claim Help, Policy Review, Other), message. On submit, call trpc.email.sendContactForm which sends email to info@scvisitingangels.com and shows success toast.

---

## TERMS PAGE (client/src/pages/Terms.tsx)

Full Terms of Use page at /terms. Include:
- Educational Purpose Disclaimer: "This website and all its contents are provided for educational and informational purposes only. Nothing on this website constitutes legal, financial, medical, or insurance advice."
- No Professional Relationship: "Use of this website does not create a professional relationship between you and SC Visiting Angels."
- Accuracy Disclaimer: "While we strive for accuracy, LTC insurance policies vary widely. Always consult your policy documents and a licensed professional."
- Limitation of Liability: "SC Visiting Angels shall not be liable for any damages arising from use of this website."
- Indemnification: User agrees to indemnify SC Visiting Angels.
- Governing Law: South Carolina.
- Contact for questions: info@scvisitingangels.com.

---

## TERMS GATE (client/src/components/TermsGate.tsx)

On first visit (check localStorage key 'ltc-terms-accepted'), show a modal dialog:
- Title: "Welcome to the LTC Insurance Portal"
- Body: Brief explanation that this site is for educational purposes only, not legal/financial/medical advice. Link to full Terms of Use (/terms).
- Two buttons: "I Accept" (teal, stores 'true' in localStorage and closes modal) and "View Full Terms" (outline, opens /terms in new tab).
- Cannot close modal by clicking outside or pressing Escape — must click a button.

---

## CHAT WIDGET (client/src/components/ChatWidget.tsx)

Floating button (bottom-right, 20px from edges). Teal background, white chat bubble icon. Badge showing unread count.

When clicked, opens a chat panel (350px wide, 500px tall on desktop; full-screen on mobile):
- Header: "LTC Assistant" with SC Visiting Angels dove icon. Close button.
- Messages area: Scrollable. User messages right-aligned (teal). Assistant messages left-aligned (white card). Markdown rendering using the `streamdown` package.
- Input area: Text input + Send button. Enter key sends.
- Initial greeting message from assistant: "Hello! I'm your LTC Insurance Assistant from SC Visiting Angels. I can help you understand your policy, navigate the claims process, and answer questions about long-term care insurance. How can I help you today?"

Call trpc.chat.send with {message, sessionId (stored in localStorage), policyId (from localStorage policy)}.

---

## SERVER ROUTERS

### server/routers.ts (main router)
Combine: auth, policy, strategy, email, sms, policyForm, pdf, system, chat, contacts.

### server/routers/chat.ts
```typescript
// Built-in LTC knowledge base (large string constant with glossary, strategy stages, critical rules, about SC Visiting Angels)
// retrieveRelevantDocs(query): keyword search in ragDocuments table
// saveMessage(sessionId, role, content): save to chatMessages
// getHistory(sessionId): get last 10 messages

export const chatRouter = router({
  send: publicProcedure
    .input(z.object({ message: z.string(), sessionId: z.string().optional(), policyId: z.number().optional() }))
    .mutation(async ({ input }) => {
      // 1. Save user message
      // 2. Retrieve relevant docs from ragDocuments
      // 3. Load policy context if policyId provided
      // 4. Get conversation history
      // 5. Build system prompt with knowledge base + policy context + RAG docs
      // 6. Call invokeLLM
      // 7. Save assistant response
      // 8. Return { content, sessionId }
    }),
  getHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => { /* return last 50 messages */ }),
});
```

### server/routers/pdfDelivery.ts
```typescript
export const pdfDeliveryRouter = router({
  generate: publicProcedure
    .input(/* full PdfData schema with all policy fields */)
    .mutation(async ({ input }) => {
      // 1. Call generateStrategyPdf(input) from pdfConverter.ts
      // 2. Upload PDF buffer to S3 with storagePut
      // 3. Return { url, filename }
    }),
  sendEmail: publicProcedure
    .input(/* email + pdfData */)
    .mutation(async ({ input }) => {
      // 1. Generate PDF
      // 2. Upload to S3
      // 3. POST to VITE_ZAPIER_WEBHOOK_URL with { email, pdfUrl, insuredName, ... }
      // 4. Return { success }
    }),
});
```

### server/pdfConverter.ts
Generate a comprehensive landscape PDF (jsPDF, 'l', 'mm', 'letter') with SC Visiting Angels branding.

Color palette:
- VA Teal: #3BBFBF (RGB: 59, 191, 191)
- VA Navy: #1B4F8A (RGB: 27, 79, 138)
- Cream: #FFF8F0
- Pastel Teal: #E8F8F8
- Pastel Blue: #EBF3FB
- Pastel Lavender: #F0EBF8
- Pastel Green: #EBF8F0
- Pastel Amber: #FEF9E7
- Text Dark: #1E293B
- Text Medium: #475569
- Text Light: #94A3B8

Pages:
1. **Cover page:** Full-page navy background. VA logo (text-based: dove emoji + "Visiting Angels"). Large white title: "Long-Term Care Insurance Strategy". Insured name in teal. Policy number, carrier, date. Bottom: "Prepared by SC Visiting Angels | www.scvisitingangels.com | (803) 749-0026". Teal accent bar at bottom.

2. **Table of Contents:** List all sections with page numbers.

3. **Executive Summary:** Pastel teal header band. AI-generated summary text. Key metrics in 4 pastel boxes (daily max, monthly max, lifetime max, elimination period).

4. **Benefit Summary:** Pastel blue header. Table with all benefit details. Inflation rider explanation box. Waiver of premium status.

5. **Policy Summary:** Pastel lavender header. Two columns: Carrier Info (name, phone, fax, address, email, website) and Claim Info (claim number, pre-claim number, case manager name/phone/email, AOB status, payment cycle).

6. **Care Needs Summary:** Pastel green header. Diagnosis checkboxes (drawn as ☑ or ☐). ADL deficits list. IADL deficits list. Care notes.

7. **3-Stage Strategy Checklist:** One page per stage. Stage 1 (teal header, Days 1-25), Stage 2 (blue header, Days 26-63), Stage 3 (green header, Day 64+). Each task as a row with: drawn checkbox square (□ or ☑ if completed), task title, description, day range badge. Notes line after each task. Stage summary at bottom.

8. **Gantt Timeline:** 3 pages (one per stage). Each page: full-width day ruler (x-axis), task rows with colored bars, alternating row backgrounds, vertical grid lines at key days, day range labels on bars. Row height: 10mm. Readable at landscape letter size.

9. **Care Calculator:** Pastel amber header. Table showing: hours/day, hourly rate, monthly cost, annual cost, estimated months of coverage, benefit pool remaining at years 1/2/3/5/10. Notes lines.

10. **Educational Section (3-4 pages):**
    - "LTC Insurance 101": What it is, who needs it, when to use it.
    - "Understanding Your ADLs": All 6 ADLs explained with what qualifies.
    - "The Claims Process": Step-by-step what to expect.
    - "Tips for Caregivers": 10 practical tips.
    - "Common Mistakes to Avoid": 6 critical mistakes.
    Each section in a pastel box with a heading and body text.

11. **Glossary of Terms:** Two-column layout. 20+ terms alphabetically. Each term bold, definition in regular weight. Pastel background alternating rows.

12. **Legal Disclaimers:** Navy header. Full disclaimer text. SC Visiting Angels contact info. "This document was generated by the LTC Insurance Portal at www.scvisitingangels.com".

Every page has:
- **Header:** Thin teal line at top. Left: "LTC Insurance Strategy" in small navy text. Right: insured name + policy number.
- **Footer:** Thin navy line at bottom. Left: "SC Visiting Angels | www.scvisitingangels.com". Center: page number (e.g., "Page 3 of 12"). Right: generation date.

### server/smsNotification.ts
```typescript
import twilio from "twilio";

export async function sendSMSNotification({ phoneNumber, message, taskName, taskDueDate }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { success: false, error: "SMS service not configured" };
  const client = twilio(sid, token);
  const result = await client.messages.create({ body: message || `Reminder: ${taskName} is due ${taskDueDate}`, from, to: phoneNumber });
  return { success: true, sid: result.sid };
}
```

### server/routers.ts — email procedures
```typescript
email: router({
  sendContactForm: publicProcedure
    .input(z.object({ name, email, phone, subject, message }))
    .mutation(async ({ input }) => {
      // Send email to info@scvisitingangels.com via nodemailer
      // Return { success }
    }),
  sendSaveLink: publicProcedure
    .input(z.object({ email: z.string(), resumeUrl: z.string(), insuredName: z.string().optional() }))
    .mutation(async ({ input }) => {
      // Send email with resume link via nodemailer
      // Return { success }
    }),
  notifyStepProgress: publicProcedure
    .input(z.object({ step: z.number(), stepName: z.string(), formData: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ input }) => {
      // Send email to daniel@scvisitingangels.com with JSON of form data
      // Subject: "LTC Portal: Step ${step} (${stepName}) completed"
      // Body: JSON.stringify(formData, null, 2)
      // Return { success }
    }),
  sendStrategy: publicProcedure
    .input(z.object({ recipientEmail: z.string(), recipientName: z.string().optional(), policyData: z.object({...all policy fields...}) }))
    .mutation(async ({ input }) => {
      // Generate PDF, upload to S3, POST to Zapier with { email, pdfUrl, insuredName }
      // Return { success }
    }),
}),
```

### server/routers/policyForm.ts
```typescript
export const policyFormRouter = router({
  sendComprehensiveToZapier: publicProcedure
    .input(z.object({ step: z.number(), stepName: z.string(), formData: z.record(z.string(), z.unknown()), timestamp: z.string() }))
    .mutation(async ({ input }) => {
      const webhookUrl = process.env.VITE_ZAPIER_WEBHOOK_URL;
      if (!webhookUrl) return { success: false };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'form_step_completed', step: input.step, stepName: input.stepName, timestamp: input.timestamp, formData: input.formData }),
      });
      return { success: true };
    }),
});
```

---

## TOOLTIP SYSTEM (client/src/components/ui/tooltip.tsx)

Rewrite the shadcn Tooltip to support click-toggle. Add a TooltipClickContext that tracks open state. The Tooltip component should:
- Accept all standard Radix Tooltip props
- Add a click handler to the trigger that toggles open state
- Work on both hover (desktop) and click/tap (mobile/touch)
- Close when clicking outside

---

## LEGAL DISCLAIMER FOOTER (client/src/components/LegalDisclaimerFooter.tsx)

A small footer component shown at the bottom of every page (inside Layout):
"⚠️ Educational Purposes Only: The information provided on this website is for educational and informational purposes only and does not constitute legal, financial, medical, or insurance advice. SC Visiting Angels makes no representations about the accuracy or completeness of this information. Always consult your insurance policy documents and a licensed professional before making any decisions. By using this website, you agree to our Terms of Use."

---

## CARE CALCULATOR LOGIC

```typescript
// In CareCalculator.tsx
const projectionData = years.map(year => {
  const inflationMultiplier = Math.pow(1 + (inflationRate / 100), year);
  const yearlyCost = hoursPerDay * 365 * hourlyRate * inflationMultiplier;
  const totalCostToYear = Array.from({length: year}, (_, i) => 
    hoursPerDay * 365 * hourlyRate * Math.pow(1 + (inflationRate / 100), i + 1)
  ).reduce((a, b) => a + b, 0);
  const benefitPoolRemaining = Math.max(0, lifetimeMaximumDollars - totalCostToYear);
  return { year, yearlyCost, totalCostToYear, benefitPoolRemaining };
});
```

---

## ENVIRONMENT VARIABLES NEEDED

Set these in Manus Secrets:
- VITE_ZAPIER_WEBHOOK_URL: Your Zapier webhook URL (placeholder: https://hooks.zapier.com/hooks/catch/YOUR_ID/YOUR_KEY/)
- TWILIO_ACCOUNT_SID: From twilio.com (starts with AC)
- TWILIO_AUTH_TOKEN: From twilio.com
- TWILIO_PHONE_NUMBER: Your Twilio phone number in E.164 format

---

## DESIGN TOKENS (client/src/index.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --teal: #3BBFBF;
  --navy: #1B4F8A;
  --cream: #FFF8F0;
  --pastel-teal: #E8F8F8;
  --pastel-blue: #EBF3FB;
  --pastel-lavender: #F0EBF8;
  --pastel-green: #EBF8F0;
  --pastel-amber: #FEF9E7;
}

h1, h2, h3 { font-family: 'Playfair Display', serif; }
body { font-family: 'Inter', sans-serif; }
```

---

## TESTING

Write vitest tests for:
- smsNotification.ts: mock twilio, test sendSMSNotification with valid/invalid credentials
- pdfConverter.ts: test generateStrategyPdf returns a Buffer with length > 0
- chat router: test send procedure returns content and sessionId
- email procedures: test sendContactForm, sendSaveLink, notifyStepProgress

---

## ADDITIONAL REQUIREMENTS

1. **Scroll to top on every route change** — add a ScrollToTop component in App.tsx that calls window.scrollTo(0,0) on location change.

2. **Phone number input mask** — format as (###) ###-#### automatically.

3. **Date input mask** — format as MM/DD/YYYY automatically.

4. **Auto-capitalize** — first letter of name fields.

5. **Forward navigation prevention** — users cannot click future steps in the progress bar; only completed steps are clickable.

6. **localStorage migration** — on load, if careNeeds array contains "None", replace with "NoneADL".

7. **Mobile responsive** — all pages work on mobile. GanttTimeline has overflow-x-auto wrapper with min-w-[600px] inner div. PdfDeliveryPanel tabs stack vertically on mobile.

8. **Error boundaries** — wrap the app in an ErrorBoundary component.

9. **Loading states** — show skeleton loaders while strategy is generating. Show spinner on PDF generation. Show loading state on all mutation buttons.

10. **Toast notifications** — use sonner for all success/error toasts.

11. **GitHub integration** — push all changes to GitHub repository dcradulescu/ltc-insurance-portal after every significant change.

Build this complete application now. Make it production-ready, elegant, and professional. The PDF especially should feel like a premium personalized planner that a family would want to keep and refer to throughout the LTC claims process.
```
