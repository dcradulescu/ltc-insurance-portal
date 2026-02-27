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

## Hero Background Images
- [x] Generate hero background image for Home page (family/caregiving theme)
- [x] Generate hero background image for Education page (learning/knowledge theme)
- [x] Generate hero background image for Policy Form page (documents/forms theme)
- [x] Generate hero background image for Strategy page (planning/roadmap theme)
- [x] Generate hero background image for Contact page (support/communication theme)
- [x] Upload all images to CDN
- [x] Add dark overlay masks to all hero sections
- [x] Update all page components with background images

## Explainer Videos
- [x] Generate explainer video for Home page with Visiting Angels dove logo
- [x] Generate explainer video for Education page with Visiting Angels dove logo
- [x] Generate explainer video for Policy Form page with Visiting Angels dove logo
- [x] Generate explainer video for Strategy page with Visiting Angels dove logo
- [x] Generate explainer video for Contact page with Visiting Angels dove logo
- [x] Upload all videos to CDN
- [x] Update VideoPlaceholder component to support actual video playback
- [x] Replace all placeholder references with real video URLs

## Teal Color Scheme & Home Page Redesign
- [x] Incorporate teal into global color scheme alongside blue
- [x] Add parallax effect to the solid blue section on Home page
- [x] Move the solid blue section higher on the Home page
- [x] Remove repetitive content from Home page
- [x] Add scrolling testimonials section about helping families
- [x] Add two-column "Our Story" section with elderly couple hugging businesswoman image
- [x] Add fading quotes in "Our Story" section (Jim's story)
- [x] Generate elderly couple hugging businesswoman image
- [x] Update all pages with teal accents (Education, PolicyForm, Strategy, Contact)


## Education Page Policy Form
- [x] Redesign Education page with creative graphical elements (not a form)
- [x] Add field validation (email, phone, required fields) on Policy Form page
- [x] Add tooltip buttons for all form fields with explanations
- [x] Integrate Zapier webhook for form submission via tRPC
- [x] Implement local data persistence for Strategy page use
- [x] Policy Form page already has comprehensive form with all spec fields
- [x] Test all validation and form submission


## Auth Loop Bug Fix
- [x] Fixed "Please login" errors by converting all protected procedures to public
- [x] Verified all pages work without authentication
- [x] Tested Policy Form navigation through all 6 steps without redirects


## Remove Authentication Module
- [x] Remove auth guards from all pages (Home, Education, Policy Form, Strategy, Contact)
- [x] Remove useAuth hook calls from pages
- [x] Remove login/logout buttons from navbar
- [x] Update Policy Form to not require authentication
- [x] Update Strategy page to ask for email when sending report
- [x] Test all pages work without login
- [x] Convert all protected procedures to public procedures (documents, contacts, email, policyForm)
- [x] Verify no "Please login" errors in browser console

## Policy Form Tooltips & Error Fixes
- [x] Added comprehensive tooltips for all form fields (24 fields total)
- [x] Verified all tooltips display correctly with help icons
- [x] Tested all form steps navigate without errors
- [x] No console errors detected on any form step

## Form Validation Bug Fix
- [x] Implement required field validation (carrierName, policyNumber, etc.)
- [x] Add error messages for empty required fields
- [x] Prevent form submission when required fields are empty
- [x] Show validation errors in UI before Zapier submission
- [x] Test form submission with empty fields
