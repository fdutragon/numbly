'use client';

import React, { useState } from 'react';
import Header from '@/components/ui/header';
import Console from '@/components/ui/console';
import Chat from '@/components/ui/chat';
import { Editor } from '@/components/blocks/editor-x/editor';
import { SerializedEditorState } from 'lexical';

const initialEditorState: SerializedEditorState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Bem-vindo ao Editor Jurídico',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Comece digitando seu documento aqui. Use o console à esquerda para validações e o chat à direita para assistência da IA.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export default function Home() {
  const [editorState, setEditorState] = useState<SerializedEditorState>(initialEditorState);

  const handleDownload = () => {
    // Implementar lógica de download
    console.log('Download iniciado');
  };

  const handleSendMessage = (message: string) => {
    // Implementar lógica de envio de mensagem para IA
    console.log('Mensagem enviada:', message);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header onDownload={handleDownload} />
      
      {/* Main Layout - 3 Colunas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Console - Coluna Esquerda */}
        <div className="w-80 flex-shrink-0">
          <Console />
        </div>
        
        {/* Editor - Coluna Central */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex-1 overflow-hidden">
            <Editor
              initialValue={editorState}
              onChange={setEditorState}
              className="h-full"
            />
          </div>
        </div>
        
        {/* Chat - Coluna Direita */}
        <div className="w-80 flex-shrink-0">
          <Chat onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
