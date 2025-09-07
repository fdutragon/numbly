import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/data/db';
import { suggestForClause } from './ghost';

vi.mock('openai', () => {
  return {
    OpenAI: class {
      chat = { completions: { create: async () => ({ choices: [{ message: { content: 'ok' } }] }) } };
    },
  };
});

beforeEach(async () => {
  await db.clauses.clear();
  await db.clause_index.clear();
});

describe('ghost suggestions', () => {
  it('returns suggestion text', async () => {
    const id = 'c1';
    const now = new Date().toISOString();
    await db.clauses.put({ id, document_id: 'd1', order_index: 1, title: 'T', body: 'B', hash: 'h', updated_at: now });
    await db.clause_index.put({ id: 'idx1', clause_id: id, start_offset: 0, end_offset: 1, summary: 's' });
    const res = await suggestForClause(id);
    expect(res).toBe('ok');
  });
});
