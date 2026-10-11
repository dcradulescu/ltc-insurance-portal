# LTC calculator audit — updated October 10, 2026

## Conclusion

The previous calculator was **not reliable for client planning**. Basic daily cost multiplication worked, but premium-waiver, inflation, eligibility and benefit-limit assumptions could materially misstate insurance coverage and benefit duration. Checkpoint 10 corrected the supported reimbursement model; its total-maximum inflation method applies only to riders with those terms, not remaining-pool riders. Checkpoint 11 confirms the specified inflation example and makes full waiver the user-directed default assumption. Checkpoint 12 adds the prominent monthly care-cost-minus-premium-savings comparison, with separate insured and optional spouse premiums.

The replacement is a tested **expense-reimbursement home-care scenario calculator**, with explicitly selected daily and/or calendar-month caps and a finite dollar pool. It does not certify an individual's claim eligibility or interpret an unreviewed insurance contract. The actual issued policy, riders, current benefit statement and carrier decisions must match the entered assumptions. No actual insured person's contract was supplied for this audit.

## Findings and corrections

| Previous finding | Consequence | Correction |
| --- | --- | --- |
| Premium savings were subtracted from insurer claim payments and benefit-pool consumption | Falsely extended coverage; very high premiums could produce negative or infinite durations | Premium due, waived premium and premium payable are separate from care accounting. Waiver changes neither reimbursement nor pool exhaustion. |
| A waiver checkbox implied every claim period automatically qualified | Overstated savings before waiver conditions were satisfied | Checkpoint 11 defaults to an explicitly labeled full-waiver assumption for the premium month reviewed. It does not assert carrier confirmation. No future waiver schedule is inferred. |
| Inflation multiplied the **remaining** benefit balance | Used the wrong base for riders that increase the total policy maximum | Verified compound increases apply to current total maximum; simple increases use the original specified amount. Only the increase is added to the remaining pool. |
| Inflation never increased the daily limit and treated insurer payment as the underlying care expense | Misstated future insurance and household costs | Care expense growth and policy benefit increases are independent. Every day is subject to that day's expense, applicable limits, waiting status and remaining pool. |
| Code assumed 3% care inflation, explanatory text said 10%, and chart intersections supposedly meant exhaustion | Chart explanation contradicted its data and misidentified exhaustion | Care-cost growth is an explicit assumption, initially 0%. Exhaustion occurs only when the pool reaches zero. The chart stacks insurance and household portions of care expenses. |
| Monthly benefit limits were ignored | Overstated benefits for monthly or combined limits | Supports daily-only, calendar-month-only, or both. Monthly usage resets by actual calendar month, with starting-month prior claims entered separately. |
| Elimination period and eligibility were ignored | Implied immediate reimbursement | Separate calendar-day and paid-service-day counting. Final waiting day is unpaid. Unconfirmed/not-eligible scenarios assume zero reimbursement and no elimination credit. |
| Original lifetime maximum was treated as fully available | Ignored prior claims | Requires current total maximum and explicitly entered remaining benefits; remaining cannot exceed total. Starting-month prior claims must already be deducted from the pool. |
| Negative, excessive and partially numeric inputs passed permissive parsing | Impossible schedules and malformed amounts could produce plausible outputs | Full-string numeric validation, finite bounds, hours 0–24 exclusive of zero, distinct selected weekdays, valid dates and conditional rider validation. Zero caps and exhausted pools are legitimate zero-benefit cases. |
| 4.33-week months and rounded-down duration concealed calendar differences and final partial benefits | Inconsistent monthly figures and truncated last claim | UTC date iteration over a five-year horizon uses actual weekdays, calendar months and leap days. Integer-cent payments include a partial final claim. |
| Daily-hour formula text was reversed, and caps could imply more than 24 hours | Misleading available-hours label | Daily dollar-limit comparison is limit ÷ hourly rate, rounded down to two decimals and capped at 24, explicitly subject to all other conditions. |
| Props could retain stale values; fabricated component defaults existed; remaining pool was not distinguished | Wrong scenario inputs could survive a policy change | No fabricated dollar defaults. Currency-formatted policy amounts normalize strictly; changed policy props reset the scenario. Results disappear after edits. Remaining pool is never silently prefilled. |
| Intake and strategy access required a daily limit | Monthly-only policies could not reach the calculator correctly | Either a daily or a monthly limit is accepted; no fabricated daily equivalent. |
| Existing tests duplicated a different helper and were excluded by Vitest configuration | Passing portal tests did not validate calculator logic | Removed the duplicate-helper test file. The UI and 116 calculator tests import the same shared engine; the main suite includes these tests. |
| Prior `PREMIUM_CALCULATION_TEST.md` said the old waiver logic was verified | Historical evidence could be mistaken for current approval | That file now explicitly supersedes the prior conclusions and points to this audit. |

