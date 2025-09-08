'use client';

import React, { useState, useCallback, Suspense, useRef, useEffect, lazy } from 'react';
import { SerializedEditorState } from 'lexical';
import { Editor } from '@/components/blocks/editor-x/editor';

// Dynamic imports para componentes não críticos
const Chat = lazy(() => import('@/components/ui/chat'));
const Console = lazy(() => import('@/components/ui/console'));

// Estado inicial vazio - o editor será inicializado com conteúdo padrão
const initialEditorState: SerializedEditorState | null = null;

export default function Home() {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(initialEditorState);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  
  // Contrato de exemplo para exibição inicial
  const contratoExemplo = `
# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

**CONTRATANTE:** [Nome da Empresa]
**CONTRATADO:** [Nome do Prestador]
**DATA:** ${new Date().toLocaleDateString('pt-BR')}

## 1. OBJETO DO CONTRATO

O presente contrato tem por objeto a prestação de serviços de desenvolvimento de software, conforme especificações técnicas acordadas entre as partes.

## 2. PRAZO DE EXECUÇÃO

O prazo para execução dos serviços será de 30 (trinta) dias corridos, contados a partir da assinatura deste contrato.

## 3. VALOR E FORMA DE PAGAMENTO

O valor total dos serviços é de R$ 10.000,00 (dez mil reais), a ser pago em 2 (duas) parcelas:
- 50% na assinatura do contrato
- 50% na entrega final do projeto

## 4. OBRIGAÇÕES DAS PARTES

### 4.1 Obrigações do Contratado:
- Executar os serviços com qualidade e dentro do prazo estabelecido
- Manter sigilo sobre informações confidenciais
- Fornecer suporte técnico por 30 dias após a entrega

### 4.2 Obrigações do Contratante:
- Efetuar os pagamentos nas datas acordadas
- Fornecer as informações necessárias para execução dos serviços
- Disponibilizar ambiente de testes quando necessário

## 5. DISPOSIÇÕES GERAIS

Este contrato é regido pelas leis brasileiras e fica eleito o foro da comarca de São Paulo para dirimir quaisquer questões oriundas do presente instrumento.

---

**Assinaturas:**

_________________________
Contratante

_________________________
Contratado
  `;
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const LOCAL_STORAGE_KEY = 'document:editorState';

  // Função removida - handleDownload não é mais necessária

  const handleSendMessage = useCallback((message: string) => {
    // Implementar lógica de envio de mensagem para IA
    console.log('Mensagem enviada:', message);
  }, []);

  // Implementar debounce para reduzir re-renders do editor e persistir
  const handleEditorStateChange = useCallback((newState: SerializedEditorState | null) => {
    // Limpar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Definir novo timeout para debounce
    debounceTimeoutRef.current = setTimeout(async () => {
      setEditorState(newState);

      // Persistência local
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
        }
      } catch {}

      // Persistência no servidor (stub em memória)
      try {
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: newState }),
        });
      } catch {}
    }, 300); // 300ms de debounce
  }, []);

  // Carregar estado inicial do servidor/localStorage e cleanup do timeout
  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      try {
        // Tentar carregar do servidor
        const res = await fetch('/api/documents', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data && data.document) {
            setEditorState(data.document as SerializedEditorState);
            setIsInitialLoaded(true);
            return;
          }
        }
      } catch {}

      // Fallback: carregar do localStorage
      try {
        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as SerializedEditorState;
            if (!cancelled) {
              setEditorState(parsed);
              setIsInitialLoaded(true);
              return;
            }
          }
        }
      } catch {}

      // Se não há conteúdo salvo, usar o contrato de exemplo
      if (!cancelled) {
        // Criar um estado inicial válido para o Lexical com o contrato de exemplo
        const initialState = {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: contratoExemplo,
                    type: "text",
                    version: 1
                  }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1
              }
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1
          }
        } as SerializedEditorState;
        
        setEditorState(initialState);
        setIsInitialLoaded(true);
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [contratoExemplo]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      
      <div className="flex flex-1 overflow-hidden">
        {/* Console lateral esquerdo */}
        <div className="w-96 border-r border-border bg-card/50 flex flex-col overflow-hidden">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Carregando console...</div>}>
            <Console />
          </Suspense>
        </div>
        
        {/* Editor central */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-hidden">
            <Suspense fallback={<div>Carregando editor...</div>}>
              {isInitialLoaded ? (
                <Editor
                  initialValue={editorState || undefined}
                  onChange={handleEditorStateChange}
                  className="h-full bg-transparent"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Carregando documento...</div>
              )}
            </Suspense>
          </div>
        </div>
        
        {/* Chat lateral direito */}
        <div className="w-96 border-l border-border bg-card/30 flex flex-col overflow-hidden">
          <Suspense fallback={<div>Carregando chat...</div>}>
            <Chat onSendMessage={handleSendMessage} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
