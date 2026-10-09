import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import { ENV } from './_core/env';
import type { TrpcContext } from './_core/context';
vi.mock('./_core/env', () => ({ ENV: { zapierWebhookUrl: '' } }));
vi.mock('./db', async original => ({ ...await original<typeof import('./db')>(), getPolicyByUserId: vi.fn(), getStrategyByPolicyId: vi.fn(), getDocumentsByUserId: vi.fn(), getUserContacts: vi.fn(), getTaskCompletions: vi.fn() }));
const user = { id: 11, name: 'QA owner', email: 'owner@example.com', openId: 'qa-owner', role: 'user' };
const caller = () => appRouter.createCaller({ user, req: { headers: {} }, res: {} } as TrpcContext);
let request = vi.fn();
beforeEach(() => {
  vi.clearAllMocks(); ENV.zapierWebhookUrl = 'https://example.com/qa-webhook';
  request = vi.fn().mockResolvedValue({ ok: true, status: 200 }); vi.stubGlobal('fetch', request);
  vi.mocked(db.getPolicyByUserId).mockResolvedValue({ id: 7, userId: 11, insuredFullName: 'QA insured', insuredEmail: 'insured@example.com', insuredPhone: '8642446300', insuredSsn: 'DO-NOT-SEND', equipmentAllowance: JSON.stringify({ poa_name: 'QA representative', careNeeds: ['Bathing'], diagnosisCheckboxes: ['Other'] }) } as any);
  vi.mocked(db.getStrategyByPolicyId).mockResolvedValue({ id: 31, policyId: 7, currentStage: 1, stage1Tasks: [{ id: 's1-1', label: 'Stored task', completed: true }], stage2Tasks: [], stage3Tasks: [], strategyContent: 'QA plan' } as any);
  vi.mocked(db.getTaskCompletions).mockResolvedValue([{ taskId: 's1-1', completed: false }] as any);
  vi.mocked(db.getDocumentsByUserId).mockResolvedValue([{ id: 4, fileName: 'qa.pdf', taskId: 's1-1' }] as any);
  vi.mocked(db.getUserContacts).mockResolvedValue([{ id: 5, name: 'QA contact', email: 'contact@example.com', receiveCcEmails: 0 }] as any);
});
afterEach(() => { vi.unstubAllGlobals(); ENV.zapierWebhookUrl = ''; });
function payload() { return JSON.parse(request.mock.calls[0][1].body); }

describe('comprehensive office handoff contract', () => {
  it.each(['form_completed', 'strategy_completed', 'exit', 'timeout'] as const)('sends %s with owned, hydrated policy data and saved task progress', async trigger => {
    const result = await caller().policyForm.sendComprehensiveToZapier({ trigger, currentPage: 'policy-form', formStep: 0, sessionDurationSeconds: 0 });
    expect(result).toMatchObject({ success: true, status: 'accepted' });
    expect(result.message).toContain('Email delivery is not confirmed');
    expect(db.getPolicyByUserId).toHaveBeenCalledWith(11);
    expect(db.getStrategyByPolicyId).toHaveBeenCalledWith(7, 11);
    expect(db.getTaskCompletions).toHaveBeenCalledWith(11, 31);
    expect(db.getDocumentsByUserId).toHaveBeenCalledWith(11);
    expect(db.getUserContacts).toHaveBeenCalledWith(11);
    expect(payload()).toMatchObject({ _meta: { trigger, formStep: 0, sessionDurationSeconds: 0 }, policyForm: { insuredEmail: 'insured@example.com', insuredPhone: '8642446300', poa_name: 'QA representative', careNeeds: ['Bathing'] }, strategy: { policyId: 7, stage1Tasks: [{ completed: false }] }, contacts: [{ receiveCcEmails: 0 }], unsavedFormData: null });
    expect(JSON.stringify(payload())).not.toContain('DO-NOT-SEND');
    expect(request.mock.calls[0][1]).toMatchObject({ redirect: 'error', method: 'POST' });
    expect(request.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it('includes unsaved known answers without accepting injected ownership or secret fields', async () => {
    await caller().policyForm.sendComprehensiveToZapier({ trigger: 'exit', unsavedFormData: { id: 99, userId: 99, insuredFullName: 'Current draft', careNeeds: ['Dressing'], poa_name: 'Draft POA', insuredSsn: 'PRIVATE', token: 'SECRET' } });
    expect(payload().unsavedFormData).toEqual({ insuredFullName: 'Current draft', careNeeds: ['Dressing'], poa_name: 'Draft POA' });
  });
  it.each([['completed', 'form_completed'], ['exit', 'exit'], ['timeout', 'timeout'], ['save', 'exit']] as const)('normalizes legacy %s to the same contract', async (trigger, expected) => {
    await caller().policyForm.sendToZapier({ trigger, currentStep: 0, sessionDurationSeconds: 0, formData: { insuredEmail: 'draft@example.com' } });
    expect(payload()).toMatchObject({ _meta: { trigger: expected, formStep: 0, sessionDurationSeconds: 0 }, unsavedFormData: { insuredEmail: 'draft@example.com' }, contacts: [{ receiveCcEmails: 0 }] });
  });
  it.each(['', 'http://example.com', 'invalid'])('does not call an absent or unsafe webhook: %s', async url => {
    ENV.zapierWebhookUrl = url;
    expect(await caller().policyForm.sendComprehensiveToZapier({ trigger: 'form_completed' })).toMatchObject({ success: false, status: 'failed' });
    expect(request).not.toHaveBeenCalled();
  });
  it.each([302, 403, 500])('does not claim success on provider status %s', async status => {
    request.mockResolvedValue({ ok: false, status });
    expect(await caller().policyForm.sendComprehensiveToZapier({ trigger: 'form_completed' })).toMatchObject({ success: false });
  });
  it('contains transport failures without returning provider details', async () => {
    request.mockRejectedValue(new Error('SECRET_PROVIDER_URL'));
    const result = await caller().policyForm.sendToZapier({ trigger: 'exit' });
    expect(result.success).toBe(false); expect(result.message).not.toContain('SECRET');
  });
  it('rejects out-of-range steps before collecting or sending data', async () => {
    await expect(caller().policyForm.sendComprehensiveToZapier({ trigger: 'exit', formStep: 6 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(db.getPolicyByUserId).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
  });
});
