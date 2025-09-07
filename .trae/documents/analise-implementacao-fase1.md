# Análise e Implementação - Editor Legal MVP Fase 1

## 1. Status Atual do Projeto

### ✅ Já Implementado

* **IndexedDB com Dexie**: Estrutura completa de dados configurada

* **API OpenAI Autocomplete**: Endpoint funcional para sugestões

* **Editor Lexical**: Base do editor com plugins essenciais

* **Componentes UI Shadcn**: Interface básica implementada

* **Estrutura Next.js**: Configuração completa do framework

### ❌ Pendente de Implementação

## 2. APIs Necessárias

### 2.1 API de Geração de Contratos

**Arquivo**: `src/app/api/generate-contract/route.ts`

```typescript
// POST /api/generate-contract
// Input: { prompt: string, context?: string }
// Output: { contract: string, clauses: Clause[] }
```

### 2.2 API de Chat IA Contextual

**Arquivo**: `src/app/api/chat/route.ts`

```typescript
// POST /api/chat
// Input: { message: string, documentId: string, clauseId?: string }
// Output: { response: string, diff?: string }
```

### 2.3 API de Melhoramento de Cláusulas

**Arquivo**: `src/app/api/improve-clause/route.ts`

```typescript
// POST /api/improve-clause
// Input: { clauseId: string, content: string }
// Output: { improved: string, diff: string }
```

### 2.4 API de Exportação DOCX

**Arquivo**: `src/app/api/export/docx/route.ts`

```typescript
// POST /api/export/docx
// Input: { documentId: string }
// Output: Blob (arquivo .docx)
```

### 2.5 API de Validação Legal

**Arquivo**: `src/app/api/validate/route.ts`

```typescript
// POST /api/validate
// Input: { documentId: string, clauses: Clause[] }
// Output: { validations: ValidationResult[] }
```

## 3. Configuração Supabase

### 3.1 Cliente Supabase

**Arquivo**: `src/lib/supabase.ts`

* Configuração do cliente

* Tipos TypeScript

* Funções de autenticação

### 3.2 Schema do Banco

**Arquivo**: `supabase/migrations/001_initial_schema.sql`

* Tabelas: users, documents, clauses, ai\_edits, chat\_messages

* Políticas RLS (Row Level Security)

* Índices otimizados

### 3.3 Sincronização

**Arquivo**: `src/lib/sync.ts`

* Migração guest → authenticated

* Sincronização incremental

* Resolução de conflitos

## 4. Funcionalidades do Editor

### 4.1 Console de Conformidade

**Arquivo**: `src/components/ui/compliance-console.tsx`

* Validação CPF/CNPJ

* Verificação de datas

* Análise de valores monetários

* Status por cláusula (OK/Alerta/Erro)

### 4.2 Blocos de Cláusula Inteligentes

**Arquivo**: `src/components/editor/nodes/clause-block-node.tsx`

* Blocos arrastáveis

* Menu contextual com IA

* Ghost suggestions

* Numeração automática

### 4.3 Chat IA Lateral

**Arquivo**: `src/components/ui/ai-chat.tsx`

* Interface de chat contextual

* Integração com clause\_index

* Aplicação de diffs

* Controle de uso gratuito

### 4.4 Toolbar Simplificada

**Arquivo**: `src/components/editor/plugins/toolbar/minimal-toolbar.tsx`

* Apenas ferramentas essenciais

* Remoção de formatações não-jurídicas

* Atalhos de teclado

## 5. Segurança e Proteção

### 5.1 Bloqueio de Cópia

**Arquivo**: `src/components/editor/plugins/security-plugin.tsx`

* Interceptação de eventos copy/cut/paste

* Desabilitação de context menu

* CSS user-select: none em modo readonly

### 5.2 Controle de Acesso

**Arquivo**: `src/lib/access-control.ts`

* Verificação de planos (free/premium)

* Controle de edições gratuitas

* Paywall para recursos avançados

## 6. Exportação e Persistência

### 6.1 Exportador DOCX

**Arquivo**: `src/lib/docx-exporter.ts`

* Mapeamento Lexical → Word

* Preservação de formatação

* Numeração de cláusulas

### 6.2 Melhorias no DAO

**Arquivo**: `src/data/dao.ts` (extensões)

* Operações de sincronização

