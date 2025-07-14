'use client';

// Adiciona a tipagem para VAPID_PUBLIC_KEY no objeto window
declare global {
  interface Window {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
  }
}

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { ThemeToggle } from '@/components/theme-toggle';
import { CheckoutComponent } from '@/components/donna/checkout-component';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { PWAFeatures } from '@/components/pwa/pwa-features';
import { useChatStore } from '@/lib/chat-store';
import { useFunnelAnalytics } from '@/lib/funnel-analytics';
import { ChatIntroCards } from '@/components/chat/chat-intro-cards';
import { generateDisruptiveResponse } from '@/lib/disruptive-donna-engine';
import { Bot, CheckCircle } from 'lucide-react';

export function Chat() {
  // Estado para controlar se as sugestões terminaram de animar
  const [suggestionsDone, setSuggestionsDone] = useState(false);
  // Estado para controlar o fluxo inicial dos cards
  const [showCards, setShowCards] = useState(true);
  // Estado para controlar o estágio do fluxo disruptivo
  const [currentFlowStage, setCurrentFlowStage] = useState<string>('');
  const {
    currentThreadId,
    isLoading,
    isTyping,
    createThread,
    setCurrentThread,
    addMessage,
    updateMessage,
    setLoading,
    setTyping,
    getCurrentThread,
    updateClaraState,
  } = useChatStore();
  
  // Analytics do funil de vendas
  const { metrics, advanceStage, recordTouchpoint, recordConversion, increaseLeadScore } = useFunnelAnalytics(currentThreadId || '');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Garante que currentThread sempre existe
  const currentThread = getCurrentThread();

  const [introTyping, setIntroTyping] = useState('');
  const introPhrases = useMemo(
    () => [
      'Oi! 👋 Sou a Donna, especialista em automação WhatsApp.',
      'Ajudo empresários a vender R$ 50k+/mês no automático.\n',
      'Qual seu maior desafio nas vendas? 🎯',
    ],
    []
  );
  const [introIndex, setIntroIndex] = useState(0);
  const [introChar, setIntroChar] = useState(0);

  // Estados para funcionalidades de intenção
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPWAIntegration, setShowPWAIntegration] = useState(false);

  // Sempre inicia uma nova conversa ao montar o componente
  useEffect(() => {
    // Garante que sempre temos um thread válido apenas na montagem inicial
    if (!currentThreadId) {
      const newThreadId = createThread();
      setCurrentThread(newThreadId);
    }
  }, [currentThreadId, createThread, setCurrentThread]); // Adicionando dependências necessárias

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

  // Debug: log do threadId atual - apenas quando muda
  useEffect(() => {
    if (currentThreadId) {
      console.log('Current Thread ID:', currentThreadId);
      console.log('Current Thread:', getCurrentThread());
    }
  }, [currentThreadId, getCurrentThread]); // Adicionando getCurrentThread às dependências

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

  // Scroll apenas quando terminar o typing effect, não durante
  const [hasTypingFinished, setHasTypingFinished] = useState(false);
  
  useEffect(() => {
    const isFinished = introIndex === introPhrases.length - 1 && 
                     introChar === introPhrases[introPhrases.length - 1].length;
    if (isFinished && !hasTypingFinished) {
      setHasTypingFinished(true);
    }
  }, [introIndex, introChar, introPhrases, hasTypingFinished]); // Adicionando introPhrases completo

  // Scroll ao receber nova mensagem (não durante intro)
  const messagesLength = currentThread?.messages.length || 0;
  useEffect(() => {
    if (messagesLength > 0) {
      scrollToBottom(true, 100);
    }
  }, [messagesLength]); // Use a length como dependência ao invés do array completo

  // Remove todos os scrolls automáticos exceto após mensagem do usuário

  // Typing effect robusto: requestAnimationFrame + setTimeout para evitar travamentos
  useEffect(() => {
    // Não executa typing se já há mensagens ou se já terminou
    if (messagesLength > 0) return;
    if (introIndex >= introPhrases.length) return;
    if (hasTypingFinished) return;
    
    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function typeChar() {
      if (cancelled) return;
      if (introChar < introPhrases[introIndex].length) {
        timeoutId = setTimeout(() => {
          rafId = requestAnimationFrame(() => {
            setIntroTyping(prev => prev + introPhrases[introIndex][introChar]);
            setIntroChar(c => c + 1);
          });
        }, 35);
      } else if (introIndex < introPhrases.length - 1) {
        timeoutId = setTimeout(() => {
          rafId = requestAnimationFrame(() => {
            setIntroTyping(prev => prev + '\n');
            setIntroIndex(i => i + 1);
            setIntroChar(0);
          });
        }, 900);
      }
    }
    typeChar();
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [introChar, introIndex, introPhrases, messagesLength, hasTypingFinished]); // Usar messagesLength ao invés do array completo

  useEffect(() => {
    if (
      introIndex < introPhrases.length &&
      introChar === 0 &&
      introIndex !== 0
    ) {
      setIntroTyping(prev => prev + '');
    }
  }, [introIndex, introChar, introPhrases.length]);

  // Função para lidar com cliques nos cards iniciais
  const handleCardClick = (cardType: string) => {
    setShowCards(false);
    setCurrentFlowStage(cardType);
    
    // Usar o motor disruptivo para gerar resposta
    const { response, nextAction, leadScoreIncrease } = generateDisruptiveResponse(
      '', 
      cardType
    );
    
    // Aumentar lead score
    if (leadScoreIncrease > 0) {
      increaseLeadScore(leadScoreIncrease);
    }
    
    // Criar thread se necessário
    const threadId = currentThreadId || createThread();
    if (!currentThreadId) {
      setCurrentThread(threadId);
    }
    
    // Adicionar resposta da Donna
    addMessage(threadId, {
      role: 'assistant',
      content: response,
    });
    
    // Executar próxima ação se necessária
    if (nextAction) {
      setTimeout(() => {
        executeNextAction(nextAction);
      }, 2000);
    }
  };

  // Função para executar ações do fluxo
  const executeNextAction = (action: string) => {
    switch (action) {
      case 'request_notifications':
        // Solicitar permissão para notificações
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              handleCardClick('notifications_granted');
            }
          });
        }
        break;
      case 'demo_whatsapp':
        // Trigger demo notifications
        const demoEvent = new CustomEvent('triggerDemoNotifications');
        window.dispatchEvent(demoEvent);
        break;
      case 'show_analytics':
        // Mostrar analytics no debug panel (já está visível)
        break;
      case 'push_app_download':
        // Mostrar modal de download do app
        break;
      case 'open_checkout':
        setShowCheckout(true);
        break;
    }
  };

  const handleSendMessage = async (content: string) => {
    // Oculta cards quando primeira mensagem é enviada
    if (showCards) {
      setShowCards(false);
    }
    
    // Registra touchpoint no analytics
    recordTouchpoint('user_message');
    
    // Verificar se deve usar o motor disruptivo
    const { response, nextAction, leadScoreIncrease } = generateDisruptiveResponse(
      content, 
      currentFlowStage
    );
    
    // Se há resposta disruptiva específica, usar ela ao invés da API
    if (response && currentFlowStage) {
      // Criar thread se necessário
      const threadId = currentThreadId || createThread();
      if (!currentThreadId) {
        setCurrentThread(threadId);
      }
      
      // Adicionar mensagem do usuário
      addMessage(threadId, {
        role: 'user',
        content,
      });
      
      // Aumentar lead score
      if (leadScoreIncrease > 0) {
        increaseLeadScore(leadScoreIncrease);
      }
      
      // Adicionar resposta da Donna
      setTimeout(() => {
        addMessage(threadId, {
          role: 'assistant',
          content: response,
        });
        
        // Executar próxima ação se necessária
        if (nextAction) {
          setTimeout(() => {
            executeNextAction(nextAction);
          }, 2000);
        }
      }, 500);
      
      return;
    }
    
    // Usar fluxo normal da API
    try {
      await handleSend(content);
      // Força scroll para mostrar a nova mensagem com delay maior
      setTimeout(() => scrollToBottom(true), 200);
      
      // Auto-foco apenas no desktop
      if (isDesktop) {
        setShouldRefocus(true);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setLoading(false);
      setTyping(false);
      
      // Adiciona mensagem de erro para o usuário
      const threadId = currentThreadId || createThread();
      addMessage(threadId, {
        role: 'assistant',
        content: 'Desculpe, houve um erro. Tente novamente em alguns instantes.',
      });
    }
  };

  // Função para focar no input com segurança
  // Garantido: nunca dá foco automático, nunca abre teclado sozinho
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
    // Validação de entrada
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.error('Invalid content provided to handleSend');
      return;
    }

    // Garante que sempre temos um threadId válido ANTES de qualquer operação
    let threadId: string = currentThreadId || '';
    if (!threadId) {
      try {
        threadId = createThread();
        setCurrentThread(threadId);
      } catch (error) {
        console.error('Failed to create thread:', error);
        return;
      }
    }

    // Verifica se a thread existe no store com tipo seguro
    let thread: ReturnType<typeof getCurrentThread> = getCurrentThread();
    if (!thread) {
      // Se não existe, força a criação
      try {
        threadId = createThread();
        setCurrentThread(threadId);
        thread = getCurrentThread();
      } catch (error) {
        console.error('Failed to create thread in fallback:', error);
        return;
      }
    }

    // Fallback final: se ainda não existe, cria thread com estrutura mínima
    if (!thread) {
      console.error('Failed to create thread, using final fallback');
      try {
        threadId = createThread();
        setCurrentThread(threadId);
        thread = getCurrentThread(); // Usa a thread criada pelo store
      } catch (error) {
        console.error('All thread creation attempts failed:', error);
        return;
      }
    }

    const claraState: Record<string, unknown> = thread?.claraState || {};

    console.log('Sending message with threadId:', threadId);
    console.log('Current thread state:', thread);
    console.log('Clara state:', claraState);

    // Add user message with null check
    try {
      addMessage(threadId, {
        role: 'user',
        content,
      });
    } catch (error) {
      console.error('Error adding message:', error);
      // Recria thread se falhar
      threadId = createThread();
      setCurrentThread(threadId);
      addMessage(threadId, {
        role: 'user',
        content,
      });
    }

    setLoading(true);
    setTyping(true);

    // Timeout para evitar loading infinito em dispositivos antigos
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        setLoading(false);
        setTyping(false);
        addMessage(threadId, {
          role: 'assistant',
          content: 'Desculpe, houve um problema de conexão. Tente novamente.',
        });
      }
    }, 30000); // 30 segundos timeout

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          threadId,
          claraState: claraState
        }),
      });

      console.log('API Request:', { message: content, threadId, claraState });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available from response');
      }

      let assistantMessageId: string | null = null;
      let fullContent = '';

      // Add initial empty assistant message
      addMessage(threadId, {
        role: 'assistant',
        content: '',
        isTyping: true,
      });

      // Get the message ID from the store
      const updatedThread = getCurrentThread();
      assistantMessageId =
        updatedThread?.messages[updatedThread.messages.length - 1]?.id || null;

      if (!assistantMessageId) {
        throw new Error('Failed to create assistant message');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content && typeof data.content === 'string') {
                fullContent += data.content;
                if (assistantMessageId) {
                  updateMessage(threadId, assistantMessageId, {
                    content: fullContent,
                    isTyping: true,
                  });
                }
              }
              
              if (data.done && assistantMessageId) {
                updateMessage(threadId, assistantMessageId, {
                  content: fullContent,
                  isTyping: false,
                });

                // Update Clara state/contexto da thread
                if (data.claraState && typeof data.claraState === 'object') {
                  console.log(
                    'Updating Clara state for thread:',
                    threadId,
                    data.claraState
                  );
                  updateClaraState(threadId, data.claraState);
                }

                // Analytics: avança stage do funil se mudou
                if (data.funnelStage && typeof data.funnelStage === 'string' && 
                    data.funnelStage !== metrics?.currentStage) {
                  advanceStage(data.funnelStage);
                  console.log('🚀 Funil stage updated:', data.funnelStage);
                }

                // Garante que o threadId seja mantido
                if (threadId && threadId !== currentThreadId) {
                  setCurrentThread(threadId);
                }

                // Handle payment modal
                if (data.shouldShowPaymentModal === true) {
                  // Analytics: registra conversão
                  recordConversion('payment_modal_shown');
                  
                  const userMessageLower = content.toLowerCase();
                  const plan =
                    userMessageLower.includes('pro') ||
                    userMessageLower.includes('premium')
                      ? 'pro'
                      : 'basic';
                  window.location.href = `/checkout?plan=${plan}`;
                  return;
                }

                // Handle email sent confirmation
                if (data.emailSent === true) {
                  setShowSuccessMessage(true);
                  setTimeout(() => setShowSuccessMessage(false), 3000);
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse chunk:', parseError);
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      
      addMessage(threadId, {
        role: 'assistant',
        content: 'Desculpe, houve um erro de conexão. Tente novamente em alguns instantes.',
      });
    } finally {
      // Limpa o timeout
      clearTimeout(loadingTimeout);
      setLoading(false);
      setTyping(false);
    }
  }

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // Add success message to chat
    if (currentThreadId) {
      addMessage(currentThreadId, {
        role: 'assistant',
        content:
          'Parabéns! Sua assinatura foi ativada com sucesso! 🎉 Você receberá as instruções de acesso em seu email. Bem-vindo à família Clara! 🚀',
      });
    }
  };

  // Controla se o typing terminou
  const isIntroFinished =
    introIndex === introPhrases.length - 1 &&
    introChar === introPhrases[introPhrases.length - 1].length;

  const suggestionQuestions: string[] = [
    '� Quanto custa para ter vendas automáticas 24h?',
    '⚡ Em quantos dias vou ver os primeiros resultados?',
    '🚀 Como funciona na prática? Quero ver demonstração',
    '📊 Tem casos reais de clientes que multiplicaram vendas?',
    '🎯 Posso testar GRÁTIS por 7 dias sem compromisso?',
  ];

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
        
        if (heightDifference > 150) { // Teclado provavelmente visível
          setIsKeyboardVisible(true);
          // Scroll para mostrar a última mensagem quando o teclado aparecer
          setTimeout(() => scrollToBottom(true), 300);
        } else {
          setIsKeyboardVisible(false);
        }
      }
    }
    
    function handleResize() {
      // Atualiza a altura inicial em rotações de tela
      if (!isKeyboardVisible) {
        initialViewportHeight = window.innerHeight;
      }
      handleViewportChange();
    }
    
    // Eventos para diferentes browsers/dispositivos
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.addEventListener('resize', handleResize);
    
    // Detecta foco em inputs (método adicional para iOS)
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
  }, [isKeyboardVisible]); // Adicionando isKeyboardVisible às dependências

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
                {/* Cards Iniciais - só aparecem se não há mensagens */}
                {showCards && (currentThread?.messages?.length ?? 0) === 0 && (
                  <motion.div
                    key="intro-cards"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="px-4"
                  >
                    <ChatIntroCards isVisible={showCards} onCardClick={handleCardClick} />
                  </motion.div>
                )}
                
                {/* Introdução da Donna - só mostra se não há cards e não há mensagens */}
                {!showCards && (currentThread?.messages?.length ?? 0) === 0 && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 flex flex-col items-center justify-center text-center px-6 py-8"
                  >
                    {!isIntroFinished && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-8"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 blur-xl animate-pulse"></div>
                          <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
                            <Bot className="w-10 h-10 text-white" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {/* Logo Donna IA */}
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Donna IA
                    </h3>
                    <div className="min-h-[2rem] mb-6">
                      <p className="text-muted-foreground max-w-sm mx-auto whitespace-pre-line text-base leading-relaxed">
                        {introTyping}
                        <span className="animate-pulse text-violet-500">|</span>
                      </p>
                    </div>
                    {isIntroFinished && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-3 w-full max-w-md mx-auto"
                        onAnimationComplete={() => setSuggestionsDone(true)}
                      >
                        {suggestionQuestions.map((q, i) => (
                          <motion.button
                            key={`suggestion-${i}-${q.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ 
                              scale: 1.02, 
                              backgroundColor: "rgb(139 92 246 / 0.1)",
                              borderColor: "rgb(139 92 246 / 0.3)" 
                            }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            className="group w-full px-5 py-4 lg:px-6 lg:py-5 rounded-xl text-left transition-all duration-200 bg-gradient-to-r from-background to-muted/50 hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-950/20 dark:hover:to-purple-950/20 border border-border/50 hover:border-violet-200 dark:hover:border-violet-800 shadow-sm hover:shadow-md text-foreground/80 hover:text-foreground backdrop-blur-sm"
                            onClick={() => handleSendMessage(q)}
                          >
                            <span className="text-sm lg:text-base font-medium leading-relaxed group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                              {q}
                            </span>
                            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-8 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"></div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}
                
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
        {(suggestionsDone || (currentThread?.messages?.length ?? 0) > 0) && (
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
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutComponent
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
      />

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

      {/* Debug do Funil - Desabilitado para limpeza visual */}
      
      {/* Sistema Progressivo - Desabilitado para limpeza visual */}
      
      {/* Demonstração de Notificações - Desabilitado para limpeza visual */}
    </>
  );
}