## Calculation rules and every result value

The model processes one calendar day at a time and rounds each day's bill and each annual benefit increase to cents. Pool and payment accounting use integer cents. Dollars are converted for display only after aggregation.

| Input/result | Rule or meaning |
| --- | --- |
| Care schedule | One hourly rate and one hours-per-day value, repeated on the selected weekdays. No simultaneous extra provider or facility claim is projected. |
| Daily care cost | Hourly rate × hours; rounds once to cents. |
| Scheduled weekly care cost | Rounded daily bill × selected weekdays. It is the starting weekly expense, before future inflation. |
| Hours within daily dollar limit | min(24, daily limit ÷ hourly rate), rounded down to two decimals. This is not a guarantee of paid hours. A monthly-only policy has no daily-hours result. |
| Starting pool | Explicit remaining balance, after past/pending claims already consuming benefits. Zero means already exhausted. |
| Starting-month usage | Benefits already charged against that calendar month's cap. They must already be included in past pool consumption; the engine does not deduct them twice. |
| Elimination days | Remaining days from the scenario start. Calendar days count each eligible day; service days count only selected eligible paid-care days. The day completing the period is unpaid. |
| Daily reimbursement | If eligible and waiting is complete: minimum of daily eligible bill, applicable daily cap, unused applicable monthly cap, and remaining pool. Otherwise zero. |
| Household care expense | Full care bill minus reimbursement. Never reduced by a premium waiver. |
| Monthly and five-year totals | Sum of actual daily expenses/payments. First and final months can be partial. Care expense always equals insurance plus household care expense. |
| Care expense during elimination | Sum of care bills on unpaid elimination days. For unconfirmed eligibility, no elimination credit is assumed; all expenses still appear in household totals. |
| First reimbursable service date | First scheduled service day with a positive computed reimbursement, not the carrier's payment date. |
| Pool exhaustion | Date of the last payment that uses the final cent, or already exhausted at start. Payments stop afterward. Inflation never revives exhausted coverage in this model. |
| Benefits remaining | Starting remainder + verified total-maximum increases − projected claim payments. |
| Premium figures | Separate insured and spouse monthly equivalents; spouse input is required only when dual waiver is selected. Full waiver is assumed by default; dual waiver is off by default. Each included premium is fully saved with $0 payable under full waiver. Turning full waiver off gives zero savings and both included premiums payable. Inactive spouse values are ignored. No claim or pool adjustment. |
| Effective monthly care cost | Gross care cost for the selected full calendar month − insured waived monthly premium − spouse waived monthly premium if dual waiver is selected. This is before insurance reimbursement; it is a household budget comparison, not the provider invoice or post-reimbursement out-of-pocket amount. Integer-cent subtraction preserves cents and negative results. |
| Reviewed month | All projected months remain selectable. Default is the first complete calendar month. Partial first/final months show their actual care costs but no calculated waiver deduction or effective-cost result because partial-month waiver terms are not known. Future selections illustrate the entered premiums and waiver assumption; no actual waiver schedule is inferred. |
| Savings above care expense | The signed negative result is retained and explained as excess household budget savings, not a refund or insurer payment. Five-year care totals continue to exclude premiums. |
| Care-cost inflation | Chosen 0–20% compound annual scenario rate, applied on anniversaries of the scenario start. Zero is a constant-cost baseline, not a forecast. |
| Constant benefits | Starting policy amounts remain fixed throughout the projection. This is an explicit scenario choice, not a determination that no rider exists. |
| Compound rider | Annual increase = previous applicable cap/total maximum × rate, rounded to cents. Affected amounts are explicitly selected. |
| Simple rider | Annual increase = original applicable amount × rate, rounded to cents. Current amounts must not be below the entered original amounts in this model. |
| Rider dates | Next increase must fall after start and within one year. Start amounts already include any increase on the start date. Annual dates recur from that anchor; February 29 uses February 28 in non-leap years. |
| Mid-month rider increase | Revised monthly cap applies in full on the increase date. There is no proration. The user must verify that these terms and annual rounding match the contract. |
| Projection horizon | Five calendar years, ending immediately before the fifth anniversary (with the stated February 29 convention). A nonzero ending balance does not establish a further coverage duration. |

