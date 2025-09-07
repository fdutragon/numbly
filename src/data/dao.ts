import {
  db,
  type Document,
  type Clause,
  type ClauseIndex,
  type ChatMsg,
} from './db';

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const queue: Array<() => Promise<void>> = [];
let isProcessing = false;

function scheduleFlush(delay = 500) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const ops = [...queue];
      queue.length = 0;
      for (const op of ops) {
        try {
          await op();
        } catch (error) {
          console.error('Error processing queue operation:', error);
        }
      }
    } finally {
      isProcessing = false;
    }
  }, delay);
}

// Função para verificar se o IndexedDB está disponível
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && indexedDB !== null;
  } catch {
    return false;
  }
}

// Função para inicializar o banco de dados
export async function initializeDB(): Promise<boolean> {
  try {
    if (!isIndexedDBAvailable()) {
      console.warn('IndexedDB não está disponível');
      return false;
    }
    await db.open();
    console.log('IndexedDB inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar IndexedDB:', error);
    return false;
  }
}

export function upsertDocument(doc: Document) {
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB não disponível, operação ignorada');
    return;
  }
  
  const op = async () => {
    try {
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
      console.log('Documento salvo:', updated.id);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      throw error;
    }
  };
  queue.push(op);
  scheduleFlush();
}

// Função para recuperar um documento
export async function getDocument(id: string): Promise<Document | undefined> {
  try {
    if (!isIndexedDBAvailable()) return undefined;
    return await db.documents.get(id);
  } catch (error) {
    console.error('Erro ao recuperar documento:', error);
    return undefined;
  }
}

// Função para listar todos os documentos
export async function listDocuments(): Promise<Document[]> {
  try {
    if (!isIndexedDBAvailable()) return [];
    return await db.documents.toArray();
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return [];
  }
}

export function upsertClause(clause: Clause) {
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB não disponível, operação ignorada');
    return;
  }
  
  const op = async () => {
    try {
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
      console.log('Cláusula salva:', updated.id);
    } catch (error) {
      console.error('Erro ao salvar cláusula:', error);
      throw error;
    }
  };
  queue.push(op);
  scheduleFlush();
}

export function addChatMessage(message: ChatMsg) {
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB não disponível, operação ignorada');
    return;
  }
  
  const op = async () => {
    try {
      await db.transaction('rw', db.chat_messages, db.outbox, async () => {
        await db.chat_messages.add(message);
        await db.outbox.put({
          id: crypto.randomUUID(),
          table: 'chat_messages',
          op: 'upsert',
          payload: message,
          updated_at: new Date().toISOString(),
        });
      });
      console.log('Mensagem de chat salva:', message.id);
    } catch (error) {
      console.error('Erro ao salvar mensagem de chat:', error);
      throw error;
    }
  };
  queue.push(op);
  scheduleFlush();
}

// Função para recuperar cláusulas de um documento
export async function getClausesByDocument(documentId: string): Promise<Clause[]> {
  try {
    if (!isIndexedDBAvailable()) return [];
    return await db.clauses.where('document_id').equals(documentId).toArray();
  } catch (error) {
    console.error('Erro ao recuperar cláusulas:', error);
    return [];
  }
}

// Função para recuperar uma cláusula específica
export async function getClause(id: string): Promise<Clause | undefined> {
  try {
    if (!isIndexedDBAvailable()) return undefined;
    return await db.clauses.get(id);
  } catch (error) {
    console.error('Erro ao recuperar cláusula:', error);
    return undefined;
  }
}

// Função para recuperar mensagens de chat de um documento
export async function getChatMessages(documentId: string): Promise<ChatMsg[]> {
  try {
    if (!isIndexedDBAvailable()) return [];
    return await db.chat_messages
      .where('document_id')
      .equals(documentId)
      .sortBy('created_at');
  } catch (error) {
    console.error('Erro ao recuperar mensagens de chat:', error);
    return [];
  }
}

// Função para limpar dados antigos (manutenção)
export async function cleanupOldData(daysOld = 30): Promise<void> {
  try {
    if (!isIndexedDBAvailable()) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();
    
    await db.transaction('rw', db.outbox, async () => {
      await db.outbox.where('updated_at').below(cutoffISO).delete();
    });
    
    console.log('Limpeza de dados antigos concluída');
  } catch (error) {
    console.error('Erro na limpeza de dados:', error);
  }
}

// Função para verificar status da sincronização
export async function getSyncStatus(): Promise<{ pending: number; lastSync?: string }> {
  try {
    if (!isIndexedDBAvailable()) return { pending: 0 };
    
    const pending = await db.outbox.count();
    const lastItem = await db.outbox.orderBy('updated_at').last();
    
    return {
      pending,
      lastSync: lastItem?.updated_at
    };
  } catch (error) {
    console.error('Erro ao verificar status de sincronização:', error);
    return { pending: 0 };
  }
}
