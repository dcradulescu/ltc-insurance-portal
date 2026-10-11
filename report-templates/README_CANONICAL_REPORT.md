# CANONICAL REPORT TEMPLATE — Original 18-Page LTC Strategy Report

**Approval date:** October 10, 2026
**Approval instruction:** “Please keep this as the template.”
**Canonical template ID:** sc-visiting-angels-ltc-original-18-v1
**Status:** CANONICAL VISUAL DESIGN APPROVED / DYNAMIC RENDERER NOT YET INTEGRATED

## Source of truth

The 18 original, standalone HTML pages are in the original-templates directory. Their exact order, names, byte lengths, and SHA-256 digests are in ltc-original-18.lock.json.

The matching Dropbox originals are in:
Ai / LTC Portal / Customized-LTC-Strategy-Report-18-Pages

These 18 files are the only approved canonical report source. The older combined PDF_TEMPLATE_18PAGE_MASTER.html and static previews are reference artifacts; neither may replace the 18 original standalone pages without verifying they are identical.

## Preservation rules

- Do not modify or overwrite any of the 18 original HTML pages in place.
- Preserve exact Visiting Angels branding, logos, palette, typography, margins, grids, page order, original headings, section blocks, Gantt styling, checklist styling, financial scenario cards, headers, and footers.
- Do not substitute a redesigned or simplified 19–20-page jsPDF layout as the canonical report.
- Dynamic client data must be bound into a COPY of the template. Use the verified policy, assessment, agreement and calculator data; do not treat example assumptions or placeholder values as established facts.
- The original sample benefit amounts, 90-day waiting period, schedule dates, and financial figures are placeholders until verified against each client policy. A genuine zero-day elimination period must remain zero.
- Preserve all report sections. Do not discard policy fields or financial projections just to fit a fixed page count; flag any data overflow or unresolved mapping for explicit review.
- Changes to the approved design or page count require new user approval and a new versioned lock.

## Enforcement

Builds run scripts/verify-canonical-ltc-template.mjs. It verifies the hash of all 18 original HTML files, their exact filenames and order, and rejects additions or modifications to the canonical source folder.

The independent command for verification is:

    corepack pnpm report:template:verify

A failing template verification blocks a new production build. Do not use a flag or automatic process to regenerate hashes merely to pass the guard.

## Important functional distinction

Approval of this master template **does not mean the portal currently exports it**.

The active legacy PDF export is still generated through server/pdfConverter.ts. The canonical 18-page template must be integrated with dynamic data, cost-calculator results, the shared claim scheduler, and conditional policy logic, then compared page-by-page to the approved template.

The existing output may remain temporarily available for compatibility, but it is NOT the canonical visual source. Future report development must target this locked 18-page master.

No existing production database, insurer integration, live deployment, or prior checkpoint archive was changed when creating this lock.
