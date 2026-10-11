import type { CanonicalReportModel } from "./canonicalReportModel";

/**
 * Runs inside an isolated Chromium page. Only text nodes and existing table
 * cells are changed; no source HTML file, CSS, logo or page is rewritten.
 * All input values use textContent, never dynamic innerHTML.
 */
export function bindCanonicalReportPage(
  payload: { model: CanonicalReportModel; pageNumber: number },
): { pageNumber:number; changes:number; unresolvedExamples:string[]; removedSourceScripts:boolean } {
  const { model:m, pageNumber } = payload;
  const root = document.querySelector("section.page") as HTMLElement;
  if (!root) throw new Error("Approved LTC template page container is missing");
  const formatMoney = (value:number|null|undefined,decimals=0) =>
    value===null || value===undefined || !Number.isFinite(value)
      ? "Not calculated"
      : "$"+value.toLocaleString("en-US",{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const showAmount = (n:number|null) => n===null?"Carrier verification required":formatMoney(n);
  const concise = (text:string|null|undefined) =>
    (text||"").trim() || "Carrier verification required";
  const prettyDate = (s:string|null) => {
    if(!s) return "Not verified";
    const date=new Date(s+"T12:00:00Z");
    return date.toLocaleDateString("en-US",{timeZone:"UTC",month:"long",day:"numeric",year:"numeric"});
  };
  const noCost = "Not calculated";
  let changes=0;

  function replaceLiteral(oldText:string,newText:string) {
    if(oldText===newText)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let item:Node|null=walker.nextNode();
    while(item) {
      const v=item.nodeValue||"";
      if(v.includes(oldText)){
        item.nodeValue=v.replaceAll(oldText,newText);
        changes++;
      }
      item=walker.nextNode();
    }
  }
  function replaceAny(source:string[],replacement:string) {
    for(const value of source)replaceLiteral(value,replacement);
  }
  function cellText(target:HTMLElement|undefined,content:string) {
    if(!target)return;
    const label=target.querySelector("b.verify,strong") as HTMLElement|null;
    if(label)label.textContent=content;
    else target.textContent=content;
    changes++;
  }
  function updateTableRow(label:string,values:Array<string|null>,selector?:string) {
    const tables=selector ? Array.from(root.querySelectorAll(selector)) : Array.from(root.querySelectorAll("table"));
    let match=false;
    for(const table of tables){
      for(const tr of Array.from(table.querySelectorAll("tr"))){
        const cells=Array.from(tr.children) as HTMLElement[];
        if(!cells.length || cells[0].textContent?.trim().toLowerCase()!==label.toLowerCase())continue;
        values.forEach((text,i)=>{ if(text!==null)cellText(cells[i+1],text); });
        match=true;
      }
    }
    return match;
  }
  function updateMetric(label:string,value:string,selector:string,header="span") {
    for(const el of Array.from(root.querySelectorAll(selector))){
      const labelEl=el.querySelector(header);
      if(labelEl?.textContent?.trim().toLowerCase()===label.toLowerCase()){
        const strong=el.querySelector("strong");
        if(strong){strong.textContent=value;changes++;}
      }
    }
  }
  function updateScenario(index:number,care:number|null,insurance:number|null,out:number|null,pct:number|null) {
    const box=root.querySelectorAll(".scenario-cards .scenario")[index] as HTMLElement|undefined;
    if(!box)return;
    const big=box.querySelector(".big"); if(big){big.textContent=formatMoney(care);changes++;}
    const allDts=Array.from(box.querySelectorAll("dt"));
    allDts.forEach(dt=>{
      const label=dt.textContent?.trim().toLowerCase();
      const dd=dt.nextElementSibling;
      if(!dd)return;
      if(label==="insurance")dd.textContent=formatMoney(insurance);
      else if(label==="margaret" || label==="client" ||
        label===m.person.firstName.toLowerCase())dd.textContent=formatMoney(out);
      else if(label==="insurance share")dd.textContent=pct===null?"Not verified":pct.toFixed(1)+"%";
      changes++;
    });
    const client=allDts.find(dt=>dt.textContent?.trim()===m.person.firstName);
    if(client)client.textContent="Client";
    const bar=box.querySelector(".coverage-meter > span") as HTMLElement|null;
    if(bar){bar.style.width=pct===null?"0%":Math.max(0,Math.min(pct,100)).toFixed(1)+"%";changes++;}
  }

  // Identity / policy information. This is NOT a fillable public SSN export.
  const p=m.person,policy=m.policy;
  const replacements:[string,string][]=[
    ["margaret.johnson@email.com",concise(p.email)],
    ["Long Term-Care Insurance Strategy Prepared for: Sample","Long Term-Care Insurance Strategy Prepared for: "+p.fullName],
    ["Margaret Anne Johnson",p.fullName],
    ["Margaret's",p.firstName+"'s"],
    ["Margaret’s",p.firstName+"’s"],
    ["Margaret",p.firstName],
    ["Genworth Life Insurance Company",policy.carrierName],
    ["Genworth LTC Claims Department",concise(policy.claimsAddress1)],
    ["Genworth’s","the carrier’s"],
    ["Genworth's","the carrier's"],
    ["Genworth","the carrier"],
    ["LTC-2019-445821",policy.policyNumber],
    ["XXX-XX-4521","Masked — not printed"],
    ["March 15, 1952 · Age 74",p.dob?prettyDate(p.dob)+(p.age!==null?" · Age "+p.age:""):"Not provided"],
    ["March 15, 1952",p.dob?prettyDate(p.dob):"Not provided"],
    ["74 years old",p.age===null?"Not provided":p.age+" years old"],
    ["1247 Oakwood Drive, Greenville, SC 29601",concise(p.address)],
    ["(864) 555-0142",concise(p.phone)],
    ["(800) 555-0123",concise(policy.carrierPhone)],
    ["(804) 555-0456",concise(policy.claimsFax)],
    ["P.O. Box 12345",concise(policy.claimsAddress2)],
    ["Richmond, VA 23219",concise(policy.claimsCityStateZip)],
    ["January 15, 2019",prettyDate(policy.issueDate)],
    ["July 20, 2026",prettyDate(m.reportDate)],
    ["Current · paid through Dec. 2026","Confirm premium status"],
    ["Premiums are reported current through December 2026.","Confirm the policy's current premium status with the carrier."],
    ["Policy status: Active and eligible","Policy status: "+concise(policy.status)],
    ["Not yet assigned",policy.claimNumber||"Not yet assigned"],
    ["3 years / 1,095 days",concise(policy.benefitPeriod)],
    ["3 years",concise(policy.benefitPeriod)],
    ["2 of 6",policy.minAdls===null?"Verify ADL trigger":policy.minAdls+" of 6"],
    ["Substantial assistance with 2 of 6 ADLs",policy.minAdls===null?
      "Verify required ADL threshold":"Policy specifies "+policy.minAdls+" of 6 ADLs; medical assessment required"],
    ["3% compound annually",policy.inflationRate===null?"Rider not verified":policy.inflationRate+"% annually (verify method)"],
    ["3% compound inflation rider","Inflation rider (if present)"],
    ["A 90-day waiting period","A policy waiting period"],
    ["90-day roadmap","claim roadmap"],
    ["Notify the carrier within 30 days of needing care","Notify the carrier promptly and confirm the actual notice deadline"],
    ["Days 1–7 · Documentation","Early phase · Documentation"],
    ["90-day claim roadmap","claim roadmap"],
    ["90-DAY IMPLEMENTATION TIMELINE","CLAIM IMPLEMENTATION TIMELINE"],
    ["the full 90-day claim roadmap","the full claim roadmap"],
    ["by Day 30","promptly, by the carrier’s actual deadline"],
    ["By Day 30","Carrier deadline"],
    ["Day 30 is the bright-red marker","The highlighted milestone is a planning target"],
    ["Submit the complete packet by Day 30","Submit the complete packet by the carrier-confirmed deadline"],
    ["Claim opened","Claim notice documented"],
  ];
  for(const [a,b] of replacements)replaceLiteral(a,b);

  // Waiting days are policy-specific. An actual zero is not coerced to 90.
  const elim=policy.eliminationDays===null?"Not verified":policy.eliminationDays+" days";
  replaceAny(["90 days","90-day elimination period","90-day waiting period"],elim);
  const cap=policy.dailyMax===null?"Not verified":formatMoney(policy.dailyMax);
  const max=policy.lifetimeMax===null?"Not verified":formatMoney(policy.lifetimeMax);
  const mcap=policy.monthlyMax===null?"Carrier verification required":formatMoney(policy.monthlyMax);
  const care=m.financial.scenarios;
  const scenario=(year:number)=>care.find(x=>x.year===year);
  const initialCare=m.financial.typicalMonthlyCareCost;
  const firstYear=scenario(1),secondYear=scenario(2),thirdYear=scenario(3);
  // Each original sample dollar amount is mapped to the verified report
  // model or explicitly withheld. No sample budget silently survives.
  const moneyPairs:Array<[string,string]> = [
    ["$273,750",max],
    ["$259,547",formatMoney(thirdYear?.insurance)],
    ["$282,047",formatMoney(thirdYear?.careCost)],
    ["$185,238",formatMoney(secondYear?.careCost)],
    ["$165,432",formatMoney(thirdYear?.careCost)],
    ["$162,738",formatMoney(secondYear?.insurance)],
    ["$142,932",formatMoney(thirdYear?.insurance)],
    ["$96,808.95","Not verified"],
    ["$93,987.50","Not verified"],
    ["$91,250",formatMoney(firstYear?.careCost)],
    ["$68,750",formatMoney(firstYear?.insurance)],
    ["$56,784",formatMoney(thirdYear?thirdYear.careCost-(secondYear?.careCost||0):null)],
    ["$55,128",formatMoney(secondYear?secondYear.careCost-(firstYear?.careCost||0):null)],
    ["$53,520",formatMoney(firstYear?.careCost)],
    ["$22,500",formatMoney(m.financial.firstYearWaitingCost)],
    ["$7,500",policy.monthlyMax===null?"Carrier verification required":formatMoney(policy.monthlyMax)],
    ["$5,558.95","Not verified"],
    ["$5,575",formatMoney(initialCare===null?null:initialCare*1.25)],
    ["$4,906",formatMoney(initialCare===null?null:initialCare*1.10)],
    ["$4,732","Not verified"],
    ["$4,594","Not verified"],
    ["$4,460",formatMoney(initialCare)],
    ["$3,040",formatMoney(initialCare===null||policy.monthlyMax===null?null:
      Math.max(0,policy.monthlyMax-initialCare))],
    ["$2,737.50","Not verified"],
    ["$2,160","Not itemized"],
    ["$1,200","Not itemized"],
    ["$800","Not itemized"],
    ["$300","Not itemized"],
    ["$257.50","Not verified"],
    ["$265.23","Not verified"],
    ["$250.00",policy.dailyMax===null?"Not verified":formatMoney(policy.dailyMax,2)],
    ["$250",cap],
    ["$100","Not itemized"],
    ["$75","Not itemized"],
    ["$18","Not itemized"],
    ["$15","Not itemized"],
  ];
  for(const [before,after] of moneyPairs)replaceLiteral(before,after);

  // Exact labels are copied from the original 18-page HTML worksheet.
  // Only provider-recorded fields are populated. Unknown fields remain
  // explicitly subject to carrier verification.
  const yn=(value:string|null|undefined):string=>{
    const v=(value||"").trim().toLowerCase();
    if(["yes","true","1"].includes(v))return "Yes — confirm policy conditions";
    if(["no","false","0"].includes(v))return "No — confirm policy conditions";
    return "Carrier verification required";
  };
  const coveredSettings=[
    ["Home care",policy.homeCareCoverage],["Facility care",policy.facilityCareCoverage],
  ].map(([label,value])=>{
    const v=(value||"").trim().toLowerCase();
    return v==="yes"?label+" indicated (verify)":v==="no"?label+" excluded (verify)":"";
  }).filter(Boolean).join("; ") || "Carrier verification required";
  const inflation=policy.inflationProtection
    ? policy.inflationProtection+" (verify rider details)"
    : policy.inflationRate===null?"Carrier verification required":
      policy.inflationRate+"% — verify rider method, limits and dates";
  const verifiedRemaining=m.financial.currentRemainingPool===null
    ? "Carrier verification required"
    : formatMoney(m.financial.currentRemainingPool)+" (user-confirmed starting balance)";
  const doubleCell=(label:string,value:string)=>{
    for(const table of Array.from(root.querySelectorAll("table"))){
      for(const row of Array.from(table.querySelectorAll("tr"))){
        const cells=Array.from(row.children) as HTMLElement[];
        for(let i=0;i<cells.length-1;i++){
          if(cells[i].textContent?.trim().toLowerCase()===label.toLowerCase()){
            cellText(cells[i+1],value);
          }
        }
      }
    }
  };
  // 14 policy identity fields in the page 2 two-column worksheet.
  const claimAddr=[policy.claimsAddress1,policy.claimsAddress2,policy.claimsCityStateZip]
    .filter(v=>v&&v.trim()).join(", ") || "Carrier verification required";
  const identity:Record<string,string>={
    "Full name":p.fullName, "Social Security #":"Masked — never include full SSN",
    "Date of birth":prettyDate(p.dob),
    "Age":p.age===null?"Not provided":String(p.age),
    "Address":concise(p.address),"Phone":concise(p.phone),"Email":concise(p.email),
    "Carrier name":policy.carrierName,"Policy #":policy.policyNumber,
    "Issue date":prettyDate(policy.issueDate),
    "Premium status":concise(policy.status),
    "Claims address":claimAddr,"Claims phone":concise(policy.carrierPhone),
    "Claims fax":concise(policy.claimsFax),
  };
  if(pageNumber===2){
    for(const [label,value] of Object.entries(identity)) doubleCell(label,value);
  }

  // Explicit policy fields in existing table layout.
  const coverage:Record<string,string>={
    "Daily maximum benefit":cap==="Not verified"?cap:cap+" per day",
    "Monthly maximum benefit":mcap,
    "Benefit period":concise(policy.benefitPeriod),
    "Lifetime maximum / benefit pool":max,
    "Current remaining benefit pool":verifiedRemaining,
    "Elimination period":elim,
    "Inflation rider":inflation,
    "Inflation effect on lifetime maximum":"Carrier verification required",
    "Covered care settings":coveredSettings,
    "Home-care benefit / covered services":concise(policy.coveredCare),
    "Home-care provider requirements":yn(policy.cnaRequired),
    "Payment method":concise(policy.paymentMethod),
    "Physical benefit trigger":policy.minAdls===null?"Carrier verification required":
      policy.minAdls+" of 6 ADLs, verify substantial assistance",
    "Cognitive-impairment trigger":yn(policy.cognitive),
  };
  for(const [label,value] of Object.entries(coverage))updateTableRow(label,[value],".coverage-table");
  updateTableRow("Client Name",[p.fullName],".coverage-table");
  updateTableRow("Carrier Name",[policy.carrierName],".coverage-table");
  updateTableRow("Address 1",[concise(policy.claimsAddress1)],".coverage-table");
  updateTableRow("Address 2",[concise(policy.claimsAddress2)],".coverage-table");
  updateTableRow("City, State, Zipcode",[concise(policy.claimsCityStateZip)],".coverage-table");
  updateTableRow("Phone Number",[concise(policy.carrierPhone)],".coverage-table");
  updateTableRow("Fax Number",[concise(policy.claimsFax)],".coverage-table");
  updateTableRow("Policy Number",[policy.policyNumber],".coverage-table");
  updateTableRow("Claim / Pre-Claim Number",[policy.claimNumber||"Not yet assigned"],".coverage-table");
  updateTableRow("Elimination Period",[elim],".coverage-table");
  updateTableRow("Daily Maximum",[cap],".coverage-table");
  updateTableRow("Lifetime Maximum",[max],".coverage-table");
  updateTableRow("Monthly Maximum",[mcap],".coverage-table");
  updateTableRow("Minimum Number of ADLs Compromised",[
    policy.minAdls===null?"Carrier verification required":policy.minAdls+" of 6 ADLs"
  ],".coverage-table");

  const admin:Record<string,string>={
    "Case Manager (if assigned)":concise(policy.caseManager),
    "Waiver of Premium":yn(policy.waiver),
    "Payment Cycle to Client":concise(policy.paymentCycle),
    "C.N.A. Caregiver Required":yn(policy.cnaRequired),
    "Logsheets Required":yn(policy.careLogsRequired),
    "Third Party Assessment":yn(policy.assessorRequired)+
      (policy.assessorWho?"; "+policy.assessorWho:""),
    "Visiting Angels Name — Print":"Not provided — complete after review",
    "Date":prettyDate(m.reportDate),
    "Payment / reimbursement cycle":concise(policy.paymentCycle),
    "Payment recipient":policy.aob?.trim().toLowerCase()==="yes"
      ?"Assignment provision indicated; verify carrier acceptance and payee"
      :"Carrier verification required",
    "Assignment of benefits":yn(policy.aob),
    "C.N.A. caregiver required":yn(policy.cnaRequired),
    "Care logs / logsheets required":yn(policy.careLogsRequired),
    "Plan of care / prior authorization":concise(policy.planOfCareStatus),
    "Third-party assessment":yn(policy.assessorRequired)+
      (policy.assessorWho?"; "+policy.assessorWho:""),
    "Case manager":concise(policy.caseManager),
    "Claim / pre-claim number":concise(policy.claimNumber),
    "Required claim forms and documentation":"Request the current carrier packet",
    "Exclusions and limitations":"Carrier verification required",
  };
  for(const [label,value] of Object.entries(admin)){
    updateTableRow(label,[value],".coverage-table");
  }

  updateMetric("Daily benefit",cap,".metrics .metric");
  updateMetric("Benefit period",concise(policy.benefitPeriod),".metrics .metric");
  updateMetric("Lifetime pool",max,".metrics .metric");
  updateMetric("Elimination period",elim,".metrics .metric");
  updateMetric("Maximum stated daily benefit",
    cap==="Not verified"?"Not verified":cap+"/day",".bubble-stats .bubble-stat");
  updateMetric("Waiting period before reimbursement",elim,".bubble-stats .bubble-stat");
  updateMetric("ADLs that may trigger benefits",
    policy.minAdls===null?"Not verified":policy.minAdls+" of 6",".bubble-stats .bubble-stat");
  updateMetric("Lifetime maximum benefit",max,".bubble-stats .bubble-stat");

  // Remove the original named-care plan and unsupported financial assumptions
  // without changing the approved row counts, grid structure or typography.
  if(pageNumber===1) {
    const heading=root.querySelector("h1 .prepared-for");
    if(heading){
      for(const child of Array.from(heading.childNodes)){
        if(child.nodeType===Node.TEXT_NODE && child.nodeValue?.includes("Sample")){
          child.nodeValue=child.nodeValue.replace("Sample",p.fullName);
          changes++;
        }
      }
    }
    const boxes=root.querySelectorAll(".grid-2 .callout");
    boxes.forEach(box=>{
      const title=box.querySelector("strong")?.textContent?.trim();
      const direct=Array.from(box.childNodes).find(node=>node.nodeType===Node.TEXT_NODE);
      if(!direct)return;
      if(title==="Critical deadline"){
        direct.nodeValue=" Notify the carrier promptly and confirm the contractual notice and proof-of-loss deadlines in writing. Preserve receipt confirmations.";
        changes++;
      }
      if(title==="Funding requirement"){
        direct.nodeValue=policy.eliminationDays===0
          ? " Recorded waiting days: zero. Confirm whether benefits are payable and which care charges remain the client's responsibility."
          : " The elimination reserve must be based on the carrier's counting method and a verified care-cost schedule, not the policy's daily cap alone.";
        changes++;
      }
    });
  }

  if(pageNumber===12) {
    const nominalMaximum=policy.monthlyMax;
    const fraction=initialCare!==null&&nominalMaximum!==null&&nominalMaximum>0
      ?Math.min(100,initialCare/nominalMaximum*100):null;
    replaceLiteral("The modeled care plan uses 59.5% of the policy’s nominal 30-day benefit capacity.",
      fraction===null
        ?"No monthly coverage ratio can be established until care frequency, policy limits and eligibility are verified."
        :"The first-month modeled care plan is "+fraction.toFixed(1)+
          "% of the stated monthly coverage cap; actual reimbursement depends on eligibility and covered expenses.");
    replaceLiteral("Assumes eligible costs remain fully reimbursable",
      "Projected coverage depends on eligibility, provider rules, limits and remaining benefits");
    replaceLiteral("Assumes continued approval and available benefits",
      "Assumes continued eligibility and sufficient benefits; verify each claim");
    replaceLiteral("The source materials contain both a fixed $273,750 lifetime pool and inflation-adjusted daily benefit projections. Confirm whether the rider also increases the lifetime maximum. Do not assume the policy can pay more than the official remaining benefit pool.",
      "Future benefit inflation cannot be assumed from current limits. Verify the issued riders, annual increase rules and current remaining pool with the carrier.");
    const paragraphs=Array.from(root.querySelectorAll("p"));
    const planningIntro=paragraphs.find(el=>el.textContent?.includes("proposed care plan costs approximately"));
    if(planningIntro){
      planningIntro.textContent=m.financial.verifiedModel
        ? "The verified calculator scenario estimates "+formatMoney(m.financial.typicalMonthlyCareCost)+
          " in the first modeled month. Policy benefits and cost sharing are calculated separately using the insured's actual confirmed terms."
        : "This original cost-analysis layout will populate only after a validated care schedule, provider rates, policy terms and remaining benefit balance are supplied.";
      changes++;
    }
    const costDescription=root.querySelector(".cost-card p");
    if(costDescription){
      costDescription.textContent=m.financial.verifiedModel
        ? "of scheduled modeled home care each week. The hourly rate, frequency and eligible care services must match the accepted provider agreement."
        : "The number of caregiver hours, treatment visits and services must be confirmed in the care plan before budgeting.";
      changes++;
    }
    const stress=root.querySelectorAll(".cost-card")[1]?.querySelector("p.small");
    if(stress){
      stress.textContent=m.financial.verifiedModel
        ? "Sensitivity scenarios compare gross care expense with nominal caps. Eligibility and coverage limits remain carrier-controlled."
        : "A verified care model is required before testing 10% and 25% cost changes.";
      changes++;
    }
    const planRows=Array.from(root.querySelectorAll("table"))
      .find(t=>t.textContent?.includes("Certified Nursing Assistant"));
    if(planRows){
      for(const row of Array.from(planRows.querySelectorAll("tbody tr"))){
        const cells=Array.from(row.children) as HTMLElement[];
        if(cells.length>=4){cellText(cells[1],"Verify schedule");cellText(cells[2],"Verify rate");cellText(cells[3],"Not itemized");}
      }
    }
    const projection=Array.from(root.querySelectorAll("table"))
      .find(t=>t.textContent?.includes("Monthly cost")&&t.textContent?.includes("Annual cost"));
    if(projection){
      for(const [i,tr] of Array.from(projection.querySelectorAll("tbody tr")).entries()){
        const row=tr as HTMLElement, cells=Array.from(row.children) as HTMLElement[];
        const sc=[firstYear,secondYear,thirdYear][i];
        if(cells.length>=4){
          const annualCost=sc?sc.careCost-(i===0?0:([firstYear,secondYear][i-1]?.careCost||0)):null;
          const yearOut=sc?sc.outOfPocket-(i===0?0:([firstYear,secondYear][i-1]?.outOfPocket||0)):null;
          cellText(cells[1],formatMoney(annualCost===null?null:annualCost/12));
          cellText(cells[2],formatMoney(annualCost));
          cellText(cells[3],formatMoney(yearOut));
        }
      }
    }
    const threeYearTotal=Array.from(root.querySelectorAll("tr")).find(tr=>
      tr.children[0]?.textContent?.trim().toLowerCase()==="3-year total");
    if(threeYearTotal){
      const cells=Array.from(threeYearTotal.children) as HTMLElement[];
      if(cells.length>=4){
        cellText(cells[1],formatMoney(thirdYear?.careCost===undefined?null:thirdYear.careCost/36));
        cellText(cells[2],formatMoney(thirdYear?.careCost));
        cellText(cells[3],formatMoney(thirdYear?.outOfPocket));
      }
    }
    const bars=root.querySelectorAll(".bar-chart .bar-row");
    const benefit=policy.dailyMax===null?null:policy.dailyMax*30;
    const rows=[initialCare,benefit,initialCare===null||benefit===null?null:Math.max(0,benefit-initialCare)];
    bars.forEach((bar,i)=>{
      const value=rows[i]??null;
      const strong=bar.querySelector("strong");
      if(strong){strong.textContent=formatMoney(value);changes++;}
      const fill=bar.querySelector(".bar") as HTMLElement|null;
      if(fill){fill.style.width=value===null||benefit===null?"0%":
        Math.max(0,Math.min(100,100*value/Math.max(value,benefit))).toFixed(1)+"%";changes++;}
    });
    const hour=root.querySelector(".cost-number");
    if(hour){hour.textContent=m.financial.careHoursPerDay!==null&&m.financial.careDaysPerWeek!==null?
      m.financial.careHoursPerDay*m.financial.careDaysPerWeek+" hours/week":"Schedule unverified";changes++;}
    const ratio=root.querySelector(".grid-2 .callout.good strong");
    if(ratio){ratio.textContent="Modeled coverage: "+(m.financial.coverageRatio===null?
      "Not verified":m.financial.coverageRatio.toFixed(1)+"%");changes++;}
    const summary=root.querySelector(".grid-2 .callout.good");
    if(summary){ const last=summary.lastChild;
      if(last && last.nodeType===Node.TEXT_NODE){last.nodeValue=m.financial.verifiedModel?
        "Planning simulation only, subject to actual carrier payment and eligible expenses.":
        "Financial projections are unavailable until the care scenario is verified.";changes++;}
    }
  }

  if(pageNumber===15){
    const reconciliation=root.querySelector(".callout.warn");
    if(reconciliation){
      const title=reconciliation.querySelector("strong");
      if(title){title.textContent="Carrier verification required before client reliance";changes++;}
      const body=m.financial.verifiedModel && thirdYear
        ? "The verified planning inputs project "+formatMoney(thirdYear.careCost)+
          " in care costs and "+formatMoney(thirdYear.insurance)+
          " in potential insurer reimbursements over three rolling years, leaving "+
          formatMoney(thirdYear.outOfPocket)+
          " as the modeled client care-cost portion. Payment remains subject to the insurer's eligibility decision, covered services, daily and monthly caps, elimination-period rules, submitted invoices, and the remaining benefit pool."
        : "Three-year financial projections are withheld because a complete, policy-consistent care scenario has not been validated. Confirm eligible services, provider rates, elimination-period terms, benefit limits and the remaining pool before relying on these figures.";
      const textNodes=Array.from(reconciliation.childNodes)
        .filter(node=>node.nodeType===Node.TEXT_NODE);
      if(textNodes.length){
        textNodes[0].nodeValue=body;
        for(const extra of textNodes.slice(1)) extra.nodeValue="";
      }else{
        reconciliation.appendChild(document.createTextNode(body));
      }
      changes++;
    }
    for(let i=0;i<3;i++){
      const sc=care[i];
      updateScenario(i,sc?.careCost??null,sc?.insurance??null,sc?.outOfPocket??null,sc?.insuranceShare??null);
    }
    updateTableRow("Elimination period",[
      policy.eliminationDays===null?"Not verified":String(policy.eliminationDays),
      "Policy specific",
      formatMoney(m.financial.firstYearWaitingCost),
      "Insured (if eligible)",
    ]);
    updateTableRow("Remaining Year 1",[
      "Based on confirmed care days", "Modeled care cost", formatMoney(firstYear?.insurance), "Carrier, if eligible",
    ]);
    updateTableRow("Year 2",[
      "Modeled", "Care projection", formatMoney(secondYear&&firstYear?secondYear.insurance-firstYear.insurance:null),"Carrier, if eligible",
    ]);
    updateTableRow("Year 3",[
      "Modeled", "Care projection", formatMoney(thirdYear&&secondYear?thirdYear.insurance-secondYear.insurance:null),"Carrier, if eligible",
    ]);
    const info=root.querySelector(".scenario-cards")?.previousElementSibling;
    if(info?.tagName==="P"){
      info.textContent=m.financial.verifiedModel
        ? "Three-year care and reimbursement planning scenarios are calculated from the confirmed home-care model. Actual carrier payment and eligibility remain subject to the policy."
        : "Illustrative scenario figures are intentionally withheld. Complete and verify the care calculator before using financial projections.";
      changes++;
    }
  }

  if(pageNumber===13){
    const title=root.querySelector("header.brandbar .title");
    if(title){
      for(const node of Array.from(title.childNodes)){
        if(node.nodeType===Node.TEXT_NODE && node.nodeValue?.includes("90-DAY")){
          node.nodeValue=node.nodeValue.replace("90-DAY","CLAIM");
          changes++;
        }
      }
    }
    const table=root.querySelector(".gantt");
    const phaseIds=["s1-1","s1-4","s2-1","s2-12","s2-13","s2-17","s3-1"];
    const spanEnd=phaseIds.map(id=>(m.schedule[id]||[0,1])[0]+(m.schedule[id]||[0,1])[1]);
    const horizon=Math.max(90,...spanEnd);
    const chunk=Math.max(15,Math.ceil(horizon/6));
    if(table){
      const headers=table.querySelectorAll("thead th");
      for(let j=1;j<=6;j++){
        if(headers[j])headers[j].textContent="Days "+((j-1)*chunk+1)+"–"+(j*chunk);
      }
      const phaseRows=table.querySelectorAll("tbody tr");
      phaseRows.forEach((row,i)=>{
        const cells=Array.from(row.children) as HTMLElement[];
        const [start,duration]=m.schedule[phaseIds[i]]||[i*10,10];
        const first=Math.min(5,Math.floor(start/chunk));
        const last=Math.min(5,Math.floor((start+duration-1)/chunk));
        for(let j=1;j<=6;j++){
          const cell=cells[j];
          if(!cell)continue;
          cell.classList.toggle("active",j-1>=first&&j-1<=last);
          cell.classList.remove("timeline-1","timeline-2","timeline-3","timeline-4","timeline-5","timeline-6","timeline-7");
          if(j-1>=first&&j-1<=last)cell.classList.add("timeline-"+(i+1));
          cell.textContent=j-1===first?"Days "+(start+1)+"–"+(start+duration):"";
        }
        changes++;
      });
    }
    const phaseDetailLabels=root.querySelectorAll(".phase-detail > b");
    phaseDetailLabels.forEach((heading,i)=>{
      if(i>=7)return;
      const [start,duration]=m.schedule[phaseIds[i]]||[i*10,10];
      const names=["Documentation","Contact carrier","Complete forms","Medical review",
        "Functional assessment","Approval decision","Benefit activation"];
      heading.textContent="Estimated days "+(start+1)+"–"+(start+duration)+" · "+names[i];
      changes++;
    });
    const top=root.querySelector(".section-title + p");
    if(top){top.textContent="Estimated dependency-based claim phases. The displayed dates are planning targets, not deadlines or benefit guarantees confirmed by the carrier.";changes++;}
    const warn=root.querySelector(".callout.warn");
    if(warn){warn.textContent="Verify carrier deadlines. Obtain written confirmation of filing requirements, assessment timing, approval decision and eligibility before relying on this schedule.";changes++;}
  }

  if(pageNumber===16){
    replaceLiteral("By Day 15","Carrier-confirmed deadline");
    replaceLiteral("Build the elimination-period care and funding plan.",
      "Verify the elimination requirement and plan care funding.");
    if(policy.eliminationDays===0){
      replaceLiteral("Confirm whether the 0 days counts calendar days, service days, or only eligible paid-care days.",
        "The policy field lists zero elimination days. Confirm with the carrier that no waiting period applies, whether prior credits are relevant, and the earliest eligible benefit date.");
    }
    replaceLiteral("Do not sign a long-term care agreement or assume a service day will count toward the elimination period until the carrier’s counting method and provider rules have been confirmed.",
      "Before scheduling covered care, confirm carrier eligibility, provider standards, notice deadlines and any applicable elimination-period rules.");
    replaceLiteral("The policy appears capable of providing meaningful support.",
      "The policy may provide meaningful support if coverage and eligibility are confirmed.");
  }
  if(pageNumber===17){
    replaceLiteral("These final moves convert the verified claim requirements",
      "These final moves address the policy-specific claim requirements");
    replaceLiteral("an approved care arrangement","a carrier-verified care arrangement");
  }
  if(pageNumber===14){
    const targets=["s1-1","s1-4","s2-1","s2-12","s2-13","s2-17","s3-1","s3-4"];
    const checks=root.querySelectorAll("ul.checklist input[type='checkbox']");
    checks.forEach((input,i)=>{
      (input as HTMLInputElement).checked=!!m.tasks.find(t=>t.id===targets[i])?.completed;
      changes++;
    });
  }

  // Scrub source document's unverified sample assertions. These are strictly
  // demo assumptions, not actual policy facts.
  replaceAny([
    "A 90-day elimination period creates a $22,500 planning obligation.",
    "90-day elimination-period estimate",
    "At $250 per day, 90 days creates a $22,500 planning obligation.",
  ],"Elimination-period expense requires the confirmed care and policy schedule.");
  replaceLiteral("The benefit grows by 3% on the prior year’s amount.",
    "Benefit growth depends on the rider actually written into this policy.");
  replaceLiteral("The projected daily benefit rises to Not verified in Year 2 and Not verified in Year 3.",
    "Verify benefit growth with the insurer before projecting future amounts.");
  replaceLiteral("Insurance supports Not calculated of Not calculated in care costs.",
    "Reimbursement requires an approved and verified care model.");
  // Keep the original HTML structure as the styling authority, but never
  // claim that the sample financial estimates are verified.
  const text=(root.textContent||"").replace(/\s+/g," ");
  const bad=["Margaret Anne Johnson","Genworth Life Insurance Company","LTC-2019-445821",
    "Prepared for: Sample","(800) 555-0123","(864) 555-0142","July 20, 2026",
    "$4,460","$22,500","$259,547","$91,250","$162,738"];
  const unresolvedExamples=bad.filter(x=>text.includes(x) &&
    ![m.person.fullName,m.policy.carrierName,m.policy.policyNumber].includes(x));
  return {pageNumber,changes,unresolvedExamples,removedSourceScripts:document.querySelectorAll("script").length===0};
}
