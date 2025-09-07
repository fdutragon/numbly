import { db } from '@/data/db';

export async function canUseAI(): Promise<boolean> {
  const f = await db.flags.get('usage');
  return Boolean(f && (f.feature_unlocked?.includes('ai') || !f.free_ai_used));
}

export async function markFreeAiUsed() {
  const now = new Date().toISOString();
  const prev =
    (await db.flags.get('usage')) ??
    { id: 'usage', free_ai_used: false, guest_id: getOrCreateGuestId(), feature_unlocked: [], updated_at: now };
  prev.free_ai_used = true;
  prev.updated_at = now;
  await db.flags.put(prev);
}

function getOrCreateGuestId() {
  const k = 'guest_id';
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(k, v);
  }
  return v;
}
