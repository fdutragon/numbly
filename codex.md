Auditoria rápida do app

Varra o repo e gere um relatório:

Árvores de imports cíclicos, componentes sem memo, hooks com deps faltantes, effects que rodam demais, re-render cascata.

Locais que tocam o layout (CSS/JS/DOM) → proibido alterar.

Lugares com side effects em render (mover para useEffect/useLayoutEffect).

Saída: reports/audit.json + reports/perf.md.

Camada de persistência (IndexedDB/Dexie)

Unificar schema, versões e índices (abaixo).

Implementar DAO transacional + fila de gravação (debounce + idle).

Testes unitários do DAO e migrações.

Sincronização Supabase (guest → auth)

Implementar fila offline + upsert por id + resolução por updated_at.

Variáveis de ambiente “stubadas” (sem credenciais), mas código funcional.

Testes de integração com Supabase mockado.

Editor (Lexical + plugins shadcn selecionados)

Garantir initialState, read-only/paywall toggle, ghost autocomplete, comandos “/”.

Sem alterar layout: apenas lógica e providers.

Paywall de IA

1 edição grátis (flag no IndexedDB + Supabase para usuários logados).

Guards: se exceder, exibe upsell (já existente, só reforçar regra).

Console de Conformidade

Validadores (CPF/CNPJ/data/valores) em Web Worker.

Status por cláusula + âncoras (IDs estáveis).

Chat IA contextual + índice de cláusulas

Construir clause_index incremental.

Busca por offset → recorte mínimo → diff aplicado.

Export .docx

Mapeamento Lexical → docx (numeração/âncoras preservadas).

Segurança (bloqueios)

CSS + listeners (copy/cut/paste/contextmenu/selection) somente em modo read-only.

Bypass interno para IA/export (não quebrar funcionalidades).

Performance

Debounce saves; memo/reselect; lazy-import de validadores/IA; workers.

Verificar recomendação de performance do TipTap/Lexical (sem layout change).

Testes automatizados

Unit (Vitest), Integração (Vitest + Dexie mocked), E2E (Playwright).

Relatórios em reports/coverage.

Schema Dexie (versão única consolidada)
// src/data/db.ts
import Dexie, { Table } from 'dexie';

export interface Document { id: string; title: string; status: 'draft'|'readonly'; created_at: string; updated_at: string; }
export interface Clause { id: string; document_id: string; order_index: number; title: string; body: string; hash: string; updated_at: string; }
export interface ClauseIndex { id: string; clause_id: string; start_offset: number; end_offset: number; summary: string; }
export interface AiEdit { id: string; document_id: string; clause_id: string|null; diff: string; applied_by: 'user'|'ai'; created_at: string; }
export interface ChatMsg { id: string; document_id: string; role: 'user'|'assistant'|'system'; content: string; created_at: string; }
export interface AutocompleteCache { id: string; clause_id: string|null; suggestion: string; created_at: string; }
export interface Flags { id: 'usage'; free_ai_used: boolean; guest_id: string; feature_unlocked: string[]; updated_at: string; }
export interface Outbox { id: string; table: string; op: 'upsert'|'delete'; payload: any; updated_at: string; }

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

DAO + gravação transacional (debounced)
// src/data/dao.ts
import { db, type Document, type Clause } from './db';
let saveTimer: number|undefined;

export async function upsertDocument(doc: Document) {
  await db.transaction('rw', db.documents, async () => {
    doc.updated_at = new Date().toISOString();
    await db.documents.put(doc);
    await enqueueOutbox('documents', 'upsert', doc);
  });
}

export async function upsertClauses(clauses: Clause[]) {
  await db.transaction('rw', db.clauses, async () => {
    const now = new Date().toISOString();
    clauses.forEach(c => (c.updated_at = now));
    await db.clauses.bulkPut(clauses);
    for (const c of clauses) await enqueueOutbox('clauses', 'upsert', c);
  });
}

async function enqueueOutbox(table: string, op: 'upsert'|'delete', payload: any) {
  await db.outbox.put({ id: crypto.randomUUID(), table, op, payload, updated_at: new Date().toISOString() });
}

export function debounced(fn: () => Promise<void>, ms = 400) {
  return () => {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => void fn(), ms);
  };
}

Serviço de Sync Supabase (guest → auth, upsert por id, updated_at)
// src/sync/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { db } from '../data/db';

const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supa = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true } });

// até conectar seu schema, deixamos tabelas genéricas com mesmas chaves:
type Row = Record<string, any>;
const tables = ['documents','clauses','ai_edits','chat_messages','autocomplete_cache','flags'] as const;

