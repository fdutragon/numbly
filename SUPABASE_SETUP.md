# Configuração do Supabase para Sincronização com IndexedDB

Este guia explica como configurar o Supabase para sincronizar dados com o IndexedDB do Editor Legal.

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Node.js instalado

## 🔧 Configuração Inicial

### 1. Obter Credenciais do Supabase

1. Acesse o [painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie as seguintes informações:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **anon public** (chave pública)
   - **service_role** (chave de serviço - **CUIDADO: não exponha no frontend**)

### 2. Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Substitua os valores placeholder pelas suas credenciais:

```env
# Substitua pelos valores do seu projeto
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

### 3. Executar Migrações SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Execute os scripts na seguinte ordem:

#### Script 1: Estrutura das Tabelas
```sql
-- Copie e cole o conteúdo de: supabase/migrations/001_initial_schema.sql
```

#### Script 2: Políticas de Segurança (RLS)
```sql
-- Copie e cole o conteúdo de: supabase/migrations/002_rls_policies.sql
```

### 4. Testar Configuração

Execute o script de teste para verificar se tudo está funcionando:

```bash
node scripts/test-supabase-sync.js
```

## 🏗️ Estrutura do Banco de Dados

### Tabelas Principais

- **documents**: Documentos do editor
- **clauses**: Cláusulas dos documentos
- **clause_index**: Índices para contexto de IA
- **ai_edits**: Histórico de edições da IA
- **chat_messages**: Mensagens do chat contextual
- **autocomplete_cache**: Cache de sugestões
- **flags**: Controle de paywall e features
- **outbox**: Fila de sincronização

### Campos de Controle de Acesso

Cada tabela possui:
- `guest_id`: Para usuários não autenticados
- `user_id`: Para usuários autenticados (referência para `auth.users`)

## 🔒 Segurança (RLS)

### Políticas Implementadas

1. **Usuários Guest**: Podem acessar dados associados ao seu `guest_id`
2. **Usuários Autenticados**: Podem acessar dados associados ao seu `user_id`
3. **Isolamento**: Cada usuário só vê seus próprios dados

### Migração Guest → Autenticado

Quando um usuário guest faz login:
1. Os dados locais são enviados para o Supabase
2. O `guest_id` é associado ao `user_id`
3. A sincronização incremental é ativada

## 🔄 Sincronização

### Fluxo de Dados

1. **Local-First**: Dados são salvos primeiro no IndexedDB
2. **Outbox**: Mudanças são enfileiradas para sincronização
3. **Push**: Dados são enviados para o Supabase
4. **Pull**: Dados remotos são baixados incrementalmente
5. **Resolução**: Conflitos são resolvidos por `updated_at`

### Funções de Sincronização

- `pushOutbox()`: Envia dados locais para o Supabase
- `pullSince(timestamp)`: Baixa dados modificados desde um timestamp
- `fullSync()`: Sincronização bidirecional completa
- `migrateGuestToUser(userId)`: Migra dados de guest para usuário

## 🧪 Testes

### Script de Teste Automático

```bash
# Testa conexão, tabelas, acesso guest e flags
node scripts/test-supabase-sync.js
```

### Testes Manuais

1. **Criar Documento**: Verifique se aparece no Supabase
2. **Editar Cláusula**: Confirme sincronização
3. **Chat IA**: Teste mensagens e contexto
4. **Paywall**: Verifique flags de uso

## 🚨 Troubleshooting

### Erro: "permission denied for table"

1. Verifique se as políticas RLS foram aplicadas
2. Confirme que as permissões foram concedidas:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
```

### Erro: "relation does not exist"

1. Execute as migrações SQL no painel do Supabase
2. Verifique se as tabelas foram criadas corretamente

### Sincronização Não Funciona

1. Verifique as variáveis de ambiente
2. Confirme que o `guest_id` está sendo gerado
3. Teste a conexão com o script de teste

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Dexie.js (IndexedDB)](https://dexie.org/)
- [Sincronização Offline](https://supabase.com/docs/guides/realtime)

## 🔄 Próximos Passos

1. ✅ Configurar variáveis de ambiente
2. ✅ Executar migrações SQL
3. ✅ Testar conexão
4. 🔄 Implementar sincronização no frontend
5. 🔄 Testar fluxo guest → autenticado
6. 🔄 Configurar real-time subscriptions (opcional)

---

**⚠️ Importante**: Nunca exponha a `service_role_key` no frontend. Use apenas em APIs do servidor ou scripts administrativos.