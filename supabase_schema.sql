-- Criação das tabelas necessárias para o projeto Numbly
-- Execute este script no SQL Editor do Supabase

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cláusulas
CREATE TABLE IF NOT EXISTS clauses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  hash TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de índice de cláusulas
CREATE TABLE IF NOT EXISTS clause_index (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clause_id UUID REFERENCES clauses(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  summary TEXT
);

-- Tabela de edições de IA
CREATE TABLE IF NOT EXISTS ai_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  clause_id UUID REFERENCES clauses(id) ON DELETE CASCADE,
  diff JSONB NOT NULL,
  applied_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cache de autocomplete
CREATE TABLE IF NOT EXISTS autocomplete_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clause_id UUID REFERENCES clauses(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários convidados (para paywall)
CREATE TABLE IF NOT EXISTS guest_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id TEXT UNIQUE NOT NULL,
  free_ai_edits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de assinaturas (para paywall)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clauses_document_id ON clauses(document_id);
CREATE INDEX IF NOT EXISTS idx_clause_index_clause_id ON clause_index(clause_id);
CREATE INDEX IF NOT EXISTS idx_ai_edits_document_id ON ai_edits(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON chat_messages(document_id);
CREATE INDEX IF NOT EXISTS idx_autocomplete_cache_clause_id ON autocomplete_cache(clause_id);
CREATE INDEX IF NOT EXISTS idx_guest_users_guest_id ON guest_users(guest_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clause_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE autocomplete_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (para usuários convidados)
CREATE POLICY "Allow public access to documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow public access to clauses" ON clauses FOR ALL USING (true);
CREATE POLICY "Allow public access to clause_index" ON clause_index FOR ALL USING (true);
CREATE POLICY "Allow public access to ai_edits" ON ai_edits FOR ALL USING (true);
CREATE POLICY "Allow public access to chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Allow public access to autocomplete_cache" ON autocomplete_cache FOR ALL USING (true);
CREATE POLICY "Allow public access to guest_users" ON guest_users FOR ALL USING (true);
CREATE POLICY "Allow public access to subscriptions" ON subscriptions FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clauses_updated_at BEFORE UPDATE ON clauses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_users_updated_at BEFORE UPDATE ON guest_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO documents (title, status, content) VALUES 
('Contrato de Prestação de Serviços', 'draft', '{"blocks": []}'),
('Termo de Uso', 'published', '{"blocks": []}');

INSERT INTO guest_users (guest_id, free_ai_edits_used) VALUES 
('guest_123', 0),
('guest_456', 1);

COMMIT;