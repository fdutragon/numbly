'use client';

import React, { useState, useCallback, Suspense, useRef, useEffect, lazy } from 'react';
import Header from '@/components/ui/header';
import { SerializedEditorState } from 'lexical';
import { Editor } from '@/components/blocks/editor-x/editor';

// Dynamic imports para componentes não críticos
const Chat = lazy(() => import('@/components/ui/chat'));
const Console = lazy(() => import('@/components/ui/console'));

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
      
      {/* Main Layout - 3 Colunas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Console - Coluna Esquerda */}
        <div className="w-96 flex-shrink-0 border-r border-border">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Carregando console...</div>}>
            <Console />
          </Suspense>
        </div>
        
        {/* Editor com Logo Background - Coluna Central */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-muted/20 border-r border-border/50 relative overflow-hidden">
          {/* Logo Background com Efeito Aprimorado */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Efeito de Glow Múltiplo */}
              <div className="absolute inset-0 text-9xl font-extralight text-muted-foreground/5 blur-3xl animate-breathe">
                n
              </div>
              <div className="absolute inset-0 text-8xl font-extralight text-muted-foreground/8 blur-xl animate-pulse">
                n
              </div>
              {/* Logo Principal */}
              <div className="text-8xl font-extralight text-muted-foreground/15 select-none tracking-wider animate-breathe">
                n
              </div>
            </div>
          </div>
          
          {/* Padrão de Pontos Sutil */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* Editor Overlay */}
          <div className="flex-1 overflow-hidden relative z-10">
            {/* Wrapper externo para centralização e max-width */}
            <div className="flex justify-center h-full">
              <div className="w-full max-w-5xl h-full relative">
                {/* Sombra Interna Sutil */}
                <div className="absolute inset-0 shadow-inner rounded-lg pointer-events-none"></div>
                <Editor
                  initialValue={editorState || undefined}
                  onChange={handleEditorStateChange}
                  className="h-full bg-transparent px-16 py-4 relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat - Coluna Direita */}
        <div className="w-96 flex-shrink-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Carregando chat...</div>}>
            <Chat onSendMessage={handleSendMessage} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
