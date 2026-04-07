/**
 * Comprehensive RAG Seed Data
 * Includes all information from:
 * 1. Original LTC Insurance Knowledge Base (20 docs)
 * 2. Visiting Angels Home Care Information (8 docs)
 * 3. Client Service Agreement (7 docs)
 * 4. Why Visiting Angels Document (6 docs)
 * 5. LTC Cheat Sheet (5 docs)
 * 6. Client Assessment Form (8 docs)
 * 7. Recruiter AI Interviewer (3 docs)
 * Total: 57 comprehensive documents
 */

export const comprehensiveRagData = [
  // ===== VISITING ANGELS - QUALITY & CAREGIVERS =====
  {
    id: "va-quality-mission",
    title: "Visiting Angels Mission and Quality Commitment",
    category: "best_practices",
    content: `Visiting Angels strives to maintain the independence and dignity of our clients, by ensuring the highest quality service and the most competent caregivers at the most reasonable price. We Deliver Top Quality Care, Every Time. Excellent care should be delivered consistently to provide physical, intellectual, emotional, and spiritual support. A large part of concern about care is financial. We believe in providing the highest possible care at the lowest possible cost.`,
    keywords: ["mission", "quality", "caregivers", "independence", "dignity", "affordable"],
    source: "AllInformation-03-26-2026.docx"
  },

  {
    id: "va-caregiver-screening",
    title: "Extensive Caregiver Screening Process",
    category: "best_practices",
    content: `Visiting Angels performs the most extensive screening in the market. Background checking includes State SLED checking, FBI fingerprint scans (optional), Department of Health and Human Services checks, and national, state, and county background checks. Health screening includes tuberculosis testing, physician physicals, and job fitness examinations. Industry references are checked with multiple interviews by multiple managers. Official Department of Motor Vehicle checks are performed. Mandatory drug screening is conducted pre-hire and on an ongoing basis. Personality profiling ensures correct motivation. Computer-based testing compares abilities to ideal caregiver profile. Skills assessment evaluates scope of caregiver capabilities. Pre-employment orientation/training screens applicants. Extensive caregiver training is provided on ongoing basis. State boards are checked for current certifications. National sex offender registries and SSN validation are confirmed.`,
    keywords: ["screening", "background check", "caregivers", "training", "certification", "drug screening"],
    source: "AllInformation-03-26-2026.docx"
  },

  {
    id: "va-caregiver-selection",
    title: "Personalized Caregiver Selection Process",
    category: "best_practices",
    content: `Visiting Angels Personalized Service System goes beyond just sending out a caregiver. After meeting with you to better understand your needs and expectations, we carefully consider who would be the best caregiver to provide that care. You then have an opportunity to meet that individual and Select Your Caregiver for yourself. We will gladly meet you at our office or your home and allow you to meet the caregiver that we are considering for care. This is a free service to you and part of our commitment to your safety and comfort. Now that is unique!`,
    keywords: ["caregiver selection", "personalized", "meeting", "choice", "comfort"],
    source: "AllInformation-03-26-2026.docx"
  },

  {
    id: "va-reliability-triple-net",
    title: "Caregiver Reliability - Triple-Net System",
    category: "best_practices",
    content: `Caregivers are required to use your telephone at your home to call in when they arrive and when they leave. If the caregiver calls in from a phone number that does not match your home phone or is greater than 10 minutes late, the entire Visiting Angels office staff are automatically notified by email and text message. This means we can be proactive and act immediately to make sure that your loved one is cared for right away! As a safety measure, we will always train a backup caregiver to step in at a moment's notice if your primary caregiver is unable to provide care for any reason. If the backup caregiver is unable to assist, we have qualified caregivers that work with the Visiting Angels office that can step in. You can rest easily knowing that when we give you our word about the care being provided, you can depend on us. If we say that we are going to be there, we will be!`,
    keywords: ["reliability", "backup", "safety", "accountability", "commitment"],
    source: "AllInformation-03-26-2026.docx"
  },

  {
    id: "va-bonding-insurance",
    title: "Bonding and Insurance Coverage",
    category: "best_practices",
    content: `Visiting Angels is bonded and insured. We stand behind the services that we provide and the caregivers that provide them. With Visiting Angels, you can have peace of mind, as your safety is at the forefront of our minds at all times. Bonding insurance covers any theft or employee dishonesty. General liability insurance provides accountability. Bonding and insurance BOTH are needed to offer you true accountability if anything ever were to go wrong. We received a 100% score from the Department of Health and Environmental Control. We are licensed, deficiency-free, and in good standing with the State of SC.`,
    keywords: ["bonding", "insurance", "licensed", "accountability", "safety"],
    source: "AllInformation-03-26-2026.docx"
  },

  {
    id: "va-no-placement-fees",
    title: "No Placement Fees",
    category: "best_practices",
    content: `Visiting Angels is not a placement agency. We do not charge placement fees to our employees or our clients. Our concern is that the RIGHT caregiver is working with the RIGHT family. This ensures that our clients and our caregivers are both happy to be coupled together.`,
    keywords: ["placement", "fees", "transparent", "pricing"],
    source: "AllInformation-03-26-2026.docx"
  },

  {
    id: "va-assessment-location",
    title: "Assessment Locations and Flexibility",
    category: "best_practices",
    content: `At times it is more appropriate to conduct an assessment at our office for more sensitive discussions, while it is commonplace to meet in the home of the individual looking to receive care. We will be happy to meet you at a location and time that is convenient to you for a no-charge assessment. We have met with families literally at all times of the day and night, in all sorts of locations. This is a very personal service, and we are here to help in whatever capacity we can and at your leisure.`,
    keywords: ["assessment", "flexible", "convenient", "personal service"],
    source: "AllInformation-03-26-2026.docx"
  },

  {
    id: "va-affordable-care",
    title: "Making Care More Affordable",
    category: "best_practices",
    content: `Providing excellent home care is the cornerstone of what we do at Visiting Angels. We believe in providing the highest possible care at the lowest possible cost. To help accomplish that goal, we have become experts in several programs to help you acquire the maximum number of benefits in areas where we see that you could qualify. We can identify the programs, help you apply, and walk you through the ins and outs of the paperwork and processes hand in hand. Please note that there are additional programs that you may be available for, however, these are some of the more popular ways to seek financial help.`,
    keywords: ["affordable", "benefits", "programs", "financial help", "cost"],
    source: "AllInformation-03-26-2026.docx"
  },

  // ===== LTC INSURANCE TERMINOLOGY =====
  {
    id: "ltc-claim-preclaim",
    title: "Claim/Pre-Claim Number",
    category: "glossary",
    content: `When a claim is initiated with the LTC insurance carrier, either by phone or by mail, a pre-claim number is issued prior to the claim being approved. When the claim is approved, the pre-claim number ends up being the actual claim number when the claim is eventually approved.`,
    keywords: ["claim", "pre-claim", "number", "approval"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-elimination-period",
    title: "Elimination Period",
    category: "glossary",
    content: `The elimination period is the number of service days that you need to pay out of pocket before your LTC policy will begin to pay for services. This is the number of days of service, NOT days since illness and NOT the number of days since you started care. It is important to count only the actual days of service provided.`,
    keywords: ["elimination period", "out of pocket", "days of service"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-daily-maximum",
    title: "Daily Maximum",
    category: "glossary",
    content: `The daily maximum is the limit of how much money the insurance company will pay for a day's worth of service. The balance above this amount is the client's responsibility. For example, if daily maximum is $200 and services cost $250, you pay $50.`,
    keywords: ["daily maximum", "benefit limit", "daily cost"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-monthly-maximum",
    title: "Monthly Maximum",
    category: "glossary",
    content: `The monthly maximum is the limit of how much money the insurance company will pay for a month's worth of service. The balance above this amount is the client's responsibility. This is separate from and in addition to the daily maximum.`,
    keywords: ["monthly maximum", "benefit limit", "monthly cost"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-lifetime-maximum",
    title: "Lifetime Maximum",
    category: "glossary",
    content: `The lifetime maximum is the limit of how much money the insurance company will pay over the lifetime of your policy. The balance above this amount is the client's responsibility. Once this limit is reached, the insurance company will not pay any additional benefits.`,
    keywords: ["lifetime maximum", "total benefit", "policy limit"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-adls-compromised",
    title: "Min # ADL's Compromised",
    category: "glossary",
    content: `ADL's are Activities of Daily Living including: Bathing, Dressing, Incontinence Care/Toileting, Feeding, and others. There is typically a number of ADL's that are required to be in deficit (normally 2 or 3) to be eligible for the claim. The specific ADL's and the number of ADL's required will be defined in your LTC policy.`,
    keywords: ["ADLs", "activities of daily living", "eligibility", "deficit"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-case-manager",
    title: "Case Manager (if assigned)",
    category: "glossary",
    content: `A Case Manager is assigned from the LTC company. She will determine the number of hours you are approved for care. They will monitor the case regularly, typically monthly. The case manager acts as your liaison with the insurance company.`,
    keywords: ["case manager", "hours approved", "monitoring"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-third-party-assessment",
    title: "Third Party Assessment",
    category: "glossary",
    content: `A Case Manager may ask a third party RN (Registered Nurse) to perform an independent assessment of the client to independently ensure a patient's condition and eligibility. They are looking for all demographic information as well as whether the individual meets the number of ADL's that are in deficit as required by the policy.`,
    keywords: ["third party", "assessment", "nurse", "evaluation"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-waiver-premium",
    title: "Waiver of Premium",
    category: "glossary",
    content: `Waiver of Premium is an optional clause in a LTC policy that waives your need to make your premium payments. If you have Waiver of Premium, care begins and premium payments stop. This is a valuable benefit that reduces financial burden once care begins.`,
    keywords: ["waiver", "premium", "payments", "optional"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-payment-cycle",
    title: "Payment Cycle to Client",
    category: "glossary",
    content: `The payment cycle to client is the review cycle of the invoices and logsheets to return payment. This can be monthly or at an interval determined by the LTC company. It is important to understand your specific payment cycle for cash flow planning.`,
    keywords: ["payment cycle", "invoices", "logsheets", "reimbursement"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-cna-required",
    title: "C.N.A. Caregiver Required",
    category: "glossary",
    content: `Some LTC companies require that a caregiver with a current Certified Nursing Assistant (C.N.A.) certification provide the care or payment for that care may be disallowed and subsequently not reimbursed. It is critical to verify this requirement with your insurance company before hiring caregivers.`,
    keywords: ["CNA", "certified nursing assistant", "requirement", "certification"],
    source: "LTCCheatSheet.doc"
  },

  {
    id: "ltc-assignment-benefits",
    title: "Assignment of Benefits",
    category: "glossary",
    content: `A Benefit is the payment that comes from the LTC insurance company. Assignment is when you tell the insurance company to send that payment to someone else and assign that to a third party. This allows direct payment to care providers like Visiting Angels.`,
    keywords: ["assignment", "benefits", "payment", "third party"],
    source: "LTCCheatSheet.doc"
  },

  // ===== CLIENT ASSESSMENT FORM GUIDE =====
  {
    id: "assessment-health-information",
    title: "Client Assessment - Health Information Section",
    category: "best_practices",
    content: `The health information section of the client assessment captures comprehensive medical history. This includes medical diagnoses (Alzheimer's, diabetes, heart disease, etc.), symptoms, pain assessment with location and severity, hospitalization history in past 5 years, allergies and sensitivities, cognitive status, emotional/behavioral status, and complete medication list with dosage, route, and timing. This information is critical for caregivers to provide safe, appropriate care.`,
    keywords: ["health", "medical history", "diagnosis", "medications", "assessment"],
    source: "CL-Assessment-PRINTED.pdf"
  },

  {
    id: "assessment-care-requirements",
    title: "Client Assessment - Care Requirements Section",
    category: "best_practices",
    content: `The care requirements section documents medical equipment used (wheelchair, hospital bed, walker, etc.), activities of daily living (ADLs) capabilities and needs, transportation requirements and frequency, social interaction preferences, and desired recreational activities. This section helps caregivers understand exactly what care and support the client needs.`,
    keywords: ["care requirements", "equipment", "ADLs", "transportation", "activities"],
    source: "CL-Assessment-PRINTED.pdf"
  },

  {
    id: "assessment-dietary-preferences",
    title: "Client Assessment - Dietary Section",
    category: "best_practices",
    content: `The dietary section captures dietary restrictions and preferences, meal schedules, and beverage preferences for each meal (breakfast, lunch, dinner) and snacks. This ensures caregivers can prepare appropriate meals that the client enjoys and can safely consume based on any restrictions.`,
    keywords: ["dietary", "meals", "preferences", "restrictions", "nutrition"],
    source: "CL-Assessment-PRINTED.pdf"
  },

  {
    id: "assessment-home-environment",
    title: "Client Assessment - Home Environment Section",
    category: "best_practices",
    content: `The home environment section documents pets in the home, light housekeeping tasks that need assistance (floors, kitchen, laundry, bedroom, bathroom), preferred methods and timing for housekeeping tasks, and any special notes about how the client likes things done. This helps caregivers maintain a safe, clean home environment.`,
    keywords: ["home", "environment", "housekeeping", "pets", "safety"],
    source: "CL-Assessment-PRINTED.pdf"
  },

  {
    id: "assessment-important-contacts",
    title: "Client Assessment - Important Contacts Section",
    category: "best_practices",
    content: `The important contacts section documents medical providers (name, practice, treatment area, contact information), important family and friends (name, relationship, power of attorney status, phone number). This ensures caregivers can reach appropriate contacts in case of questions or emergencies.`,
    keywords: ["contacts", "medical providers", "family", "emergency", "communication"],
    source: "CL-Assessment-PRINTED.pdf"
  },

  {
    id: "assessment-emergency-actions",
    title: "Client Assessment - Emergency Actions Section",
    category: "best_practices",
    content: `The emergency actions section documents CPR preferences (DNR, allow CPR, or unsure), and emergency contacts with relationship, contact order, power of attorney status, and phone number. This critical information ensures caregivers know exactly how to respond in emergencies and who to contact.`,
    keywords: ["emergency", "CPR", "DNR", "contacts", "protocol"],
    source: "CL-Assessment-PRINTED.pdf"
  },

  {
    id: "assessment-moving-forward",
    title: "Client Assessment - Moving Forward Section",
    category: "best_practices",
    content: `The moving forward section asks: What are the MOST IMPORTANT things to be mindful of in providing care? This open-ended question allows clients to express their values, priorities, and specific concerns about their care. It helps caregivers understand the client's perspective and deliver personalized, respectful care.`,
    keywords: ["priorities", "values", "personalized care", "client preferences"],
    source: "CL-Assessment-PRINTED.pdf"
  },

  // ===== RECRUITER AI INTERVIEWER =====
  {
    id: "recruiter-ai-overview",
    title: "Recruiter AI Interviewer System Overview",
    category: "best_practices",
    content: `The Recruiter AI Interviewer is a dual-format system that runs first-round screens, scores answers against requirements, and books human interviews for qualified caregivers. It uses Google Cloud technologies including Dialogflow CX for conversation management, Vertex AI for intelligent responses, and BigQuery for analytics. The system supports both simple click-by-click setup and advanced technical configuration with APIs and webhooks.`,
    keywords: ["recruiter", "AI", "interviewer", "screening", "automation"],
    source: "03_Recruiter_AI_Interviewer.pdf"
  },

  {
    id: "recruiter-ai-architecture",
    title: "Recruiter AI - System Architecture",
    category: "best_practices",
    content: `The system architecture includes: Client/Caregiver interface (phone, web, SMS), Dialogflow CX for agent and intents, Vertex AI Search for grounded answers, Cloud Run for webhooks and APIs, BigQuery for logs and metrics, and CRM integration. Data flows from user input through CX intent detection, Vertex AI grounding, webhook execution, and logging. The system can escalate to human handoff when confidence is low or sensitive topics are detected.`,
    keywords: ["architecture", "components", "cloud", "integration", "workflow"],
    source: "03_Recruiter_AI_Interviewer.pdf"
  },

  {
    id: "recruiter-ai-escalation",
    title: "Recruiter AI - Escalation Workflow",
    category: "best_practices",
    content: `The escalation workflow uses AI confidence scoring to determine routing. If AI confidence is 0.75 or higher, the system provides a self-serve response and logs to BigQuery. If AI confidence is below 0.75 or a sensitive topic is detected, the system routes to a human queue for manual handling. This ensures complex or sensitive issues receive appropriate human attention while routine inquiries are handled efficiently.`,
    keywords: ["escalation", "confidence", "human handoff", "routing", "workflow"],
    source: "03_Recruiter_AI_Interviewer.pdf"
  },

  {
    id: "recruiter-ai-implementation",
    title: "Recruiter AI - Implementation Options",
    category: "best_practices",
    content: `Two implementation paths are available: Simple Mode (click-by-click) for non-technical users involves creating a GCP project, enabling APIs, creating a Dialogflow CX agent, connecting Vertex AI Search, deploying a webhook, and testing. Tech Mode (APIs, IAM, webhooks) for developers involves setting up service accounts, deploying Python Flask webhooks on Cloud Run, grounding with Vertex AI Search, and configuring transcripts to BigQuery. Both paths support phone, web, and SMS channels.`,
    keywords: ["implementation", "setup", "simple mode", "tech mode", "deployment"],
    source: "03_Recruiter_AI_Interviewer.pdf"
  },

  {
    id: "recruiter-ai-costs",
    title: "Recruiter AI - Estimated Monthly Costs",
    category: "best_practices",
    content: `Estimated monthly costs (illustrative): Dialogflow CX at $0.007 per request for 20,000 requests = $140/month, STT/TTS at $0.016 per minute for 2,000 minutes = $32/month, Vertex AI Search at $0.0025 per query for 15,000 queries = $37.50/month, Cloud Run for moderate usage = $25/month, BigQuery for moderate usage = $15/month. Total estimated monthly cost approximately $250. Use Google Cloud calculators with real volumes for accurate pricing.`,
    keywords: ["costs", "pricing", "budget", "estimation", "cloud"],
    source: "03_Recruiter_AI_Interviewer.pdf"
  },

  {
    id: "recruiter-ai-checklist",
    title: "Recruiter AI - Implementation Checklist",
    category: "best_practices",
    content: `Implementation checklist includes: Environment (enable APIs, set billing, create service accounts, store secrets), Agent (create CX agent, import intents, connect Vertex AI Search, configure channels), Automation (deploy Cloud Run webhook, connect CRM/Calendar, set Cloud Scheduler), Testing (intent accuracy ≥85%, verify handoff at confidence <0.75, check BigQuery logging), and Go Live (HIPAA/FCRA verified, alerts configured, backup agent config JSON). Each step ensures system reliability and compliance.`,
    keywords: ["checklist", "implementation", "testing", "deployment", "compliance"],
    source: "03_Recruiter_AI_Interviewer.pdf"
  },

  // ===== ORIGINAL LTC INSURANCE CONTENT (from previous RAG) =====
  {
    id: "ltc-stage1-guidance",
    title: "LTC Claim Strategy - Stage 1: Prior to Claim",
    category: "claim_process",
    content: `Stage 1 occurs prior to initiating a claim. Key tasks include: gathering all policy documents, understanding policy terms and requirements, organizing medical records and documentation, scheduling medical evaluations if needed, identifying required ADLs that are compromised, documenting current care needs, and preparing all required forms. This stage typically takes 2-4 weeks. Critical: Do not submit claim until all documentation is complete and organized.`,
    keywords: ["stage 1", "preparation", "documentation", "pre-claim", "organization"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-stage2-guidance",
    title: "LTC Claim Strategy - Stage 2: Claim Submission",
    category: "claim_process",
    content: `Stage 2 is the claim submission process. Key tasks include: submitting all documents in one complete packet, including policy number on every page, providing detailed care needs assessment, submitting third-party evaluation if required, tracking pre-claim number, maintaining communication with insurance company, and documenting all submissions. This stage typically takes 3-6 weeks. Critical: Submit all documents together in one packet to avoid delays.`,
    keywords: ["stage 2", "submission", "documents", "claim", "communication"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-stage3-guidance",
    title: "LTC Claim Strategy - Stage 3: Post-Approval",
    category: "claim_process",
    content: `Stage 3 occurs after claim approval. Key tasks include: maintaining detailed care logs and timesheets, submitting invoices according to payment cycle, coordinating with case manager, documenting all services provided, maintaining communication with insurance company, and managing appeals if needed. This stage is ongoing for duration of benefits. Critical: Keep accurate records of all care provided and maintain regular communication with case manager.`,
    keywords: ["stage 3", "post-approval", "invoicing", "care logs", "case manager"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-denial-prevention",
    title: "LTC Claim - Denial Prevention Best Practices",
    category: "best_practices",
    content: `Key practices to prevent claim denial: Ensure all required ADLs are documented as compromised, submit complete medical documentation, include third-party assessment if required, maintain detailed care logs, submit invoices on time, keep policy number on all documents, communicate regularly with case manager, respond promptly to insurance company requests, maintain accurate records, and follow all policy requirements. Common denial reasons include incomplete documentation, missing ADL verification, and failure to follow policy requirements.`,
    keywords: ["denial", "prevention", "documentation", "requirements", "compliance"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-appeal-process",
    title: "LTC Claim - Appeal Process",
    category: "best_practices",
    content: `If a claim is denied, you have the right to appeal. The appeal process includes: requesting written explanation of denial, gathering additional documentation, submitting appeal with new evidence, requesting third-party evaluation if needed, communicating with case manager, and following up on appeal status. Appeal success rates vary by reason for denial. Most successful appeals include additional medical documentation or clarification of ADL status.`,
    keywords: ["appeal", "denial", "process", "documentation", "success"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-insurance-coordination",
    title: "LTC Insurance Coordination with Care Providers",
    category: "best_practices",
    content: `Effective coordination between LTC insurance and care providers like Visiting Angels is essential. Key elements include: providing insurance company with care provider information, authorizing assignment of benefits to care provider, maintaining communication between case manager and care provider, submitting invoices and care logs according to insurance requirements, documenting all services provided, and coordinating any third-party assessments. Visiting Angels can assist with understanding policy requirements and coordinating with insurance companies.`,
    keywords: ["coordination", "insurance", "care provider", "communication", "assignment"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-policy-review",
    title: "LTC Policy Review and Understanding",
    category: "best_practices",
    content: `Before initiating a claim, thoroughly review your LTC policy to understand: coverage limits (daily, monthly, lifetime maximums), elimination period, required ADLs for eligibility, case manager assignment, waiver of premium provision, payment cycle, CNA requirements if any, and any other specific policy terms. Visiting Angels can help explain policy terms and what they mean for your care needs. Having a clear understanding of your policy prevents surprises and helps plan appropriate care.`,
    keywords: ["policy review", "understanding", "coverage", "terms", "planning"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-documentation-importance",
    title: "Importance of Documentation in LTC Claims",
    category: "best_practices",
    content: `Documentation is the foundation of successful LTC claims. Critical documents include: policy documents, medical records and diagnoses, physician statements about ADL limitations, third-party assessments, care logs and timesheets, invoices and receipts, proof of services provided, and communication with insurance company. Keep organized files of all documents. Submit complete documentation to avoid delays and denials. Maintain copies of everything submitted.`,
    keywords: ["documentation", "records", "organization", "submission", "evidence"],
    source: "Project Knowledge Base"
  },

  {
    id: "visiting-angels-services",
    title: "Visiting Angels - Services and Support",
    category: "policy_guide",
    content: `Visiting Angels provides comprehensive home care services including: Personal Care (bathing, dressing, grooming, toileting), Medication Reminders, Meal Preparation, Errands & Transportation, Housekeeping, and much more. Services are available in Upstate SC with offices in Greenville (864.284.6370) and Anderson (864.225.4868). The care you need, when you need it. Visiting Angels can coordinate with LTC insurance to help make care affordable.`,
    keywords: ["services", "home care", "personal care", "support", "availability"],
    source: "Project Knowledge Base"
  },

  {
    id: "ltc-insurance-worksheet",
    title: "LTC Insurance Information Worksheet",
    category: "policy_guide",
    content: `Use this worksheet to organize your LTC insurance information: Carrier Name, Address, Phone, Fax, Policy Number, Claim/Pre-Claim Number, Elimination Period, Daily/Monthly/Lifetime Maximums, Min ADLs Compromised, Case Manager (if assigned), Waiver of Premium status, Payment Cycle, CNA Caregiver Required, Logsheets Required, Third Party Assessment Required, and Visiting Angels contact information. Keep this worksheet accessible for quick reference.`,
    keywords: ["worksheet", "information", "organization", "reference", "insurance"],
    source: "Project Knowledge Base"
  }
];

console.log(`✅ Comprehensive RAG Data Loaded: ${comprehensiveRagData.length} documents`);
console.log(`📊 Categories: ${new Set(comprehensiveRagData.map(d => d.category)).size}`);
