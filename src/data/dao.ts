import {
  db,
  type Document,
  type Clause,
  type ClauseIndex,
  type ChatMsg,
} from './db';

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
    const index: ClauseIndex = {
      id: clause.id,
      clause_id: clause.id,
      start_offset: 0,
      end_offset: clause.body.length,
      summary: clause.body.slice(0, 100),
    };
    await db.transaction(
      'rw',
      db.clauses,
      db.clause_index,
      db.outbox,
      async () => {
        await db.clauses.put(updated);
        await db.clause_index.put(index);
        await db.outbox.put({
          id: crypto.randomUUID(),
          table: 'clauses',
          op: 'upsert',
          payload: updated,
          updated_at: updated.updated_at,
        });
        await db.outbox.put({
          id: crypto.randomUUID(),
          table: 'clause_index',
          op: 'upsert',
          payload: index,
          updated_at: updated.updated_at,
        });
      },
    );
  };
  queue.push(op);
  scheduleFlush();
}

export function addChatMessage(message: ChatMsg) {
  const op = async () => {
    await db.transaction('rw', db.chat_messages, db.outbox, async () => {
      await db.chat_messages.put(message);
      await db.outbox.put({
        id: crypto.randomUUID(),
        table: 'chat_messages',
        op: 'upsert',
        payload: message,
        updated_at: message.created_at,
      });
    });
  };
  queue.push(op);
  scheduleFlush();
}

export function listChatMessages(documentId: string) {
  return db.chat_messages
    .where('document_id')
    .equals(documentId)
    .sortBy('created_at');
}
