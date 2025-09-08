import { db, type Document, type Clause, type ClauseIndex, type AiEdit, type ChatMsg } from './db';

// Verificar se o IndexedDB está disponível
function isDBAvailable(): boolean {
  return typeof window !== 'undefined' && db && typeof db.transaction === 'function';
}

// Timer global para debounce de saves
let saveTimer: NodeJS.Timeout | undefined;

/**
 * Função de debounce genérica para operações de I/O
 * @param fn Função a ser executada
 * @param ms Milissegundos de delay (padrão 400ms)
 */
export function debounced<T extends (...args: any[]) => Promise<any>>(fn: T, ms = 400): T {
  return ((...args: Parameters<T>) => {
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      saveTimer = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, ms);
    });
  }) as T;
}

/**
 * Enfileira operação para sincronização com Supabase
 */
async function enqueueOutbox(table: string, op: 'upsert' | 'delete', payload: any): Promise<void> {
  if (!isDBAvailable()) return;
  
  await db.outbox.put({ 
    id: crypto.randomUUID(), 
    table, 
    op, 
    payload, 
    updated_at: new Date().toISOString() 
  });
}

// === OPERAÇÕES DE DOCUMENTO ===

/**
 * Cria ou atualiza um documento
 */
export async function upsertDocument(doc: Omit<Document, 'updated_at'>): Promise<Document> {
  if (!isDBAvailable()) {
    return { ...doc, updated_at: new Date().toISOString() };
  }
  
  return await db.transaction('rw', [db.documents, db.outbox], async () => {
    const documentWithTimestamp: Document = {
      ...doc,
      updated_at: new Date().toISOString()
    };
    
    await db.documents.put(documentWithTimestamp);
    await enqueueOutbox('documents', 'upsert', documentWithTimestamp);
    
    return documentWithTimestamp;
  });
}

/**
 * Busca um documento por ID
 */
export async function getDocument(id: string): Promise<Document | undefined> {
  if (!isDBAvailable()) return undefined;
  return await db.documents.get(id);
}

/**
 * Lista todos os documentos
 */
export async function listDocuments(): Promise<Document[]> {
  if (!isDBAvailable()) return [];
  return await db.documents.orderBy('updated_at').reverse().toArray();
}

/**
 * Remove um documento e todas suas cláusulas relacionadas
 */
export async function deleteDocument(id: string): Promise<void> {
  await db.transaction('rw', [db.documents, db.clauses, db.clause_index, db.ai_edits, db.chat_messages, db.outbox], async () => {
    // Remove documento
    await db.documents.delete(id);
    
    // Remove cláusulas relacionadas
    const clauses = await db.clauses.where('document_id').equals(id).toArray();
    const clauseIds = clauses.map(c => c.id);
    
    await db.clauses.where('document_id').equals(id).delete();
    await db.clause_index.where('clause_id').anyOf(clauseIds).delete();
    await db.ai_edits.where('document_id').equals(id).delete();
    await db.chat_messages.where('document_id').equals(id).delete();
    
    // Enfileira remoção para sync
    await enqueueOutbox('documents', 'delete', { id });
  });
}

// === OPERAÇÕES DE CLÁUSULA ===

/**
 * Cria ou atualiza múltiplas cláusulas de forma transacional
 */
export async function upsertClauses(clauses: Omit<Clause, 'updated_at'>[]): Promise<Clause[]> {
  return await db.transaction('rw', [db.clauses, db.outbox], async () => {
    const now = new Date().toISOString();
    const clausesWithTimestamp: Clause[] = clauses.map(c => ({
      ...c,
      updated_at: now
    }));
    
    await db.clauses.bulkPut(clausesWithTimestamp);
    
    // Enfileira cada cláusula para sync
    for (const clause of clausesWithTimestamp) {
      await enqueueOutbox('clauses', 'upsert', clause);
    }
    
    return clausesWithTimestamp;
  });
}

/**
 * Busca cláusulas de um documento ordenadas por order_index
 */
export async function getClausesByDocument(documentId: string): Promise<Clause[]> {
  return await db.clauses
    .where('document_id')
    .equals(documentId)
    .sortBy('order_index');
}

/**
 * Busca uma cláusula específica
 */
export async function getClause(id: string): Promise<Clause | undefined> {
  return await db.clauses.get(id);
}

/**
 * Atualiza a ordem das cláusulas
 */
