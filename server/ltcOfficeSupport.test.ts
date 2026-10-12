import {beforeEach,describe,expect,it,vi} from "vitest";
import * as mail from "./_core/email";
import {
  buildLtcSupportSummary,ltcOfficeCopiesEnabled,sendLtcOfficeSupportCopy,
} from "./ltcOfficeSupport";
vi.mock("./_core/email",async importOriginal=>({
  ...await importOriginal<typeof import("./_core/email")>(),sendEmail:vi.fn(),
}));
beforeEach(()=>{
  vi.clearAllMocks();
  vi.mocked(mail.sendEmail).mockResolvedValue({success:true,status:"accepted",messageId:"synthetic"});
});
const policy={
  carrierName:"Fictional LTC Carrier",carrierPhone:"(800) 555-8800",
  dailyMaximum:"250",lifetimeMaximum:"250000",eliminationPeriod:"90",
  minAdlsRequired:"2",qualifyingAdls:["Dressing","Bathing"],
  diagnosisCheckboxes:["Dementia"],careNeeds:["NoneADL"],
  additionalNotes:"PRIVATE-NOTES-NEVER-EMAIL",
  diagnosisNotes:"PRIVATE-DIAGNOSIS-FREE-TEXT",
  howToSubmitClaimsPacket:"Please call Jane Smith at 864-555-0177",
  insuredFullName:"PRIVATE-HIDDEN-NAME",
  policyNumber:"SYNTHETIC-PRIVATE-POLICY",
};
describe("Visiting Angels support-copy delivery",()=>{
  it("summarizes structured selections but excludes private identifiers and notes",()=>{
    const html=buildLtcSupportSummary(policy);
    expect(html).toContain("Dementia");
    expect(html).toContain("Fictional LTC Carrier");
    expect(html).toContain("NoneADL");
    for(const sensitive of ["PRIVATE-NOTES-NEVER-EMAIL","PRIVATE-DIAGNOSIS-FREE-TEXT",
      "PRIVATE-HIDDEN-NAME","SYNTHETIC-PRIVATE-POLICY","Jane Smith"]){
      expect(html).not.toContain(sensitive);
    }
  });
  it("emails the displayed strategy, checklist and structured answers with the matching reference",async()=>{
    const status=await sendLtcOfficeSupportCopy({
      reference:"LTC-123456ABCDEF",source:"strategy_generated",
      policy,stageTasks:["Check cognitive impairment pathway","File paperwork"],
      strategyHtml:"<p>Review your care benefits and claim triggers</p>",
    });
    expect(status).toBe("accepted");
    expect(mail.sendEmail).toHaveBeenCalledOnce();
    const [outbound]=vi.mocked(mail.sendEmail).mock.calls[0];
    expect(outbound.to).toBe("daniel@scvisitingangels.com");
    expect(outbound.subject).toContain("LTC-123456ABCDEF");
    expect(outbound.html).toContain("Review your care benefits");
    expect(outbound.html).toContain("Check cognitive impairment pathway");
    expect(outbound.html).toContain("Dementia");
    expect(outbound.html).not.toContain("PRIVATE-NOTES-NEVER-EMAIL");
  });
  it("emails the identical PDF bytes to the office when visitor downloads",async()=>{
    const pdf=Buffer.from("%PDF-1.7 SYNTHETIC identical bytes");
    const status=await sendLtcOfficeSupportCopy({
      reference:"LTC-123456ABCDEF",source:"pdf_downloaded",policy,pdfBuffer:pdf,
    });
    expect(status).toBe("accepted");
    const [outbound]=vi.mocked(mail.sendEmail).mock.calls[0];
    expect(outbound.attachments?.[0].content).toEqual(pdf);
    expect(outbound.attachments?.[0].filename).toContain("LTC-123456ABCDEF");
  });
  it("does not block the visitor if the office mail service is unavailable",async()=>{
    vi.mocked(mail.sendEmail).mockRejectedValueOnce(new Error("SMTP unavailable"));
    expect(await sendLtcOfficeSupportCopy({
      reference:"LTC-123456ABCDEF",source:"pdf_downloaded",pdfBuffer:Buffer.from("%PDF"),
    })).toBe("unavailable");
  });
  it("supports explicit maintenance disable without silently claiming delivery",async()=>{
    const saved=process.env.LTC_SUPPORT_COPY_ENABLED;
    try{
      process.env.LTC_SUPPORT_COPY_ENABLED="false";
      expect(ltcOfficeCopiesEnabled()).toBe(false);
      expect(await sendLtcOfficeSupportCopy({
        reference:"LTC-123456ABCDEF",source:"strategy_generated",policy,
      })).toBe("disabled");
      expect(mail.sendEmail).not.toHaveBeenCalled();
    }finally{
      if(saved===undefined)delete process.env.LTC_SUPPORT_COPY_ENABLED;
      else process.env.LTC_SUPPORT_COPY_ENABLED=saved;
    }
  });
});
