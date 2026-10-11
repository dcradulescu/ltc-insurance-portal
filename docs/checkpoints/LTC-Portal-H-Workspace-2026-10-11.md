# LTC Insurance Portal — Verified pre-change rollback save point

**Checkpoint date:** October 11, 2026
**Source:** H:\LTC-Insurance-Portal\Development\LTC-Portal-Continuation-2026-10-10\workspace\ltc-portable
**Previous GitHub parent commit:** 7aa7926da3683562af4a00c862bb108a99a2face
**Checkpoint branch:** checkpoint/pre-public-education-strategy-20261011
**New feature branch:** feature/public-education-strategy-20261011

This is the verified local development state before the next public education/strategy changes. Restoring the checkpoint branch rolls back the source code. Production and external account data are not part of a Git commit.

## Preservation verification
- **404 / 404 active H: source files** copied into an isolated Git checkout and verified by SHA-256, with no missing or mismatched files.
- Source inventory: **179,380,719 bytes**, excluding installed dependencies, generated dist builds, ignored local environment files and logs.
- Full per-file SHA-256 digests are in LTC-Portal-H-Workspace-2026-10-11.manifest.json.
- **59 previous GitHub-only files retained**, not deleted; they were not present in the active H: tree. Their presence is documented in the manifest.
- Initial secret-pattern scan found no actual credentials in source files. The only pattern flagged was a placeholder localhost DATABASE_URL in .env.example. This check is not a complete security audit.
- The .gitignore excludes .env, caches, node_modules and build outputs; credentials must remain outside source control.

## Baseline development evidence
- TypeScript: PASS.
- Vitest: **566 passing, 0 failing**, in 35 test files, on the source H: project.
- Production-code build: PASS, with a pre-existing >500 KB chunk-size warning.
- Original approved Visiting Angels 18-page report template integrity: PASS, 18/18 pages.
- Disposable local MySQL integration: 27 checks passed in a prior checkpoint; no live database access.
- Prior synthetic searchable 18-page PDF visual QA: 18 pages identical by pixel comparison; PDF/UA accessibility not certified.
- No production deployment.

## Binding scope for next development
1. Keep the original public visitor journey: Education → Policy Form → Strategy; the Strategy page's existing calculator balances care needs, home-care costs, insurer reimbursements and family out-of-pocket expense.
2. **Do not modify calculators:** formulas, fields, defaults, validation, layouts or results.
3. Preserve approved UI/UX, branding and all locked original 18-page report HTML.
4. Retain Zapier unchanged until the complete app is reviewed and the owner approves cutover.
5. Anonymous members of the public should ultimately be able to use the educational workflow without unnecessary identifying information. This remains UNIMPLEMENTED in the checkpoint.
6. No live-data testing, production migration or merge into main without separate authorization.

## Known release blockers
- Both /policy-form and /strategy and their server data dependencies currently require authentication.
- Policy Form requires insured name, email, phone, policy number and a diagnosis/condition selection.
- Automatic Zapier transmissions, database storage, external AI policy context, S3 uploads and progress notification paths remain in source. Do not claim visitor information stays entirely within a browser.
- PDF generation is presently server-side; client-side PDF is future separately verified work.

**Checkpoint status:** Source-code restore point, not a production-ready release.