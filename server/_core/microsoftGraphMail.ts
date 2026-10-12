/**
 * Microsoft 365 / GoDaddy-managed Microsoft 365 app-only outbound mail.
 *
 * Uses Microsoft Graph v1.0 SendMail with OAuth 2.0 client credentials.
 * Explicit environment configuration is required; never sends credentials,
 * access tokens or attachment data to logs. One access token is reused while
 * valid and only the configured mailbox is selected for sending.
 *
 * Exchange Online's Graph Mail.Send application permission requires tenant
 * admin consent. Scope it to the sending mailbox with Exchange Application
 * RBAC. See docs/field-decisions/GO-DADDY-M365-MAIL-SETUP.md.
 */
import { TRPCError } from "@trpc/server";

export type MicrosoftGraphMailOptions = {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
};

type GraphMailSettings = {
  tenantId:string;
  clientId:string;
  clientSecret:string;
  senderEmail:string;
};
type TokenCache={accessToken:string;expiresAt:number;cacheKey:string};
let cache:TokenCache|null=null;
let loadingToken:Promise<string>|null=null;
const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const isEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function settings(env:NodeJS.ProcessEnv):GraphMailSettings {
  const tenantId=env.MS365_TENANT_ID?.trim() || "";
  const clientId=env.MS365_CLIENT_ID?.trim() || "";
  const clientSecret=env.MS365_CLIENT_SECRET?.trim() || "";
  const senderEmail=env.MS365_SENDER_EMAIL?.trim() || "";
  if (!isUuid(tenantId)||!isUuid(clientId)||!clientSecret||!isEmail(senderEmail))
    throw new TRPCError({
      code:"PRECONDITION_FAILED",
      message:"Microsoft 365 mail authorization is not configured. Please contact the office.",
    });
  return {tenantId,clientId,clientSecret,senderEmail};
}

function recipientArray(value:string|string[]|undefined):Array<{emailAddress:{address:string}}> {
  const addresses=typeof value==="string"?[value]:value||[];
  if(addresses.some(x=>!isEmail(x))||addresses.length>12)throw new TRPCError({
    code:"BAD_REQUEST",message:"Invalid email recipient.",
  });
  return addresses.map(address=>({emailAddress:{address}}));
}

async function getToken(config:GraphMailSettings):Promise<string> {
  const cacheKey=config.tenantId+"|"+config.clientId;
  if(cache?.cacheKey===cacheKey && Date.now()<cache.expiresAt)return cache.accessToken;
  if(loadingToken)return loadingToken;
  loadingToken=(async()=>{
    const body=new URLSearchParams({
      client_id:config.clientId,
      client_secret:config.clientSecret,
      scope:"https://graph.microsoft.com/.default",
      grant_type:"client_credentials",
    });
    let response:Response;
    try{
      response=await fetch(
        "https://login.microsoftonline.com/"+encodeURIComponent(config.tenantId)+"/oauth2/v2.0/token",
        {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
          body:body.toString(),signal:AbortSignal.timeout(15000)},
      );
    }catch{throw new TRPCError({
      code:"BAD_GATEWAY",message:"Microsoft 365 authorization could not be reached.",
    });}
    if(!response.ok)throw new TRPCError({
      code:"PRECONDITION_FAILED",message:"Microsoft 365 app authorization was rejected. Check tenant consent and credentials.",
    });
    const token=await response.json() as {access_token?:unknown;expires_in?:unknown};
    if(typeof token.access_token!=="string"||token.access_token.length<10)
      throw new TRPCError({code:"BAD_GATEWAY",message:"Microsoft 365 did not return a usable access token."});
    const expires=typeof token.expires_in==="number"?token.expires_in:3600;
    cache={accessToken:token.access_token,cacheKey,
      expiresAt:Date.now()+Math.max(60,expires-300)*1000};
    return cache.accessToken;
  })();
  try {return await loadingToken;}finally {loadingToken=null;}
}

function graphMessage(options:MicrosoftGraphMailOptions) {
  const toRecipients=recipientArray(options.to);
  const bccRecipients=recipientArray(options.bcc);
  if(toRecipients.length===0)throw new TRPCError({code:"BAD_REQUEST",message:"At least one recipient is required."});
  const attachments=(options.attachments||[]).map(a=>{
    if(a.path || !a.content)throw new TRPCError({
      code:"BAD_REQUEST",message:"Microsoft 365 requires in-memory email attachments.",
    });
    const content=Buffer.isBuffer(a.content)?a.content:Buffer.from(a.content,"utf8");
    // Graph JSON sendMail supports small inline file attachments. Large reports
    // must use a separately engineered MIME/upload solution, never silently
    // omit the attachment or claim delivery.
    if(content.byteLength>3*1024*1024)throw new TRPCError({
      code:"PRECONDITION_FAILED",
      message:"The PDF exceeds Microsoft 365's direct attachment limit. Please download it or contact the office.",
    });
    return {
      "@odata.type":"#microsoft.graph.fileAttachment",
      name:a.filename,
      contentType:a.contentType||"application/octet-stream",
      contentBytes:content.toString("base64"),
    };
  });
  return {message:{
    subject:options.subject,
    body:{contentType:"HTML",content:options.html},
    toRecipients,bccRecipients,attachments,
  },saveToSentItems:true};
}

/** A 202 response indicates Microsoft Graph accepted processing, not inbox receipt. */
export async function sendMicrosoftGraphMail(
  options:MicrosoftGraphMailOptions,
  env:NodeJS.ProcessEnv=process.env,
):Promise<{success:true;status:"accepted";messageId?:string}>{
  const config=settings(env);
  const mail=graphMessage(options); // validate recipients, filesize before any token fetch
  const token=await getToken(config);
  let result:Response;
  try{
    result=await fetch(
      "https://graph.microsoft.com/v1.0/users/"+encodeURIComponent(config.senderEmail)+"/sendMail",
      {method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
        body:JSON.stringify(mail),signal:AbortSignal.timeout(30000)},
    );
  }catch{throw new TRPCError({
    code:"BAD_GATEWAY",message:"Microsoft 365 email submission could not be confirmed.",
  });}
  if(result.status!==202){
    if(result.status===401 || result.status===403)cache=null;
    throw new TRPCError({
      code:"BAD_GATEWAY",
      message:"Microsoft 365 did not accept the message. Verify Mail.Send consent, sender mailbox restrictions and configuration.",
    });
  }
  return {success:true,status:"accepted"};
}
