import test from "node:test";
import assert from "node:assert/strict";
import {reviewConfiguration} from "./configuration-readiness.mjs";

const ready=()=>({
  NODE_ENV:"production",
  JWT_SECRET:"a".repeat(64),
  APP_ID:"ltc-insurance-portal",
  APP_PUBLIC_URL:"https://ltc.scvisitingangels.com",
  PORT:"3000",
  DATABASE_URL:"mysql://portal:synthetic-password@db.scvisitingangels.com/ltc_qa",
  S3_BUCKET:"ltc-portal-test",
  S3_REGION:"us-east-1",
  OPENAI_API_KEY:"synthetic-openai-key",
  OPENAI_MODEL:"synthetic-ai-model",
  NOTIFY_OWNER_EMAIL:"daniel@scvisitingangels.com",
  LTC_SUPPORT_EMAIL:"daniel@scvisitingangels.com",
  LTC_SUPPORT_COPY_ENABLED:"true",
  LTC_MAIL_TRANSPORT:"graph",
  MS365_TENANT_ID:"11111111-1111-4111-8111-111111111111",
  MS365_CLIENT_ID:"22222222-2222-4222-8222-222222222222",
  MS365_CLIENT_SECRET:"synthetic-graph-client-secret",
  MS365_SENDER_EMAIL:"daniel@scvisitingangels.com",
});
test("Graph configuration does not incorrectly require SMTP user/password",()=>{
  const result=reviewConfiguration(ready());
  assert.equal(result.configurationValid,true,JSON.stringify(result.issues));
  assert.equal(result.deploymentReady,false);
  assert.equal(result.liveChecksPerformed,false);
  assert(!result.issues.some(x=>x.key==="SMTP_HOST"));
});
test("Graph refuses missing tenant, client, secret and sender",()=>{
  for(const key of ["MS365_TENANT_ID","MS365_CLIENT_ID","MS365_CLIENT_SECRET","MS365_SENDER_EMAIL"]){
    const data=ready();
    delete data[key];
    const result=reviewConfiguration(data);
    assert.equal(result.configurationValid,false,"Missing "+key+" should block");
    assert(result.issues.some(x=>x.key===key),"Expected issue for "+key);
  }
});
test("Graph refuses malformed app IDs and sender email",()=>{
  for(const [key,value] of [["MS365_TENANT_ID","not-uuid"],["MS365_CLIENT_ID","not-uuid"],["MS365_SENDER_EMAIL","not-an-address"]]){
    const data=ready(); data[key]=value;
    const result=reviewConfiguration(data);
    assert.equal(result.configurationValid,false);
    assert(result.issues.some(x=>x.key===key));
  }
});
test("Legacy SMTP mode remains configurable and rejects missing server host",()=>{
  const data=ready();
  data.LTC_MAIL_TRANSPORT="smtp";
  const invalid=reviewConfiguration(data);
  assert.equal(invalid.configurationValid,false);
  assert(invalid.issues.some(x=>x.key==="SMTP_HOST"));
  data.SMTP_HOST="smtp.office365.com";
  data.SMTP_FROM="daniel@scvisitingangels.com";
  assert.equal(reviewConfiguration(data).configurationValid,true);
});
