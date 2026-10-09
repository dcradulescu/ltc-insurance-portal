import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { appRouter } from './routers';
import { ENV } from './_core/env';
import * as db from './db';
import type { TrpcContext } from './_core/context';
vi.mock('./_core/env', () => ({ ENV: { zapierWebhookUrl: '' } }));
vi.mock('./db', async original => ({ ...await original<typeof import('./db')>(), getStrategyById: vi.fn(), createSaveLink: vi.fn() }));
const caller = () => appRouter.createCaller({ user: { id: 11 }, req: { headers: {} }, res: {} } as TrpcContext);
const data = { insuredName: 'QA insured', policyNumber: 'QA-7', carrierName: 'QA carrier', dailyMaximum: 250, monthlyMaximum: 7500, lifetimeMaximum: 100000, adlLimitations: [], stage1Tasks: [], stage2Tasks: [], stage3Tasks: [], careRecommendations: '', strategyContent: 'QA strategy' };
let request = vi.fn();
beforeEach(() => {
  vi.clearAllMocks(); ENV.zapierWebhookUrl = 'https://example.com/qa-webhook';
  request = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal('fetch', request);
  vi.stubEnv('APP_URL', 'https://portal.example.com');
  vi.mocked(db.getStrategyById).mockResolvedValue({ id: 31, userId: 11, strategyContent: 'QA stored strategy' } as any);
  vi.mocked(db.createSaveLink).mockResolvedValue(9);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); ENV.zapierWebhookUrl = ''; });
const payload = () => JSON.parse(request.mock.calls[0][1].body);
const checkAttachment = () => {
  expect(payload().attachmentContentType).toBe('application/pdf');
  expect(payload().attachmentFilename).toBe('LTC-Strategy.pdf');
  expect(Buffer.from(payload().attachmentBase64, 'base64').subarray(0, 5).toString()).toBe('%PDF-');
};
describe('email receiving contracts (fetch mocked)', () => {
  it('sends contact content and configured office recipient', async () => {
    vi.stubEnv('CONTACT_EMAIL', 'office@example.com');
    await caller().email.sendContactForm({ name: 'QA sender', email: 'sender@example.com', phone: '8642446300', subject: 'general', message: 'QA message' });
    expect(payload()).toMatchObject({ type: 'contact_form', name: 'QA sender', email: 'sender@example.com', subject: 'general', message: 'QA message', notifyEmail: 'office@example.com' });
  });
  it('attaches real PDF bytes to strategy email with explicit recipients', async () => {
    const receipt = await caller().email.sendStrategy({ strategyId: 31, recipients: ['family@example.com'], policyData: data });
    expect(receipt.status).toBe('accepted'); checkAttachment();
    expect(payload()).toMatchObject({ type: 'strategy_email', recipients: ['family@example.com'], strategyContent: 'QA stored strategy', insuredName: 'QA insured' });
  });
  it('attaches real PDF bytes through the single-recipient sharing panel', async () => {
    await caller().pdfDelivery.sendPdfByEmail({ ...data, recipientEmail: 'family@example.com', recipientName: 'QA family', message: 'QA note' });
    checkAttachment(); expect(payload()).toMatchObject({ type: 'strategy_email', recipientEmail: 'family@example.com', recipientName: 'QA family', personalMessage: 'QA note' });
  });
  it('preserves the page-content contract', async () => {
    await caller().email.sendPageContent({ pageName: 'Education', content: 'QA content', recipients: ['family@example.com'] });
    expect(payload()).toMatchObject({ type: 'page_content', pageName: 'Education', content: 'QA content', recipients: ['family@example.com'] });
  });
  it('sends step-progress payloads to the office', async () => {
    await caller().email.notifyStepProgress({ stepNumber: 0, stepTitle: 'Insured', formData: { insuredFullName: 'QA draft' } });
    expect(payload()).toMatchObject({ type: 'step_progress', stepNumber: 0, formData: { insuredFullName: 'QA draft' } });
  });
  it('uses the trusted origin and matches the stored recovery token', async () => {
    await caller().email.sendSaveLink({ email: 'family@example.com', origin: 'https://untrusted.example', formData: { insuredFullName: 'QA draft' }, currentStep: 0 });
    const stored = vi.mocked(db.createSaveLink).mock.calls[0][0];
    expect(payload()).toMatchObject({ type: 'save_link', to: 'family@example.com', returnUrl: `https://portal.example.com/policy-form?resume=${stored.token}` });
  });
});
