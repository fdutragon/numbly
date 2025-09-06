'use client';

import React, { useState, useCallback, Suspense, useRef, useEffect, lazy } from 'react';
import Header from '@/components/ui/header';
import { SerializedEditorState } from 'lexical';
import { Editor } from '@/components/blocks/editor-x/editor';

// Dynamic imports para componentes não críticos
const Chat = lazy(() => import('@/components/ui/chat'));

// Estado inicial vazio - o editor será inicializado com conteúdo padrão
const initialEditorState: SerializedEditorState | null = null;

export default function Home() {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(initialEditorState);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDownload = useCallback(() => {
    // Implementar lógica de download
    console.log('Download iniciado');
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    // Implementar lógica de envio de mensagem para IA
    console.log('Mensagem enviada:', message);
  }, []);

  // Implementar debounce para reduzir re-renders do editor
  const handleEditorStateChange = useCallback((newState: SerializedEditorState | null) => {
    // Limpar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Definir novo timeout para debounce
    debounceTimeoutRef.current = setTimeout(() => {
      setEditorState(newState);
    }, 300); // 300ms de debounce
  }, []);

  // Cleanup do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header onDownload={handleDownload} />
      
      {/* Main Layout - 2 Colunas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor com Logo Background - Coluna Central */}
        <div className="flex-1 flex flex-col bg-background border-r border-border relative overflow-hidden">
          {/* Logo Background com Efeito */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Efeito de Glow */}
              <div className="absolute inset-0 text-8xl font-light text-muted-foreground/10 blur-sm animate-pulse">
                n
              </div>
              {/* Logo Principal */}
              <div className="text-8xl font-light text-muted-foreground/20 select-none">
                n
              </div>
            </div>
          </div>
          
          {/* Editor Overlay */}
          <div className="flex-1 overflow-hidden relative z-10">
            <Editor
              initialValue={editorState || undefined}
              onChange={handleEditorStateChange}
              className="h-full bg-transparent"
            />
          </div>
        </div>
        
        {/* Chat - Coluna Direita (largura aumentada) */}
        <div className="w-96 flex-shrink-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Carregando chat...</div>}>
            <Chat onSendMessage={handleSendMessage} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
