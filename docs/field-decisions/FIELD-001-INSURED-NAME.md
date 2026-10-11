# Field decision 001 — Full Name of Insured

Date: October 11, 2026
Approved: **Remove insuredFullName from the active web form and leave a blank field in the PDF.**
The visitor can write the name on their own PDF later.

Implementation:
- Active Policy Form: input and required-name validation removed.
- Saved draft/prefill/sample: insuredFullName forced to empty; legacy stored names are not restored to this form.
- Strategy: name no longer a completion prerequisite. Calculator formulas, fields, validation and layout untouched.
- Current server policy-save path: strips the name from newly saved records. Existing database and historical records remain unchanged pending database retirement.
- Original 18-page report: actual names are excluded; printed name entries become "____________________________" for handwriting. HTML page source and template lock unchanged.
- Comprehensive Zapier payload: insuredFullName blanked; Zapier integration itself remains intact.
- Legacy supplementary forms/modules and other identifiers remain under separate review.

Verified:
- Current-source test suite: **568/568 passing across 35 files** on this feature worktree.
- Vite/client/server build PASS; approved 18-page template preflight PASS.
- Real synthetic canonical PDF: 18 pages, name line shown blank, and synthetic test name absent from extracted first two PDF pages.
- Other inherited GitHub-only tests and TypeScript files have pre-existing inconsistencies; complete repository suite/type check still have errors unrelated to this approved field removal.

Not done:
- No main merge or deployment.
- No database drop, delete or historical data purge.
- No Zapier decommission.
- Other identifying fields, including email, phone and policy number, still await individual decisions.
- Full anonymity and HIPAA/legal compliance are NOT yet certified.

Next proposed review item: insuredEmail (Email Address). Await user decision; do not remove without explicit approval.
