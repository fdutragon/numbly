import { createClient } from '@supabase/supabase-js';
import { db } from '@/data/db';

const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supa = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true } });

type Row = Record<string, unknown>;
const tables = ['documents', 'clauses', 'ai_edits', 'chat_messages', 'autocomplete_cache', 'flags'] as const;
const tableMap = {
  documents: db.documents,
  clauses: db.clauses,
  ai_edits: db.ai_edits,
  chat_messages: db.chat_messages,
  autocomplete_cache: db.autocomplete_cache,
  flags: db.flags,
} as const;

export async function pushOutbox() {
  const items = await db.outbox.orderBy('updated_at').toArray();
  if (!items.length) return;
  for (const it of items) {
    const { error } = await supa.from(it.table).upsert(it.payload, { onConflict: 'id' });
    if (!error) await db.outbox.delete(it.id);
  }
}

export async function pullSince(sinceISO: string) {
  for (const t of tables) {
    const { data, error } = await supa.from(t).select('*').gt('updated_at', sinceISO);
    if (error || !data) continue;
    await db.transaction('rw', tableMap[t], async () => {
      for (const row of data as Row[]) {
        const local = await tableMap[t].get(row.id);
        if (!local || new Date(row.updated_at as string) > new Date(local.updated_at)) {
          await tableMap[t].put(row);
        }
      }
    });
  }
}

export async function migrateGuestToUser(userId: string) {
  await pushOutbox();
}
