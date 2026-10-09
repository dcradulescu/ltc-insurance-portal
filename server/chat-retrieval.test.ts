import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { chatRouter } from './routers/chat';
import { getDb, getPolicyById } from './db';
import { invokeLLM } from './_core/llm';
import type { TrpcContext } from './_core/context';
vi.mock('./db', () => ({ getDb: vi.fn(), getPolicyById: vi.fn() }));
vi.mock('./_core/llm', () => ({ invokeLLM: vi.fn() }));
const queries: Array<{ sql: string; params: unknown[] }> = [];
const caller = (id: number) => chatRouter.createCaller({ user: { id }, req: { headers: {} }, res: {} } as TrpcContext);
beforeEach(() => {
  vi.clearAllMocks(); queries.length = 0;
  vi.mocked(getPolicyById).mockResolvedValue(undefined);
  vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: 'QA answer' } }] } as any);
  vi.mocked(getDb).mockResolvedValue({
    insert: () => ({ values: async () => {} }),
    select: (fields: unknown) => ({ from: () => ({ where: (filter: any) => ({
      orderBy: () => ({ limit: async () => [] }),
      limit: async () => {
        if (!fields) return [];
        queries.push(new MySqlDialect().sqlToQuery(filter));
        return [{ title: 'Owned active reference', content: 'QA retrieved evidence' }];
      },
    }) }) }),
  } as any);
});
describe('chat knowledge retrieval authorization', () => {
  it.each([7, 8])('requires active documents belonging to visitor %s in the actual SQL predicate', async id => {
    await caller(id).send({ message: 'Explain elimination', sessionId: 'qa' });
    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('`ragDocuments`.`userId` = ?');
    expect(queries[0].sql).toContain('`ragDocuments`.`isActive` = ?');
    expect(queries[0].sql).toContain(' and ');
    expect(queries[0].params.slice(0, 2)).toEqual([id, true]);
    expect(queries[0].params).toContain('%elimination%');
    const messages = vi.mocked(invokeLLM).mock.calls[0][0].messages;
    expect(JSON.stringify(messages)).toContain('QA retrieved evidence');
  });
  it('continues with built-in context when no private knowledge is available', async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await caller(7).send({ message: 'Explain elimination' });
    expect(queries).toHaveLength(0);
    const messages = JSON.stringify(vi.mocked(invokeLLM).mock.calls[0][0].messages);
    expect(messages).toContain('GLOSSARY OF LTC INSURANCE TERMS');
    expect(messages).not.toContain('RELEVANT KNOWLEDGE BASE DOCUMENTS');
  });
});