Money inputs allow at most two decimal places. Hourly rate is $0.01–$10,000; daily limit $0–$1 million; monthly limit $0–$10 million; total/remaining pool $0–$1 billion; each monthly premium $0–$1 million. Hours are greater than zero through 24, with two decimal places. Elimination days are integers 0–3,650. Dates are 2000–2100. Inflation rates are 0–20%. These are supported software ranges, not assertions about insurance-market limits. Unsupported amounts/terms block the estimate.

## Independently checked examples

Common scenario: start January 1, 2026; Monday–Friday care; $60/hour × 4 hours; $250 daily cap; $500,000 current total/remaining pool; eligible expenses and eligibility confirmed; no future increases unless stated. January has **22 scheduled care days**, costing **$5,280**.

| Variation | January insurance | January household care | Other verified result |
| --- | ---: | ---: | --- |
| No waiting period | $5,280.00 | $0.00 | Ending pool $494,720.00 |
| Assumed full $200 monthly premium waiver | $5,280.00 | $0.00 | Premium payable $0; identical pool consumption |
| 7 remaining calendar elimination days | $4,080.00 | $1,200.00 | First reimbursable care January 8 |
| 7 remaining service elimination days | $3,600.00 | $1,680.00 | First reimbursable care January 12 |
| Additional $1,000 calendar-month cap | $1,000.00 | $4,280.00 | Pool reduced by only $1,000 |
| Only $250.55 benefits remain | $250.55 | $5,029.45 | Final partial claim January 2; no later benefit payments |
| Eligibility unconfirmed | $0.00 | $5,280.00 | No reimbursement assumed; not an eligibility denial |

Separate inflation example: $100,000 current total maximum, $90,000 remaining after prior claims, $100 daily cap, $200 daily expense every day in 2026. After $36,500 of claims, the remaining pool is $53,500. A verified 10% compound increase to both total maximum and cap on January 1, 2027 adds **$10,000**, not $5,350, to the pool. January then pays 31 × $110 = **$3,410**, leaving **$60,090**. The direct engine test confirms this result.

## Checkpoint 11 confirmation of item 5 and item 6

Item 5: for a verified 3% compound rider increasing a $500,000 current total maximum, the annual increase is $15,000. With $400,000 remaining before further claims, the balance becomes $415,000. The following increase is 3% of $515,000, or $15,450; without intervening claims the next balance is $430,450. A new direct engine regression test confirms both amounts. Simple inflation still uses the original applicable benefit amount. Care-cost inflation remains independent, and the rider must specify which policy amounts grow and whether growth continues during the claim.

