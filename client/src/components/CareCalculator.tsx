import { useMemo, useRef, useState } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  amountInput,
  calculateCare,
  type CareInputs,
} from "@shared/careCalculator";

interface CareCalculatorProps {
  policyId?: number;
  defaultDailyMax?: number | string;
  defaultMonthlyMax?: number | string;
  lifetimeMaximum?: number | string;
  eliminationPeriod?: string | null;
  onConfirmedScenario?: (scenario: CareInputs | null) => void;
  initialScenario?: CareInputs | null;
  initialScenarioValidated?: boolean;
  initialScenarioReason?: string | null;
  onSaveScenario?: (inputs: CareInputs) => Promise<{status:string;reason:string|null}>;
  /** Browser-only draft persistence; the financial formulas and UI are unchanged. */
  onDraftChange?: (inputs: CareInputs) => void;
}
const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const sourceGuide =
  "https://content.naic.org/sites/default/files/publication-ltc-lp-shoppers-guide-long-term.pdf";

// A policy change resets the whole scenario, including remaining benefits and verification choices.
export function CareCalculator(props: CareCalculatorProps) {
  // Reset only for a different saved scenario or policy, not a mutation's
  // loading state or a changed callback identity.
  const key=JSON.stringify({policyId:props.policyId,
    initialScenario:props.initialScenario,valid:props.initialScenarioValidated});
  return <CalculatorForm key={key} {...props} />;
}

