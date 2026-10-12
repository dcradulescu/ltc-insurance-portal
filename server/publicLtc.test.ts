import { beforeEach,describe,expect,it,vi } from "vitest";
import { appRouter } from "./routers";
import * as mail from "./_core/email";
import * as report from "./canonicalReportPdf";
import { invokeLLM } from "./_core/llm";
vi.mock("./_core/email",async importOriginal=>({
  ...await importOriginal<typeof import("./_core/email")>(),
  sendEmail:vi.fn(),
}));
vi.mock("./canonicalReportPdf",()=>({renderApprovedLtcReport:vi.fn()}));
vi.mock("./_core/llm",()=>({invokeLLM:vi.fn()}));
const ctx=(ip:string)=>({user:null,req:{socket:{remoteAddress:ip},headers:{}},res:{}} as any);
const sample={
  insuredName:"SYNTHETIC USER",insuredDob:"1950-01-01",insuredEmail:"private@example.test",
  insuredPhone:"555-0100",insuredAddress:"123 Private Street",policyNumber:"PRIVATE-POLICY",
  claimNumber:"PRIVATE-CLAIM",caseManagerName:"PRIVATE CASE MANAGER",
  carrierName:"Illustrative LTC Insurance",dailyMaximum:250,
  monthlyMaximum:7500,lifetimeMaximum:250000,
  eliminationPeriod:"90",adlLimitations:["Dressing"],
  stage1Tasks:[],stage2Tasks:[],stage3Tasks:[],
};
beforeEach(()=>{
  vi.clearAllMocks();
  vi.mocked(report.renderApprovedLtcReport).mockResolvedValue({
    buffer:Buffer.from("%PDF-1.7 synthetic test"),pageCount:18,
    templateId:"sc-visiting-angels-ltc-original-18-v1",
    renderingMode:"original-image-with-searchable-text-layer",reportWarnings:[],pageChanges:[],
  });
  vi.mocked(mail.sendEmail).mockResolvedValue({success:true,status:"accepted",messageId:"qa-1"});
  vi.mocked(invokeLLM).mockResolvedValue({choices:[{message:{content:"Stage 1: Contact the carrier"}}]} as any);
});
describe("anonymous LTC routes",()=>{
  it("exposes visitor-only BCC notice without an account",async()=>{
    const info=await appRouter.createCaller(ctx("203.0.113.16")).publicLtc.mailConfig();
    expect(info.supportCopyEnabled).toBe(true);
    expect(info.officeName).toBe("SC Visiting Angels");
  });
  it("rejects identifying fields sent to the strategy route",async()=>{
    await expect(appRouter.createCaller(ctx("203.0.113.17")).publicLtc.generateStrategy({
      policy:{carrierName:"Illustrative LTC Insurance",insuredFullName:"SYNTHETIC USER"},
    })).rejects.toHaveProperty("code","BAD_REQUEST");
    expect(invokeLLM).not.toHaveBeenCalled();
  });
  it("provides education and canonical three-stage checklist without database login",async()=>{
    const result=await appRouter.createCaller(ctx("203.0.113.18")).publicLtc.generateStrategy({
      policy:{carrierName:"Illustrative LTC Insurance",diagnosisCheckboxes:["Dementia"],
        careNeeds:["Dressing"],minAdlsRequired:"2",eliminationPeriod:"90"},
    });
    expect(result.stage1Tasks.length).toBeGreaterThan(0);
    expect(result.stage2Tasks.length).toBeGreaterThan(0);
    expect(result.stage3Tasks.length).toBeGreaterThan(0);
    expect(result.content).toContain("Stage 1");
    expect(result.supportCopyStatus).toBe("accepted");
    expect(result.supportReference).toMatch(/^LTC-[A-F0-9]{12}$/);
    const [office]=vi.mocked(mail.sendEmail).mock.calls[0];
    expect(office.to).toBe("daniel@scvisitingangels.com");
    expect(office.subject).toContain(result.supportReference);
    expect(office.html).toContain("Generated claim checklist");
    expect(office.html).toContain("Dementia");
  });
  it("does not transmit arbitrary claims notes or accidental identifiers to strategy AI",async()=>{
    await appRouter.createCaller(ctx("203.0.113.46")).publicLtc.generateStrategy({
      policy:{
        carrierName:"Illustrative Carrier",
        howToSubmitClaimsPacket:"Fax documents to JANE PRIVATE-PERSON at the claims office",
      },
    });
    const prompts=JSON.stringify(vi.mocked(invokeLLM).mock.calls[0][0].messages);
    expect(prompts).toContain("fax");
    expect(prompts).not.toContain("JANE PRIVATE-PERSON");
    expect(prompts).not.toContain("howToSubmitClaimsPacket");
  });
  it("renders in memory only and redacts all identifiers, no stored PDF URL",async()=>{
    const result=await appRouter.createCaller(ctx("203.0.113.19")).publicLtc.generatePdf(sample);
    expect(result.pageCount).toBe(18);
    expect(Buffer.from(result.pdfBase64,"base64").toString()).toContain("%PDF-");
    const [safe]=vi.mocked(report.renderApprovedLtcReport).mock.calls[0];
    for(const key of ["insuredName","insuredDob","insuredEmail","insuredPhone",
      "insuredAddress","policyNumber","claimNumber","caseManagerName"]){
      expect(safe[key as keyof typeof safe]).toBe("");
    }
    expect(result).not.toHaveProperty("url");
    expect(result.supportCopyStatus).toBe("accepted");
    const [office]=vi.mocked(mail.sendEmail).mock.calls[0];
    expect(office.to).toBe("daniel@scvisitingangels.com");
    expect(office.attachments?.[0].content).toEqual(Buffer.from(result.pdfBase64,"base64"));
  });
  it("SMTP sends PDF attachment to recipient with prefilled test BCC",async()=>{
    const cfg=await appRouter.createCaller(ctx("203.0.113.20")).publicLtc.mailConfig();
    const result=await appRouter.createCaller(ctx("203.0.113.21")).publicLtc.emailPdf({
      report:sample,recipients:["recipient@example.test"],acknowledgedBcc:true,
    });
    expect(result.status).toBe("accepted");
    expect(mail.sendEmail).toHaveBeenCalledOnce();
    const [sent]=vi.mocked(mail.sendEmail).mock.calls[0];
    expect(sent.to).toEqual(["recipient@example.test"]);
    if(cfg.supportCopyEnabled) expect(sent.bcc).toEqual(["daniel@scvisitingangels.com"]);
    expect(sent.html).toContain("Support reference:");
    expect(sent.html).toContain("Visiting Angels receives a copy");
    expect(sent.attachments?.[0].content).toBeInstanceOf(Buffer);
  });
  it("asks for conscious acknowledgement before sending email",async()=>{
    await expect(appRouter.createCaller(ctx("203.0.113.22")).publicLtc.emailPdf({
      report:sample,recipients:["recipient@example.test"],acknowledgedBcc:false as any,
    })).rejects.toHaveProperty("code","BAD_REQUEST");
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });
  it("supports an explicit emergency off switch for office copies",async()=>{
    const original=process.env.LTC_SUPPORT_COPY_ENABLED;
    try{
      process.env.LTC_SUPPORT_COPY_ENABLED="false";
      const cfg=await appRouter.createCaller(ctx("203.0.113.40")).publicLtc.mailConfig();
      expect(cfg.supportCopyEnabled).toBe(false);
      await appRouter.createCaller(ctx("203.0.113.41")).publicLtc.emailPdf({
        report:sample,recipients:["recipient@example.test"],acknowledgedBcc:true,
      });
      expect(vi.mocked(mail.sendEmail).mock.calls[0][0].bcc).toEqual([]);
    }finally{
      if(original===undefined)delete process.env.LTC_SUPPORT_COPY_ENABLED;
      else process.env.LTC_SUPPORT_COPY_ENABLED=original;
    }
  });
  it("limits concurrent anonymous PDF renders and releases slots after completion",async()=>{
    type PdfResponse=Awaited<ReturnType<typeof report.renderApprovedLtcReport>>;
    const canned:PdfResponse={
      buffer:Buffer.from("%PDF-1.7 synthetic concurrency test"),
      pageCount:18,templateId:"sc-visiting-angels-ltc-original-18-v1",
      renderingMode:"original-image-with-searchable-text-layer",reportWarnings:[],pageChanges:[],
    };
    const release: Array<(result:PdfResponse)=>void>=[];
    vi.mocked(report.renderApprovedLtcReport).mockImplementation(
      ()=>new Promise<PdfResponse>(resolve=>{release.push(resolve);})
    );
    const first=appRouter.createCaller(ctx("203.0.113.42")).publicLtc.generatePdf(sample);
    const second=appRouter.createCaller(ctx("203.0.113.43")).publicLtc.generatePdf(sample);
    for(let n=0;n<30&&release.length<2;n++)await Promise.resolve();
    expect(release).toHaveLength(2);
    await expect(appRouter.createCaller(ctx("203.0.113.44")).publicLtc.generatePdf(sample))
      .rejects.toHaveProperty("code","TOO_MANY_REQUESTS");
    release.forEach(resolve=>resolve(canned));
    await Promise.all([first,second]);
    vi.mocked(report.renderApprovedLtcReport).mockResolvedValue(canned);
    const after=await appRouter.createCaller(ctx("203.0.113.45")).publicLtc.generatePdf(sample);
    expect(after.pageCount).toBe(18);
  });
  it("does not persist AI chat messages or require identifying policy IDs",async()=>{
    const result=await appRouter.createCaller(ctx("203.0.113.23")).publicLtc.chat({
      message:"What counts as a cognitive impairment trigger?",history:[],
    });
    expect(result.content).toContain("Stage 1");
    expect(invokeLLM).toHaveBeenCalledOnce();
  });
});