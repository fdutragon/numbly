import { describe, it, expect, beforeEach } from 'vitest';
import { db, type ChatMsg, type Document } from './db';
import { upsertDocument, addChatMessage, getChatMessages } from './dao';

// Clear tables before each test
beforeEach(async () => {
  await db.documents.clear();
  await db.chat_messages.clear();
  await db.outbox.clear();
});

describe('dao', () => {
  it('persists chat messages', async () => {
    const doc: Document = {
      id: 'doc1',
      title: 'Test',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    upsertDocument(doc);
    const msg: ChatMsg = {
      id: 'm1',
      document_id: 'doc1',
      role: 'user',
      content: 'hi',
      created_at: new Date().toISOString(),
    };
    addChatMessage(msg);
    // Wait for debounce flush
    await new Promise((r) => setTimeout(r, 600));
    const msgs = await getChatMessages('doc1');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('hi');
  });
});
