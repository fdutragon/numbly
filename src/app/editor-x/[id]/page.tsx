'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Editor } from '@/components/blocks/editor-x/editor';
import { supa } from '@/sync/supabase';
import { SerializedEditorState } from 'lexical';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditorPage() {
  const [initialEditorState, setInitialEditorState] = useState<SerializedEditorState | undefined>(undefined);
  const [docTitle, setDocTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const documentId = params.id as string;

  // Carrega os dados do documento
  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      // Primeiro, garante que o usuário está logado
      const { data: { user } } = await supa.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supa
        .from('documents')
        .select('title, content')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Erro ao buscar documento:', error);
        setError('Documento não encontrado ou acesso negado.');
      } else if (data) {
        setDocTitle(data.title);
        // O conteúdo pode ser null no DB, então tratamos isso
        if (data.content && typeof data.content === 'object') {
          setInitialEditorState(data.content as SerializedEditorState);
        } else {
          // Define um estado inicial vazio se o conteúdo for nulo ou inválido
          setInitialEditorState(undefined);
        }
      }
      setLoading(false);
    };

    fetchDocument();
  }, [documentId, router]);

  // Salva as alterações do editor com debounce
  const handleEditorChange = useCallback((newState: SerializedEditorState) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      console.log('Salvando alterações...');
      const { error } = await supa
        .from('documents')
        .update({ content: newState, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) {
        console.error('Erro ao salvar alterações:', error);
        // Opcional: Adicionar um indicador de erro na UI
      }
    }, 1000); // Salva 1 segundo após a última alteração
  }, [documentId]);

  // Cleanup do debounce
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando editor...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <h1 className="text-xl font-semibold">{docTitle}</h1>
        <Link href="/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto">
        <Editor
          initialValue={initialEditorState}
          onChange={handleEditorChange}
          className="h-full max-w-4xl mx-auto p-8"
        />
      </main>
    </div>
  );
}