Item 6: the user instructed us to assume full waiver. The default scenario now uses 100% premium savings: a $200 monthly premium produces $200 assumed savings and $0 premium payable. The checkbox and result explicitly identify this as an assumption. Users can clear the checkbox to model no waiver. Premium savings have no effect on care reimbursement, remaining benefits or exhaustion. This does not assert a universal waiver start date or project future waiver timing.

Focused Chromium checks at 1440 and 390 pixels verified the selected default, $200-to-$0 premium calculation, no-waiver override, unchanged care/pool totals, stale-result hiding and visible assumption wording. No uncaught page errors; screenshots inspected. The broader checkpoint 10 browser checks remain historical. New evidence: `verification/LTC_Portal_Calculator_UI_Verification_CHECKPOINT11.json`.

## Checkpoint 12 — effective monthly care cost and dual waiver

The first result section now prominently displays the selected month’s gross care cost, the insured premium deduction, the spouse deduction (when dual waiver applies), total premium savings deducted, and the effective cost in a high-contrast panel. The formula is also explained beside the premium inputs. Each person’s premium is entered separately; annual billing is divided by 12 and quarterly billing by 3 to obtain the monthly equivalent. A combined bill must be split without counting either share twice.

For the common January scenario above: **$5,280 − $200 − $150 = $4,930** under a full dual waiver. February has 20 scheduled weekdays: **$4,800 − $350 = $4,450**. Single waiver gives January **$5,080**. Clearing full waiver gives zero savings, January effective care cost **$5,280**, and **$350** in separate premiums payable if both premiums are entered. The effective-cost formula never adds unwaived premiums to care costs; that separate payable amount is shown explicitly.

Waiver eligibility is policy-specific. The Mutual of Omaha outline hosted by California’s insurance regulator illustrates a spouse waiver requiring the relevant rider on both in-force policies, with premium payments resuming when the spouse waiver period ends. Its base home-care waiver also has qualifying conditions. [4] These are evidence that dual waiver must be selected deliberately, not universal eligibility rules imposed on all users. Full waiver remains a planning assumption, including when the care scenario assumes no reimbursement; it is not a carrier decision.

**Inflation scope clarification:** compounding a remaining pool is not inherently wrong. FLTCIP describes automatic increases to its daily benefit and remaining lifetime benefit. [5] This calculator’s existing pool-increase branch supports the explicitly verified **total-maximum** method only. The interface now names remaining-pool riders as requiring a separate calculation. No new inflation method was implemented in this checkpoint, and the earlier total-maximum examples do not validate FLTCIP or every policy.

New tests cover single/dual/no waiver, zero premiums, invalid active spouse values, ignored inactive spouse values, exact cents, negative offsets, partial first/final months, leap February, care inflation with unchanged entered premiums, and unchanged claim/pool/waiting results across eligibility states. Chromium verified the rendered formula, conditional validation, month switching, default choices, all 61 months in a partial-start scenario, stale-result hiding, and desktop/tablet/mobile layouts. Evidence: `verification/LTC_Portal_Calculator_UI_Verification_CHECKPOINT12.json`. API fixtures are mocked; calculator arithmetic is real.

## Insurance guidance used

NAIC distinguishes expense reimbursement from fixed indemnity/cash payments, describes policy-specific benefit limits and elimination counting, and explains that waiver suspends premiums with timing that varies. It also describes benefit inflation and different coverage structures. The implementation separates premiums from claim consumption and requires the actual rider's calculation terms rather than inferring them from a checkbox. [1]

ACL describes benefit triggers, carrier assessment/plan-of-care approval, elimination periods and different benefit-payment methods. The calculator does not infer eligibility from an ADL count or diagnosis. [2]

California's regulator illustrates calendar versus service-day counting and possible special weekly credits, and distinguishes daily limits, lifetime maximums and inflation protection. Its California-specific requirements are not treated as national rules. Unsupported special credits are excluded. [3]

