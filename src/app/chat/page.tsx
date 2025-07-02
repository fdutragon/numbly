'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AppLayout } from '@/components/ui/app-layout';
import { 
  Send, 
  Sparkles, 
  Crown, 
  Loader2,
  MessageCircle,
  Star,
  Heart,
  TrendingUp
} from 'lucide-react';
import { useUserStore } from '@/lib/stores/user-store';
import { useChatApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'oracle';
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, mapa, perguntasRestantes, addPergunta, decrementPergunta, isAuthenticated, isLoading: authLoading, requireAuth } = useAuth();
  const chatApi = useChatApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'Qual é o melhor momento para tomar decisões importantes?',
    'Como posso superar meus bloqueios pessoais?',
    'Que tipo de relacionamento é ideal para mim?',
    'Qual é meu propósito de vida segundo a numerologia?',
    'Como posso usar meu número da sorte a meu favor?',
    'Quais são minhas maiores fortalezas espirituais?'
  ];

  // Proteger rota - chamada correta do hook
  requireAuth();

  useEffect(() => {
    // Remover verificação redundante já que requireAuth já cuida disso
    
    // Mensagem de boas-vindas
    if (user && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Olá, ${user.nome.split(' ')[0]}! 🔮 Sou seu Oráculo Numerológico pessoal. Baseado no seu número do destino ${user.numeroDestino}, estou aqui para oferecer orientação e insights sobre sua jornada. O que gostaria de saber hoje?`,
        sender: 'oracle',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    if (user.plano === 'gratuito' && perguntasRestantes <= 0) {
      setShowPremiumModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const context = {
        numerologyContext: {
          userData: {
            name: user.nome,
            firstName: user.nome.split(' ')[0],
            birthDate: user.dataNascimento,
            numerologyData: {
              numeroDestino: user.numeroDestino.toString(),
              numeroSorte: mapa?.numeroSorte?.toString() || "0",
              potencial: mapa?.potencial || "",
              fortalezas: Array.isArray(mapa?.fortalezas) ? mapa.fortalezas.join(", ") : "",
              desafios: Array.isArray(mapa?.desafios) ? mapa.desafios.join(", ") : "",
              amor: mapa?.amor || "",
              cicloVida: mapa?.cicloVida?.fase || ""
            }
          }
        }
      };
      
      const data = await chatApi.sendMessage(currentInput, context);

      if (data.success && data.data) {
        const oracleMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.response,
          sender: 'oracle',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, oracleMessage]);

        if (user.plano === 'gratuito') {
          decrementPergunta();
        }
      } else {
        throw new Error(data.error || 'Erro na resposta da API');
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        sender: 'oracle',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading || !user || !mapa) {
    return (
      <AppLayout title="Chat">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando oráculo...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Oráculo">
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto relative">
        {/* Header Info */}
        <div className="px-4 py-2 bg-purple-50 rounded-lg mb-4 mx-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Oráculo Numerológico</p>
                <p className="text-xs text-purple-600">Baseado no seu número {user.numeroDestino}</p>
              </div>
            </div>
            
            {user.plano === 'gratuito' && (
              <div className="text-right">
                <p className="text-xs text-purple-600">
                  {perguntasRestantes} pergunta{perguntasRestantes !== 1 ? 's' : ''} restante{perguntasRestantes !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="premium"
                  size="sm"
                  onClick={() => setShowPremiumModal(true)}
                  className="text-xs mt-1"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {message.sender === 'oracle' && (
                    <div className="flex items-center mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-xs font-medium text-purple-600">Oráculo</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600 mr-2" />
                  <span className="text-sm text-gray-600">O oráculo está consultando os números...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <p className="text-sm font-medium text-gray-700 mb-3">Perguntas sugeridas:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left justify-start h-auto p-2 text-xs hover:bg-white"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="flex items-center space-x-3 w-full max-w-4xl mx-auto">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Digite sua pergunta para o oráculo..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      <Modal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Upgrade para Premium"
        size="md"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold mb-4">
            Perguntas Ilimitadas
          </h3>
          
          <p className="text-gray-600 mb-8">
            Com o plano Premium, você tem acesso ilimitado ao oráculo numerológico, 
            análises mais profundas e recursos exclusivos.
          </p>
          
          <div className="grid grid-cols-1 gap-4 mb-8">
            {[
              { icon: MessageCircle, title: 'Perguntas Ilimitadas', desc: 'Converse quanto quiser com o oráculo' },
              { icon: Star, title: 'Análises Profundas', desc: 'Insights mais detalhados e personalizados' },
              { icon: Heart, title: 'Compatibilidade Avançada', desc: 'Análise completa de relacionamentos' },
              { icon: TrendingUp, title: 'Previsões Mensais', desc: 'Tendências e orientações para o futuro' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center text-left">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <feature.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <Button className="w-full" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              Assinar Premium - R$ 19,90/mês
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowPremiumModal(false)}
              className="w-full"
            >
              Continuar com Plano Gratuito
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
