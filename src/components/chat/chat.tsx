'use client';

// Adiciona a tipagem para VAPID_PUBLIC_KEY no objeto window
declare global {
  interface Window {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
  }
}

import { useEffect, useRef, useState, useMemo } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { ThemeToggle } from '@/components/theme-toggle';

import { TypingIndicator } from '@/components/chat/typing-indicator';
import { PWAFeatures } from '@/components/pwa/pwa-features';
import { SalesFunnelDebug } from '@/components/chat/sales-funnel-debug';
import { Bot, CheckCircle } from 'lucide-react';

export function Chat() {
  // Estados locais para gerenciar o chat
  const [threadId, setThreadId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Thread simulada para manter compatibilidade com o código existente
  const currentThread = { messages };

  //

  // Estados para funcionalidades de intenção
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPWAIntegration, setShowPWAIntegration] = useState(false);
  
  // Estados do funil de vendas
  const [salesData, setSalesData] = useState({
    score: 0,
    stage: 'discovery' as const,
    interests: [],
    objections: [],
    urgency: 'low' as const,
    lastScoreUpdate: Date.now()
  });
  const [showFunnelDebug, setShowFunnelDebug] = useState(false);

  // Gera um threadId único ao montar o componente
  useEffect(() => {
    if (!threadId) {
      const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setThreadId(newThreadId);
    }
  }, [threadId]);

  // Listener para fechar modal PWA via evento customizado
  useEffect(() => {
    const handleClosePWAModal = () => {
      setShowPWAIntegration(false);
    };

    window.addEventListener('closePWAModal', handleClosePWAModal);
    
    return () => {
      window.removeEventListener('closePWAModal', handleClosePWAModal);
    };
  }, []);

  // Scroll automático inteligente - sempre mostra a última mensagem completamente
  const scrollToBottom = (force = false, delay = 0) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      
      if (force || isNearBottom) {
        setTimeout(() => {
          requestAnimationFrame(() => {
            // Garante que sempre mostra a última mensagem completamente
            const maxScroll = container.scrollHeight - container.clientHeight;
            container.scrollTop = maxScroll + 100; // Extra padding para nunca cortar
          });
        }, delay);
      }
    }
  };

  //

  //

  // Função para executar ações do fluxo
  const executeNextAction = (action: string) => {
    switch (action) {
      case 'open_checkout':
        setShowCheckout(true);
        break;
      default:
        break;
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await handleSend(content);
      setTimeout(() => scrollToBottom(true), 200);
      if (isDesktop) {
        setShouldRefocus(true);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  // Função para focar no input com segurança
  const handleInputFocus = () => {
    setTimeout(() => {
      if (inputRef.current) {
        try {
          inputRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } catch {
          // Silencia qualquer erro
        }
      }
    }, 300);
  };

  async function handleSend(content: string): Promise<void> {
    if (!content?.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: content.trim(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: data.content,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Process sales funnel actions
      if (data.nextAction) {
        executeNextAction(data.nextAction);
      }

      // Update sales data
      if (data.leadData) {
        setSalesData(data.leadData);
        setShowFunnelDebug(true);
      }

      // Show payment modal if needed
      if (data.shouldShowPaymentModal) {
        setShowCheckout(true);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'Desculpe, houve um erro de conexão. Tente novamente.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    const successMessage: Message = {
      id: `success_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: 'Parabéns! Sua assinatura foi ativada com sucesso! 🎉 Você receberá as instruções de acesso em seu email. Bem-vindo à família Clara! 🚀',
    };
    setMessages(prev => [...prev, successMessage]);
  };

  //

  // Controla montagem para evitar problemas de hidratação do ThemeToggle
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Detecta altura do teclado (mobile) e gerencia scroll inteligente
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let initialViewportHeight = window.innerHeight;
    
    function handleViewportChange() {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        
        if (heightDifference > 150) {
          setIsKeyboardVisible(true);
          setTimeout(() => scrollToBottom(true), 300);
        } else {
          setIsKeyboardVisible(false);
        }
      }
    }
    
    function handleResize() {
      if (!isKeyboardVisible) {
        initialViewportHeight = window.innerHeight;
      }
      handleViewportChange();
    }
    
    // Eventos para diferentes browsers/dispositivos
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.addEventListener('resize', handleResize);
    
    const handleFocusIn = () => {
      setTimeout(handleViewportChange, 300);
    };
    
    const handleFocusOut = () => {
      setTimeout(() => {
        setIsKeyboardVisible(false);
      }, 300);
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isKeyboardVisible]);

  // Detecta se é desktop
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkDesktop = () => {
        setIsDesktop(window.matchMedia('(pointer: fine)').matches && window.innerWidth > 768);
      };
      checkDesktop();
      window.addEventListener('resize', checkDesktop);
      return () => window.removeEventListener('resize', checkDesktop);
    }
  }, []);

  // Foco inicial apenas no desktop
  useEffect(() => {
    if (isDesktop && inputRef.current && isMounted) {
      inputRef.current.focus();
    }
  }, [isDesktop, isMounted]);

  // Auto-foco após enviar mensagem (apenas desktop)
  const [shouldRefocus, setShouldRefocus] = useState(false);
  useEffect(() => {
    if (shouldRefocus && isDesktop && inputRef.current && !isLoading) {
      setTimeout(() => {
        inputRef.current?.focus();
        setShouldRefocus(false);
      }, 100);
    }
  }, [shouldRefocus, isDesktop, isLoading]);



  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-background overflow-hidden max-h-dvh h-full w-full min-h-0">
        {/* Header fixo sempre visível no topo */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border z-50">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background">
                  <div className="w-full h-full bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-base">
                  Donna IA
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Sua Vendedora 24/7
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Banner Features */}
              <button
                id="pwa-button"
                onClick={() => setShowPWAIntegration(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium rounded-full hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                ✨ Features
              </button>
              {isMounted && <ThemeToggle />}
            </div>
          </div>
        </div>

        {/* Messages - Área com scroll */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar overscroll-behavior-y-contain min-h-0"
          style={{
            padding: 0,
            transition: 'padding 0.3s ease-in-out'
          }}
        >
          <div className="p-4 lg:p-6">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <AnimatePresence initial={false}>
                {/* Cards e introdução removidos */}
                
                {/* Mensagens do chat - com null check */}
                {currentThread?.messages
                  ?.filter(message => message.id && message.id.trim() !== '') // Filtra mensagens sem ID válido
                  ?.map((message, index) => (
                  <ChatMessage
                    key={`msg-${message.id}-${index}`} // Combina ID com índice para garantir unicidade
                    message={message}
                    isLatest={
                      index === (currentThread?.messages?.length ?? 0) - 1
                    }
                  />
                )) || []}
                {isTyping && <TypingIndicator key="typing-indicator" />}
              </AnimatePresence>
              <div
                ref={messagesEndRef}
                style={{ height: isKeyboardVisible ? 0 : 20 }}
              />
            </div>
          </div>
        </div>

        {/* Input - Fixo no bottom */}
        <div className="flex-shrink-0 bg-background border-t border-border px-4 lg:px-6 py-3 z-50 sticky bottom-0 min-h-0">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isLoading}
              inputRef={inputRef}
              onFocus={handleInputFocus}
            />
          </div>
        </div>
      </div>



      {/* PWA Features Modal - Full Screen com z-index máximo */}
      <AnimatePresence>
        {showPWAIntegration && (
          <motion.div
            key="pwa-features-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-background"
            style={{ zIndex: 9999 }}
          >
            <div className="h-full w-full overflow-hidden">
              <PWAFeatures />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug do Funil de Vendas */}
      <SalesFunnelDebug 
        salesData={salesData} 
        isVisible={showFunnelDebug} 
      />
      
      {/* Sistema Progressivo - Desabilitado para limpeza visual */}
      
      {/* Demonstração de Notificações - Desabilitado para limpeza visual */}
    </>
  );
}