export async function pushOutbox() {
  const items = await db.outbox.orderBy('updated_at').toArray();
  if (!items.length) return;
  for (const it of items) {
    const { data, error } = await supa.from(it.table as any).upsert(it.payload, { onConflict: 'id' });
    if (!error) await db.outbox.delete(it.id);
  }
}

// pull incremental por updated_at
export async function pullSince(sinceISO: string) {
  for (const t of tables) {
    const { data, error } = await supa.from(t).select('*').gt('updated_at', sinceISO);
    if (error || !data) continue;
    await db.transaction('rw', (db as any)[t], async () => {
      // resolução por updated_at
      for (const row of data as Row[]) {
        const local = await (db as any)[t].get(row.id);
        if (!local || new Date(row.updated_at) > new Date(local.updated_at)) {
          await (db as any)[t].put(row);
        }
      }
    });
  }
}

export async function migrateGuestToUser(userId: string) {
  // Envia tudo que tem owner implícito por id; regra RLS no Supabase deve permitir upsert do próprio user.
  await pushOutbox();
}


Observação: você só precisa criar as tabelas no Supabase com a mesma PK id (text/uuid) e updated_at. As RLS devem assegurar auth.uid() = owner (quando houver). Variáveis de ambiente já referenciam chaves; basta inserir valores.

Guards de paywall e 1 edição grátis
// src/features/paywall.ts
import { db } from '@/data/db';

export async function canUseAI(): Promise<boolean> {
  const f = await db.flags.get('usage');
  return !!(f && (f.feature_unlocked?.includes('ai') || !f.free_ai_used));
}

export async function markFreeAiUsed() {
  const now = new Date().toISOString();
  const prev = (await db.flags.get('usage')) ?? { id: 'usage', free_ai_used: false, guest_id: getOrCreateGuestId(), feature_unlocked: [], updated_at: now };
  prev.free_ai_used = true; prev.updated_at = now;
  await db.flags.put(prev);
}
function getOrCreateGuestId(){ const k='guest_id'; let v=localStorage.getItem(k); if(!v){ v=crypto.randomUUID(); localStorage.setItem(k,v);} return v; }


Uso: antes de acionar IA → if (!(await canUseAI())) { abrirUpsell(); return; }

Ghost Autocomplete + IA (mínimo de tokens via clause_index)
// src/ai/ghost.ts
import { OpenAI } from 'openai';
import { db } from '@/data/db';
const client = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });

export async function suggestForClause(clauseId: string) {
  const idx = await db.clause_index.where('clause_id').equals(clauseId).first();
  const clause = await db.clauses.get(clauseId);
  const prompt = [
    'Você é um assistente jurídico. Melhore a cláusula abaixo, mantendo escopo e linguagem formal. Responda apenas com o texto da cláusula.',
    `TÍTULO: ${clause?.title}`,
    `TRECHO: ${clause?.body}`,
    idx?.summary ? `RESUMO: ${idx.summary}` : ''
  ].join('\n');

  const { choices } = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  return choices[0]?.message?.content ?? '';
}


O chat contextual reutiliza a mesma estratégia, porém enviando apenas o recorte (offset) da cláusula solicitado no comando “/”.

Validações no Console de Conformidade (Web Worker)
// src/workers/validate.ts
self.onmessage = (e: MessageEvent) => {
  const { clauses } = e.data as { clauses: Array<{id:string;body:string;title:string}> };
  const results = clauses.map(c => validateClause(c));
  // postMessage com { id, status: 'OK'|'ALERTA'|'ERRO', issues: [...] }
  (self as any).postMessage(results);
};

function validateClause(c:{id:string;body:string;title:string}){
  const issues:string[]=[];
  // exemplos simples — expanda com regex oficiais
  if (/\bCPF\b/.test(c.body) && !/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(c.body)) issues.push('CPF inválido no texto');
  if (/\bCNPJ\b/.test(c.body) && !/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/.test(c.body)) issues.push('CNPJ possivelmente inválido');
  // datas e valores:
  if (/\bdata\b/i.test(c.body) && !/\b\d{2}\/\d{2}\/\d{4}\b/.test(c.body)) issues.push('Data sem formato DD/MM/AAAA');
  return { id: c.id, status: issues.length ? 'ALERTA' : 'OK', issues };
}


O componente que mostra o painel só escuta o worker e atualiza badges/âncoras (IDs estáveis), sem tocar no layout.

Export .docx (mapeando nós)
// src/export/docx.ts
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { db } from '@/data/db';

