'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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
  const introPhrases = useMemo(() => [
    'Oi! Eu sou a Clara, sua secretária inteligente.',
    'Faço atendimento automático no WhatsApp, organizo agendamentos, gero relatórios e conecto campanhas de marketing.\n',
    'Como posso ajudar você hoje?'
  ], []);
  const [introIndex, setIntroIndex] = useState(0);
  const [introChar, setIntroChar] = useState(0);

  // Estados para funcionalidades de intenção
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'basic' | 'pro'>('basic');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const suggestionQuestions = [
    'Como automatizar meu atendimento no WhatsApp?',
    'Quais campanhas de marketing posso integrar?',
    'Como acessar relatórios de atendimentos?',
    'Quero contratar o plano Pro',
    'Clara, envie informações para meu@email.com'
  ];

  // Inicialização e gerenciamento do viewport
  useEffect(() => {
    const setInitialViewportHeight = () => {
      if (typeof window !== 'undefined') {
        // Não precisamos mais armazenar o viewport height
        console.log('Initial viewport height:', window.innerHeight);
      }
    };
    setInitialViewportHeight();
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      console.log('Viewport height changed to:', currentHeight);
      
      // Scroll para última mensagem após mudança do viewport
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'end'
        });
      }, 100);
    };

    // Listener para mudanças no viewport (principalmente teclado virtual)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  // Sempre inicia uma nova conversa ao montar o componente
  useEffect(() => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sempre scrolla para o final ao adicionar mensagem ou typing
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'end'
      });
    };
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [currentThread?.messages, isTyping]);

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
    if (introIndex < introPhrases.length && introChar === 0 && introIndex !== 0) {
      setIntroTyping(prev => prev + '');
    }
  }, [introIndex, introChar, introPhrases.length]);

  const handleSendMessage = async (content: string) => {
    // Fecha o teclado após envio da mensagem
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Chama a função original handleSend
    return handleSend(content);
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

    try {
      const messages = getCurrentThread()?.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })) || [];

      messages.push({ role: 'user', content });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages, 
          claraState: getCurrentThread()?.claraState 
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
      assistantMessageId = updatedThread?.messages[updatedThread.messages.length - 1]?.id || null;

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
                  const plan = userMessageLower.includes('pro') || userMessageLower.includes('premium') ? 'pro' : 'basic';
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
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
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
        content: 'Parabéns! Sua assinatura foi ativada com sucesso! 🎉 Você receberá as instruções de acesso em seu email. Bem-vindo à família Clara! 🚀',
      });
    }
  };

  // Controla se o typing terminou
  const isIntroFinished = introIndex === introPhrases.length - 1 && introChar === introPhrases[introPhrases.length - 1].length;

  // Estado para controlar visibilidade do header
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollTop = useRef(0);

  // Esconde header ao rolar para baixo, exibe ao rolar para cima
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const st = container.scrollTop;
          if (st > lastScrollTop.current + 8) {
            setShowHeader(false);
          } else if (st < lastScrollTop.current - 8) {
            setShowHeader(true);
          }
          lastScrollTop.current = st;
          ticking = false;
        });
        ticking = true;
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    console.log('Chat component rendered');
  });

  return (
    <>
      <div 
        className="flex flex-col w-full bg-background h-screen max-h-screen overflow-hidden"
        style={{ 
          height: '100dvh',
          maxHeight: '100dvh',
          overflow: 'hidden',
          position: 'relative',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Header - Fixo no topo, some ao rolar para baixo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showHeader ? 1 : 0, y: showHeader ? 0 : -40 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border flex-shrink-0 sticky top-0 z-40"
          style={{ position: 'sticky', top: 0, zIndex: 40, pointerEvents: showHeader ? 'auto' : 'none' }}
        >
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
              <h1 className="font-medium text-foreground text-base">
                Clara
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <ThemeToggle />
        </motion.div>
        
        {/* Messages - Área com scroll */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto custom-scrollbar pb-4" style={{ minHeight: 0, maxHeight: 'calc(100vh - 140px)' }}>
          <div className="p-4 pb-0">
            <div className="max-w-2xl mx-auto space-y-6">
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
                            className="w-full px-4 py-2.5 rounded-lg bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors text-left"
                            onClick={() => handleSendMessage(q)}
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
                      isLatest={index === (currentThread?.messages.length ?? 0) - 1}
                    />
                  ))
                )}   
                {isTyping && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>
        
        {/* Input - Fixo no bottom, sempre visível mesmo com teclado */}
        <div
          className="bg-background border-t border-border px-4 py-3 flex-shrink-0"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            // Garante que o input fique acima do teclado virtual em mobile
            touchAction: 'none',
            WebkitTransform: 'translateZ(0)',
            willChange: 'transform',
            width: '100vw',
            maxWidth: '100vw',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} inputRef={inputRef} />
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