1. National Association of Insurance Commissioners, *A Shopper’s Guide to Long-Term Care Insurance*, sections “How Long-Term Care Benefits Are Paid,” “How Much Coverage Will I Have,” “When Benefits Start,” “Inflation Protection,” and “Waiver of Premium.” https://content.naic.org/sites/default/files/publication-ltc-lp-shoppers-guide-long-term.pdf
2. Administration for Community Living, *Receiving Long-Term Care Insurance Benefits*. https://acl.gov/ltc/costs-and-who-pays/what-is-long-term-care-insurance/receiving-long-term-care-insurance-benefits
3. California Department of Insurance, *Long Term Care Insurance*. https://www.insurance.ca.gov/01-consumers/105-type/95-guides/05-health/01-ltc/ltc-insurance.cfm

4. Mutual of Omaha, *Long-Term Care Insurance Outline of Coverage*, Form M26943, spouse waiver (printed page 4) and base waiver (printed page 11), hosted by California Department of Insurance. This is an example policy form, not confirmation of any user’s rider. https://www.insurance.ca.gov/01-consumers/105-type/95-guides/05-health/01-ltc/upload/71412OCM26943MutualofOmaha.pdf
5. Federal Long Term Care Insurance Program, *Frequently Asked Questions*, “How is my benefit impacted by inflation while I need care?” and “When does the waiver of premium begin?” https://www.ltcfeds.gov/help/faqs

Sources 1–3 reviewed October 9; sources 4–5 reviewed October 10, 2026. These explain general structures; none substitutes for the actual contract. Numerical examples above are independent calculations, not quotes from the sources.

## Verification and remaining limits

- **367 automated tests passed**, zero failures/skips, including **116 tests importing the production calculation engine**. One accounting test checks **108 combinations** of cap mode, waiting method, eligibility, inflation method and inflation scope.
- Regression cases cover malformed/negative/out-of-range input, fractional hours, duplicate/invalid weekdays, zero caps, zero/partial pools, monthly resets, previous monthly usage, leap years, partial months, final unpaid elimination day, unconfirmed eligibility, inactive inputs, waiver premiums larger than claims, simple/compound inflation, separate cap/pool growth, and no restoration after exhaustion.
- TypeScript check and production build passed. Chromium checks passed at 1440, 1024 and 390 pixels, including the expanded monthly table. Screenshots were visually inspected; the responsive chart overflow found during QA was corrected. External Google Fonts requests failed (fallback fonts rendered), and unrelated video requests were canceled on navigation. No uncaught page errors occurred. Latest waiver/effective-cost browser verification is recorded in `verification/LTC_Portal_Calculator_UI_Verification_CHECKPOINT12.json`; broader checkpoint 10 evidence remains in `verification/LTC_Portal_Calculator_UI_Verification.json`. Account and policy API fixtures are mocked; the displayed calculator uses the real engine.
- No database schema or server financial calculation was changed. Checkpoint 9's 24 real MySQL checks remain historical database evidence; they were not rerun for this calculation/UI work. Live providers, deployment and production contract data remain unverified.
- No estimate is offered for cash/indemnity/hybrid payment structures, unknown terms, weekly caps, coinsurance, shared/restored/unlimited pools, separate service-day/time benefit limits, special waiting credits/resets, or riders whose rules differ from the supported fixed annual increases, including remaining-pool inflation riders. A finite dollar-pool calculation does not prove that a stated “three-year benefit period” has no separate contractual time limit.
- The model assumes one continuous eligible episode, one repeated care schedule and no concurrent future claims from another care setting. Carrier payment lag, premium cash flow after the reviewed month, taxes, Medicaid eligibility and partnership asset protections are not modeled.
- This audit covers the interactive Care Cost Calculator and its intake/strategy limit connection. It is not a clinical review or approval of every statement in the portal's legacy education pages, static example reports or generated strategy content.

Reproduce engine tests with `corepack pnpm exec vitest run shared/careCalculator.test.ts`; run the full suite with `corepack pnpm test`.
