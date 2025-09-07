import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/data/db';
import { upsertDocument } from '@/data/dao';
import { pushOutbox } from '@/sync/supabase';

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({ from: () => ({ upsert: async () => ({ data: null, error: null }) }) }),
  };
});

beforeEach(async () => {
  await db.documents.clear();
  await db.outbox.clear();
});

describe('sync flow', () => {
  it('writes offline then clears outbox on sync', async () => {
    const now = new Date().toISOString();
    upsertDocument({ id: 'd1', title: 'Doc', status: 'draft', created_at: now, updated_at: now });
    await new Promise((r) => setTimeout(r, 600));
    expect(await db.outbox.count()).toBe(1);
    await pushOutbox();
    expect(await db.outbox.count()).toBe(0);
  });
});
