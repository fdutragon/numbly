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
import { CheckoutComponent } from '@/components/clara/checkout-component';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { useChatStore, createInitialClaraState } from '@/lib/chat-store';
import { Bot, CheckCircle } from 'lucide-react';
import { usePWA } from '@/lib/pwa-manager';

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
  const { sendFunNotification } = usePWA();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentThread = getCurrentThread();

  const [introTyping, setIntroTyping] = useState('');
  const introPhrases = useMemo(
    () => [
      'Oi! 👋 Eu sou a Donna, sua vendedora digital 24/7.',
      'Transformo seu WhatsApp numa máquina de vendas que nunca para.\n',
      'Pronta para multiplicar suas vendas? 🚀',
    ],
    []
  );
  const [introIndex, setIntroIndex] = useState(0);
  const [introChar, setIntroChar] = useState(0);

  // Estados para funcionalidades de intenção
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Sempre inicia uma nova conversa ao montar o componente
  useEffect(() => {
    // Só cria novo thread se não existir um currentThreadId
    if (!currentThreadId) {
      const newThreadId = createThread();
      setCurrentThread(newThreadId);
    } else {
      // Limpa as mensagens da thread atual ao recarregar
      if (currentThreadId && currentThread) {
        // Executa updateClaraState apenas no client para evitar mismatch de Date.now()
        if (typeof window !== 'undefined') {
          updateClaraState(currentThreadId, {
            ...createInitialClaraState(),
            lastInteraction: currentThread.claraState?.lastInteraction || Date.now(),
            salesMetrics: {
              ...createInitialClaraState().salesMetrics,
              lastActiveTime: currentThread.claraState?.salesMetrics?.lastActiveTime || Date.now(),
            },
          });
        }
        // Limpa as mensagens mantendo o threadId
        if (currentThread.messages.length > 0) {
          useChatStore.setState(state => ({
            threads: state.threads.map(thread =>
              thread.id === currentThreadId
                ? { ...thread, messages: [] }
                : thread
            ),
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: log do threadId atual
  useEffect(() => {
    console.log('Current Thread ID:', currentThreadId);
    console.log('Current Thread:', currentThread);
  }, [currentThreadId, currentThread]);

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
      // Removido: não faz scroll ao terminar o typing effect
      // O scroll só ocorre quando há mensagens reais
    }
  }, [introIndex, introChar, introPhrases, hasTypingFinished]);

  // Scroll ao receber nova mensagem (não durante intro)
  useEffect(() => {
    if (currentThread?.messages.length && currentThread.messages.length > 0) {
      scrollToBottom(true, 100);
    }
  }, [currentThread?.messages.length]);

  // Remove todos os scrolls automáticos exceto após mensagem do usuário

  // Typing effect robusto: requestAnimationFrame + setTimeout para evitar travamentos
  useEffect(() => {
    // Não executa typing se já há mensagens ou se já terminou
    if (currentThread?.messages.length) return;
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
  }, [introChar, introIndex, introPhrases, currentThread?.messages.length, hasTypingFinished]);

  useEffect(() => {
    if (
      introIndex < introPhrases.length &&
      introChar === 0 &&
      introIndex !== 0
    ) {
      setIntroTyping(prev => prev + '');
    }
  }, [introIndex, introChar, introPhrases.length]);

  const handleSendMessage = async (content: string) => {
    await handleSend(content);
    // Força scroll para mostrar a nova mensagem com delay maior
    setTimeout(() => scrollToBottom(true), 200);
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

  async function handleSend(content: string) {
    // Garante que sempre temos um threadId válido
    let threadId = currentThreadId;
    if (!threadId) {
      threadId = createThread();
      setCurrentThread(threadId);
    }

    const thread = getCurrentThread();
    const claraState = thread?.claraState || {};

    console.log('Sending message with threadId:', threadId);
    console.log('Current thread state:', thread);
    console.log('Clara state:', claraState);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content, // apenas a mensagem atual
          threadId, // sempre envia o threadId
        }),
      });

      console.log('API Request:', { message: content, threadId });
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

                // Update Clara state/contexto da thread
                if (data.claraState) {
                  console.log(
                    'Updating Clara state for thread:',
                    threadId,
                    data.claraState
                  );
                  updateClaraState(threadId, data.claraState);
                }

                // Garante que o threadId seja mantido
                if (threadId && threadId !== currentThreadId) {
                  setCurrentThread(threadId);
                }

                // Handle payment modal
                if (data.shouldShowPaymentModal) {
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
    '🚀 Como Donna pode multiplicar minhas vendas?',
    '💰 Quanto custa para ter Donna trabalhando 24/7?',
    '⚡ Quanto tempo leva para implementar?',
    '📧 Envie mais informações para meu email',
    '🎯 Quero fazer um teste grátis agora!',
  ];

  // Controla montagem para evitar problemas de hidratação do ThemeToggle
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Detecta altura do teclado (mobile) e gerencia scroll inteligente
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    let initialViewportHeight = window.innerHeight;
    
    function handleViewportChange() {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        
        if (heightDifference > 150) { // Teclado provavelmente visível
          setKeyboardHeight(heightDifference);
          setIsKeyboardVisible(true);
          // Scroll para mostrar a última mensagem quando o teclado aparecer
          setTimeout(() => scrollToBottom(true), 300);
        } else {
          setKeyboardHeight(0);
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
        setKeyboardHeight(0);
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
      setIsDesktop(window.matchMedia('(pointer: fine)').matches);
    }
  }, []);

  useEffect(() => {
    if (isDesktop && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDesktop, isMounted]);

  // Card de sugestão para push notification
  const handleSendPushDemo = async () => {
    await sendFunNotification();
  };

  // Helper para converter VAPID para Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-background overflow-hidden max-h-dvh h-full w-full min-h-0">
        {/* Header fixo sempre visível no topo */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border z-50">
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
                <h1 className="font-semibold text-foreground text-base">
                  Donna IA
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">

                  Sua Vendedora 24/7
                </p>
              </div>
            </div>
            {isMounted && <ThemeToggle />}
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
          <div className="p-4">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              <AnimatePresence initial={false}>
                {/* Sempre mostra a introdução e cards, mesmo com mensagens */}
                <motion.div
                  key="intro-section"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                    {/* Espaçamento inteligente para o teclado */}
                    {isKeyboardVisible && currentThread?.messages.length === 0 && (
                      <div key="keyboard-spacer" style={{ height: Math.min(keyboardHeight * 0.3, 100) }} />
                    )}
                    {/* Card de envio de push notification - AGORA ACIMA DO LOGO DONNA */}
                    <div className="rounded-2xl bg-gradient-to-r from-primary/80 to-pink-500/80 p-4 flex items-center gap-4 shadow-lg border border-primary/30 mb-8 justify-center">
                      <button
                        onClick={async () => {
                          const reg = await navigator.serviceWorker.ready;
                          let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || window.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
                          // Sanitize: remove espaços, quebras de linha e caracteres invisíveis
                          vapidKey = (vapidKey || '').replace(/\s|\n|\r|\t|\u200B|\uFEFF/g, '');
                          console.log('VAPID_PUBLIC_KEY (sanitized):', vapidKey, 'length:', vapidKey.length);
                          if (!vapidKey || vapidKey.length < 40) {
                            alert('NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada ou inválida. Verifique o .env.production e o build.');
                            return;
                          }
                          let appServerKey;
                          try {
                            appServerKey = urlBase64ToUint8Array(vapidKey);
                          } catch (e) {
                            alert('NEXT_PUBLIC_VAPID_PUBLIC_KEY inválida (erro na conversão).');
                            return;
                          }
                          try {
                            const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({
                              userVisibleOnly: true,
                              applicationServerKey: appServerKey
                            });
                            const isProd = window.location.hostname === 'www.numbly.life';
                            const endpoint = isProd
                              ? 'https://www.numbly.life/api/push/demo'
                              : '/api/push/demo';
                            await fetch(endpoint, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ subscription: sub }),
                            });
                            alert('Push subscription criada e notificação enviada!');
                          } catch (err) {
                            console.error('Erro ao configurar push subscription:', err);
                            alert('Erro ao configurar push subscription: ' + (err instanceof Error ? err.message : String(err)));
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-primary font-bold rounded-lg shadow transition-colors"
                      >
                        <span role="img" aria-label="notificação">🔔</span>
                        Testar Notificação Push
                      </button>
                      <span className="text-white font-medium text-sm">Receba uma notificação real agora!</span>
                    </div>
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
                            className="group w-full px-5 py-4 rounded-xl text-left transition-all duration-200 bg-gradient-to-r from-background to-muted/50 hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-950/20 dark:hover:to-purple-950/20 border border-border/50 hover:border-violet-200 dark:hover:border-violet-800 shadow-sm hover:shadow-md text-foreground/80 hover:text-foreground backdrop-blur-sm"
                            onClick={() => handleSendMessage(q)}
                          >
                            <span className="text-sm font-medium leading-relaxed group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
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
                
                {/* Mensagens do chat */}
                {currentThread?.messages
                  .filter(message => message.id && message.id.trim() !== '') // Filtra mensagens sem ID válido
                  .map((message, index) => (
                  <ChatMessage
                    key={`msg-${message.id}-${index}`} // Combina ID com índice para garantir unicidade
                    message={message}
                    isLatest={
                      index === (currentThread?.messages.length ?? 0) - 1
                    }
                  />
                ))}
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
        <div className="flex-shrink-0 bg-background border-t border-border px-4 py-3 z-50 sticky bottom-0 min-h-0">
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
      />

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
    </>
  );
}
