import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/data/db';
import { pushOutbox, pullSince } from './supabase';

const mockData: Record<string, unknown[]> = { documents: [] };

vi.mock('@supabase/supabase-js', () => {
  const gt = vi.fn(async () => ({ data: mockData.documents, error: null }));
  const select = vi.fn(() => ({ gt }));
  const upsert = vi.fn(async () => ({ data: null, error: null }));
  return {
    createClient: () => ({ from: () => ({ upsert, select }) }),
  };
});

beforeEach(async () => {
  await db.outbox.clear();
  await db.documents.clear();
});

describe('supabase sync', () => {
  it('pushOutbox clears processed items', async () => {
    await db.outbox.put({ id: '1', table: 'documents', op: 'upsert', payload: { id: '1' }, updated_at: new Date().toISOString() });
    await pushOutbox();
    expect(await db.outbox.count()).toBe(0);
  });

  it('pullSince updates newer rows', async () => {
    const old = { id: 'doc1', title: 'Old', status: 'draft', created_at: '0', updated_at: '0' };
    await db.documents.put(old);
    const newer = { ...old, title: 'New', updated_at: new Date().toISOString() };
    mockData.documents = [newer];
    await pullSince('1970-01-01');
    const saved = await db.documents.get('doc1');
    expect(saved?.title).toBe('New');
  });
});
