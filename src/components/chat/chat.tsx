'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatInput } from '@/components/chat/chat-input';
import { ThemeToggle } from '@/components/theme-toggle';
import { CheckoutComponent } from '@/components/clara/checkout-component';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { useChatStore } from '@/lib/chat-store';
import { Bot, CheckCircle } from 'lucide-react';

export function Chat() {
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentThread = getCurrentThread();

  const [introTyping, setIntroTyping] = useState('');
  const introPhrases = useMemo(
    () => [
      'Oi! Eu sou a Clara, sua secretária inteligente.',
      'Faço atendimento automático no WhatsApp, organizo agendamentos, gero relatórios e conecto campanhas de marketing.\n',
      'Como posso ajudar você hoje?',
    ],
    []
  );
  const [introIndex, setIntroIndex] = useState(0);
  const [introChar, setIntroChar] = useState(0);

  // Estados para funcionalidades de intenção
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'basic' | 'pro'>('basic');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Estados para controle do header e pull to refresh
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cardsClicked, setCardsClicked] = useState<Set<number>>(new Set());
  
  // Sempre inicia uma nova conversa ao montar o componente
  useEffect(() => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
    // Garante que o header esteja visível no carregamento
    setIsHeaderVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sempre scrolla para o final ao adicionar mensagem ou typing
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    };
    
    // Delay para garantir que o DOM foi atualizado
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [currentThread?.messages, isTyping]);

  // Scroll adicional após envio de mensagem
  useEffect(() => {
    if (currentThread?.messages.length && currentThread.messages.length > 0) {
      const lastMessage = currentThread.messages[currentThread.messages.length - 1];
      if (lastMessage.role === 'user') {
        // Scroll imediato após mensagem do usuário
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      }
    }
  }, [currentThread?.messages]);

  useEffect(() => {
    if (currentThread?.messages.length) return;
    if (introIndex >= introPhrases.length) return;
    if (introChar < introPhrases[introIndex].length) {
      const timeout = setTimeout(() => {
        setIntroTyping(prev => prev + introPhrases[introIndex][introChar]);
        setIntroChar(c => c + 1);
      }, 35);
      return () => clearTimeout(timeout);
    } else if (introIndex < introPhrases.length - 1) {
      const timeout = setTimeout(() => {
        setIntroTyping(prev => prev + '\n');
        setIntroIndex(i => i + 1);
        setIntroChar(0);
      }, 900);
      return () => clearTimeout(timeout);
    }
  }, [introChar, introIndex, introPhrases, currentThread?.messages.length]);

  useEffect(() => {
    if (
      introIndex < introPhrases.length &&
      introChar === 0 &&
      introIndex !== 0
    ) {
      setIntroTyping(prev => prev + '');
    }
  }, [introIndex, introChar, introPhrases.length]);

  // Função para controlar a visibilidade do header baseado no scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const currentScrollY = messagesContainerRef.current.scrollTop;
    const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
    
    // Mostra header quando scrolling para cima ou no topo
    if (scrollDirection === 'up' || currentScrollY < 50) {
      setIsHeaderVisible(true);
    } else if (scrollDirection === 'down' && currentScrollY > 100) {
      setIsHeaderVisible(false);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  // Variável para armazenar a posição inicial do touch
  const touchStartY = useRef(0);
  
  // Função para lidar com pull to refresh
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (messagesContainerRef.current?.scrollTop === 0) {
      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      setPullDistance(0);
      setIsPullingToRefresh(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingToRefresh || !messagesContainerRef.current) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    if (messagesContainerRef.current.scrollTop === 0) {
      const distance = Math.max(0, currentY - touchStartY.current);
      setPullDistance(Math.min(distance, 120));
      
      if (distance > 0) {
        e.preventDefault();
      }
    }
  }, [isPullingToRefresh]);

  const handleTouchEnd = useCallback(() => {
    if (isPullingToRefresh && pullDistance > 80) {
      setIsRefreshing(true);
      // Simula refresh - recarrega a conversa
      setTimeout(() => {
        const newThreadId = createThread();
        setCurrentThread(newThreadId);
        setIsRefreshing(false);
        setIsPullingToRefresh(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setIsPullingToRefresh(false);
      setPullDistance(0);
    }
  }, [isPullingToRefresh, pullDistance, createThread, setCurrentThread]);

  // Event listeners para scroll e touch
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleScroll, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const handleSendMessage = async (content: string, cardIndex?: number) => {
    // Marca o card como clicado se for um card de sugestão
    if (cardIndex !== undefined) {
      setCardsClicked(prev => new Set(prev).add(cardIndex));
    }
    
    // Chama a função original handleSend
    await handleSend(content);
    
    // Força scroll para o final após envio
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    }, 150);
  };

  // Função para focar no input com segurança
  // Removido: qualquer foco automático no input. O teclado só abre se o usuário clicar.
  const handleInputFocus = () => {
    // Apenas scrolla o input para a área visível, sem dar foco automático
    setTimeout(() => {
      if (inputRef.current) {
        try {
          inputRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } catch (error) {
          console.warn('ScrollIntoView on focus failed:', error);
        }
      }
    }, 300);
  };

  async function handleSend(content: string) {
    if (!currentThreadId) {
      const newThreadId = createThread();
      setCurrentThread(newThreadId);
    }

    const threadId = currentThreadId || createThread();

    // Add user message
    addMessage(threadId, {
      role: 'user',
      content,
    });

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
      const messages =
        getCurrentThread()?.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })) || [];

      messages.push({ role: 'user', content });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          claraState: getCurrentThread()?.claraState,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
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

                // Update Clara state
                if (data.claraState) {
                  updateClaraState(threadId, data.claraState);
                }

                // Handle payment modal
                if (data.shouldShowPaymentModal) {
                  const userMessageLower = content.toLowerCase();
                  const plan =
                    userMessageLower.includes('pro') ||
                    userMessageLower.includes('premium')
                      ? 'pro'
                      : 'basic';
                  setCheckoutPlan(plan);
                  setShowCheckout(true);
                }

                // Handle email sent confirmation
                if (data.emailSent) {
                  setShowSuccessMessage(true);
                  setTimeout(() => setShowSuccessMessage(false), 3000);
                }
              }
            } catch {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage(threadId, {
        role: 'assistant',
        content:
          'Desculpe, houve um erro. Tente novamente em alguns instantes.',
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
    'Como automatizar meu atendimento no WhatsApp?',
    'Quais campanhas de marketing posso integrar?',
    'Como acessar relatórios de atendimentos?',
    'Quero contratar o plano Pro',
    'Clara, envie informações para meu@email.com',
  ];

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-background h-screen overflow-hidden">
        {/* Header com visibilidade dinâmica */}
        <motion.div 
          initial={{ y: 0 }}
          animate={{ y: isHeaderVisible ? 0 : -100 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 flex items-center justify-between px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border z-50"
        >
          <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
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
                <h1 className="font-medium text-foreground text-base">Clara</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  Online
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </motion.div>

        {/* Messages - Área com scroll */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar overscroll-behavior-y-contain"
          style={{ transform: `translateY(${isPullingToRefresh ? pullDistance : 0}px)` }}
        >
          {/* Pull to refresh indicator */}
          {isPullingToRefresh && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-background/90 backdrop-blur-sm z-40">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isRefreshing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Atualizando...</span>
                  </>
                ) : pullDistance > 80 ? (
                  <span className="text-violet-500">Solte para atualizar</span>
                ) : (
                  <span>Puxe para atualizar</span>
                )}
              </div>
            </div>
          )}
          
          <div className="p-4">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              <AnimatePresence initial={false}>
                {currentThread?.messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Clara
                    </h3>
                    <div className="min-h-[2rem] mb-6">
                      <p className="text-muted-foreground max-w-sm mx-auto whitespace-pre-line text-sm leading-relaxed">
                        {introTyping}
                        <span className="animate-pulse text-violet-500">|</span>
                      </p>
                    </div>
                    {isIntroFinished && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-2"
                      >
                        {suggestionQuestions.map((q, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="button"
                            className={`w-full px-4 py-2.5 rounded-lg text-sm text-left transition-colors ${
                              cardsClicked.has(i) 
                                ? 'bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            onClick={() => handleSendMessage(q, i)}
                          >
                            {q}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  currentThread?.messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLatest={
                        index === (currentThread?.messages.length ?? 0) - 1
                      }
                    />
                  ))
                )}
                {isTyping && <TypingIndicator />}
              </AnimatePresence>
              <div
                ref={messagesEndRef}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Input - Fixo no bottom */}
        <div className="flex-shrink-0 bg-background border-t border-border px-4 py-3 z-50 sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isLoading}
              inputRef={inputRef}
              onFocus={handleInputFocus}
            />
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutComponent
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
        plan={checkoutPlan}
      />

      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
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
    </>
  );
}
