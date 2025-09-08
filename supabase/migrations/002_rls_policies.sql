-- POLÍTICAS DE SEGURANÇA (RLS) PARA USUÁRIOS AUTENTICADOS

-- Limpa políticas antigas para garantir um estado limpo
DROP POLICY IF EXISTS "Users can access their own documents" ON documents;
DROP POLICY IF EXISTS "Anonymous users can create documents" ON documents;
-- Adicione DROP POLICY para todas as outras políticas antigas em todas as tabelas se necessário...

-- Tabela: documents
CREATE POLICY "Usuários podem criar seus próprios documentos" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios documentos" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios documentos" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios documentos" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Tabela: clauses
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access clauses of their documents" ON clauses;
DROP POLICY IF EXISTS "Users can create clauses for their documents" ON clauses;

CREATE POLICY "Usuários podem gerenciar cláusulas de seus documentos" ON clauses
  FOR ALL USING (
    (auth.uid() = user_id) AND
    EXISTS (SELECT 1 FROM documents WHERE documents.id = clauses.document_id AND documents.user_id = auth.uid())
  );

-- Tabela: ai_edits
ALTER TABLE ai_edits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access AI edits of their documents" ON ai_edits;
DROP POLICY IF EXISTS "Users can create AI edits for their documents" ON ai_edits;

CREATE POLICY "Usuários podem gerenciar edições de IA de seus documentos" ON ai_edits
  FOR ALL USING (
    (auth.uid() = user_id) AND
    EXISTS (SELECT 1 FROM documents WHERE documents.id = ai_edits.document_id AND documents.user_id = auth.uid())
  );

-- Tabela: chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access chat messages of their documents" ON chat_messages;
DROP POLICY IF EXISTS "Users can create chat messages for their documents" ON chat_messages;

CREATE POLICY "Usuários podem gerenciar mensagens de chat de seus documentos" ON chat_messages
  FOR ALL USING (
    (auth.uid() = user_id) AND
    EXISTS (SELECT 1 FROM documents WHERE documents.id = chat_messages.document_id AND documents.user_id = auth.uid())
  );

-- Adicione políticas para outras tabelas conforme necessário (clause_index, autocomplete_cache, etc.)
-- Por simplicidade do MVP, focamos nas tabelas principais.