export async function reorderClauses(documentId: string, clauseIds: string[]): Promise<void> {
  await db.transaction('rw', [db.clauses, db.outbox], async () => {
    const clauses = await db.clauses.where('document_id').equals(documentId).toArray();
    const clauseMap = new Map(clauses.map(c => [c.id, c]));
    
    const updates: Clause[] = [];
    clauseIds.forEach((clauseId, index) => {
      const clause = clauseMap.get(clauseId);
      if (clause && clause.order_index !== index) {
        const updatedClause = { ...clause, order_index: index };
        updates.push(updatedClause);
      }
    });
    
    if (updates.length > 0) {
      await db.clauses.bulkPut(updates);
      for (const clause of updates) {
        await enqueueOutbox('clauses', 'upsert', clause);
      }
    }
  });
}

// === OPERAÇÕES DE ÍNDICE DE CLÁUSULAS ===

/**
 * Cria ou atualiza índice de cláusula para contexto de IA
 */
export async function upsertClauseIndex(index: ClauseIndex): Promise<void> {
  await db.transaction('rw', [db.clause_index, db.outbox], async () => {
    await db.clause_index.put(index);
    await enqueueOutbox('clause_index', 'upsert', index);
  });
}

/**
 * Busca índice de uma cláusula
 */
export async function getClauseIndex(clauseId: string): Promise<ClauseIndex | undefined> {
  return await db.clause_index.where('clause_id').equals(clauseId).first();
}

// === OPERAÇÕES DE EDIÇÕES IA ===

/**
 * Registra uma edição feita pela IA
 */
export async function logAiEdit(edit: Omit<AiEdit, 'id' | 'created_at'>): Promise<AiEdit> {
  return await db.transaction('rw', [db.ai_edits, db.outbox], async () => {
    const aiEdit: AiEdit = {
      ...edit,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    
    await db.ai_edits.put(aiEdit);
    await enqueueOutbox('ai_edits', 'upsert', aiEdit);
    
    return aiEdit;
  });
}

/**
 * Busca edições de IA de um documento
 */
export async function getAiEditsByDocument(documentId: string): Promise<AiEdit[]> {
  return await db.ai_edits
    .where('document_id')
    .equals(documentId)
    .reverse()
    .sortBy('created_at');
}

// === OPERAÇÕES DE CHAT ===

/**
 * Adiciona mensagem ao chat
 */
export async function addChatMessage(message: Omit<ChatMsg, 'id' | 'created_at'>): Promise<ChatMsg> {
  return await db.transaction('rw', [db.chat_messages, db.outbox], async () => {
    const chatMsg: ChatMsg = {
      ...message,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    
    await db.chat_messages.put(chatMsg);
    await enqueueOutbox('chat_messages', 'upsert', chatMsg);
    
    return chatMsg;
  });
}

/**
 * Busca mensagens de chat de um documento
 */
export async function getChatMessages(documentId: string, limit = 50): Promise<ChatMsg[]> {
  return await db.chat_messages
    .where('document_id')
    .equals(documentId)
    .reverse()
    .sortBy('created_at')
    .then(messages => messages.slice(0, limit));
}

// === CACHE DE AUTOCOMPLETE ===

/**
 * Armazena sugestão de autocomplete em cache
 */
export async function cacheAutocompleteSuggestion(
  clauseId: string | null, 
  suggestion: string
): Promise<void> {
  await db.autocomplete_cache.put({
    id: crypto.randomUUID(),
    clause_id: clauseId,
    suggestion,
    created_at: new Date().toISOString()
  });
}

/**
 * Busca sugestões em cache
 */
export async function getCachedSuggestions(clauseId: string | null, limit = 5): Promise<string[]> {
  if (clauseId === null) {
    return [];
  }
  
  const cache = await db.autocomplete_cache
    .where('clause_id')
    .equals(clauseId)
    .reverse()
    .limit(limit)
    .toArray();
    
  return cache.map(c => c.suggestion);
}

// === LIMPEZA E MANUTENÇÃO ===

/**
 * Remove itens antigos do cache de autocomplete
 */
export async function cleanupAutocompleteCache(daysOld = 7): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffIso = cutoffDate.toISOString();
  
  await db.autocomplete_cache
    .where('created_at')
    .below(cutoffIso)
    .delete();
}

/**
 * Estatísticas do banco de dados
 */
export async function getDatabaseStats(): Promise<{
  documents: number;
  clauses: number;
  aiEdits: number;
  chatMessages: number;
  pendingSync: number;
}> {
  const [documents, clauses, aiEdits, chatMessages, pendingSync] = await Promise.all([
    db.documents.count(),
    db.clauses.count(),
    db.ai_edits.count(),
    db.chat_messages.count(),
    db.outbox.count()
  ]);
  
  return {
    documents,
    clauses,
    aiEdits,
    chatMessages,
    pendingSync
  };
}

// Versões debounced das operações principais para melhor performance
export const debouncedUpsertDocument = debounced(upsertDocument, 800);
export const debouncedUpsertClauses = debounced(upsertClauses, 600);
export const debouncedReorderClauses = debounced(reorderClauses, 300);
