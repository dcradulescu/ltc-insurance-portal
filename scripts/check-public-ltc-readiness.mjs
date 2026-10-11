/**
 * Local-only LTC public deployment configuration check.
 * Never prints secrets, personal data, or supplied private file contents.
 * This is a technical preflight, not a HIPAA or operational certification.
 *
 * Run: node scripts/check-public-ltc-readiness.mjs
 */
import "dotenv/config";
import {existsSync} from "node:fs";
import {resolve} from "node:path";

const env=process.env;
const production=env.NODE_ENV==="production";
const checks=[];
function check(id,ready,description){
  checks.push({id,status:ready?"configured":"action_required",description});
}
function present(key){return typeof env[key]==="string" && env[key].trim().length>0;}
check("strategy_and_chat_ai",present("OPENAI_API_KEY")&&present("OPENAI_MODEL"),
  "Configure OPENAI_API_KEY and OPENAI_MODEL for Strategy and Support Chat");
check("smtp_attachment_delivery",present("SMTP_HOST")&&present("SMTP_FROM"),
  "Configure SMTP_HOST and SMTP_FROM for secure PDF attachment delivery");
check("smtp_auth_pair",present("SMTP_USER")===present("SMTP_PASS"),
  "SMTP_USER and SMTP_PASS must either both be set or both intentionally omitted");
check("public_https",!production || /^https:\/\//.test(env.APP_PUBLIC_URL||""),
  "Production APP_PUBLIC_URL must be an HTTPS URL");
const chrome=env.CANONICAL_REPORT_CHROMIUM_PATH || env.CHROMIUM_EXECUTABLE_PATH ||
  (process.platform==="win32"?"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe":"/usr/bin/chromium");
check("canonical_pdf_browser",existsSync(chrome),
  "A Chrome/Chromium executable must be available to render the 18-page approved PDF");
check("canonical_pdf_lock",existsSync(resolve("report-templates","ltc-original-18.lock.json")),
  "The 18-page original report approval lock must be present");
const bccOn=env.LTC_TEST_BCC_ENABLED==="true" ||
  (!production && env.LTC_TEST_BCC_ENABLED!=="false");
const report={
  scope:"LTC Portal public branch only",
  production,
  technicalPreflightPassed:checks.every(x=>x.status==="configured"),
  checks,
  testingBcc:{enabled:bccOn,addressWhenEnabled:bccOn?"daniel@scvisitingangels.com":null,
    note:bccOn?"Explicit sender disclosure is required; disable after testing":
      "Enable LTC_TEST_BCC_ENABLED=true when performing the approved BCC delivery test"},
  manualBeforeLaunch:[
    "Test one controlled, real SMTP delivery and verify recipient plus BCC receipt; SMTP acceptance alone is insufficient",
    "Have legal/privacy counsel evaluate HIPAA applicability, business associate agreements and AI/email provider retention",
    "Verify privacy terms, transport security, accessibility, logging, DNS, backups and incident response",
    "Test real Chrome and Edge flows plus accessible mobile behavior; test Safari/Firefox where supported",
    "Review legacy database and Zapier retirement separately; preserve originals until explicitly authorized",
    "Obtain explicit production deployment approval; keep rollback checkpoint untouched",
  ],
};
console.log(JSON.stringify(report,null,2));
if(!report.technicalPreflightPassed) process.exitCode=1;