export async function exportDocx(documentId: string) {
  const doc = await db.documents.get(documentId);
  const clauses = await db.clauses.where('document_id').equals(documentId).sortBy('order_index');

  const children = clauses.flatMap(c => [
    new Paragraph({ text: c.title, heading: HeadingLevel.HEADING_2 }),
    ...c.body.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] })),
  ]);

  const d = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(d);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${doc?.title ?? 'Contrato'}.docx`;
  a.click();
}

Bloqueios (somente em read-only)
// src/security/locks.ts
export function enableReadOnlyLocks(root: HTMLElement) {
  root.style.userSelect = 'none';
  const handler = (e: Event) => e.preventDefault();
  root.addEventListener('copy', handler);
  root.addEventListener('cut', handler);
  root.addEventListener('paste', handler);
  root.addEventListener('contextmenu', handler);
  return () => {
    root.style.userSelect = '';
    root.removeEventListener('copy', handler);
    root.removeEventListener('cut', handler);
    root.removeEventListener('paste', handler);
    root.removeEventListener('contextmenu', handler);
  };
}

Performance (sem alterar layout)

Saves: debounced (400–800ms) + navigator.scheduling.isInputPending?.() para evitar bloquear input.

Workers: validações e diffs.

Memo: selectors por documentId, clauseId.

Lazy: importar IA/validações/export sob demanda.

Renders: React.memo em blocos de cláusula; key estável [documentId, clauseId].

Lexical: use initialEditorState serializado; evite rehidratar no render; evite listeners globais desnecessários.

Testes automatizados (scripts que o Codex deve criar e rodar)
Unit (Vitest)

src/data/dao.test.ts: put/get, bulkPut, transações, ordenação por order_index.

src/sync/supabase.test.ts: resolução por updated_at, upsert, fila outbox.

src/features/paywall.test.ts: 1 edição grátis, flags, migração guest→user.

src/ai/ghost.test.ts: prompt mínimo e saneamento de saída (mock OpenAI).

src/workers/validate.test.ts: CPF/CNPJ/data/valores.

Integração

tests/integration/persistence.test.ts: cria doc→cláusulas→edita→fecha/abre app→consistência.

tests/integration/sync-flow.test.ts: escreve offline→outbox→mock supa ok→limpa fila.

E2E (Playwright)

Fluxo: landing → autocomplete → gerar contrato → abre read-only → 1 edição IA → upsell → export .docx.

Verificar bloqueio de copiar em read-only e liberação quando alterna para edit (pós-paywall).

Draggable blocks mantêm order_index e âncoras.

package.json (acréscimos):

{
  "scripts": {
    "test": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "typecheck": "tsc -p tsconfig.json",
    "report": "node scripts/print-report.mjs"
  }
}

Checklist de conformidade (Codex deve marcar)

Dados/Persistência

 Schema Dexie criado exatamente conforme acima.

 Índices por document_id e [document_id+order_index].

 updated_at atualizado em todas as gravações.

 Fila outbox gravando cada alteração.

 Migração guest→auth executa pushOutbox().

Sync Supabase

 Funções pushOutbox() e pullSince() implementadas.

 Upsert por id (onConflict) e resolução por updated_at.

 Variáveis .env criadas; nada hardcoded.

 RLS preparada (comentários no código descrevem política).

Editor/Paywall

 Read-only pós-geração + 1 edição IA grátis.

 Upsell dispara quando canUseAI() = false.

 Toolbar mínima respeitada (sem mudanças visuais).

IA/Chat

 clause_index populado e consultado.

 Ghost suggestions funcionando (sem travar input).

 Diff aplicado e logado em ai_edits.

Conformidade

 Worker ativo; painel recebe mensagens e mostra status.

 Regras básicas (CPF/CNPJ/data/valor); espaço para novas regras.

Export

 .docx preserva títulos/numeração/âncoras.

 Download com nome do documento.

Segurança

 Bloqueios ativos apenas em read-only.

 IA/export conseguem ler conteúdo (sem bloqueio acidental).

Performance

 Debounce I/O.

 Lazy-load de módulos pesados.

 Memoização em listas de cláusulas.

 Zero setState em loop/por render.

Testes

 Unit + Integração + E2E rodando com coverage > 80%.

 Relatórios em reports/.

Variáveis de ambiente (placeholders)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_OPENAI_KEY=

Observações finais e riscos

Não alterar layout: todas as mudanças são internas (dados, lógica, workers, guards).

Safari iOS: Dexie exige atenção a quotas; incluir fallback de erro amigável.

Conflitos: se o usuário editar offline e depois a IA editar online, updated_at resolve; se precisar, evoluir para CRDT em fase 2.

Privacidade: telemetria sem conteúdo de cláusulas (apenas métricas técnicas).

Se quiser, eu já entrego isso em “pacote Codex” (tarefas autogerenciáveis + prompts de execução) para ele varrer o repo e aplicar as correções automaticamente. Quer que eu formate como uma issue list para o seu board (Linear/Notion) e o prompt de operação do Codex?