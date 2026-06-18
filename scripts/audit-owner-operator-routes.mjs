#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const routerPath = path.join(repoRoot, "server", "routers.ts");
const source = fs.readFileSync(routerPath, "utf8");

const checks = [
  {
    name: "policy.get must not load hard-coded policy id 1",
    pattern: /const\s+policy\s*=\s*await\s+getPolicyById\(1\)/,
    remediation: "Use getPolicyByUserId(1) for the private owner-operator route, or authenticated user ownership for public mode.",
  },
  {
    name: "profile routes must not read users.id = 1",
    pattern: /where\(eq\(users\.id,\s*1\)\)/,
    remediation: "Resolve the portal operator by openId = 'portal-operator' or by ctx.user.openId before reading/updating profile data.",
  },
  {
    name: "profile creation must not force id = 1",
    pattern: /id:\s*1,\s*\n\s*openId:\s*['"]portal-operator['"]/,
    remediation: "Allow the database to assign the user id and use the unique openId for stable identity.",
  },
];

const failures = checks.filter(check => check.pattern.test(source));

if (failures.length > 0) {
  console.error("Owner-operator route audit found blocking issues:\n");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    console.error(`  ${failure.remediation}`);
  }
  process.exit(1);
}

console.log("Owner-operator route audit passed.");
