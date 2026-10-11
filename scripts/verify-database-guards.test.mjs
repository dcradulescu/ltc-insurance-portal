import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
for (const [name, value, message] of [
  ["missing explicit test database", undefined, "Set LTC_TEST_DATABASE_URL"],
  ["remote host even with a test database name", "mysql://qa:placeholder@db.example.invalid/ltc_verify_example", "Refusing verification"],
  ["local database without the test prefix", "mysql://qa:placeholder@127.0.0.1/production", "Refusing verification"],
]) {
  test(`refuses ${name} before connecting or writing`, () => {
    const env = { ...process.env }; delete env.LTC_TEST_DATABASE_URL;
    if (value) env.LTC_TEST_DATABASE_URL = value;
    const result = spawnSync(process.execPath, ["scripts/verify-database.mjs"], { cwd: root, env, encoding: "utf8", timeout: 5000 });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(message), result.stderr);
    assert.ok(!result.stderr.includes("ECONNREFUSED"));
  });
}
