# LTC Insurance Portal — Disaster Recovery Guide

**Project:** SC Visiting Angels LTC Insurance Portal  
**Owner:** Daniel — SC Visiting Angels (daniel@scvisitingangels.com)  
**Website:** [www.scvisitingangels.com](https://www.scvisitingangels.com)  
**Phone:** (803) 749-0026  
**GitHub Repository:** dcradulescu/ltc-insurance-portal  
**Hosted On:** Manus (manus.app) — managed Node.js hosting with built-in database  
**Last Updated:** June 2026

---

## What This Document Is

This guide exists so that any developer — even one who has never seen this project before — can fully reconstruct the LTC Insurance Portal from scratch if something catastrophic happens. It covers the architecture, every major feature, all environment variables, the database schema, and step-by-step reconstruction instructions.

---

## Executive Summary

The LTC Insurance Portal is a web application that helps families navigate the long-term care (LTC) insurance claims process. It is branded for SC Visiting Angels, a home care agency in South Carolina.

**What the app does:**

1. **Educates** users about LTC insurance through a comprehensive Education page with a glossary, ADL/IADL explanations, and tips.
2. **Collects policy data** through a 6-step intake form covering the insured person, policy details, carrier information, care needs, and ADL/IADL deficits.
3. **Generates a personalized strategy** using an LLM (AI) that produces a 3-stage claims roadmap with a Gantt timeline, interactive checklist, care calculator, and benefit projections.
4. **Delivers the strategy** as a professionally designed landscape PDF (SC Visiting Angels branded) via download, email (through Zapier), or print.
5. **Notifies the agency** via Zapier webhook and email (daniel@scvisitingangels.com) every time a user advances through the form.
6. **Provides a RAG-powered chat widget** that answers LTC insurance questions using a built-in knowledge base and the user's specific policy context.
7. **Sends SMS notifications** via Twilio for task reminders and alerts.
8. **Protects the company legally** through a Terms of Use gate that every user must accept before using the site.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Styling | Tailwind CSS | 4 |
| UI components | shadcn/ui + Radix UI | latest |
| Routing | Wouter | latest |
| State / data fetching | tRPC + TanStack Query | 11 / 5 |
| Backend framework | Express | 4 |
| API layer | tRPC | 11 |
| Database ORM | Drizzle ORM | latest |
| Database | MySQL (TiDB on Manus) | — |
| Build tool | Vite | latest |
| Language | TypeScript | 5 |
| PDF generation | jsPDF | latest |
| SMS | Twilio | latest |
| Email | Nodemailer + Zapier webhook | — |
| AI / LLM | Manus built-in LLM API | — |
| File storage | AWS S3 (Manus managed) | — |
| Hosting | Manus | — |

---

## Project Structure

```
ltc-insurance-portal/
├── client/                          # React frontend
│   ├── index.html                   # HTML entry point (Google Fonts loaded here)
│   └── src/
│       ├── App.tsx                  # Routes, global providers, ChatWidget, TermsGate
│       ├── main.tsx                 # React root, QueryClient, tRPC provider
│       ├── index.css                # Global CSS variables, Tailwind theme tokens
│       ├── const.ts                 # getLoginUrl() helper
│       ├── lib/trpc.ts              # tRPC client binding
│       ├── hooks/useAuth.ts         # Auth state hook
│       ├── contexts/AuthContext.tsx # Auth context provider
│       ├── pages/
│       │   ├── Home.tsx             # Landing page with hero, features, testimonials
│       │   ├── Education.tsx        # LTC education, glossary, ADL/IADL guide
│       │   ├── PolicyForm.tsx       # 6-step intake form (the core of the app)
│       │   ├── Strategy.tsx         # AI-generated strategy page
│       │   ├── Contact.tsx          # Contact form + info
│       │   └── Terms.tsx            # Terms of Use page (/terms)
│       └── components/
│           ├── Layout.tsx           # Nav, footer, top bar (SC Visiting Angels branded)
│           ├── ChatWidget.tsx       # Floating RAG chat widget (bottom-right)
│           ├── TermsGate.tsx        # First-visit Terms of Use modal
│           ├── PdfDeliveryPanel.tsx # Download/email PDF UI
│           ├── GanttTimeline.tsx    # Interactive Gantt chart (3 stages)
│           ├── CareCalculator.tsx   # Benefit calculator with inflation/waiver
│           ├── ChronologicalChecklist.tsx  # 3-stage task checklist
│           ├── PolicySummaryCard.tsx       # Policy details summary card
│           ├── SMSNotificationManager.tsx  # Twilio SMS setup UI
│           ├── LegalDisclaimerFooter.tsx   # Legal disclaimer on every page
│           ├── AboutHomeCare.tsx           # SC Visiting Angels CTA section
│           └── ui/                  # shadcn/ui components (DO NOT edit)
├── server/
│   ├── routers.ts                   # Main tRPC router (combines all sub-routers)
│   ├── db.ts                        # Database query helpers
│   ├── smsNotification.ts           # Twilio SMS integration
│   ├── strategyPdfGenerator.ts      # Entry point for PDF generation
│   ├── pdfConverter.ts              # Full PDF layout engine (jsPDF, landscape, VA branded)
│   ├── storage.ts                   # S3 helpers (storagePut, storageGet)
│   ├── routers/
│   │   ├── chat.ts                  # RAG chat router (LLM + knowledge base)
│   │   ├── pdfDelivery.ts           # PDF generation + S3 upload + Zapier email
│   │   └── policyForm.ts            # Zapier webhook + step-progress notification
│   └── _core/                       # Framework plumbing (DO NOT edit)
│       ├── env.ts                   # Environment variable validation
│       ├── trpc.ts                  # tRPC server setup
│       ├── context.ts               # Request context (user, db)
│       ├── llm.ts                   # LLM invocation helper
│       ├── email.ts                 # Email sending helper
│       ├── notification.ts          # Owner notification helper
│       └── storageProxy.ts          # S3 storage proxy for frontend image serving
├── drizzle/
│   ├── schema.ts                    # Database schema (ALL tables defined here)
│   └── migrations/                  # Auto-generated migration files
├── shared/                          # Shared types and constants
├── DISASTER_RECOVERY.md             # This file
├── RECONSTRUCTION_PROMPT.md         # One-shot Manus reconstruction prompt
├── package.json
├── tsconfig.json
└── todo.md                          # Feature tracking
```

---

## Database Schema

All tables are defined in `drizzle/schema.ts`. The database is MySQL (TiDB) hosted on Manus.

### `policies` table (67 columns)
The core table. Stores all data from the 6-step intake form.

| Column Group | Key Fields |
|---|---|
| Insured Person | `insuredFullName`, `insuredDob`, `insuredEmail`, `insuredPhone`, `insuredAddress` |
| Policy Details | `policyNumber`, `policyStartDate`, `eliminationPeriod`, `minAdlsRequired` |
| Carrier Info | `carrierName`, `carrierPhone`, `carrierFax`, `carrierAddress`, `carrierEmail` |
| Benefits | `dailyMaximum`, `monthlyMaximum`, `lifetimeMaximum`, `inflationRider`, `waiverOfPremium` |
| Care Needs | `qualifyingAdls` (JSON array), `careNeeds` (JSON array), `diagnosisCheckboxes` (JSON array) |
| Claim Info | `claimNumber`, `caseManagerName`, `caseManagerPhone`, `aobStatus` |
| Provider Info | `providerName`, `providerPhone`, `providerFax` |
| Admin | `createdAt`, `updatedAt` |

### `strategies` table
Stores AI-generated strategy content linked to a policy.

| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key |
| `policyId` | int | Foreign key → policies.id |
| `stage1Tasks` | text | JSON array of Stage 1 tasks |
| `stage2Tasks` | text | JSON array of Stage 2 tasks |
| `stage3Tasks` | text | JSON array of Stage 3 tasks |
| `executiveSummary` | text | AI-generated executive summary |
| `completedTasks` | text | JSON array of completed task IDs |

### `chatMessages` table
Stores conversation history for the RAG chat widget.

| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key |
| `sessionId` | varchar | Browser session identifier |
| `role` | enum | `user` or `assistant` |
| `content` | text | Message content |
| `createdAt` | timestamp | When message was sent |

### `ragDocuments` table
Optional knowledge base documents for the RAG chat (built-in knowledge is sufficient without this).

| Column | Type | Description |
|---|---|---|
| `id` | int | Primary key |
| `title` | varchar | Document title |
| `content` | text | Full document text |
| `category` | varchar | Category tag |
| `createdAt` | timestamp | When added |

### `ragDocumentChunks` table
Chunked versions of RAG documents for retrieval.

### `users` table (Manus managed)
Standard Manus OAuth user table. Not directly used by the app (all procedures are public).

---

## Environment Variables

All environment variables are managed through the Manus Secrets panel. **Never commit these to git.**

### Automatically injected by Manus (no setup needed)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Session cookie signing |
| `BUILT_IN_FORGE_API_KEY` | Manus LLM API key (server-side) |
| `BUILT_IN_FORGE_API_URL` | Manus LLM API URL |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus LLM API key (frontend) |
| `VITE_FRONTEND_FORGE_API_URL` | Manus LLM API URL (frontend) |
| `VITE_APP_ID` | Manus OAuth app ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |
| `OWNER_OPEN_ID` | Owner's Manus user ID |
| `OWNER_NAME` | Owner's name |

### Must be configured manually

| Variable | Where to Get It | Purpose |
|---|---|---|
| `VITE_ZAPIER_WEBHOOK_URL` | Zapier → Create Zap → Webhooks by Zapier | Receives form submissions and sends emails |
| `TWILIO_ACCOUNT_SID` | twilio.com → Console → Account SID | SMS notifications |
| `TWILIO_AUTH_TOKEN` | twilio.com → Console → Auth Token | SMS authentication |
| `TWILIO_PHONE_NUMBER` | twilio.com → Phone Numbers | Sender phone number (E.164 format) |

---

## Key Features — How They Work

### 1. Six-Step Intake Form (`PolicyForm.tsx`)

The form has 6 steps:
- **Step 0:** Insured Person (name, DOB, email, phone, address, SSN, Medicare/Medicaid)
- **Step 1:** Policy Details (policy number, dates, elimination period, ADL requirements)
- **Step 2:** Carrier Information (carrier name, phone, fax, address, claim numbers)
- **Step 3:** Benefits (daily/monthly/lifetime max, inflation rider, waiver of premium, premium amount)
- **Step 4:** Care Needs (diagnosis checkboxes, ADL deficits, IADL deficits, care services)
- **Step 5:** Review & Submit

Data is saved to `localStorage` on every change and to the database on every Next click. On every Next click, the full form JSON is also sent to Zapier and an email notification is sent to daniel@scvisitingangels.com.

**ADL/IADL None logic:** "None" on ADLs triggers the qualification alert modal. "None" on IADLs does not. Both remember previous selections when unchecked.

### 2. Strategy Generation (`Strategy.tsx`)

When the user arrives at the Strategy page, the app:
1. Loads the saved policy from localStorage
2. Calls `trpc.strategy.generate` which invokes the LLM with the full policy context
3. The LLM returns 3 stages of tasks (Stage 1: Prior to Claim, Stage 2: Filing, Stage 3: Post-Approval)
4. Tasks are displayed as an interactive checklist, Gantt timeline, and care calculator

### 3. PDF Generation (`pdfConverter.ts`)

The PDF is a landscape-oriented, multi-page document with SC Visiting Angels branding. Sections:
1. Cover page (VA logo, insured name, policy number, date)
2. Executive Summary (AI-generated overview)
3. Benefit Summary (daily/monthly/lifetime max, elimination period, inflation rider)
4. Policy Summary (carrier info, claim numbers, case manager)
5. 3-Stage Checklist (with literal drawn checkbox squares)
6. Gantt Timeline (3 pages, one per stage, with day ruler and colored bars)
7. Care Calculator (hours of care, benefit duration projections)
8. Educational Section (LTC 101, ADL guide, claim process, caregiver tips)
9. Glossary of Terms
10. Legal Disclaimers

### 4. RAG Chat Widget (`ChatWidget.tsx` + `server/routers/chat.ts`)

A floating chat button in the bottom-right corner of every page. When clicked, opens a chat panel. The AI assistant:
- Has a built-in LTC knowledge base (glossary, strategy stages, critical rules)
- Retrieves relevant documents from the `ragDocuments` database table
- Injects the user's current policy context if available
- Maintains conversation history per browser session
- Is branded as "SC Visiting Angels LTC Assistant"

### 5. Terms of Use Gate (`TermsGate.tsx`)

On first visit, a modal appears requiring the user to accept the Terms of Use before proceeding. Acceptance is stored in `localStorage`. The full Terms of Use page is at `/terms`.

---

## Reconstruction Steps

If the project is completely lost, follow these steps:

### Step 1: Create a new Manus project

1. Go to manus.app and create a new project
2. Select the "Web App (tRPC + Database + Auth)" template
3. Name it `ltc-insurance-portal`

### Step 2: Connect GitHub

1. In the Manus project settings, connect to GitHub
2. Link to the repository `dcradulescu/ltc-insurance-portal`

### Step 3: Set environment variables

In the Manus Secrets panel, add:
- `VITE_ZAPIER_WEBHOOK_URL` — your Zapier webhook URL
- `TWILIO_ACCOUNT_SID` — from twilio.com
- `TWILIO_AUTH_TOKEN` — from twilio.com
- `TWILIO_PHONE_NUMBER` — your Twilio phone number

### Step 4: Push the database schema

```bash
pnpm db:push
```

This creates all tables from `drizzle/schema.ts`.

### Step 5: Deploy

Click the Publish button in the Manus Management UI.

### Step 6: Use the reconstruction prompt

If the code is also lost, use the `RECONSTRUCTION_PROMPT.md` file to rebuild the entire app from scratch using Manus AI.

---

## Contact & Support

| Person | Role | Contact |
|---|---|---|
| Daniel | Owner / SC Visiting Angels | daniel@scvisitingangels.com |
| SC Visiting Angels | Business | (803) 749-0026 |
| SC Visiting Angels | Website | www.scvisitingangels.com |
| Manus Support | Platform support | help.manus.im |

---

## Important Notes for Developers

1. **All procedures are public** — authentication is not required to use the app. The `protectedProcedure` is available but not used.
2. **localStorage is the primary form state** — the database is a backup. The Strategy page reads from localStorage first.
3. **The Zapier webhook handles all email delivery** — there is no direct SMTP email from the app (except for the Save & Return link and contact form which use Nodemailer as a fallback).
4. **jsPDF runs server-side** — the PDF is generated on the server, uploaded to S3, and the URL is returned to the client for download.
5. **The LLM is Manus's built-in model** — no OpenAI API key is needed. The `invokeLLM` helper in `server/_core/llm.ts` handles everything.
6. **Never edit files in `server/_core/`** — these are framework files managed by Manus.
7. **Hero images are hosted on Manus CDN** — URLs start with `/manus-storage/`. Do not move them to `client/public/`.
