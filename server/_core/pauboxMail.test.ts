import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { sendPauboxMail } from "./pauboxMail";
import { sendEmail } from "./email";

const cfg = () => ({
  PAUBOX_API_KEY: "SYNTHETIC-PAUBOX-KEY-NEVER-REAL",
  PAUBOX_SENDER_EMAIL: "daniel@scvisitingangels.com",
});
const file = Buffer.from("%PDF-1.7\\nSynthetic testing document", "utf8");
const options = {
  to: ["synthetic-recipient@example.test"],
  bcc: ["daniel@scvisitingangels.com"],
  subject: "Your LTC Strategy - LTC-123456ABCDEF",
  html: "<p>Same PDF attached. Support reference LTC-123456ABCDEF.</p>",
  attachments: [{ filename: "Visiting-Angels-LTC-Strategy.pdf",
    content: file, contentType: "application/pdf" }],
};
const accepted = () => new Response(JSON.stringify({
  sourceTrackingId: "synthetic-source-tracking-id",
  data: "Service OK",
}), { status: 200, headers: { "Content-Type": "application/json" } });
beforeEach(() => vi.clearAllMocks());
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Paubox secure LTC email delivery", () => {
  it("uses current documented REST endpoint and Bearer token, identical PDF bytes and hidden BCC", async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(accepted());
    vi.stubGlobal("fetch", fetchSpy);
    const receipt = await sendPauboxMail(options, cfg());
    expect(receipt).toEqual({ success: true, status: "accepted",
      messageId: "synthetic-source-tracking-id" });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, args] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.paubox.com/v1/email/messages");
    expect(args.method).toBe("POST");
    expect(args.headers.Authorization).toBe("Bearer SYNTHETIC-PAUBOX-KEY-NEVER-REAL");
    expect(args.headers["Content-Type"]).toBe("application/json");
    const request = JSON.parse(args.body).data.message;
    expect(request.recipients).toEqual(["synthetic-recipient@example.test"]);
    expect(request.bcc).toEqual(["daniel@scvisitingangels.com"]);
    expect(request.headers.from).toBe("daniel@scvisitingangels.com");
    expect(request.headers.subject).toContain("LTC-123456ABCDEF");
    expect(request.content["text/html"]).toContain("Same PDF");
    expect(request.allowNonTLS).toBeUndefined();
    expect(Buffer.from(request.attachments[0].content, "base64")).toEqual(file);
    expect(request.attachments[0].fileName).toBe("Visiting-Angels-LTC-Strategy.pdf");
    expect(request.attachments[0].contentType).toBe("application/pdf");
    expect(args.body).not.toContain("SYNTHETIC-PAUBOX-KEY-NEVER-REAL");
  });
  it("does not send when API credentials are absent or placeholder", async () => {
    const fetchSpy = vi.fn(); vi.stubGlobal("fetch", fetchSpy);
    for (const env of [{}, {PAUBOX_API_KEY:"REPLACE_ME",
      PAUBOX_SENDER_EMAIL:"daniel@scvisitingangels.com"}]) {
      await expect(sendPauboxMail(options, env)).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("rejects invalid recipients without contacting the provider", async () => {
    const fetchSpy = vi.fn(); vi.stubGlobal("fetch", fetchSpy);
    await expect(sendPauboxMail({ ...options, to:["not-an-email"] }, cfg()))
      .rejects.toMatchObject({code:"BAD_REQUEST"});
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("refuses file-system attachment paths and retains no upload side effects", async () => {
    const fetchSpy = vi.fn(); vi.stubGlobal("fetch", fetchSpy);
    await expect(sendPauboxMail({ ...options,
      attachments:[{filename:"private.pdf",path:"C:\\private\\client.pdf"}],
    },cfg())).rejects.toMatchObject({code:"BAD_REQUEST"});
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("rejects oversized attachments instead of omitting the file", async () => {
    const fetchSpy = vi.fn(); vi.stubGlobal("fetch", fetchSpy);
    await expect(sendPauboxMail({ ...options,
      attachments:[{filename:"oversize.pdf",content:Buffer.alloc(45*1024*1024+1)}],
    },cfg())).rejects.toMatchObject({code:"PRECONDITION_FAILED"});
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("does not claim acceptance on unauthorized, invalid, or unexpected status", async () => {
    for (const status of [400,401,403,422,429,500,202]) {
      const fetchSpy = vi.fn().mockResolvedValueOnce(new Response(
        "PROVIDER-PRIVATE-ERROR-DO-NOT-ECHO", {status}));
      vi.stubGlobal("fetch",fetchSpy);
      await expect(sendPauboxMail(options,cfg())).rejects.toMatchObject({
        code: status===401||status===403?"PRECONDITION_FAILED":"BAD_GATEWAY",
      });
    }
  });
  it("requires valid sourceTrackingId even after an HTTP 200", async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({data:"Service OK"}), {status:200}));
    vi.stubGlobal("fetch",fetchSpy);
    await expect(sendPauboxMail(options,cfg())).rejects.toMatchObject({
      code:"BAD_GATEWAY",
    });
  });
  it("handles network timeout without leaking tokens or falsely reporting success", async () => {
    const fetchSpy = vi.fn().mockRejectedValueOnce(new Error("PRIVATE-NETWORK-ERROR"));
    vi.stubGlobal("fetch",fetchSpy);
    await expect(sendPauboxMail(options,cfg())).rejects.toMatchObject({
      code:"BAD_GATEWAY",
    });
  });
  it("routes website email through Paubox when enabled even if SMTP and Graph are configured",async()=>{
    vi.stubEnv("LTC_MAIL_TRANSPORT","paubox");
    vi.stubEnv("PAUBOX_API_KEY",cfg().PAUBOX_API_KEY);
    vi.stubEnv("PAUBOX_SENDER_EMAIL",cfg().PAUBOX_SENDER_EMAIL);
    vi.stubEnv("SMTP_HOST","smtp.office365.com");
    vi.stubEnv("MS365_CLIENT_ID","synthetic-id");
    const fetchSpy=vi.fn().mockResolvedValueOnce(accepted());
    vi.stubGlobal("fetch",fetchSpy);
    expect(await sendEmail(options)).toMatchObject({success:true,status:"accepted"});
    expect(fetchSpy.mock.calls[0][0]).toBe("https://api.paubox.com/v1/email/messages");
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
  it("preserves distinct user and office recipients when To equals BCC",async()=>{
    const fetchSpy=vi.fn().mockResolvedValueOnce(accepted());
    vi.stubGlobal("fetch",fetchSpy);
    await sendPauboxMail({...options,to:"daniel@scvisitingangels.com"},cfg());
    const request=JSON.parse(fetchSpy.mock.calls[0][1].body).data.message;
    expect(request.recipients).toEqual(["daniel@scvisitingangels.com"]);
    expect(request.bcc).toEqual(["daniel@scvisitingangels.com"]);
  });
});
