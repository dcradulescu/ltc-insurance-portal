import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse } from 'dotenv';
import { reviewConfiguration } from '../scripts/configuration-readiness.mjs';
const fixture = () => ({ NODE_ENV: 'production', APP_PUBLIC_URL: 'https://portal.client-company.com', JWT_SECRET: 'only-a-synthetic-test-secret-never-use-in-production-01234567890123456789', DATABASE_URL: 'mysql://portal:synthetic-password@127.0.0.1/portal', S3_BUCKET: 'portal-private', S3_ACCESS_KEY_ID: 'synthetic-access', S3_SECRET_ACCESS_KEY: 'synthetic-storage-secret', OPENAI_API_KEY: 'synthetic-ai-key', OPENAI_MODEL: 'configured-model', SMTP_HOST: 'smtp.client-company.com', SMTP_USER: 'synthetic-mail-user', SMTP_PASS: 'synthetic-mail-password', SMTP_FROM: 'Portal <portal@client-company.com>', NOTIFY_OWNER_EMAIL: 'office@client-company.com' });
const errors = (report: ReturnType<typeof reviewConfiguration>) => report.issues.filter((issue: any) => issue.severity === 'error');
describe('offline deployment configuration review', () => {
  it('never promotes valid-looking settings to verified deployment readiness', () => {
    const report = reviewConfiguration(fixture());
    expect(report.configurationValid).toBe(true); expect(report.deploymentReady).toBe(false);
    expect(report.liveChecksPerformed).toBe(false); expect(report.optionalSms).toBe('disabled');
    expect(report.remainingVerification.length).toBeGreaterThan(0);
  });
  it('rejects the untouched deployment template', () => {
    const env = parse(readFileSync(new URL('../.env.example', import.meta.url)));
    const report = reviewConfiguration(env);
    expect(report.configurationValid).toBe(false);
    for (const key of ['APP_PUBLIC_URL', 'JWT_SECRET', 'DATABASE_URL', 'OPENAI_API_KEY', 'SMTP_HOST']) {
      expect(errors(report).some((issue: any) => issue.key === key)).toBe(true);
    }
  });
  it.each([
    ['NODE_ENV', 'development'], ['JWT_SECRET', 'too-short'], ['APP_PUBLIC_URL', 'http://portal.client-company.com'],
    ['APP_PUBLIC_URL', 'https://portal.client-company.com/private'], ['APP_PUBLIC_URL', 'https://user:secret@portal.client-company.com'],
    ['APP_PUBLIC_URL', ' https://portal.client-company.com'], ['DATABASE_URL', 'mysql://portal:pw@db.example.com/portal'], ['SMTP_FROM', 'portal@client-company.com>'],
    ['PORT', '3000oops'], ['TRUST_PROXY_HOPS', '-1'], ['TRUST_PROXY_HOPS', 'true'],
    ['DATABASE_URL', 'mysql://USER:PASSWORD@HOST/DATABASE'], ['DATABASE_URL', 'mysql://portal@db/portal'],
    ['DATABASE_URL', 'postgres://portal:pw@db/portal'], ['S3_SECRET_ACCESS_KEY', ''],
    ['OPENAI_BASE_URL', 'https://api.vendor.com/v1'], ['SMTP_PORT', '0'], ['SMTP_SECURE', 'TRUE'],
    ['SMTP_FROM', 'two@addresses.com,another@addresses.com'], ['NOTIFY_OWNER_EMAIL', 'office@example.com'],
    ['CORS_ORIGINS', '*'], ['CORS_ORIGINS', 'https://another.client-company.com'],
    ['VITE_PUBLIC_URL', 'https://another.client-company.com'], ['ZAPIER_WEBHOOK_URL', 'http://hooks.vendor.com/private'],
    ['VITE_ZAPIER_WEBHOOK_URL', 'legacy-secret'], ['TWILIO_ACCOUNT_SID', 'partial-setup'],
  ])('rejects invalid %s configuration (%s)', (key, value) => {
    const report = reviewConfiguration({ ...fixture(), [key]: value });
    expect(report.configurationValid).toBe(false);
  });
  it('supports legacy S3 credential aliases without exposing them', () => {
    const env: Record<string, string> = fixture(); delete env.S3_ACCESS_KEY_ID; delete env.S3_SECRET_ACCESS_KEY;
    env.S3_ACCESS_KEY = 'legacy-access'; env.S3_SECRET_KEY = 'legacy-secret';
    const report = reviewConfiguration(env); expect(report.configurationValid).toBe(true);
    expect(JSON.stringify(report)).not.toContain('legacy-secret');
  });
  it('matches runtime alias precedence when a canonical S3 key is explicitly blank', () => {
    const report = reviewConfiguration({ ...fixture(), S3_ACCESS_KEY_ID: '', S3_ACCESS_KEY: 'legacy-access' });
    expect(report.configurationValid).toBe(false);
  });
  it('permits the SDK credential chain but requires manual verification', () => {
    const env: Record<string, string> = fixture(); delete env.S3_ACCESS_KEY_ID; delete env.S3_SECRET_ACCESS_KEY;
    const report = reviewConfiguration(env); expect(report.configurationValid).toBe(true);
    expect(report.issues.some((issue: any) => issue.key === 'S3 credentials' && issue.severity === 'warning')).toBe(true);
  });
  it('does not let a webhook hide missing SMTP configuration', () => {
    const env: Record<string, string> = { ...fixture(), ZAPIER_WEBHOOK_URL: 'https://hooks.vendor.com/synthetic-private-token' }; delete env.SMTP_HOST;
    const report = reviewConfiguration(env); expect(report.configurationValid).toBe(false);
    expect(errors(report).some((issue: any) => issue.key === 'SMTP_HOST')).toBe(true);
  });
  it('never includes configuration values in reports, including malformed credential URLs', () => {
    const env = { ...fixture(), DATABASE_URL: 'mysql://private-user:private-password@[invalid', ZAPIER_WEBHOOK_URL: 'https://hooks.vendor.com/private-webhook-token?secret=private-query-token' };
    const serialized = JSON.stringify(reviewConfiguration(env));
    for (const value of ['private-user', 'private-password', 'private-webhook-token', 'private-query-token', env.JWT_SECRET, env.SMTP_PASS, env.OPENAI_API_KEY, env.S3_SECRET_ACCESS_KEY]) expect(serialized).not.toContain(value);
  });
  it('CLI returns JSON and a failing exit code without any production environment or .env', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ltc-config-'));
    try {
      const script = fileURLToPath(new URL('../scripts/check-configuration.mjs', import.meta.url));
      const missing = spawnSync(process.execPath, [script], { cwd, env: {}, encoding: 'utf8' });
      expect(missing.status).toBe(1); expect(JSON.parse(missing.stdout).configurationValid).toBe(false);
      const valid = spawnSync(process.execPath, [script], { cwd, env: fixture(), encoding: 'utf8' });
      expect(valid.status).toBe(0); expect(JSON.parse(valid.stdout).deploymentReady).toBe(false);
      expect(valid.stdout).not.toContain(fixture().JWT_SECRET);
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });
});
