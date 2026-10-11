import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import mysql from "mysql2/promise";
import superjson from "superjson";

// Deliberately separate from DATABASE_URL. This command never drops a database.
const databaseUrl = process.env.LTC_TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("Set LTC_TEST_DATABASE_URL to a NEW, empty, local ltc_verify_* database.");
let address;
try { address = new URL(databaseUrl); } catch { throw new Error("LTC_TEST_DATABASE_URL is not a valid MySQL URL"); }
const databaseName = decodeURIComponent(address.pathname.slice(1));
if (address.protocol !== "mysql:" || !["localhost", "127.0.0.1", "[::1]"].includes(address.hostname) || !/^ltc_verify_[a-z0-9_]+$/.test(databaseName)) {
  throw new Error("Refusing verification: use a local MySQL database named ltc_verify_*.");
}
const root = fileURLToPath(new URL("../", import.meta.url));
const checks = [];
const report = { executedAt: new Date().toISOString(), status: "running", database: databaseName, mysqlVersion: "", checks, browser: { status: "not_run", reason: "Optional Playwright module not configured" },
  limits: ["Synthetic accounts/data only", "Real S3, SMTP, AI, SMS and hosted TLS not exercised", "Existing production/legacy database not migrated"] };
let db, server, browser, activeCheck = "empty-database guard";
const passwordOne = randomBytes(24).toString("base64url");
const passwordTwo = randomBytes(24).toString("base64url");
const racePasswords = [randomBytes(24).toString("base64url"), randomBytes(24).toString("base64url")];
const changedPassword = randomBytes(24).toString("base64url");
let activePasswordOne = passwordOne;
const resetPassword = randomBytes(24).toString("base64url");
const secrets = [databaseUrl, address.password, passwordOne, passwordTwo, resetPassword, changedPassword, ...racePasswords];
const safe = value => secrets.reduce((text, secret) => secret ? text.replaceAll(secret, "[redacted]") : text, String(value));
let env;
async function check(name, fn) { activeCheck = name; await fn(); checks.push({ name, status: "passed" }); console.log(`PASS ${name}`); }
function command(args, input = "", expectFailure = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] });
    let output = ""; const timer = setTimeout(() => child.kill("SIGKILL"), 30000);
    child.stdout.on("data", chunk => output += chunk); child.stderr.on("data", chunk => output += chunk);
    child.on("error", reject); child.on("close", code => {
      clearTimeout(timer);
      if ((code === 0) === !expectFailure) resolve(output);
      else reject(new Error(`Command ${args[0]} returned ${code}: ${safe(output).slice(0, 1500)}`));
    });
    child.stdin.end(input);
  });
}
async function freePort() {
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve)); return port;
}
async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const child = server;
  await new Promise(resolve => { const timer = setTimeout(() => child.kill("SIGKILL"), 5000); child.once("close", () => { clearTimeout(timer); resolve(); }); child.kill("SIGTERM"); });
  server = null;
}
async function startServer() {
  server = spawn(process.execPath, ["dist/index.js"], { cwd: root, env, stdio: "ignore" });
  for (let i = 0; i < 150; i++) {
    if (server.exitCode !== null) throw new Error("Application process exited before becoming ready");
    try { const response = await fetch(env.APP_PUBLIC_URL + "/healthz", { signal: AbortSignal.timeout(1000) }); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Application did not become ready");
}
async function request(procedure, input, cookie = "", mutation = false) {
  const encoded = superjson.serialize(input);
  const url = env.APP_PUBLIC_URL + "/api/trpc/" + procedure + (mutation ? "" : "?input=" + encodeURIComponent(JSON.stringify(encoded)));
  const response = await fetch(url, { method: mutation ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "x-ltc-request": "1", ...(cookie ? { cookie } : {}) },
    ...(mutation ? { body: JSON.stringify(encoded) } : {}), signal: AbortSignal.timeout(15000) });
  const text = await response.text(); let body;
  try { body = JSON.parse(text); } catch { body = null; }
  return { status: response.status, cookie: response.headers.get("set-cookie"),
    data: body?.result?.data ? superjson.deserialize(body.result.data) : undefined,
    error: body?.error?.json?.data?.code || body?.error?.data?.code, message: body?.error?.json?.message };
}
async function ok(procedure, input, cookie, mutation = false) {
  const result = await request(procedure, input, cookie, mutation);
  assert.equal(result.status, 200, `${procedure}: ${result.error || result.message || result.status}`); return result.data;
}
const sessionCookie = result => { assert.ok(result.cookie?.includes("app_session_id=")); return result.cookie.split(";")[0]; };

try {
  await fs.access(path.join(root, "dist/index.js"));
  address.searchParams.delete("timezone");
  db = await mysql.createConnection({ uri: address.toString(), timezone: "Z" });
  await db.query("SET time_zone = '+00:00'");
  const [tables] = await db.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  assert.equal(tables.length, 0, "Refusing to write: verification database is not empty");
  const [[version]] = await db.query("SELECT VERSION() AS version, @@global.time_zone AS globalTimezone, @@system_time_zone AS systemTimezone, @@session.time_zone AS verificationSessionTimezone");
  report.mysqlVersion = version.version;
  report.databaseTimezone = { global: version.globalTimezone, system: version.systemTimezone, verificationSession: version.verificationSessionTimezone };
  const port = await freePort();
  env = { ...process.env, NODE_ENV: "production", DATABASE_URL: databaseUrl, HOST: "127.0.0.1", PORT: String(port),
    JWT_SECRET: randomBytes(48).toString("hex"), APP_PUBLIC_URL: `http://127.0.0.1:${port}`, CORS_ORIGINS: `http://127.0.0.1:${port}`, TRUST_PROXY_HOPS: "",
    S3_BUCKET: "", SMTP_HOST: "", SMTP_FROM: "", NOTIFY_OWNER_EMAIL: "", ZAPIER_WEBHOOK_URL: "",
    OPENAI_API_KEY: "", TWILIO_ACCOUNT_SID: "", TWILIO_AUTH_TOKEN: "", TWILIO_PHONE_NUMBER: "" };
  await check("fresh schema bootstrap", () => command(["scripts/bootstrap-database.mjs"]));
  await check("bootstrap refuses a nonempty database", async () => { const output = await command(["scripts/bootstrap-database.mjs"], "", true); assert.match(output, /database is not empty/); });
  await check("schema preflight", async () => { const output = await command(["dist/check-database.js"]); assert.equal(JSON.parse(output).ready, true); });
  await check("tracked migrations are a no-op after bootstrap", async () => {
    await command(["scripts/migrate-database.mjs"]);
    const [[row]] = await db.query("SELECT COUNT(*) AS count FROM __drizzle_migrations"); assert.equal(row.count, JSON.parse(await fs.readFile(path.join(root, "drizzle/meta/_journal.json"), "utf8")).entries.length);
  });
  await check("provision two accounts through operator CLI", async () => {
    await command(["dist/provision-account.js", "--email", "ONE@example.test", "--name", "QA Account One"], passwordOne);
    await command(["dist/provision-account.js", "--email", "two@example.test", "--name", "QA Account Two"], passwordTwo);
    const [rows] = await db.query("SELECT email, passwordHash FROM portalAccounts ORDER BY userId");
    assert.equal(rows.length, 2); assert.equal(rows[0].email, "one@example.test"); assert.ok(rows.every(row => row.passwordHash.startsWith("scrypt-v1$")));
  });
  await check("duplicate provisioning refuses without reset", async () => {
    assert.match(await command(["dist/provision-account.js", "--email", "one@example.test", "--name", "Duplicate"], passwordOne, true), /Account exists/);
  });
  const [accounts] = await db.query("SELECT userId FROM portalAccounts ORDER BY userId");
  const [one, two] = accounts.map(row => row.userId);
  await startServer();
  let cookieOne, cookieTwo, policyId, strategyId, contactId, documentId;
  await check("real HTTP sign-in, secure cookie, and database session", async () => {
    const loginWindowStart = Date.now();
    const first = await request("auth.login", { email: "one@example.test", password: passwordOne }, "", true);
    assert.equal(first.status, 200, first.message); assert.match(first.cookie, /HttpOnly/); assert.match(first.cookie, /Secure/); assert.match(first.cookie, /SameSite=Lax/i);
    cookieOne = sessionCookie(first);
    cookieTwo = sessionCookie(await request("auth.login", { email: "two@example.test", password: passwordTwo }, "", true));
    assert.equal((await ok("auth.me", undefined, cookieOne)).id, one);
    const [sessions] = await db.query("SELECT tokenHash, expiresAt FROM portalSessions"); assert.equal(sessions.length, 2); assert.ok(sessions.every(row => /^[0-9a-f]{64}$/.test(row.tokenHash)));
    // TIMESTAMP has whole-second precision and MySQL can round fractional input.
    // Bound the stored expiry by the real request window plus one second.
    const loginWindowEnd = Date.now();
    assert.ok(sessions.every(row => {
      const expiry = row.expiresAt.getTime();
      return expiry >= loginWindowStart + 8 * 60 * 60 * 1000 - 1000 && expiry <= loginWindowEnd + 8 * 60 * 60 * 1000 + 1000;
    }), "Stored sessions must expire eight hours after sign-in, allowing TIMESTAMP rounding");
  });
  await check("policy persistence and cross-account denial", async () => {
    policyId = (await ok("policy.save", { insuredFullName: "Synthetic Client One", policyNumber: "QA-ONE" }, cookieOne, true)).id;
    assert.equal((await ok("policy.get", undefined, cookieOne)).insuredFullName, "Synthetic Client One");
    assert.equal((await ok("policy.get", undefined, cookieTwo)).id, 0);
    assert.equal((await request("policy.save", { id: policyId, insuredFullName: "Wrong account" }, cookieTwo, true)).error, "NOT_FOUND");
  });
  await check("strategy tasks persist and reject another account", async () => {
    const initialStageTasks = JSON.stringify([{ id: "s1-1", label: "QA task", completed: false, category: "carrier-contact" }]);
    const [inserted] = await db.execute(
      "INSERT INTO strategies (userId, policyId, strategyContent, stage1Tasks) VALUES (?, ?, ?, ?)",
      [one, policyId, "Synthetic strategy", initialStageTasks]
    );
    strategyId = inserted.insertId;
    await ok("strategy.saveTaskCompletion", { strategyId, taskId: "s1-1", taskTitle: "QA task", stage: 1, completed: true }, cookieOne, true);
    const tasks = await ok("strategy.getTaskCompletions", { strategyId }, cookieOne); assert.equal(tasks.length, 1); assert.equal(tasks[0].completed, true);
    assert.equal((await request("strategy.get", { id: strategyId }, cookieTwo)).error, "NOT_FOUND");
  });
  await check("simultaneous canonical task writes create one completion record", async () => {
    const requests=Array.from({length:12},()=>request(
      "strategy.saveTaskCompletion",
      {strategyId,taskId:"s1-1",taskTitle:"QA task",stage:1,completed:true},
      cookieOne,true,
    ));
    const results=await Promise.all(requests);
    assert.ok(results.every(r=>r.status===200),"Concurrent task writes were not all acknowledged");
    const [rows]=await db.query(
      "SELECT id, completed FROM taskCompletions WHERE userId=? AND strategyId=? AND taskId='s1-1'",
      [one,strategyId],
    );
    assert.equal(rows.length,1,"Concurrent first/repeated writes duplicated a task");
    assert.equal(rows[0].completed,1);
  });
  await check("durable care scenario survives HTTP reload and detects policy changes", async () => {
    assert.equal((await ok("strategy.getCareScenario",{strategyId},cookieOne)).status,"empty");
    await ok("policy.save",{
      id:policyId,dailyMaximum:"250",monthlyMaximum:"7500",
      lifetimeMaximum:"273750",eliminationPeriod:"0",
    },cookieOne,true);
    const inputs={
      paymentType:"reimbursement",termsConfirmed:true,eligibility:"confirmed",
      startDate:"2026-11-15",careDays:[1,2,3,4,5],
      hourlyRate:"50",hoursPerDay:"3",capType:"daily",
      dailyMax:"250",monthlyMax:"7500",totalPool:"273750",remainingPool:"273750",
      firstMonthUsed:"0",eliminationType:"calendar",eliminationRemaining:"0",
      monthlyPremium:"0",assumeFullWaiver:false,dualWaiver:false,
      spouseMonthlyPremium:"",careInflation:"0",benefitInflation:"none",
      benefitRate:"",inflationScope:"",nextIncrease:"",riderConfirmed:false,
      originalDaily:"",originalMonthly:"",originalPool:"",
    };
    const saved=await ok("strategy.saveCareScenario",{strategyId,inputs},cookieOne,true);
    assert.equal(saved.status,"saved_valid");
    assert.equal(saved.inputs.startDate,"2026-11-15");
    const persisted=await ok("strategy.getCareScenario",{strategyId},cookieOne);
    assert.equal(persisted.status,"saved_valid");
    assert.equal(persisted.inputs.hourlyRate,"50");
    assert.equal((await request("strategy.getCareScenario",{strategyId},cookieTwo)).error,"NOT_FOUND");
    assert.equal((await request("strategy.saveCareScenario",{strategyId,inputs},cookieTwo,true)).error,"NOT_FOUND");
    // Policy revisions must invalidate the previously confirmed calculation.
    await ok("policy.save",{id:policyId,dailyMaximum:"275"},cookieOne,true);
    const stale=await ok("strategy.getCareScenario",{strategyId},cookieOne);
    assert.equal(stale.status,"needs_review");
    assert.equal(stale.policyChanged,true);
    assert.equal(stale.inputs.hourlyRate,"50","Stored draft must not be lost");
    // Restore the synthetic policy's original cap for unrelated later tests.
    await ok("policy.save",{id:policyId,dailyMaximum:"250"},cookieOne,true);
    const verifiedAgain=await ok("strategy.getCareScenario",{strategyId},cookieOne);
    assert.equal(verifiedAgain.status,"saved_valid");
  });
  await check("saved Gantt planning anchor is account-scoped and validates dates", async () => {
    const saved = await ok("strategy.updateScheduleStartDate",
      {strategyId,startDate:"2026-10-10"},cookieOne,true);
    assert.equal(saved.startDate,"2026-10-10");
    const [[record]] = await db.query("SELECT scheduleStartDate FROM strategies WHERE id=?", [strategyId]);
    assert.equal(record.scheduleStartDate,"2026-10-10");
    assert.equal((await request("strategy.updateScheduleStartDate",
      {strategyId,startDate:"2026-10-11"},cookieTwo,true)).error,"NOT_FOUND");
    assert.equal((await request("strategy.updateScheduleStartDate",
      {strategyId,startDate:"2026-02-30"},cookieOne,true)).error,"BAD_REQUEST");
  });
  await check("contact persistence and cross-account denial", async () => {
    contactId = (await ok("contacts.add", { name: "QA Family", email: "family@example.test" }, cookieOne, true)).id;
    assert.equal((await ok("contacts.list", undefined, cookieOne)).length, 1);
    assert.equal((await ok("contacts.list", undefined, cookieTwo)).length, 0);
    assert.equal((await request("contacts.delete", { id: contactId }, cookieTwo, true)).error, "NOT_FOUND");
  });
  await check("SMS and profile preferences merge in MySQL", async () => {
    await ok("sms.savePreferences", { phoneNumber: "8645550100", taskReminders: true, milestoneAlerts: false, deadlineWarnings: true, reminderDaysBefore: [7, 1] }, cookieOne, true);
    await ok("auth.updateProfile", { notificationPreferences: { notifyOnContactForm: false } }, cookieOne, true);
    assert.equal((await ok("sms.getPreferences", undefined, cookieOne)).phoneNumber, "8645550100");
    assert.equal((await ok("auth.getProfile", undefined, cookieOne)).notificationPreferences.notifyOnContactForm, false);
  });
  await check("saved-progress record survives unconfigured email and stays private", async () => {
    const saved = await ok("email.sendSaveLink", { email: "ignored@example.test", formData: { insuredFullName: "Synthetic Client One" }, currentStep: 2 }, cookieOne, true);
    assert.equal(saved.saved, true); assert.equal(saved.success, false);
    assert.equal((await ok("email.getResumeData", { token: saved.token }, cookieOne)).currentStep, 2);
    assert.equal((await ok("email.getResumeData", { token: saved.token }, cookieTwo)).found, false);
  });
  await check("chat history is scoped even with a shared session identifier", async () => {
    await db.execute("INSERT INTO chatMessages (userId, sessionId, role, content) VALUES (?, 'qa-shared', 'user', 'One only'), (?, 'qa-shared', 'user', 'Two only')", [one, two]);
    const history = await ok("chat.getHistory", { sessionId: "qa-shared" }, cookieOne);
    assert.equal(history.length, 1); assert.equal(history[0].content, "One only");
  });
  await check("document metadata, private links, and removal use the real database", async () => {
    for (const id of [one, two]) {
      const key = `users/${id}/documents/qa-example`;
      await db.execute("INSERT INTO portalFiles (fileKey, userId) VALUES (?, ?)", [key, id]);
      const [inserted] = await db.execute("INSERT INTO documentUploads (userId, category, fileName, fileUrl, fileKey, mimeType, fileSize) VALUES (?, 'Insurance Policy', ?, 'https://old-public.example/file', ?, 'application/pdf', 1024)", [id, `QA-Account-${id}.pdf`, key]);
      if (id === one) documentId = inserted.insertId;
    }
    const mine = await ok("documents.list", undefined, cookieOne); assert.equal(mine.length, 1); assert.ok(mine[0].fileUrl.startsWith("/storage/"));
    assert.equal((await request("documents.delete", { id: documentId }, cookieTwo, true)).error, "NOT_FOUND");
    const denied = await fetch(env.APP_PUBLIC_URL + `/storage/users/${one}/documents/qa-example`, { headers: { cookie: cookieTwo }, redirect: "manual" }); assert.equal(denied.status, 404);
    // The same task ID can occur in different strategies within one account.
    const stageTasks = JSON.stringify([{ id: "s1-1", label: "Gather policy" }]);
    await db.execute("UPDATE strategies SET stage1Tasks = ? WHERE id = ?", [stageTasks, strategyId]);
    const [otherStrategy] = await db.execute("INSERT INTO strategies (userId, policyId, strategyContent, stage1Tasks) VALUES (?, ?, 'Second strategy', ?)", [one, policyId, stageTasks]);
    await db.execute("UPDATE documentUploads SET strategyId = ?, policyId = ?, taskId = 's1-1' WHERE id = ?", [strategyId, policyId, documentId]);
    const taskDocs = await ok("documents.taskDocuments", { strategyId, taskId: "s1-1" }, cookieOne);
    assert.equal(taskDocs.taskLabel, "Gather policy"); assert.equal(taskDocs.documents.length, 1);
    assert.equal((await ok("documents.taskDocuments", { strategyId: otherStrategy.insertId, taskId: "s1-1" }, cookieOne)).documents.length, 0);
    assert.equal((await request("documents.taskDocuments", { strategyId, taskId: "s1-1" }, cookieTwo)).error, "NOT_FOUND");
    assert.equal((await request("documents.taskDocuments", { strategyId, taskId: "missing" }, cookieOne)).error, "NOT_FOUND");
    const attachment = { strategyId, taskId: "s1-1", documentId };
    await ok("documents.detachFromTask", attachment, cookieOne, true);
    const available = await ok("documents.availableForTask", { strategyId, taskId: "s1-1" }, cookieOne);
    assert.equal(available.length, 1); assert.equal(available[0].policyId, policyId);
    const [[retainedFile]] = await db.execute("SELECT COUNT(*) AS count FROM portalFiles WHERE userId = ?", [one]); assert.equal(retainedFile.count, 1);
    await ok("documents.attachToTask", attachment, cookieOne, true);
    await ok("documents.attachToTask", attachment, cookieOne, true); // A retry does not duplicate/move the file.
    assert.equal((await request("documents.attachToTask", { ...attachment, strategyId: otherStrategy.insertId }, cookieOne, true)).error, "CONFLICT");
    assert.equal((await request("documents.detachFromTask", { ...attachment, strategyId: otherStrategy.insertId }, cookieOne, true)).error, "CONFLICT");
    assert.equal((await request("documents.detachFromTask", attachment, cookieTwo, true)).error, "NOT_FOUND");
    assert.equal((await ok("documents.taskDocuments", { strategyId, taskId: "s1-1" }, cookieOne)).documents.length, 1);
    await ok("documents.delete", { id: documentId }, cookieOne, true);
    const [[remaining]] = await db.execute("SELECT COUNT(*) AS count FROM portalFiles WHERE userId = ?", [one]); assert.equal(remaining.count, 0);
    assert.equal((await ok("documents.list", undefined, cookieOne)).length, 0);
  });
  await check("concurrent attachments cannot move a file between strategies", async () => {
    const tasks = JSON.stringify([{ id: "s1-1", label: "Gather policy" }]);
    const [second] = await db.execute("INSERT INTO strategies (userId, policyId, strategyContent, stage1Tasks) VALUES (?, ?, 'Concurrency fixture', ?)", [one, policyId, tasks]);
    const key = `users/${one}/documents/qa-concurrent`;
    await db.execute("INSERT INTO portalFiles (fileKey, userId) VALUES (?, ?)", [key, one]);
    const [inserted] = await db.execute("INSERT INTO documentUploads (userId, category, fileName, fileUrl, fileKey, mimeType, fileSize) VALUES (?, 'Insurance Policy', 'Concurrent.pdf', '/storage/fixture', ?, 'application/pdf', 1024)", [one, key]);
    const targets = [strategyId, second.insertId].map(id => ({ documentId: inserted.insertId, strategyId: id, taskId: "s1-1" }));
    const results = await Promise.all(targets.map(input => request("documents.attachToTask", input, cookieOne, true)));
    assert.equal(results.filter(result => result.status === 200).length, 1);
    assert.equal(results.filter(result => result.error === "CONFLICT").length, 1);
    const winner = targets[results.findIndex(result => result.status === 200)];
    const [[saved]] = await db.execute("SELECT strategyId, policyId, taskId FROM documentUploads WHERE id = ?", [inserted.insertId]);
    assert.equal(saved.strategyId, winner.strategyId); assert.equal(saved.policyId, policyId); assert.equal(saved.taskId, "s1-1");
    const detaches = await Promise.all([1, 2].map(() => request("documents.detachFromTask", winner, cookieOne, true)));
    assert.equal(detaches.filter(result => result.status === 200).length, 1);
    assert.equal(detaches.filter(result => result.error === "CONFLICT").length, 1);
    const [[detached]] = await db.execute("SELECT strategyId, policyId, taskId, fileKey FROM documentUploads WHERE id = ?", [inserted.insertId]);
    assert.equal(detached.strategyId, null); assert.equal(detached.taskId, null); assert.equal(detached.policyId, policyId); assert.equal(detached.fileKey, key);
    const [[registered]] = await db.execute("SELECT COUNT(*) AS count FROM portalFiles WHERE fileKey = ? AND userId = ?", [key, one]); assert.equal(registered.count, 1);
    await ok("documents.delete", { id: inserted.insertId }, cookieOne, true);
  });
  await check("documented carrier approval and claim events persist with protected evidence", async () => {
    const evidenceKey = "users/" + one + "/documents/qa-carrier-approval";
    await db.execute("INSERT INTO portalFiles (fileKey, userId) VALUES (?, ?)", [evidenceKey, one]);
    const [created] = await db.execute(
      "INSERT INTO documentUploads (userId,policyId,strategyId,category,fileName,fileUrl,fileKey,mimeType,fileSize) VALUES (?,?,?,'Other','Synthetic Carrier Decision.pdf','/storage/qa',?,'application/pdf',1024)",
      [one,policyId,strategyId,evidenceKey]
    );
    const fileId = created.insertId;
    const date = new Date().toISOString().slice(0,10);
    const payload = {
      strategyId, effectiveDate:date, carrierReference:"SYNTHETIC-CLM-001",
      evidenceDocumentId:fileId, attestationConfirmed:true,
    };
    assert.equal((await request("strategy.recordCarrierApproval",payload,cookieTwo,true)).error,"NOT_FOUND");
    assert.equal((await request("strategy.recordCarrierApproval",{...payload,evidenceDocumentId:999999},cookieOne,true)).error,"BAD_REQUEST");
    assert.equal((await request("strategy.recordCarrierApproval",{...payload,attestationConfirmed:false},cookieOne,true)).status,400);
    const accepted = await ok("strategy.recordCarrierApproval",payload,cookieOne,true);
    assert.equal(accepted.evidenceLevel,"user_submitted");
    const timeline = await ok("strategy.listClaimMilestones",{strategyId},cookieOne);
    assert.equal(timeline.filter(event=>event.kind==="carrier_approval").length,1);
    assert.equal(timeline[0].evidenceDocumentId,fileId);
    const [[stage3]] = await db.query("SELECT currentStage,claimStatus FROM strategies WHERE id=?",[strategyId]);
    assert.equal(stage3.currentStage,3);
    assert.equal(stage3.claimStatus,"approved");
    assert.equal((await request("documents.delete",{id:fileId},cookieOne,true)).error,"CONFLICT");
    assert.equal((await request("strategy.recordCarrierApproval",payload,cookieOne,true)).error,"CONFLICT");
    assert.equal((await request("strategy.updateTasks",{strategyId,stage:"stage1Tasks",tasks:[],currentStage:3,claimStatus:"approved",carrierApprovalConfirmed:true},cookieOne,true)).error,"PRECONDITION_FAILED");
    await ok("strategy.recordActualMilestone",{strategyId,kind:"care_started",effectiveDate:date},cookieOne,true);
    const history=await ok("strategy.listClaimMilestones",{strategyId},cookieOne);
    assert.equal(history.length,2);
    assert.equal((await request("strategy.listClaimMilestones",{strategyId},cookieTwo)).error,"NOT_FOUND");
  });
  await check("password change verifies current password and revokes all account sessions", async () => {
    const secondSession = sessionCookie(await request("auth.login", { email: "one@example.test", password: activePasswordOne }, "", true));
    const wrong = await request("auth.changePassword", { currentPassword: "wrong current password", newPassword: changedPassword }, cookieOne, true);
    assert.equal(wrong.error, "BAD_REQUEST");
    assert.equal((await ok("auth.me", undefined, cookieOne)).id, one);
    const changed = await request("auth.changePassword", { currentPassword: activePasswordOne, newPassword: changedPassword }, cookieOne, true);
    assert.equal(changed.status, 200); assert.equal(changed.data.signInRequired, true);
    assert.ok(changed.cookie?.includes("Expires=Thu, 01 Jan 1970"), "Password change must clear the current cookie");
    const [[sessions]] = await db.execute("SELECT COUNT(*) AS count FROM portalSessions WHERE userId = ?", [one]); assert.equal(sessions.count, 0);
    assert.equal(await ok("auth.me", undefined, cookieOne), null); assert.equal(await ok("auth.me", undefined, secondSession), null);
    assert.equal((await request("auth.login", { email: "one@example.test", password: activePasswordOne }, "", true)).error, "UNAUTHORIZED");
    activePasswordOne = changedPassword;
    cookieOne = sessionCookie(await request("auth.login", { email: "one@example.test", password: activePasswordOne }, "", true));
    assert.equal((await ok("auth.me", undefined, cookieOne)).id, one);
  });
  await check("concurrent password changes cannot overwrite the winning change", async () => {
    const results = await Promise.all(racePasswords.map(newPassword => request("auth.changePassword", { currentPassword: activePasswordOne, newPassword }, cookieOne, true)));
    assert.equal(results.filter(result => result.status === 200).length, 1);
    const loser = results.find(result => result.status !== 200);
    assert.ok(["CONFLICT", "UNAUTHORIZED"].includes(loser?.error));
    const winnerIndex = results.findIndex(result => result.status === 200);
    activePasswordOne = racePasswords[winnerIndex];
    const [[sessions]] = await db.execute("SELECT COUNT(*) AS count FROM portalSessions WHERE userId = ?", [one]); assert.equal(sessions.count, 0);
    assert.equal((await request("auth.login", { email: "one@example.test", password: racePasswords[1 - winnerIndex] }, "", true)).error, "UNAUTHORIZED");
    cookieOne = sessionCookie(await request("auth.login", { email: "one@example.test", password: activePasswordOne }, "", true));
  });
  await check("logout revokes a real database session", async () => {
    await ok("auth.logout", undefined, cookieOne, true); assert.equal(await ok("auth.me", undefined, cookieOne), null);
    assert.equal((await request("documents.list", undefined, cookieOne)).error, "UNAUTHORIZED");
  });
  await check("five failed passwords lock the account", async () => {
    // Isolate the per-account lockout from the separately tested per-IP limit.
    await stopServer(); await startServer();
    for (let i = 0; i < 5; i++) {
      assert.equal((await request("auth.login", { email: "two@example.test", password: "wrong password value" }, "", true)).error, "UNAUTHORIZED");
      const [[attempt]] = await db.execute("SELECT failedAttempts, lockedUntil FROM portalAccounts WHERE userId = ?", [two]);
      assert.equal(attempt.failedAttempts, i + 1);
      if (i < 4) assert.equal(attempt.lockedUntil, null, "Account locked before fifth failure");
    }
    const [[account]] = await db.execute("SELECT failedAttempts, lockedUntil FROM portalAccounts WHERE userId = ?", [two]);
    assert.equal(account.failedAttempts, 5); assert.ok(account.lockedUntil > new Date());
    assert.ok(account.lockedUntil.getTime() - Date.now() < 16 * 60 * 1000, "Lockout duration exceeds 15-minute window");
    assert.equal((await request("auth.login", { email: "two@example.test", password: passwordTwo }, "", true)).error, "UNAUTHORIZED");
  });
  await check("operator password reset clears lockout and revokes sessions", async () => {
    await command(["dist/provision-account.js", "--email", "two@example.test", "--reset"], resetPassword);
    assert.equal(await ok("auth.me", undefined, cookieTwo), null);
    assert.equal((await request("auth.login", { email: "two@example.test", password: passwordTwo }, "", true)).error, "UNAUTHORIZED");
    const result = await request("auth.login", { email: "two@example.test", password: resetPassword }, "", true);
    assert.equal(result.status, 200); cookieTwo = sessionCookie(result);
  });
  await check("HTTP login throttle blocks the eleventh attempt", async () => {
    await stopServer(); await startServer();
    for (let attempt = 0; attempt < 10; attempt++) {
      assert.equal((await request("auth.login", { email: "unknown@example.test", password: "invalid password" }, "", true)).status, 401);
    }
    assert.equal((await request("auth.login", { email: "unknown@example.test", password: "invalid password" }, "", true)).status, 429);
  });
  await stopServer(); await startServer();
  await check("expired lockout starts a new attempt window", async () => {
    await db.execute("UPDATE portalAccounts SET failedAttempts = 5, lockedUntil = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE userId = ?", [two]);
    assert.equal((await request("auth.login", { email: "two@example.test", password: "wrong password value" }, "", true)).error, "UNAUTHORIZED");
    const [[account]] = await db.execute("SELECT failedAttempts, lockedUntil FROM portalAccounts WHERE userId = ?", [two]);
    assert.equal(account.failedAttempts, 1); assert.equal(account.lockedUntil, null);
  });
  await check("expired database sessions are rejected", async () => {
    await db.execute("UPDATE portalSessions SET expiresAt = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE userId = ?", [two]);
    assert.equal(await ok("auth.me", undefined, cookieTwo), null);
  });
  if (process.env.LTC_QA_PLAYWRIGHT_MODULE) {
    await stopServer(); await startServer();
    await check("browser sign-in, sign-out, account isolation, and persisted attach/detach", async () => {
      const require = createRequire(import.meta.url);
      const { chromium } = require(process.env.LTC_QA_PLAYWRIGHT_MODULE);
      browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const pageErrors = [], consoleMessages = [], failedRequests = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      page.on("console", message => { if (["error", "warning"].includes(message.type())) consoleMessages.push(message.text()); });
      page.on("requestfailed", request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      await page.addInitScript(() => localStorage.setItem("ltc_terms_accepted_v1", "true"));
      await page.goto(env.APP_PUBLIC_URL + "/documents"); await page.waitForURL(/\/login\?returnTo=/);
      async function login(email, password) {
        await page.getByLabel("Email address", { exact: true }).fill(email);
        await page.getByLabel("Password", { exact: true }).fill(password);
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
        await page.waitForURL(/\/documents$/);
      }
      await login("one@example.test", activePasswordOne);
      await page.getByRole("heading", { name: "No documents yet", exact: true }).waitFor();
      await page.getByRole("button", { name: "Sign out", exact: true }).click(); await page.waitForURL(/\/login$/);
      await page.goto(env.APP_PUBLIC_URL + "/documents"); await page.waitForURL(/\/login\?returnTo=/);
      await login("two@example.test", resetPassword);
      await page.getByRole("heading", { name: `QA-Account-${two}.pdf`, exact: true }).waitFor();
      assert.equal(await page.getByRole("heading", { name: `QA-Account-${one}.pdf`, exact: true }).count(), 0);
      // Exercise the new attachment workflow through the real authenticated UI.
      const [browserPolicy] = await db.execute("INSERT INTO policies (userId, insuredFullName) VALUES (?, 'Synthetic Browser Client')", [two]);
      const [browserStrategy] = await db.execute("INSERT INTO strategies (userId, policyId, strategyContent, stage1Tasks) VALUES (?, ?, 'Browser fixture', ?)", [two, browserPolicy.insertId, JSON.stringify([{ id: "s1-1", label: "Gather your insurance policy" }])]);
      const [[browserDocument]] = await db.execute("SELECT id, fileKey FROM documentUploads WHERE userId = ?", [two]);
      await page.goto(env.APP_PUBLIC_URL + `/documents?strategyId=${browserStrategy.insertId}&taskId=s1-1`);
      await page.getByRole("heading", { name: "Gather your insurance policy", exact: true }).waitFor();
      await page.getByLabel("Existing document", { exact: true }).selectOption(String(browserDocument.id));
      await page.getByRole("button", { name: "Attach to task", exact: true }).click();
      await page.getByRole("heading", { name: `QA-Account-${two}.pdf`, exact: true }).waitFor();
      const [[attachedRow]] = await db.execute("SELECT strategyId, policyId, taskId FROM documentUploads WHERE id = ?", [browserDocument.id]);
      assert.equal(attachedRow.strategyId, browserStrategy.insertId); assert.equal(attachedRow.policyId, browserPolicy.insertId); assert.equal(attachedRow.taskId, "s1-1");
      await page.getByRole("button", { name: `Detach QA-Account-${two}.pdf from task`, exact: true }).click();
      await page.getByRole("status").filter({ hasText: "detached from this task and kept in your account" }).waitFor();
      await page.getByLabel("Existing document", { exact: true }).waitFor();
      const [[detachedRow]] = await db.execute("SELECT strategyId, policyId, taskId, fileKey FROM documentUploads WHERE id = ?", [browserDocument.id]);
      assert.equal(detachedRow.strategyId, null); assert.equal(detachedRow.taskId, null); assert.equal(detachedRow.policyId, browserPolicy.insertId); assert.equal(detachedRow.fileKey, browserDocument.fileKey);
      const [[browserAccess]] = await db.execute("SELECT COUNT(*) AS count FROM portalFiles WHERE fileKey = ? AND userId = ?", [browserDocument.fileKey, two]); assert.equal(browserAccess.count, 1);
      assert.deepEqual(pageErrors, []);
      report.browser = { status: "passed", realDatabase: true, apiMocks: false, pageErrors, consoleMessages, failedRequests, viewport: "1440x1000", page: "/documents?strategyId=<fixture>&taskId=s1-1", taskAttachment: "real UI attach and detach persisted; file registry retained" };
      if (process.env.LTC_QA_SCREENSHOT_PATH) await page.screenshot({ path: process.env.LTC_QA_SCREENSHOT_PATH });
    });
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed"; checks.push({ name: activeCheck, status: "failed", message: safe(error.message) });
  console.error(`FAIL ${activeCheck}: ${safe(error.message)}`); process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stopServer(); if (db) await db.end();
  if (process.env.LTC_QA_REPORT_PATH) await fs.writeFile(process.env.LTC_QA_REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log(`Database verification ${report.status}: ${checks.filter(item => item.status === "passed").length} checks passed.`);
}
