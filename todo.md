# Project TODO

- [x] Global theming: Tentered-inspired color palette, typography (Roboto/Roboto Slab), responsive layout
- [x] Database schema: policies table, strategies table for user data persistence
- [x] Shared layout: Navbar with navigation links, footer, video placeholder component
- [x] Home/Intro page: Hero section, feature cards, CTA, explainer video placeholder
- [x] Education page: Comprehensive LTC insurance info, accordion sections, video placeholder
- [x] Policy intake form: Multi-step interactive form for policy details, saved to DB
- [x] Customized strategy page: LLM-powered strategy generation based on policy data
- [x] PDF download: Generate and download strategy as PDF
- [x] Email delivery: Send strategy to user and other recipients
- [x] Chat widget: Floating chat widget on all pages for LTC support
- [x] Authentication: Login/register with name and email capture
- [x] Explainer video placeholders on every page
- [x] Vitest tests for key server procedures

## Phase 2 - Major Overhaul (from spec documents)
- [x] Expand DB schema: checklist_tasks, document_uploads, user_contacts tables
- [x] Expand policies table with all cheat sheet fields (carrier address, fax, daily/monthly/lifetime max, CNA, logsheets, payment cycle, AOB, case manager, third party assessment, SSN, Medicare/Medicaid, POA, providers)
- [x] Rebuild Policy Form with all cheat sheet fields, tooltips, and document upload sections
- [x] Build 3-stage strategy system with dynamic checklists (Stage 1: Prior to Claim, Stage 2: The Claim, Stage 3: Post Approval)
- [x] Implement checklist task completion tracking with progress percentage
- [ ] Implement document upload per checklist task with S3 storage (placeholder - needs further implementation)
- [x] Add branch logic for Assignment of Benefits (AOB yes/no affects Stage 3)
- [x] Add Contact Us page with web form
- [ ] Add Profile page with name/email editing, CC contacts, notification preferences (future enhancement)
- [x] Add comprehensive glossary with tooltips on Education page
- [x] Add page-level download and email buttons on Strategy page
- [x] Add Next/Previous navigation between pages
- [x] Generate explainer video thumbnails for each page
- [x] Add Tips & Pitfalls section on Education page
- [x] Add denial warning logic and third-party evaluation prep on Strategy page
