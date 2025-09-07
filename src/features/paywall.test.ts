import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/data/db';
import { canUseAI, markFreeAiUsed } from './paywall';

beforeEach(async () => {
  await db.flags.clear();
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  });
});

describe('paywall', () => {
  it('allows one free AI usage', async () => {
    expect(await canUseAI()).toBe(true);
    await markFreeAiUsed();
    expect(await canUseAI()).toBe(false);
  });
});
