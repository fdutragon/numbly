-- Configuração inicial do banco de dados para o Editor Legal
-- Baseado na estrutura IndexedDB definida em src/data/db.ts

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'readonly')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guest_id UUID, -- Para usuários não autenticados
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Tabela de cláusulas
CREATE TABLE IF NOT EXISTS clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guest_id UUID, -- Para usuários não autenticados
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Tabela de índices de cláusulas (para contexto de IA)
CREATE TABLE IF NOT EXISTS clause_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
    start_offset INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    summary TEXT NOT NULL,
    guest_id UUID, -- Para usuários não autenticados
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Tabela de edições de IA
CREATE TABLE IF NOT EXISTS ai_edits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    clause_id UUID REFERENCES clauses(id) ON DELETE CASCADE,
    diff TEXT NOT NULL,
    applied_by TEXT NOT NULL CHECK (applied_by IN ('user', 'ai')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guest_id UUID, -- Para usuários não autenticados
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guest_id UUID, -- Para usuários não autenticados
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Tabela de cache de autocomplete
CREATE TABLE IF NOT EXISTS autocomplete_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID REFERENCES clauses(id) ON DELETE CASCADE,
    suggestion TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guest_id UUID, -- Para usuários não autenticados
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Tabela de flags de uso (paywall, features desbloqueadas)
CREATE TABLE IF NOT EXISTS flags (
    id TEXT PRIMARY KEY, -- 'usage' ou outros identificadores
    free_ai_used BOOLEAN NOT NULL DEFAULT FALSE,
    guest_id UUID NOT NULL,
    feature_unlocked TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Tabela de fila outbox (para sincronização)
CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    op TEXT NOT NULL CHECK (op IN ('upsert', 'delete')),
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guest_id UUID, -- Para usuários não autenticados
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Para usuários autenticados
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_guest_id ON documents(guest_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);

CREATE INDEX IF NOT EXISTS idx_clauses_document_id ON clauses(document_id);
CREATE INDEX IF NOT EXISTS idx_clauses_order_index ON clauses(document_id, order_index);
CREATE INDEX IF NOT EXISTS idx_clauses_guest_id ON clauses(guest_id);
CREATE INDEX IF NOT EXISTS idx_clauses_user_id ON clauses(user_id);

CREATE INDEX IF NOT EXISTS idx_clause_index_clause_id ON clause_index(clause_id);
CREATE INDEX IF NOT EXISTS idx_ai_edits_document_id ON ai_edits(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON chat_messages(document_id);
CREATE INDEX IF NOT EXISTS idx_autocomplete_cache_clause_id ON autocomplete_cache(clause_id);
CREATE INDEX IF NOT EXISTS idx_flags_guest_id ON flags(guest_id);
CREATE INDEX IF NOT EXISTS idx_outbox_updated_at ON outbox(updated_at);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clauses_updated_at
    BEFORE UPDATE ON clauses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flags_updated_at
    BEFORE UPDATE ON flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outbox_updated_at
    BEFORE UPDATE ON outbox
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();