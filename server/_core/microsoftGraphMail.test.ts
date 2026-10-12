import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {sendMicrosoftGraphMail} from "./microsoftGraphMail";
import {sendEmail} from "./email";

let n=0;
const base=()=>{
  const unique=String(++n).padStart(12,"0");
  return {
    ...process.env,
    MS365_TENANT_ID:"11111111-1111-4111-8111-111111111111",
    MS365_CLIENT_ID:"22222222-2222-4222-8222-"+unique,
    MS365_CLIENT_SECRET:"SYNTHETIC-PRIVATE-TEST-SECRET",
    MS365_SENDER_EMAIL:"daniel@scvisitingangels.com",
  } as NodeJS.ProcessEnv;
};
const mail={
  to:["visitor@example.test"],
  bcc:["daniel@scvisitingangels.com"],
  subject:"LTC strategy – LTC-ABCDEF123456",
  html:"<p>Attached confidential educational strategy</p>",
  attachments:[{
    filename:"Visiting-Angels-LTC-Strategy-LTC-ABCDEF123456.pdf",
    content:Buffer.from("%PDF-1.7 synthetic file only"),
    contentType:"application/pdf",
  }],
};
const okToken=()=>new Response(JSON.stringify({
  token_type:"Bearer",access_token:"synthetic-access-token-long-enough-for-test",expires_in:3600,
}),{status:200,headers:{"Content-Type":"application/json"}});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
beforeEach(()=>vi.clearAllMocks());

describe("GoDaddy-hosted Microsoft 365 OAuth/Graph outbound email",()=>{
  it("encodes original PDF bytes, BCC, HTML and sender in one Graph sendMail call",async()=>{
    const f=vi.fn().mockResolvedValueOnce(okToken()).mockResolvedValueOnce(new Response(null,{status:202}));
    vi.stubGlobal("fetch",f);
    const answer=await sendMicrosoftGraphMail(mail,base());
    expect(answer).toMatchObject({success:true,status:"accepted"});
    expect(f).toHaveBeenCalledTimes(2);
    expect(f.mock.calls[0][0]).toMatch(/^https:\/\/login\.microsoftonline\.com\/11111111-1111-4111-8111-111111111111\/oauth2\/v2\.0\/token$/);
    expect(f.mock.calls[0][1].body).toContain("grant_type=client_credentials");
    expect(f.mock.calls[0][1].body).toContain("https%3A%2F%2Fgraph.microsoft.com%2F.default");
    expect(f.mock.calls[1][0]).toBe("https://graph.microsoft.com/v1.0/users/daniel%40scvisitingangels.com/sendMail");
    expect(f.mock.calls[1][1].headers.Authorization).toBe("Bearer synthetic-access-token-long-enough-for-test");
    const json=JSON.parse(f.mock.calls[1][1].body);
    expect(json.message.toRecipients).toEqual([{emailAddress:{address:"visitor@example.test"}}]);
    expect(json.message.bccRecipients).toEqual([{emailAddress:{address:"daniel@scvisitingangels.com"}}]);
    expect(json.message.subject).toBe(mail.subject);
    expect(json.message.body).toEqual({contentType:"HTML",content:mail.html});
    expect(Buffer.from(json.message.attachments[0].contentBytes,"base64")).toEqual(mail.attachments[0].content);
    expect(json.saveToSentItems).toBe(true);
    expect(f.mock.calls[1][1].body).not.toContain("SYNTHETIC-PRIVATE-TEST-SECRET");
  });
  it("keeps the access token cached for a second message within its lifetime",async()=>{
    const f=vi.fn().mockResolvedValueOnce(okToken())
      .mockResolvedValueOnce(new Response(null,{status:202}))
      .mockResolvedValueOnce(new Response(null,{status:202}));
    vi.stubGlobal("fetch",f);
    const env=base();
    await sendMicrosoftGraphMail(mail,env);
    await sendMicrosoftGraphMail({...mail,subject:"A second safe test"},env);
    expect(f).toHaveBeenCalledTimes(3);
    expect(f.mock.calls[2][0]).toContain("/sendMail");
  });
  it("refuses to send when tenant authentication is missing",async()=>{
    const f=vi.fn();vi.stubGlobal("fetch",f);
    await expect(sendMicrosoftGraphMail(mail,{}))
      .rejects.toMatchObject({code:"PRECONDITION_FAILED"});
    expect(f).not.toHaveBeenCalled();
  });
  it("rejects a PDF exceeding direct Graph attachment limits before sending",async()=>{
    const f=vi.fn();vi.stubGlobal("fetch",f);
    await expect(sendMicrosoftGraphMail({
      ...mail,attachments:[{...mail.attachments[0],content:Buffer.alloc(3*1024*1024+1)}],
    },base())).rejects.toMatchObject({code:"PRECONDITION_FAILED"});
    expect(f).not.toHaveBeenCalled();
  });
  it("does not claim successful delivery on Graph 403 or 500",async()=>{
    for(const status of [403,500]){
      const f=vi.fn().mockResolvedValueOnce(okToken()).mockResolvedValueOnce(new Response("private diagnostic",{status}));
      vi.stubGlobal("fetch",f);
      await expect(sendMicrosoftGraphMail(mail,base())).rejects.toMatchObject({code:"BAD_GATEWAY"});
    }
  });
  it("fails closed instead of downgrading to SMTP when the configured transport is misspelled",async()=>{
    vi.stubEnv("LTC_MAIL_TRANSPORT","grap");
    vi.stubEnv("SMTP_HOST","smtp.office365.com");
    vi.stubEnv("SMTP_FROM","daniel@scvisitingangels.com");
    const f=vi.fn();vi.stubGlobal("fetch",f);
    await expect(sendEmail(mail)).rejects.toMatchObject({code:"PRECONDITION_FAILED"});
    expect(f).not.toHaveBeenCalled();
  });
  it("uses Graph rather than password SMTP in explicitly configured portal mode",async()=>{
    const env=base();
    for(const [key,value] of Object.entries(env))if(key.startsWith("MS365_"))vi.stubEnv(key,value);
    vi.stubEnv("LTC_MAIL_TRANSPORT","graph");
    vi.stubEnv("SMTP_HOST","");
    const f=vi.fn().mockResolvedValueOnce(okToken()).mockResolvedValueOnce(new Response(null,{status:202}));
    vi.stubGlobal("fetch",f);
    expect(await sendEmail(mail)).toMatchObject({success:true,status:"accepted"});
    expect(f.mock.calls[1][0]).toContain("graph.microsoft.com");
  });
});
