Manual Técnico do Editor – MVP Fase 1 (Next.js + Lexical + Shadcn + IndexedDB + Supabase Guest)
Escopo Geral

Stack: Next.js + Lexical + Shadcn UI (Tailwind/Radix).

Persistência: IndexedDB (via Dexie.js) para armazenamento local-first.

Backend: Supabase Postgres para autenticação, controle de acesso, paywall e sincronização incremental de dados para usuários autenticados.

Páginas: 1 (rota única do editor).

Entrega (Fase 1): foco total no editor e recursos descritos abaixo.

Geração/IA: OpenAI para autocomplete inicial e geração do contrato; 1 edição gratuita de IA; upsell para liberar recursos premium.

Exportação: .docx.

Ações por Texto: todas as funções acionáveis também por comandos (ex.: barra /).

Segurança: bloquear copiar/recortar/selecionar/clipboard/context menu.

1) Estrutura de Dados – IndexedDB (Dexie.js)

Tabelas/Objetos

documents: {id, title, status, created_at, updated_at}

clauses: {id, document_id, order_index, title, body, hash, updated_at}

clause_index: {id, clause_id, start_offset, end_offset, summary}

ai_edits: {id, document_id, clause_id, diff, applied_by, created_at}

chat_messages: {id, document_id, role, content, created_at}

autocomplete_cache: {id, clause_id, suggestion, created_at}

Regras

Index por document_id para todas as tabelas de conteúdo.

Migração anônimo → autenticado: ao logar, enviar dados para Supabase via upsert (match por id).

Sincronização incremental: comparar updated_at e aplicar apenas diffs.

2) Fluxo de Entrada

Tela inicial com typing effect (micro copy).

Textarea Lexical com autocomplete ghost via API OpenAI.

Objetivo: preencher o máximo possível para gerar contrato completo.

Submit → geração de contrato (OpenAI) → abre em modo visualização.

3) Modo Visualização + Paywall de IA

Após gerar, contrato abre em read-only.

Usuário tem 1 edição gratuita de IA.

Após aplicar diff, exibir upsell → se assinar/pagar, liberar IA no editor.

4) Plugins Shadcn Ativos

Manter

Autocomplete (ghost IDE-like)

Auto Focus

Context Menu (ações de cláusula)

Draggable Block (blocos de cláusula)

Keywords (realce de termos-chave)

Markdown (entrada opcional)

Layout (grid: editor central + console lateral)

History Toolbar (Undo/Redo)

Edit Mode Toggle (controlado por paywall)

Remover/Desativar

Inserção de mídia, tabelas, embeds, emojis, decorações visuais não jurídicas.

5) Blocos de Cláusula + Ghost Suggestions

Cada cláusula é um bloco arrastável.

Menu: “Melhorar cláusula” (IA) e “Aceitar sugestão” (ghost suggestion).

Sugestões automáticas em ghost mode baseadas no contexto da cláusula.

6) Console de Conformidade (Painel Lateral)

Validações: conformidade legal, formatos (CPF, CNPJ, datas, valores).

Status por cláusula: OK / Alerta / Erro.

Links âncora para navegação rápida.

7) Chat IA Contextual

Baseado em índice (clause_index) para reduzir tokens.

IndexedDB fornece o contexto localmente.

Fluxo: comando → busca cláusula → envia trecho/offset → aplica diff.

1 interação gratuita → upsell.

8) Exportação .docx

Leitura direta do IndexedDB.

Mapeamento de nós Lexical para estilos Word.

Preserva numeração e âncoras.

9) Bloqueio de Cópia e Seleção

CSS: user-select: none em modo read-only.

JS: interceptar copy, cut, contextmenu → preventDefault().

10) Toolbar Mínima

Manter: Undo/Redo, Headings H1–H4, Bold, Italic, Underline, listas, citação, links, alinhamento esquerda/justificado, inserir cláusula, assinatura.

Remover: Font family, cores, riscado, subscrito, sobrescrito, mídia.

11) Sincronização com Supabase Guest

Guest ID criado na primeira sessão.

Salva flags de uso (edição gratuita usada, features liberadas).

Ao logar, migrar dados locais para conta e sincronizar.

12) Boas Práticas

Não usar inline CSS → usar tokens/variáveis globais.

Plugins e UI desacoplados.

Testar IndexedDB em múltiplos browsers (incluindo Safari iOS).

Telemetria sem texto sensível.

Garantir acessibilidade (atalhos, ARIA).