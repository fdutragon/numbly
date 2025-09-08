import Dexie, { Table } from 'dexie';

export interface Document { 
  id: string; 
  title: string; 
  status: 'draft' | 'readonly'; 
  created_at: string; 
  updated_at: string; 
}

export interface Clause { 
  id: string; 
  document_id: string; 
  order_index: number; 
  title: string; 
  body: string; 
  hash: string; 
  updated_at: string; 
}

export interface ClauseIndex { 
  id: string; 
  clause_id: string; 
  start_offset: number; 
  end_offset: number; 
  summary: string; 
}

export interface AiEdit { 
  id: string; 
  document_id: string; 
  clause_id: string | null; 
  diff: string; 
  applied_by: 'user' | 'ai'; 
  created_at: string; 
}

export interface ChatMsg { 
  id: string; 
  document_id: string; 
  role: 'user' | 'assistant' | 'system'; 
  content: string; 
  created_at: string; 
}

export interface AutocompleteCache { 
  id: string; 
  clause_id: string | null; 
  suggestion: string; 
  created_at: string; 
}

export interface Flags { 
  id: 'usage'; 
  free_ai_used: boolean; 
  guest_id: string; 
  feature_unlocked: string[]; 
  updated_at: string; 
}

export interface Outbox { 
  id: string; 
  table: string; 
  op: 'upsert' | 'delete'; 
  payload: any; 
  updated_at: string; 
}

export class AppDB extends Dexie {
  documents!: Table<Document, string>;
  clauses!: Table<Clause, string>;
  clause_index!: Table<ClauseIndex, string>;
  ai_edits!: Table<AiEdit, string>;
  chat_messages!: Table<ChatMsg, string>;
  autocomplete_cache!: Table<AutocompleteCache, string>;
  flags!: Table<Flags, string>;
  outbox!: Table<Outbox, string>;

  constructor() {
    super('legalEditorDB');
    this.version(1).stores({
      documents: 'id, updated_at, status',
      clauses: 'id, document_id, order_index, updated_at, [document_id+order_index]',
      clause_index: 'id, clause_id',
      ai_edits: 'id, document_id, clause_id, created_at',
      chat_messages: 'id, document_id, created_at',
      autocomplete_cache: 'id, clause_id, created_at',
      flags: 'id, updated_at',
      outbox: 'id, table, updated_at'
    });

    // Hooks para garantir updated_at sempre atualizado
    this.documents.hook('creating', function (primKey, obj: Document, trans) {
      obj.updated_at = new Date().toISOString();
    });

    this.documents.hook('updating', function (modifications: Partial<Document>, primKey, obj, trans) {
      const next = { ...modifications, updated_at: new Date().toISOString() } as Partial<Document>;
      return next;
    });

    this.clauses.hook('creating', function (primKey, obj: Clause, trans) {
      obj.updated_at = new Date().toISOString();
    });

    this.clauses.hook('updating', function (modifications: Partial<Clause>, primKey, obj, trans) {
      const next = { ...modifications, updated_at: new Date().toISOString() } as Partial<Clause>;
      return next;
    });

    this.flags.hook('creating', function (primKey, obj: Flags, trans) {
      obj.updated_at = new Date().toISOString();
    });

    this.flags.hook('updating', function (modifications: Partial<Flags>, primKey, obj, trans) {
      const next = { ...modifications, updated_at: new Date().toISOString() } as Partial<Flags>;
      return next;
    });
  }

  // Método para inicializar dados padrão
  async initializeDefaults() {
    const existingFlags = await this.flags.get('usage');
    if (!existingFlags) {
      await this.flags.put({
        id: 'usage',
        free_ai_used: false,
        guest_id: this.getOrCreateGuestId(),
        feature_unlocked: [],
        updated_at: new Date().toISOString()
      });
    }
  }

  private getOrCreateGuestId(): string {
    const key = 'numbly_guest_id';
    let guestId = localStorage.getItem(key);
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem(key, guestId);
    }
    return guestId;
  }

  // Método para limpar dados locais (útil para desenvolvimento)
  async clearAllData() {
    await this.transaction('rw', this.tables, () => {
      this.tables.forEach(table => table.clear());
    });
    await this.initializeDefaults();
  }
}

// Verificar se estamos no ambiente do browser antes de inicializar o IndexedDB
let db: AppDB;

if (typeof window !== 'undefined') {
  db = new AppDB();
  
  // Inicializar dados padrão quando o DB for carregado
  db.open().then(() => {
    db.initializeDefaults().catch(console.error);
  }).catch(console.error);
} else {
  // No servidor, criar um mock para evitar erros
  db = {} as AppDB;
}

export { db };