function CalculatorForm(props: CareCalculatorProps) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState<CareInputs>(() => props.initialScenario
    ? {...props.initialScenario,careDays:[...props.initialScenario.careDays]}
    : ({
    paymentType: "",
    termsConfirmed: false,
    eligibility: "unconfirmed",
    startDate: "",
    careDays: [],
    hourlyRate: "",
    hoursPerDay: "",
    capType: "",
    dailyMax: amountInput(props.defaultDailyMax),
    monthlyMax: amountInput(props.defaultMonthlyMax),
    totalPool: amountInput(props.lifetimeMaximum),
    remainingPool: "",
    firstMonthUsed: "",
    eliminationType: "",
    eliminationRemaining: "",
    monthlyPremium: "",
    assumeFullWaiver: true,
    dualWaiver: false,
    spouseMonthlyPremium: "",
    careInflation: "0",
    benefitInflation: "none",
    benefitRate: "",
    inflationScope: "",
    nextIncrease: "",
    riderConfirmed: false,
    originalDaily: "",
    originalMonthly: "",
    originalPool: "",
  }));
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState<CareInputs | null>(
    props.initialScenarioValidated && props.initialScenario
      ? {...props.initialScenario,careDays:[...props.initialScenario.careDays]} : null);
  const [saveStatus,setSaveStatus] = useState<"idle"|"saving"|"saved"|"review"|"error">("idle");
  const [saveMessage,setSaveMessage] = useState<string | null>(props.initialScenarioReason ?? null);
  const changeVersion=useRef(0);
  const evaluation = useMemo(
    () => calculateCare(submitted ?? input),
    [submitted, input]
  );
  const result = submitted ? evaluation.result : null;
  const update = <K extends keyof CareInputs>(key: K, value: CareInputs[K]) => {
    changeVersion.current++;
    setInput(old => ({ ...old, [key]: value }));
    props.onDraftChange?.({ ...input, [key]: value });
    setSaveStatus("idle");
    setSaveMessage(null);
    setSubmitted(null); // Never leave stale results visible beneath edited inputs.
    props.onConfirmedScenario?.(null); // Do not export obsolete projections.
    setAttempted(false);
  };
  const persist = async (next: CareInputs,version:number): Promise<void> => {
    if (!props.onSaveScenario) return;
    setSaveStatus("saving");
    setSaveMessage(null);
    try {
      const response=await props.onSaveScenario({...next,careDays:[...next.careDays]});
      if(version!==changeVersion.current) return; // A later edit superseded this save.
      setSaveStatus(response.status==="saved_valid"?"saved":"review");
      setSaveMessage(response.reason);
      if(response.status==="saved_valid" && calculateCare(next).result){
        setSubmitted({...next,careDays:[...next.careDays]});
        props.onConfirmedScenario?.(next);
      } else {
        setSubmitted(null);
        props.onConfirmedScenario?.(null);
      }
    } catch {
      if(version!==changeVersion.current) return;
      setSaveStatus("error");
      setSaveMessage("Unable to save. Your edits remain in this form; retry before leaving.");
      props.onConfirmedScenario?.(null);
    }
  };
  const error = (key: keyof CareInputs) =>
    attempted && evaluation.errors[key] ? (
      <p id={`care-${key}-error`} className="mt-1 text-sm text-red-700">
        {evaluation.errors[key]}
      </p>
    ) : null;
  const field = (
    key: keyof CareInputs,
    label: string,
    help?: string,
    type = "text"
  ) => (
    <div>
      <Label htmlFor={`care-${key}`}>{label}</Label>
      <Input
        id={`care-${key}`}
        value={String(input[key])}
        type={type}
        inputMode={type === "text" ? "decimal" : undefined}
        onChange={event => update(key, event.target.value)}
        className="mt-1 bg-white"
        aria-invalid={Boolean(attempted && evaluation.errors[key])}
        aria-describedby={
          attempted && evaluation.errors[key] ? `care-${key}-error` : undefined
        }
      />
      {help && <p className="mt-1 text-xs text-slate-600">{help}</p>}
      {error(key)}
    </div>
  );
  const select = (
    key: keyof CareInputs,
    label: string,
    choices: [string, string][],
    help?: string
  ) => (
    <div>
      <Label htmlFor={`care-${key}`}>{label}</Label>
      <select
        id={`care-${key}`}
        value={String(input[key])}
        onChange={event => update(key, event.target.value)}
        className="mt-1 block w-full min-w-0 rounded-md border border-slate-300 bg-white p-2 text-sm"
        aria-invalid={Boolean(attempted && evaluation.errors[key])}
        aria-describedby={
          attempted && evaluation.errors[key] ? `care-${key}-error` : undefined
        }
      >
        <option value="">Select an option</option>
        {choices.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {help && <p className="mt-1 text-xs text-slate-600">{help}</p>}
      {error(key)}
    </div>
  );
  const dailyApplies = ["daily", "both"].includes(input.capType);
  const monthlyApplies = ["monthly", "both"].includes(input.capType);
  const capsGrow = ["caps", "caps-and-pool"].includes(input.inflationScope);
  const poolGrows = ["pool", "caps-and-pool"].includes(input.inflationScope);

  return (
    <section
      className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 md:p-6"
      aria-label="Care cost calculator"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="care-calculator-body"
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-900">
          <Calculator className="h-5 w-5 text-teal" />
          Care Cost Calculator
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      {open && (
        <div id="care-calculator-body" className="mt-4 space-y-6">
          <p className="text-sm text-slate-600">
            Estimate eligible home-care expenses under an expense-reimbursement
            policy. Results are a planning scenario, not a carrier coverage
            decision or a payment schedule.
          </p>
          <form
            className="space-y-6"
            noValidate
            onSubmit={event => {
              event.preventDefault();
              setAttempted(true);
              const next=calculateCare(input);
              const verified=next.result && !Object.keys(next.errors).length
                ? {...input,careDays:[...input.careDays]} : null;
              if(!props.onSaveScenario){
                setSubmitted(verified);
                props.onConfirmedScenario?.(verified);
              } else {
                setSubmitted(null); // Never export unpersisted projections.
                props.onConfirmedScenario?.(null);
                void persist(input,changeVersion.current);
              }
            }}
          >
            <fieldset className="space-y-4">
              <legend className="mb-3 font-semibold text-slate-900">
                1. Confirm coverage terms
              </legend>
              {select("paymentType", "How does the policy pay?", [
                ["reimbursement", "Reimburses eligible expenses"],
                ["other", "Cash, indemnity, hybrid, other or unsure"],
              ])}
              <p className="text-xs text-slate-600">
                This model uses a finite dollar pool and daily and/or
                calendar-month caps. It excludes weekly caps, coinsurance,
                shared pools, restoration, unlimited coverage, separate
                time/service-day benefit limits, hybrid death-benefit rules, and
                special elimination credits or resets. These require a
                policy-specific calculation.
              </p>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={input.termsConfirmed}
                  onChange={e => update("termsConfirmed", e.target.checked)}
                />
                <span>
                  I verified that this model matches the policy: all entered
                  care expenses and providers qualify, these are the current
                  home-care limits, and no additional limit or excluded rule
                  above applies. Monthly caps, if used, reset each calendar
                  month without carryover or proration.
                </span>
              </label>
              {error("termsConfirmed")}
              {select(
                "eligibility",
                "Benefit eligibility at the scenario start",
                [
                  ["unconfirmed", "Not yet confirmed"],
                  ["confirmed", "Confirmed and expected to continue"],
                  ["not-eligible", "Not eligible"],
                ],
                "Confirm the carrier's benefit triggers, required assessment, plan of care and covered provider. An ADL count alone does not establish approval. Unconfirmed eligibility assumes no reimbursement throughout the scenario; this is not a denial."
              )}
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-3 font-semibold text-slate-900">
                2. Care schedule and benefit limits
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                {field(
                  "startDate",
                  "Scenario start date",
                  "Use the first date on which remaining elimination days can count, if eligibility is confirmed.",
                  "date"
                )}
                {field(
                  "hourlyRate",
                  "Hourly care rate ($)",
                  "One rate for eligible home care; exclude unrelated or ineligible charges."
                )}
                {field(
                  "hoursPerDay",
                  "Hours per care day",
                  "Greater than 0 and no more than 24; the same hours on each selected day."
                )}
                {select(
                  "capType",
                  "Which benefit limits apply?",
                  [
                    ["daily", "Daily only"],
                    ["monthly", "Calendar-month only"],
                    ["both", "Both daily and calendar-month"],
                  ],
                  "A quoted monthly equivalent of a daily limit is not necessarily a separate cap. Verify the contract."
                )}
                {dailyApplies &&
                  field(
                    "dailyMax",
                    "Current daily home-care limit ($)",
                    "Use the home-care amount after any benefit percentage and past inflation increases; do not use a facility limit."
                  )}
                {monthlyApplies &&
                  field("monthlyMax", "Current monthly home-care limit ($)")}
                {field(
                  "totalPool",
                  "Current total benefit maximum ($)",
                  "Total maximum before subtracting past claims. Prefilled policy values must be checked against the current carrier statement."
                )}
                {field(
                  "remainingPool",
                  "Benefits remaining at start ($)",
                  "Subtract all past and pending claims that consume the pool. Enter 0 for an exhausted pool."
                )}
                {monthlyApplies &&
                  field(
                    "firstMonthUsed",
                    "Benefits already used this calendar month ($)",
                    "Include prior/pending claims charged to the starting month; enter 0 if none. Already deducted from the remaining pool."
                  )}
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">
                  Care days each week
                </legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {weekdays.map((day, index) => (
                    <label
                      key={day}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={input.careDays.includes(index)}
                        onChange={e =>
                          update(
                            "careDays",
                            e.target.checked
                              ? [...input.careDays, index]
                              : input.careDays.filter(d => d !== index)
                          )
                        }
                      />
                      {day}
                    </label>
                  ))}
                </div>
                {error("careDays")}
              </fieldset>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-3 font-semibold text-slate-900">
                3. Elimination period
              </legend>
              {props.eliminationPeriod && (
                <p className="text-xs text-slate-600">
                  Policy record: {props.eliminationPeriod}. Confirm the days
                  still outstanding and the counting method below.
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {select("eliminationType", "How do elimination days count?", [
                  ["calendar", "Calendar days while eligible"],
                  ["service", "Paid, covered service days only"],
                ])}
                {field(
                  "eliminationRemaining",
                  "Elimination days still remaining",
                  "Enter 0 if already satisfied or waived. The last elimination day remains unpaid; counting begins on the scenario start date."
                )}
              </div>
              <p className="text-xs text-slate-600">
                Assumes one continuous period of eligibility. The schedule does
                not apply special weekly credits, look-back rules, retroactive
                payment, a second elimination period or care-coordinator
                reductions automatically.
              </p>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <legend className="px-1 font-semibold text-slate-900">
                4. Premium waiver and effective monthly care cost
              </legend>
              <p className="text-sm font-medium text-slate-900">
                Premium savings matter to your monthly budget. Effective care
                cost = total monthly care cost − your waived premium − your
                spouse’s waived premium, if a dual waiver applies.
              </p>
              {field(
                "monthlyPremium",
                "Your monthly premium equivalent ($)",
                "Enter your premium before waiver. For annual billing, divide by 12; for quarterly billing, divide by 3. Enter 0 if none."
              )}
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={input.dualWaiver}
                  onChange={e => update("dualWaiver", e.target.checked)}
                />
                <span>Include my spouse under a dual waiver of premium.</span>
              </label>
              <p className="text-xs text-slate-600">
                Select only when the spouse waiver provision applies to both
                policies. Having a spouse alone does not establish a dual
                waiver. Enter each person’s share once if you receive a combined
                bill.
              </p>
              {input.dualWaiver &&
                field(
                  "spouseMonthlyPremium",
                  "Spouse’s monthly premium equivalent ($)",
                  "Enter the spouse’s premium before waiver, separate from yours. Annual premium ÷ 12; quarterly premium ÷ 3; or 0 if none."
                )}
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={input.assumeFullWaiver}
                  onChange={e => update("assumeFullWaiver", e.target.checked)}
                />
                <span>
                  Assume a full premium waiver for the month being reviewed.
                </span>
              </label>
              <p className="text-xs text-slate-600">
                Full waiver is the default planning assumption: 100% of the
                entered premium(s) are saved and premium payable is $0. Clear
                this option to model a month without waiver. This is a monthly
                budget illustration, not confirmation of waiver eligibility or
                dates. Select a full calendar month in the results to compare
                costs. Future premium changes, refunds and partial-month waiver
                amounts are not projected.
              </p>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <legend className="px-1 font-semibold text-slate-900">
                5. Future costs and policy increases
              </legend>
              {field(
                "careInflation",
                "Assumed annual care-cost increase (%)",
                "0 holds costs constant. Choose 0–20%; this is your scenario assumption, not a forecast. Applied on each anniversary of the scenario start."
              )}
              {select(
                "benefitInflation",
                "Future policy benefit increases",
                [
                  ["none", "Hold current benefits constant"],
                  ["compound", "Verified fixed compound increases"],
                  ["simple", "Verified fixed simple increases"],
                ],
                "Use constant benefits for a baseline or if increases stop during a claim. Riders that increase only the remaining pool, CPI, purchase offers and limited-term riders require a separate calculation."
              )}
              {input.benefitInflation !== "none" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {field(
                      "benefitRate",
                      "Annual benefit increase (%)",
                      "0–20%, as specified by the rider."
                    )}
                    {select("inflationScope", "Which amounts increase?", [
                      ["caps", "Applicable daily/monthly caps only"],
                      ["pool", "Total benefit maximum only"],
                      ["caps-and-pool", "Caps and total benefit maximum"],
                    ])}
                    {field(
                      "nextIncrease",
                      "Next benefit increase date",
                      "After the scenario start, within one year; start values already include any increase due at the start.",
                      "date"
                    )}
                    {input.benefitInflation === "simple" &&
                      capsGrow &&
                      dailyApplies &&
                      field(
                        "originalDaily",
                        "Original daily limit for simple inflation ($)"
                      )}
                    {input.benefitInflation === "simple" &&
                      capsGrow &&
                      monthlyApplies &&
                      field(
                        "originalMonthly",
                        "Original monthly limit for simple inflation ($)"
                      )}
                    {input.benefitInflation === "simple" &&
                      poolGrows &&
                      field(
                        "originalPool",
                        "Original total maximum for simple inflation ($)"
                      )}
                  </div>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0"
                      checked={input.riderConfirmed}
                      onChange={e => update("riderConfirmed", e.target.checked)}
                    />
                    <span>
                      I verified these increases continue for this five-year
                      claim scenario, use annual cent rounding, and apply in
                      full on the selected anniversary without proration.
                      February 29 anniversaries use February 28 in other years.
                      The total maximum increases before past claims are
                      subtracted; exhaustion ends coverage.
                    </span>
                  </label>
                  {error("riderConfirmed")}
                </>
              )}
            </fieldset>
            {attempted && Object.keys(evaluation.errors).length > 0 && (
              <p
                role="alert"
                className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                Please correct the marked fields. No estimate is shown for
                incomplete, unsupported or invalid inputs.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saveStatus==="saving"}
                className="rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saveStatus==="saving"?"Saving scenario…":"Calculate and save scenario"}
              </button>
              {props.onSaveScenario && (
                <button type="button" onClick={()=>void persist(input,changeVersion.current)}
                  disabled={saveStatus==="saving"}
                  className="rounded-lg border border-teal-700 px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-50">
                  Save draft
                </button>
              )}
              <span role="status" aria-live="polite" className="text-xs text-slate-700">
                {saveStatus==="saved"?"Validated scenario saved to your account.":
                 saveStatus==="review"?"Draft saved. Review required before report projections.":
                 saveStatus==="saving"?"Saving securely…":
                 saveStatus==="error"?"Scenario was not saved.":""}
              </span>
            </div>
            {saveMessage && <p role={saveStatus==="error"?"alert":"status"}
              className="text-xs text-amber-800">{saveMessage}</p>}

          </form>

          {result && (
            <div
              data-testid="care-results"
              className="min-w-0 space-y-5 border-t border-slate-200 pt-6"
            >
              <h4 className="font-semibold text-slate-900">
                Your care scenario
              </h4>
              <MonthlyEffectiveCost
                result={result}
                dualWaiver={input.dualWaiver}
                assumeFullWaiver={input.assumeFullWaiver}
              />
              {input.eligibility !== "confirmed" && (
                <p role="status" className="rounded bg-amber-100 p-3 text-sm">
                  No insurance reimbursement assumed because benefit eligibility
                  is not confirmed. All care expenses below are assigned to you.
                  This does not determine whether the carrier will approve a
                  claim.
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <Metric
                  label="Care cost per scheduled day"
                  value={money(result.dailyCareCost)}
                />
                <Metric
                  label="Care cost per scheduled week"
                  value={money(result.scheduledWeeklyCost)}
                />
                <Metric
                  label="Hours within the daily dollar limit"
                  value={
                    result.dailyLimitHours === null
                      ? "No daily cap selected"
                      : `${result.dailyLimitHours.toFixed(2)} hours`
                  }
                />
              </div>
              <p className="text-xs text-slate-600">
                Starting costs before inflation. Daily-limit hours = daily limit
                ÷ hourly rate, rounded down to two decimals and capped at 24.
                This is a dollar-limit comparison; eligibility, elimination
                days, monthly caps and pool exhaustion can still prevent
                reimbursement.
              </p>
              <h5 className="font-semibold">
                Five-year care totals: {input.startDate} through{" "}
                {result.through}
              </h5>
              <div className="grid gap-4 md:grid-cols-3">
                <Metric
                  label="Total care expenses"
                  value={money(result.totalCare)}
                />
                <Metric
                  label="Estimated insurance reimbursement"
                  value={money(result.totalInsurance)}
                />
                <Metric
                  label="Your care expenses"
                  value={money(result.totalOutOfPocket)}
                />
              </div>
              <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-slate-600">
                    Care expenses during elimination
                  </dt>
                  <dd className="font-semibold">{money(result.waitingCost)}</dd>
                </div>
                <div>
                  <dt className="text-slate-600">
                    First reimbursable service date
                  </dt>
                  <dd className="font-semibold">
                    {result.firstBenefitDate ?? "None in this scenario"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">Pool exhaustion</dt>
                  <dd className="font-semibold">
                    {result.exhaustionDate
                      ? input.remainingPool === "0"
                        ? "Already exhausted at start"
                        : result.exhaustionDate
                      : "Not exhausted within this five-year scenario"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">Benefits remaining at end</dt>
                  <dd className="font-semibold">
                    {money(result.remainingPool)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-slate-600">
                Insurance payments stop at the remaining pool, including a
                partial final claim. The remaining balance reaching zero marks
                exhaustion. No coverage duration beyond this horizon is
                inferred. Future eligibility and the same weekly care schedule
                are assumed to continue. Reimbursement timing and any cash you
                must advance are not modeled.
              </p>
              <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-3">
                <h5 className="mb-3 text-sm font-semibold">
                  Monthly care expenses and who pays
                </h5>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={result.months}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      minTickGap={50}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      width={65}
                      tickFormatter={n =>
                        `$${Number(n).toLocaleString("en-US")}`
                      }
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={value => money(Number(value))} />
                    <Legend />
                    <Bar
                      dataKey="insurance"
                      isAnimationActive={false}
                      name="Insurance reimbursement"
                      stackId="care"
                      fill="#0f766e"
                    />
                    <Bar
                      dataKey="outOfPocket"
                      isAnimationActive={false}
                      name="Your care expenses"
                      stackId="care"
                      fill="#d97706"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-xs text-slate-600">
                  Actual selected weekdays and calendar months, including leap
                  years. First and last months may be partial. Care costs rise
                  by {input.careInflation}% on scenario anniversaries. See the
                  balance in the table; chart intersections do not indicate
                  exhaustion.
                </p>
              </div>
              <details className="min-w-0">
                <summary className="cursor-pointer text-sm font-semibold text-teal">
                  View every month and remaining balance
                </summary>
                <div
                  className="mt-3 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-white"
                  tabIndex={0}
                  role="region"
                  aria-label="Monthly calculation details"
                >
                  <table className="w-full whitespace-nowrap text-right text-sm">
                    <caption className="p-3 text-left text-xs">
                      Premiums excluded. Covered service-date expenses, not
                      carrier payment dates.
                    </caption>
                    <thead className="bg-slate-100">
                      <tr>
                        {[
                          "Dates",
                          "Care days",
                          "Care cost",
                          "Insurance",
                          "You pay",
                          "Pool remaining",
                        ].map(h => (
                          <th key={h} className="p-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.months.map(m => (
                        <tr key={m.month} className="border-t">
                          <th scope="row" className="p-3 text-left font-normal">
                            {m.from} – {m.through}
                          </th>
                          <td className="p-3">{m.careDays}</td>
                          <td className="p-3">{money(m.careCost)}</td>
                          <td className="p-3">{money(m.insurance)}</td>
                          <td className="p-3">{money(m.outOfPocket)}</td>
                          <td className="p-3">{money(m.benefitRemaining)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
          <p className="text-xs text-slate-600">
            Policy guidance:{" "}
            <a
              href={sourceGuide}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              NAIC Shopper’s Guide
            </a>{" "}
            (benefit payment methods, limits, elimination periods, inflation and
            waiver) and{" "}
            <a
              href="https://acl.gov/ltc/costs-and-who-pays/what-is-long-term-care-insurance/receiving-long-term-care-insurance-benefits"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Administration for Community Living
            </a>{" "}
            (benefit eligibility). The issued policy, riders and carrier
            determinations control.
          </p>
        </div>
      )}
    </section>
  );
}

function MonthlyEffectiveCost({
  result,
  dualWaiver,
  assumeFullWaiver,
}: {
  result: NonNullable<ReturnType<typeof calculateCare>["result"]>;
  dualWaiver: boolean;
  assumeFullWaiver: boolean;
}) {
  const [month, setMonth] = useState(
    () => result.monthlyEffectiveCosts.find(m => m.fullMonth)!.month
  );
  const reviewed = result.monthlyEffectiveCosts.find(m => m.month === month)!;
  const care = result.months.find(m => m.month === month)!;
  const monthName = (value: string) =>
    new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  return (
    <section
      aria-labelledby="effective-care-heading"
      data-testid="monthly-effective-care"
      className="min-w-0 rounded-xl border-2 border-teal-700 bg-teal-50 p-4 md:p-6"
    >
      <h5
        id="effective-care-heading"
        className="text-xl font-bold text-teal-950"
      >
        Effective monthly cost of care
      </h5>
      <p className="mt-2 text-sm text-slate-700">
        Include premium savings in your care budget: total care cost minus the
        premium(s) waived for the month. This comparison is before insurance
        reimbursement; it does not change the care provider’s invoice.
      </p>
      <div className="my-4">
        <Label htmlFor="care-reviewMonth">Month to review</Label>
        <select
          id="care-reviewMonth"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="mt-1 block w-full min-w-0 rounded-md border border-slate-300 bg-white p-2 text-sm"
        >
          {result.monthlyEffectiveCosts.map(m => (
            <option key={m.month} value={m.month}>
              {monthName(m.month)}
              {m.fullMonth ? "" : " — partial month"}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-600">
          Opens to the first full calendar month. Each month uses its actual
          scheduled care days and any selected care-cost increases. Premium
          amounts stay as entered; waiver is an assumption for the month you
          review.
        </p>
      </div>
      <p className="mb-3 text-sm font-medium">
        {care.from} – {care.through} · {care.careDays} scheduled care days
      </p>
      <dl className="space-y-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt>
            Total cost of care this{" "}
            {reviewed.fullMonth ? "month" : "partial month"}
          </dt>
          <dd className="font-semibold" data-testid="monthly-gross-care">
            {money(care.careCost)}
          </dd>
        </div>
        {reviewed.fullMonth && (
          <>
            <div className="flex flex-wrap justify-between gap-2">
              <dt>Less: your waived premium</dt>
              <dd
                className="font-semibold"
                data-testid="insured-premium-deduction"
              >
                −{money(reviewed.insuredPremiumSavings!)}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt>
                Less: spouse’s waived premium
                {dualWaiver ? " (dual waiver)" : " (not selected)"}
              </dt>
              <dd
                className="font-semibold"
                data-testid="spouse-premium-deduction"
              >
                −{money(reviewed.spousePremiumSavings!)}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-teal-200 pt-3">
              <dt>Total monthly premium savings deducted</dt>
              <dd className="font-bold" data-testid="total-premium-deduction">
                {money(reviewed.totalPremiumSavings!)}
              </dd>
            </div>
            <div className="rounded-lg bg-teal-800 p-4 text-white">
              <dt className="font-semibold">
                Effective cost of care for {monthName(month)}
              </dt>
              <dd
                className="mt-1 break-words text-3xl font-bold"
                data-testid="effective-monthly-cost"
              >
                {money(reviewed.effectiveCareCost!)}
              </dd>
              <dd className="mt-2 text-sm">
                {money(care.careCost)} − {money(reviewed.totalPremiumSavings!)}{" "}
                = {money(reviewed.effectiveCareCost!)}
              </dd>
            </div>
          </>
        )}
      </dl>
      {reviewed.fullMonth ? (
        <>
          <p className="mt-3 text-sm">
            {assumeFullWaiver
              ? `Full waiver assumed for ${dualWaiver ? "both entered premiums" : "your entered premium"} for this entire month.`
              : "No waiver assumed for this month; no premium savings deducted."}{" "}
            Premium(s) before waiver:{" "}
            <strong>{money(result.totalMonthlyPremium)}</strong>. Premium(s)
            payable:{" "}
            <strong data-testid="monthly-premiums-payable">
              {money(result.totalMonthlyPremiumPayable)}
            </strong>
            .
          </p>
          {reviewed.effectiveCareCost! < 0 && (
            <p role="status" className="mt-3 rounded bg-white p-3 text-sm">
              Premium savings exceed this month’s care cost by{" "}
              {money(-reviewed.effectiveCareCost!)}. The negative result is a
              household budget offset, not a payment from the insurer or a
              refund from the care provider.
            </p>
          )}
        </>
      ) : (
        <p role="status" className="mt-3 rounded bg-white p-3 text-sm">
          This scenario covers only part of {monthName(month)}. A full month’s
          premium savings is not deducted from a partial care period. Select a
          full calendar month for the effective-cost comparison; partial-month
          savings require the carrier’s actual waiver dates and terms.
        </p>
      )}
      <p className="mt-3 text-xs text-slate-700">
        Waiver savings reduce the household budget burden; they are not care
        claim payments and do not reduce benefit-pool use or extend coverage.
        The five-year care totals below exclude premiums. This monthly
        illustration does not establish when waiver starts or ends.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
