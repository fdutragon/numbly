"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AppLayout } from "@/components/ui/app-layout";
import {
  Send,
  Sparkles,
  Crown,
  Loader2,
  MessageCircle,
  Star,
  Heart,
  TrendingUp,
} from "lucide-react";
import { useUserStore } from "@/lib/stores/user-store";
import { useChatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/ui/navbar";

import { User, MapaNumerologico } from "@/lib/stores/user-store";

interface Message {
  id: string;
  content: string;
  sender: "user" | "oracle";
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const {
    user,
    mapa,
    perguntasRestantes,
    addPergunta,
    decrementPergunta,
    isAuthenticated,
    isLoading: authLoading,
    requireAuth,
  } = useAuth();
  const chatApi = useChatApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Qual é o melhor momento para tomar decisões importantes?",
    "Como posso superar meus bloqueios pessoais?",
    "Que tipo de relacionamento é ideal para mim?",
    "Qual é meu propósito de vida segundo a numerologia?",
    "Como posso usar meu número da sorte a meu favor?",
    "Quais são minhas maiores fortalezas espirituais?",
  ];

  // Proteger rota - chamada correta do hook
  requireAuth();

  useEffect(() => {
    // Mensagem de boas-vindas
    if (user?.name && messages.length === 0) {
      const firstName = user.name.split(" ")[0];
      const destinyNumber = mapa?.numeroDestino || "?";
      const welcomeMessage: Message = {
        id: "welcome",
        content: `Olá, ${firstName}! 🔮 Sou seu Oráculo Numerológico pessoal. Baseado no seu número do destino ${destinyNumber}, estou aqui para oferecer orientação e insights sobre sua jornada. O que gostaria de saber hoje?`,
        sender: "oracle",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user, mapa?.numeroDestino, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    if (!user.isPremium && perguntasRestantes <= 0) {
      setShowPremiumModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const context = {
        numerologyContext: {
          userData: {
            name: user.name,
            firstName: user.name ? user.name.split(" ")[0] : "",
            birthDate: user.birthDate,
            numerologyData: {
              numeroDestino: mapa?.numeroDestino?.toString(),
              numeroSorte: mapa?.numeroSorte?.toString() || "0",
              potencial: mapa?.potencial || "",
              fortalezas: Array.isArray(mapa?.fortalezas)
                ? mapa.fortalezas.join(", ")
                : "",
              desafios: Array.isArray(mapa?.desafios)
                ? mapa.desafios.join(", ")
                : "",
              amor: mapa?.amor || "",
              cicloVida: mapa?.cicloVida?.fase || "",
            },
          },
        },
      };

      const data = await chatApi.sendMessage(currentInput, context);

      if (data.success && data.data) {
        const oracleMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.response,
          sender: "oracle",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, oracleMessage]);

        if (!user.isPremium) {
          decrementPergunta();
        }
      } else {
        throw new Error(data.error || "Erro na resposta da API");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Desculpe, ocorreu um erro. Tente novamente em alguns instantes.",
        sender: "oracle",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading || !user || !mapa) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando oráculo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header minimalista estilo OpenAI */}
      <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-gray-900">
              Oráculo Numerológico
            </h1>
            <p className="text-xs text-gray-500">
              Número do destino: {mapa?.numeroDestino || "?"}
            </p>
          </div>
        </div>

        {!user.isPremium && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {perguntasRestantes} restante{perguntasRestantes !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPremiumModal(true)}
              className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </div>
        )}
      </div>

      {/* Container principal estilo ChatGPT com padding bottom para navbar */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full pb-20">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`group mb-6 ${
                    message.sender === "user" ? "" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex gap-4 p-6 ${message.sender === "user" ? "" : "bg-gray-50 -mx-4"}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.sender === "user" ? (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group mb-6 bg-gray-50"
              >
                <div className="flex gap-4 p-6 bg-gray-50 -mx-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Consultando os números...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Questions - apenas quando não há mensagens */}
        {messages.length <= 1 && (
          <div className="border-t border-gray-100 bg-white px-4 py-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Sugestões para começar:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-left p-3 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-gray-300"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input area estilo ChatGPT */}
        <div className="border-t border-gray-100 bg-white px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <input
                type="text"
                placeholder="Faça sua pergunta ao oráculo..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500 resize-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="m-2 p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-600 rounded-lg transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
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

          <h3 className="text-xl font-semibold mb-4">Perguntas Ilimitadas</h3>

          <p className="text-gray-600 mb-8">
            Com o plano Premium, você tem acesso ilimitado ao oráculo
            numerológico, análises mais profundas e recursos exclusivos.
          </p>

          <div className="grid grid-cols-1 gap-4 mb-8">
            {[
              {
                icon: MessageCircle,
                title: "Perguntas Ilimitadas",
                desc: "Converse quanto quiser com o oráculo",
              },
              {
                icon: Star,
                title: "Análises Profundas",
                desc: "Insights mais detalhados e personalizados",
              },
              {
                icon: Heart,
                title: "Compatibilidade Avançada",
                desc: "Análise completa de relacionamentos",
              },
              {
                icon: TrendingUp,
                title: "Previsões Mensais",
                desc: "Tendências e orientações para o futuro",
              },
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

      {/* Navbar */}
      <NavBar />
    </div>
  );
}
