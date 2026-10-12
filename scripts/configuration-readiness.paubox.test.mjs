import test from "node:test";
import assert from "node:assert/strict";
import { reviewConfiguration } from "./configuration-readiness.mjs";

const ready = () => ({
  NODE_ENV: "production",
  APP_ID: "ltc-insurance-portal",
  JWT_SECRET: "a".repeat(64),
  APP_PUBLIC_URL: "https://ltc.scvisitingangels.com",
  PORT: "3000",
  DATABASE_URL: "mysql://portal:synthetic-password@db.scvisitingangels.com/ltc_qa",
  S3_BUCKET: "ltc-portal-test",
  S3_REGION: "us-east-1",
  OPENAI_API_KEY: "synthetic-ai-key",
  OPENAI_MODEL: "synthetic-ai-model",
  NOTIFY_OWNER_EMAIL: "daniel@scvisitingangels.com",
  LTC_SUPPORT_EMAIL: "daniel@scvisitingangels.com",
  LTC_SUPPORT_COPY_ENABLED: "true",
  LTC_MAIL_TRANSPORT: "paubox",
  PAUBOX_API_KEY: "synthetic-only-pa ub ox-api-key".replaceAll(" ",""),
  PAUBOX_SENDER_EMAIL: "daniel@scvisitingangels.com",
});
test("Paubox-only transport does not demand Microsoft Entra or SMTP credentials",()=>{
  const result=reviewConfiguration(ready());
  assert.equal(result.configurationValid,true,JSON.stringify(result.issues));
  assert.equal(result.deploymentReady,false);
  assert.equal(result.liveChecksPerformed,false);
  assert(!result.issues.some(x=>x.key==="SMTP_HOST" || x.key==="MS365_CLIENT_ID"));
  assert(result.issues.some(x=>x.key==="Paubox" && x.severity==="warning"));
});
test("Paubox requires the server-only API key and sender email",()=>{
  for(const key of ["PAUBOX_API_KEY","PAUBOX_SENDER_EMAIL"]){
    const env=ready();
    delete env[key];
    const result=reviewConfiguration(env);
    assert.equal(result.configurationValid,false,key);
    assert(result.issues.some(x=>x.key===key),key);
  }
});
test("Paubox rejects placeholders and malformed sender address",()=>{
  for(const [key,value] of [["PAUBOX_API_KEY","REPLACE_ME"],
    ["PAUBOX_API_KEY","CHANGEME"],["PAUBOX_SENDER_EMAIL","not@email"]]){
    const env=ready(); env[key]=value;
    const result=reviewConfiguration(env);
    assert.equal(result.configurationValid,false,key);
  }
});
test("Explicit unknown mail transport cannot silently use a fallback",()=>{
  const result=reviewConfiguration({...ready(),LTC_MAIL_TRANSPORT:"unknown"});
  assert.equal(result.configurationValid,false);
  assert(result.issues.some(x=>x.key==="LTC_MAIL_TRANSPORT"));
});
test("Paubox credentials never appear in readiness output",()=>{
  const env=ready();
  const output=JSON.stringify(reviewConfiguration(env));
  assert(!output.includes(env.PAUBOX_API_KEY));
});
