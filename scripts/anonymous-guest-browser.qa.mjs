/**
 * Synthetic end-to-end guest workflow smoke. No AI, SMTP or third-party requests
 * are sent: explicit tRPC mocks exercise the original page layout and state.
 * Run from project root: BASE_URL=http://127.0.0.1:5195 node scripts/anonymous-guest-browser.qa.mjs
 */
import {chromium} from "playwright-core";
import {mkdirSync} from "node:fs";
import {join,resolve} from "node:path";
const base=process.env.BASE_URL || "http://127.0.0.1:5195";
const chrome=process.env.CHROME_PATH || (process.platform==="win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "/usr/bin/chromium");
const browser=await chromium.launch({executablePath:chrome,headless:true});
const apiCalls=[],javascriptErrors=[];
const syntheticSecret="PRIVATE-NOTES-MUST-STAY-ON-DEVICE";
function ensure(value,message){if(!value)throw new Error(message);}
function response(obj,batch=false){
  const result={result:{data:{json:obj}}};
  return JSON.stringify(batch?[result]:result);
}
const screenshotsDir=resolve(process.env.LTC_QA_DIR || join(process.cwd(),"qa-screenshots"));
mkdirSync(screenshotsDir,{recursive:true});
function screenshotName(label){return join(screenshotsDir,label+".png");}
async function mockPublicApi(page) {
  await page.route(/\/api\/trpc\/publicLtc\./,async route=>{
    const request=route.request();
    const name=new URL(request.url()).pathname.split("/").at(-1).split("?")[0];
    const body=request.postData() || "";
    apiCalls.push({name,body});
    let value;
    if(name==="publicLtc.mailConfig")value={testingBccEnabled:true,testingBccAddress:"daniel@scvisitingangels.com"};
    else if(name==="publicLtc.generateStrategy")value={
      content:"<p>Step 1: Review the carrier benefits and cognitive impairment requirements.</p>",
      stage1Tasks:[{id:"s1-1",label:"Confirm carrier requirements",category:"carrier-contact",completed:false}],
      stage2Tasks:[{id:"s2-1",label:"Prepare claim paperwork",category:"claim-packet",completed:false}],
      stage3Tasks:[{id:"s3-1",label:"Track reimbursements",category:"ongoing",completed:false}],
    };
    else if(name==="publicLtc.generatePdf")value={success:true,pageCount:18,pdfBase64:Buffer.from("%PDF-1.4\n%Synthetic browser smoke\n").toString("base64")};
    else if(name==="publicLtc.emailPdf")value={success:true,status:"accepted",message:"Synthetic SMTP accepted. Inbox not confirmed."};
    else if(name==="publicLtc.chat")value={content:"Cognitive impairment may be an LTC benefit trigger; verify the policy's substantial supervision requirement."};
    else return route.continue();
    const isBatch=new URL(request.url()).searchParams.get("batch")==="1";
    await route.fulfill({status:200,contentType:"application/json",body:response(value,isBatch)});
  });
}
try{
  const context=await browser.newContext({viewport:{width:1365,height:900},acceptDownloads:true});
  await context.addInitScript(()=>localStorage.setItem("ltc_terms_accepted_v1","true"));
  const page=await context.newPage();
  page.on("pageerror",e=>javascriptErrors.push(String(e)));
  await mockPublicApi(page);
  const next=()=>page.getByRole("button",{name:/Next/}).last().click();

  // Education -> Policy Form: keeps original visitor flow and visual brand.
  await page.goto(base+"/education",{waitUntil:"networkidle"});
  ensure((await page.title()).length>0,"Education page missing title");
  await page.goto(base+"/policy-form",{waitUntil:"networkidle"});
  await page.getByText("About Your",{exact:false}).first().waitFor();
  ensure(await page.locator("#insuredEmail").count()===0,"Identity field still present");
  await next();
  await page.locator("#carrierName").fill("Fictional LTC Carrier");
  await page.locator("#carrierPhone").fill("(800) 555-9000");
  await next();
  await page.locator("#whereToGetClaimsPacket").fill("Call the carrier for instructions");
  await next();
  await page.locator("#dailyMaximum").fill("250");
  await page.locator("#lifetimeMaximum").fill("250000");
  await page.locator("#eliminationPeriod").fill("90");
  const selectors=page.getByRole("combobox");
  ensure(await selectors.count()>=5,"Policy coverage selectors missing");
  await selectors.nth(2).click();
  await page.getByRole("option",{name:"2",exact:true}).click();
  await next();
  await page.getByText("Alzheimer's Disease",{exact:true}).last().click();
  await page.getByText("None of these ADLs apply",{exact:true}).click();
  await page.locator("#additionalNotes").fill(syntheticSecret);
  await page.getByText("Potential Cognitive-Impairment Benefit Pathway").waitFor();
  await next();
  await page.getByText("Review & Generate",{exact:false}).first().waitFor();
  const formData=await page.evaluate(()=>JSON.parse(localStorage.getItem("ltc-public:v1:ltc_policy_form")||"null"));
  ensure(formData.waiverOfPremium==="no","Original visible no-default is not captured as a policy value");
  ensure(formData.diagnosisCheckboxes.includes("Alzheimer's Disease"),"Cognitive diagnosis not saved");
  ensure(formData.careNeeds.includes("NoneADL"),"No-ADL option not saved");
  ensure(formData.additionalNotes===syntheticSecret,"Personal notes not autosaved");
  await page.getByRole("button",{name:/Generate Strategy/}).last().click();
  await page.waitForURL("**/strategy");
  await page.getByText("Ready to Generate Your Strategy",{exact:false}).first().waitFor();
  await page.getByRole("button",{name:/Generate My Strategy/}).last().click();
  await page.getByText("Your Personalized Strategy",{exact:false}).first().waitFor();
  ensure(apiCalls.some(x=>x.name==="publicLtc.generateStrategy"),"Strategy API not called");
  const prompt=apiCalls.find(x=>x.name==="publicLtc.generateStrategy").body;
  ensure(!prompt.includes(syntheticSecret),"Personal notes were improperly transmitted to AI");
  ensure(!prompt.includes("insuredFullName"),"Insured name key transmitted to AI");
  await page.screenshot({path:screenshotName("ltc-full-strategy-desktop"),fullPage:true});

  // Cross-refresh local strategy and checklist (no account).
  await page.getByRole("button",{name:"Checklist",exact:true}).click();
  const check=page.getByRole("checkbox",{name:"Confirm carrier requirements"}).first();
  if(await check.count())await check.click();
  const before=await page.evaluate(()=>({
    strategy:localStorage.getItem("ltc-public:v1:ltc_strategy"),
    tasks:localStorage.getItem("ltc-public:v1:ltc_task_completions"),
  }));
  ensure(before.strategy?.includes("Confirm carrier requirements"),"Strategy not saved locally");
  await page.reload({waitUntil:"networkidle"});
  await page.getByText("Your Personalized Strategy",{exact:false}).first().waitFor();
  ensure(!page.url().includes("/login"),"Returning to Strategy requires account");

  // Original calculator remains on Strategy page; draft persists without changes to formulas.
  await page.getByRole("button",{name:"Financial",exact:true}).click();
  await page.locator("#care-hourlyRate").fill("38");
  const savedDraft=await page.evaluate(()=>localStorage.getItem("ltc-public:v1:ltc_care_scenario_draft"));
  ensure(savedDraft?.includes('"hourlyRate":"38"'),"Financial calculator draft not saved");
  await page.reload({waitUntil:"networkidle"});
  await page.getByRole("button",{name:"Financial",exact:true}).click();
  ensure(await page.locator("#care-hourlyRate").inputValue()==="38","Calculator draft not restored");
  await page.screenshot({path:screenshotName("ltc-full-strategy-calculator"),fullPage:true});

  // Canonical report UI, mail service and BCC disclosure. No real email sent.
  await page.getByRole("button",{name:"Downloads",exact:true}).click();
  await page.getByText("Download or Share Your Strategy",{exact:false}).first().waitFor();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button",{name:"Download Your Strategy PDF"}).click(),
  ]);
  ensure(download.suggestedFilename().endsWith(".pdf"),"PDF download did not yield a named file");
  const pdfCall=apiCalls.find(c=>c.name==="publicLtc.generatePdf");
  ensure(Boolean(pdfCall),"Canonical PDF endpoint was not used for download");
  ensure(!pdfCall.body.includes(syntheticSecret),"Private notes included in PDF request");
  await page.getByRole("button",{name:"Email to Someone"}).click();
  await page.getByText("daniel@scvisitingangels.com",{exact:false}).first().waitFor();
  const emailInputs=page.locator('input[type="email"]');
  await emailInputs.last().fill("synthetic-recipient@example.test");
  await page.getByText(/I understand this report will be emailed to the recipient/i).click();
  await page.getByRole("button",{name:/Send Strategy PDF by Email/}).click();
  await page.getByText("Synthetic SMTP accepted",{exact:false}).first().waitFor();
  const outgoing=apiCalls.find(c=>c.name==="publicLtc.emailPdf");
  ensure(Boolean(outgoing),"Email API not invoked");
  ensure(outgoing.body.includes("synthetic-recipient@example.test"),"Recipient not transmitted");
  ensure(!outgoing.body.includes(syntheticSecret),"Notes were transmitted in email PDF request");
  ensure(!outgoing.body.includes("PRIVATE-POLICY"),"Sensitive policy number was transmitted");

  // Floating chat suggested prompts must send first click, no stale React state.
  await page.getByRole("button",{name:"Open LTC support chat"}).click();
  await page.getByRole("button",{name:"What ADLs qualify for benefits?"}).click();
  await page.getByText(/Cognitive impairment may be an LTC benefit trigger/i).first().waitFor();
  ensure(apiCalls.some(c=>c.name==="publicLtc.chat"),"Suggested chat prompt not sent");

  await page.goto(base+"/contact",{waitUntil:"networkidle"});
  ensure(await page.locator("#email").count()===1,"Contact Us email missing");

  // Touch/mobile and tablet render without horizontal overflow, no layout redesign.
  for(const [name,width,height] of [["mobile",390,844],["tablet",820,1180]]){
    const c=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:name==="mobile"});
    await c.addInitScript(()=>localStorage.setItem("ltc_terms_accepted_v1","true"));
    const p=await c.newPage();p.on("pageerror",e=>javascriptErrors.push(name+": "+String(e)));
    await mockPublicApi(p);
    for(const route of ["/policy-form","/contact"]){
      await p.goto(base+route,{waitUntil:"networkidle"});
      const dims=await p.evaluate(()=>({w:document.documentElement.scrollWidth,v:innerWidth}));
      ensure(dims.w<=dims.v+3,name+" horizontal overflow "+route+": "+JSON.stringify(dims));
    }
    await p.screenshot({path:screenshotName("ltc-full-contact-"+name),fullPage:true});
    await c.close();
  }
  // Deleting local data must not be undone by the browser's pagehide autosave.
  await page.goto(base+"/policy-form",{waitUntil:"networkidle"});
  page.once("dialog",async dialog=>dialog.accept());
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button",{name:"Clear All Data"}).click(),
  ]);
  const afterClear=await page.evaluate(()=>({
    form:JSON.parse(localStorage.getItem("ltc-public:v1:ltc_policy_form") || "null"),
    strategy:localStorage.getItem("ltc-public:v1:ltc_strategy"),
  }));
  ensure(!afterClear.form?.additionalNotes && !afterClear.form?.carrierName,
    "Clear All Data restored a sensitive draft");
  ensure(!afterClear.strategy,"Clear All Data retained the previous Strategy");
  ensure(javascriptErrors.length===0,"JS errors: "+javascriptErrors.join(" | "));
  console.log("PASS",JSON.stringify({visitedSixWizardSteps:true,cognitiveAlternative:true,
    formAutosave:true,calculatorDraftRestore:true,originalStrategyScreen:true,
    testBccAcknowledgement:true,emailMockOnly:true,supportChat:true,
    crossDeviceLayout:true,apiCalls:apiCalls.map(v=>v.name),jsErrors:javascriptErrors}));
  await context.close();
}catch(error){console.error("E2E FAIL",String(error));process.exitCode=1;}
finally{await browser.close();}
