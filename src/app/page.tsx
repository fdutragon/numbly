'use client';

import React, { useState, useCallback, Suspense, useRef, useEffect, lazy } from 'react';

import Sidebar from '@/components/ui/sidebar';
import Navbar from '@/components/ui/navbar';
import BottomPanel from '@/components/ui/bottom-panel';
import { SerializedEditorState } from 'lexical';
import { Editor } from '@/components/blocks/editor-x/editor';

// Dynamic imports para componentes não críticos
const Chat = lazy(() => import('@/components/ui/chat'));

// Estado inicial vazio - o editor será inicializado com conteúdo padrão
const initialEditorState: SerializedEditorState | null = null;

export default function Home() {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(initialEditorState);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDownload = useCallback(() => {
    console.log('Download iniciado');
  }, []);

  const handleSave = useCallback(() => {
    console.log('Salvando documento...');
  }, []);

  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    console.log('Arquivo selecionado:', fileId);
  }, []);

  const handleSendMessage = useCallback((message: string) => {
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
    <div className="h-screen flex flex-col bg-sidebar overflow-hidden">
      {/* Navbar Superior */}
      <Navbar 
        onNewDocument={() => console.log('Novo documento')}
        onImportDocument={() => console.log('Importar documento')}
        onInvitePerson={() => console.log('Convidar pessoa')}
        onSearch={(query) => console.log('Pesquisar:', query)}
      />
      
      {/* Layout Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar com Sistema de Pastas */}
        <div className="w-72 flex-shrink-0">
          <Sidebar 
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFileId}
          />
        </div>
        
        {/* Área Central do Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Editor */}
          <div className="flex-1 flex relative overflow-hidden border-l border-sidebar-border/30">
             
             {/* Editor com Background Moderno */}
             <div className="flex-1 overflow-hidden relative">
                {/* Background com gradiente e elementos geométricos */}
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/20">
                  {/* Elementos geométricos sutis */}
                  <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-xl" />
                  <div className="absolute bottom-32 right-32 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />
                  <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-muted/20 rotate-45 blur-lg" />
                  
                  {/* Grid pattern sutil */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                
                {/* Logo central sutil */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-8xl font-bold text-muted/5 select-none">
                    Aether
                  </div>
                </div>
                
                <div className="flex justify-center h-full relative z-10">
                  <div className="w-full max-w-4xl h-full">
                  <Editor
                    initialValue={editorState || undefined}
                    onChange={handleEditorStateChange}
                    className="h-full bg-transparent px-12"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Painel Inferior Expansível */}
          <BottomPanel />
        </div>
        
        {/* Chat Lateral (Opcional) */}
        <div className="w-80 flex-shrink-0">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-sidebar border-l border-sidebar-border">
              <div className="text-sidebar-foreground/60 text-sm font-medium">Carregando chat...</div>
            </div>
          }>
            <Chat documentId="default-document" onSendMessage={handleSendMessage} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
