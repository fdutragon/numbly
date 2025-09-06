import { db, type Document, type Clause } from './db';

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const queue: Array<() => Promise<void>> = [];

function scheduleFlush(delay = 500) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const ops = [...queue];
    queue.length = 0;
    for (const op of ops) {
      await op();
    }
  }, delay);
}

export function upsertDocument(doc: Document) {
  const op = async () => {
    const updated = { ...doc, updated_at: new Date().toISOString() };
    await db.transaction('rw', db.documents, db.outbox, async () => {
      await db.documents.put(updated);
      await db.outbox.put({
        id: crypto.randomUUID(),
        table: 'documents',
        op: 'upsert',
        payload: updated,
        updated_at: updated.updated_at,
      });
    });
  };
  queue.push(op);
  scheduleFlush();
}

export function upsertClause(clause: Clause) {
  const op = async () => {
    const updated = { ...clause, updated_at: new Date().toISOString() };
    await db.transaction('rw', db.clauses, db.outbox, async () => {
      await db.clauses.put(updated);
      await db.outbox.put({
        id: crypto.randomUUID(),
        table: 'clauses',
        op: 'upsert',
        payload: updated,
        updated_at: updated.updated_at,
      });
    });
  };
  queue.push(op);
  scheduleFlush();
}