* Cache de validações

* Métricas de uso

## 7. Plugins do Editor

### 7.1 Plugin de Comandos por Texto

**Arquivo**: `src/components/editor/plugins/slash-commands-plugin.tsx`

* Comando "/" para ações

* Inserção rápida de cláusulas

* Atalhos para IA

### 7.2 Plugin de Keywords Jurídicas

**Arquivo**: `src/components/editor/plugins/legal-keywords-plugin.tsx`

* Realce de termos jurídicos

* Sugestões contextuais

* Glossário integrado

### 7.3 Plugin de Numeração Automática

**Arquivo**: `src/components/editor/plugins/auto-numbering-plugin.tsx`

* Numeração de cláusulas

* Subcláusulas e incisos

* Referências cruzadas

## 8. Componentes UI Adicionais

### 8.1 Modal de Upsell

**Arquivo**: `src/components/ui/upsell-modal.tsx`

* Apresentação de planos

* Comparação de recursos

* Call-to-action para upgrade

### 8.2 Indicador de Status IA

**Arquivo**: `src/components/ui/ai-status-indicator.tsx`

* Uso de créditos gratuitos

* Status da API OpenAI

* Feedback visual

### 8.3 Painel de Validações

**Arquivo**: `src/components/ui/validation-panel.tsx`

* Lista de validações por cláusula

* Navegação rápida

* Correções sugeridas

## 9. Utilitários e Helpers

### 9.1 Validadores Legais

**Arquivo**: `src/lib/validators.ts`

* Validação CPF/CNPJ

* Formatos de data brasileiros

* Valores monetários

* Endereços e CEP

### 9.2 Processador de Texto Legal

**Arquivo**: `src/lib/legal-text-processor.ts`

* Análise de estrutura jurídica

* Extração de entidades

* Sugestões de melhoria

### 9.3 Gerenciador de Estado Global

**Arquivo**: `src/lib/store.ts`

* Estado do documento atual

* Configurações do usuário

* Cache de validações

## 10. Configurações e Variáveis de Ambiente

### 10.1 Arquivo .env.local

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 10.2 Configuração de Build

**Arquivo**: `next.config.ts` (atualizações)

* Otimizações para produção

* Configuração de headers de segurança

* Compressão de assets

## 11. Testes e Qualidade

### 11.1 Testes de Integração

**Arquivo**: `src/__tests__/integration/`

* Testes de APIs

* Fluxos de usuário

* Sincronização de dados

### 11.2 Testes de Componentes

**Arquivo**: `src/__tests__/components/`

* Componentes críticos

* Interações do editor

* Validações

## 12. Prioridade de Implementação

### Fase 1A (Crítico - 1 semana)

1. ✅ Configuração Supabase completa
2. ✅ API de geração de contratos
3. ✅ Console de conformidade básico
4. ✅ Bloqueio de segurança

### Fase 1B (Importante - 1 semana)

1. ✅ Chat IA contextual
2. ✅ Exportação DOCX
3. ✅ Sincronização de dados
4. ✅ Blocos de cláusula inteligentes

### Fase 1C (Complementar - 3-5 dias)

1. ✅ Comandos por texto (/)
2. ✅ Validações legais avançadas
3. ✅ Melhorias na toolbar
4. ✅ Testes e otimizações

## 13. Estimativa de Esforço

* **APIs**: \~20 horas

* **Supabase**: \~15 horas

* **Componentes UI**: \~25 horas

* **Plugins do Editor**: \~20 horas

* **Segurança**: \~8 horas

* **Exportação**: \~12 horas

* **Testes**: \~10 horas

**Total Estimado**: \~110 horas (3-4 semanas para 1 desenvolvedor)

## 14. Dependências Adicionais Necessárias

```json
{
  "dependencies": {
    "docx": "^8.5.0",
    "mammoth": "^1.6.0",
    "date-fns": "^3.6.0",
    "zod": "^3.22.4",
    "react-hotkeys-hook": "^4.5.0"
  }
}
```

## 15. Considerações de Produção

### Performance

* Lazy loading de componentes não críticos

* Debounce em operações de salvamento

* Virtualização para listas grandes

### SEO e Acessibilidade

* Meta tags apropriadas

* ARIA labels completos

* Suporte a screen readers

### Monitoramento

* Logs

