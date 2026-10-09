import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import { deliver } from './_core/delivery';
import { invokeLLM } from './_core/llm';
import type { TrpcContext } from './_core/context';
import { applyTaskCompletions, isStrategyPolicyComplete } from '../shared/strategyState';

vi.mock('./db', async original => ({
  ...await original<typeof import('./db')>(),
  createUserContact: vi.fn(), updateUserContact: vi.fn(), deleteUserContact: vi.fn(),
  getStrategyById: vi.fn(), saveTaskCompletion: vi.fn(), getPolicyById: vi.fn(),
  getStrategyByPolicyId: vi.fn(), createStrategy: vi.fn(), updateStrategy: vi.fn(),
}));
vi.mock('./_core/delivery', async original => ({ ...await original<typeof import('./_core/delivery')>(), deliver: vi.fn() }));
vi.mock('./_core/llm', () => ({ invokeLLM: vi.fn() }));
const policy = {
  id: 7, userId: 11, insuredFullName: 'Saved person', insuredEmail: 'person@example.com',
  insuredPhone: '8642446300', carrierName: 'Test carrier', policyNumber: 'TEST-7',
  eliminationPeriod: '0', dailyMaximum: '$250', lifetimeMaximum: '$100,000',
  minAdlsRequired: '2', cognitiveImpairmentTrigger: 'yes',
  equipmentAllowance: JSON.stringify({ careNeeds: ['NoneADL'], diagnosisCheckboxes: ['Other'] }),
};
const caller = (id = 11) => appRouter.createCaller({ user: { id }, req: { headers: {} }, res: {} } as TrpcContext);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.createUserContact).mockResolvedValue(23);
  vi.mocked(db.updateUserContact).mockResolvedValue(true);
  vi.mocked(db.deleteUserContact).mockResolvedValue(true);
  vi.mocked(deliver).mockResolvedValue({ success: true, status: 'accepted', message: 'Accepted for delivery' } as any);
  vi.mocked(db.getPolicyById).mockResolvedValue(policy as any);
  vi.mocked(db.getStrategyByPolicyId).mockResolvedValue(undefined);
  vi.mocked(db.createStrategy).mockResolvedValue(31);
  vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: '<p>Test plan</p>' } }] } as any);
  vi.mocked(db.getStrategyById).mockResolvedValue({ id: 31, userId: 11, stage1Tasks: [{ id: 's1-1', label: 'Stored task', completed: true }] } as any);
});

describe('contact and profile inputs', () => {
  it('normalizes contacts and binds creation to the current visitor', async () => {
    await caller().contacts.add({ name: '  Care Partner  ', email: ' care@example.com ', relationship: ' Sister ', receiveCcEmails: 0 });
    expect(db.createUserContact).toHaveBeenCalledWith({ name: 'Care Partner', email: 'care@example.com', relationship: 'Sister', receiveCcEmails: 0, userId: 11 });
  });
  it.each([{ name: ' ', email: 'care@example.com' }, { name: 'Person', email: 'bad' }, { name: 'Person', email: 'care@example.com', receiveCcEmails: 2 }])('rejects invalid contacts before storage: %j', async input => {
    await expect(caller().contacts.add(input)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(db.createUserContact).not.toHaveBeenCalled();
  });
  it('preserves an explicit empty relationship when updating', async () => {
    await caller().contacts.update({ id: 23, relationship: '' });
    expect(db.updateUserContact).toHaveBeenCalledWith(23, 11, { relationship: '' });
  });
  it('reports missing or unowned contacts instead of successful update/delete', async () => {
    vi.mocked(db.updateUserContact).mockResolvedValue(false);
    vi.mocked(db.deleteUserContact).mockResolvedValue(false);
    await expect(caller(12).contacts.update({ id: 23, name: 'Changed' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(caller(12).contacts.delete({ id: 23 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(db.updateUserContact).toHaveBeenCalledWith(23, 12, { name: 'Changed' });
    expect(db.deleteUserContact).toHaveBeenCalledWith(23, 12);
  });
  it('rejects blank profile updates', async () => {
    await expect(caller().auth.updateProfile({ name: '  ' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
  it('rejects whitespace-only messages without calling delivery', async () => {
    await expect(caller().email.sendContactForm({ name: 'Person', email: 'p@example.com', subject: 'general', message: ' \n ' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(deliver).not.toHaveBeenCalled();
  });
  it('normalizes a valid contact handoff', async () => {
    await caller().email.sendContactForm({ name: ' Person ', email: ' p@example.com ', subject: 'general', message: ' Please help. ' });
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ type: 'contact_form', name: 'Person', email: 'p@example.com', message: 'Please help.' }));
  });
});

describe('strategy saved state', () => {
  it('explicit false overrides legacy completion while unsaved tasks retain their value', () => {
    expect(applyTaskCompletions([{ id: 'a', completed: true }, { id: 'b', completed: true }], [{ taskId: 'a', completed: false }])).toEqual([{ id: 'a', completed: false }, { id: 'b', completed: true }]);
  });
  it('accepts complete forms with zero waiting days without treating ADL counts as eligibility', async () => {
    expect(isStrategyPolicyComplete({ ...policy, careNeeds: ['NoneADL'], diagnosisCheckboxes: ['Other'] })).toBe(true);
    await caller().strategy.generate({ policyId: 7 });
    expect(db.createStrategy).toHaveBeenCalledWith(expect.objectContaining({ policyId: 7, userId: 11 }));
  });
  it('rejects incomplete saved policies before invoking a model', async () => {
    vi.mocked(db.getPolicyById).mockResolvedValue({ ...policy, dailyMaximum: '-10' } as any);
    await expect(caller().strategy.generate({ policyId: 7 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(invokeLLM).not.toHaveBeenCalled();
  });
  it('does not generate or modify another visitor strategy', async () => {
    await expect(caller(12).strategy.generate({ policyId: 7 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(caller(12).strategy.saveTaskCompletion({ strategyId: 31, taskId: 's1-1', taskTitle: 'Injected', stage: 1, completed: false })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(invokeLLM).not.toHaveBeenCalled();
    expect(db.saveTaskCompletion).not.toHaveBeenCalled();
  });
  it('uses the saved task title and accepts unchecking a task', async () => {
    await caller().strategy.saveTaskCompletion({ strategyId: 31, taskId: 's1-1', taskTitle: 'Injected', stage: 1, completed: false });
    expect(db.saveTaskCompletion).toHaveBeenCalledWith(11, 31, 's1-1', 'Stored task', 1, false);
  });
  it('rejects task IDs outside the selected stage', async () => {
    await expect(caller().strategy.saveTaskCompletion({ strategyId: 31, taskId: 's1-1', taskTitle: 'Task', stage: 2, completed: true })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(db.saveTaskCompletion).not.toHaveBeenCalled();
  });
  it('rejects any invalid recipient rather than silently omitting them', async () => {
    await expect(caller().email.sendStrategy({ strategyId: 31, recipients: ['valid@example.com', 'bad'] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(deliver).not.toHaveBeenCalled();
  });
  it('trims and deduplicates recipients in accepted strategy handoffs', async () => {
    await caller().email.sendStrategy({ strategyId: 31, recipients: [' person@example.com ', 'PERSON@example.com'] });
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ recipients: ['person@example.com'] }));
  });
});
