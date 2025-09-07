import Dexie, { Table } from 'dexie';

export interface Document { id: string; title: string; status: 'draft'|'readonly'; created_at: string; updated_at: string; }
export interface Clause { id: string; document_id: string; order_index: number; title: string; body: string; hash: string; updated_at: string; }
export interface ClauseIndex { id: string; clause_id: string; start_offset: number; end_offset: number; summary: string; }
export interface AiEdit { id: string; document_id: string; clause_id: string|null; diff: string; applied_by: 'user'|'ai'; created_at: string; }
export interface ChatMsg { id: string; document_id: string; role: 'user'|'assistant'|'system'; content: string; created_at: string; }
export interface AutocompleteCache { id: string; clause_id: string|null; suggestion: string; created_at: string; }
export interface Flags { id: 'usage'; free_ai_used: boolean; guest_id: string; feature_unlocked: string[]; updated_at: string; }
export interface Outbox { id: string; table: string; op: 'upsert'|'delete'; payload: unknown; updated_at: string; }

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
  }
}

export const db = new AppDB();
