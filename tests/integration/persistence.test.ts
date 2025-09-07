import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/data/db';
import { upsertDocument, upsertClause } from '@/data/dao';

beforeEach(async () => {
  await db.documents.clear();
  await db.clauses.clear();
  await db.outbox.clear();
});

describe('persistence flow', () => {
  it('saves and retrieves documents and clauses', async () => {
    const now = new Date().toISOString();
    upsertDocument({ id: 'd1', title: 'Doc', status: 'draft', created_at: now, updated_at: now });
    upsertClause({ id: 'c1', document_id: 'd1', order_index: 0, title: 'T', body: 'B', hash: 'h', updated_at: now });
    await new Promise((r) => setTimeout(r, 600));
    const doc = await db.documents.get('d1');
    const clauses = await db.clauses.where('document_id').equals('d1').toArray();
    expect(doc?.title).toBe('Doc');
    expect(clauses).toHaveLength(1);
  });
});
