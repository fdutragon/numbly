"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AppLayout } from "@/components/ui/app-layout";
import {
  Sparkles,
  Moon,
  Sun,
  Heart,
  BookOpen,
  MessageCircle,
  PenTool,
  Trophy,
  Zap,
  Eye,
  Calendar,
  Filter,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Types
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  type:
    | "DAILY_MEDITATION"
    | "ARTICLE"
    | "ORACLE_MESSAGE"
    | "RITUAL_GUIDE"
    | "NUMEROLOGY_INSIGHT";
  personalDay?: number;
  lunarPhase?: string;
  numerologyFocus?: string;
  meditationAudio?: string;
  meditationDuration?: number;
  tags: string[];
  views: number;
  likes: number;
  publishedAt: string;
}

interface UserStats {
  streak: number;
  completedMeditations: number;
  journalEntries: number;
  badges: string[];
  currentMood?: string;
  personalDay: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 7,
    completedMeditations: 12,
    journalEntries: 8,
    badges: ["guardian-constancy", "soul-scribe"],
    personalDay: 7,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showOracleModal, setShowOracleModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [oracleQuestion, setOracleQuestion] = useState("");
  const [oracleResponse, setOracleResponse] = useState("");

  // Mock data - substituir por API calls
  useEffect(() => {
    const mockPosts: BlogPost[] = [
      {
        id: "1",
        title: "Meditação da Aurora: Conectando com seu Dia Pessoal 7",
        content:
          "Hoje é um dia de introspecção e sabedoria interior. Seu dia pessoal 7 convida você a mergulhar nas profundezas da sua alma...",
        excerpt:
          "Uma jornada guiada para dias de contemplação e busca espiritual.",
        type: "DAILY_MEDITATION",
        personalDay: 7,
        lunarPhase: "Crescente",
        numerologyFocus: "Espiritualidade",
        meditationAudio: "/meditations/aurora-day7.mp3",
        meditationDuration: 900, // 15 minutos
        tags: ["meditação", "dia-pessoal-7", "introspecção"],
        views: 234,
        likes: 89,
        publishedAt: "2025-07-02T06:00:00Z",
      },
      {
        id: "2",
        title: "Os Mistérios do Número 11: Portal de Iluminação",
        content:
          "O número 11 é conhecido como um número mestre na numerologia, representando intuição, espiritualidade e iluminação...",
        excerpt:
          "Descubra os segredos místicos por trás do poderoso número 11.",
        type: "NUMEROLOGY_INSIGHT",
        numerologyFocus: "Número Mestre 11",
        tags: ["numerologia", "número-mestre", "intuição"],
        views: 456,
        likes: 123,
        publishedAt: "2025-07-01T14:00:00Z",
      },
      {
        id: "3",
        title: "Ritual da Lua Nova: Plantando Sementes de Transformação",
        content:
          "A Lua Nova é o momento perfeito para novos começos. Este ritual irá ajudá-lo a manifestar seus desejos mais profundos...",
        excerpt: "Um guia completo para aproveitar a energia da Lua Nova.",
        type: "RITUAL_GUIDE",
        lunarPhase: "Nova",
        tags: ["ritual", "lua-nova", "manifestação"],
        views: 678,
        likes: 234,
        publishedAt: "2025-06-30T20:00:00Z",
      },
    ];
    setPosts(mockPosts);
  }, []);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "DAILY_MEDITATION":
        return Play;
      case "ARTICLE":
        return BookOpen;
      case "ORACLE_MESSAGE":
        return Sparkles;
      case "RITUAL_GUIDE":
        return Moon;
      case "NUMEROLOGY_INSIGHT":
        return Eye;
      default:
        return BookOpen;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "DAILY_MEDITATION":
        return "from-purple-500 to-violet-600";
      case "ARTICLE":
        return "from-blue-500 to-indigo-600";
      case "ORACLE_MESSAGE":
        return "from-yellow-500 to-amber-600";
      case "RITUAL_GUIDE":
        return "from-indigo-500 to-purple-600";
      case "NUMEROLOGY_INSIGHT":
        return "from-green-500 to-emerald-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const filteredPosts =
    filterType === "all"
      ? posts
      : posts.filter((post) => post.type === filterType);

  const handleOracleConsult = async () => {
    if (!oracleQuestion.trim()) return;

    // Simulate AI response
    setTimeout(() => {
      setOracleResponse(
        `🔮 O Oráculo sussurra: "${oracleQuestion}" ecoa na câmara dos espíritos. Vejo que sua alma busca respostas em meio à neblina do tempo. No seu dia pessoal ${userStats.personalDay}, os números cantam uma melodia de transformação. Confie na sua intuição - ela é o farol que guiará seus passos pelos caminhos ocultos do destino.`,
      );
    }, 2000);
  };

  const handleJournalSave = () => {
    // Save journal entry
    console.log("Salvando entrada do diário:", journalText);
    setJournalText("");
    setShowJournalModal(false);
  };

  return (
    <AppLayout title="Blog Místico">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header Místico */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              {userStats.personalDay && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    Dia {userStats.personalDay}
                  </div>
                  <div className="text-sm text-gray-600">Seu Ciclo Pessoal</div>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Jornada da Alma
            </h1>
            <p className="text-gray-700 mb-6">
              Sabedoria ancestral para nutrir seu despertar espiritual
            </p>

            {/* User Stats */}
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{userStats.streak} dias seguidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-purple-500" />
                <span>{userStats.completedMeditations} meditações</span>
              </div>
              <div className="flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-blue-500" />
                <span>{userStats.journalEntries} reflexões</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Button
            onClick={() => setShowOracleModal(true)}
            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Consultar Oráculo
          </Button>
          <Button
            onClick={() => setShowJournalModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <PenTool className="w-4 h-4 mr-2" />
            Diário da Alma
          </Button>
          <Button
            variant="outline"
            className="border-purple-200 hover:bg-purple-50"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Conquistas
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            Todos
          </Button>
          <Button
            variant={filterType === "DAILY_MEDITATION" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("DAILY_MEDITATION")}
          >
            <Play className="w-3 h-3 mr-1" />
            Meditações
          </Button>
          <Button
            variant={filterType === "ARTICLE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("ARTICLE")}
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Artigos
          </Button>
          <Button
            variant={filterType === "ORACLE_MESSAGE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("ORACLE_MESSAGE")}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Oráculo
          </Button>
          <Button
            variant={filterType === "RITUAL_GUIDE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("RITUAL_GUIDE")}
          >
            <Moon className="w-3 h-3 mr-1" />
            Rituais
          </Button>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredPosts.map((post, index) => {
              const IconComponent = getPostTypeIcon(post.type);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-purple-100 hover:border-purple-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getPostTypeColor(post.type)} flex items-center justify-center flex-shrink-0`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{post.views}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Heart className="w-3 h-3" />
                            <span>{post.likes}</span>
                          </div>
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {post.personalDay && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              Dia {post.personalDay}
                            </span>
                          )}
                          {post.lunarPhase && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              🌙 {post.lunarPhase}
                            </span>
                          )}
                        </div>

                        {post.meditationDuration && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <Play className="w-3 h-3 mr-1" />
                            {Math.floor(post.meditationDuration / 60)}min
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Oráculo Modal */}
        <AnimatePresence>
          {showOracleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowOracleModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Oráculo Contextual
                  </h3>
                  <p className="text-sm text-gray-600">
                    Faça sua pergunta e receba uma orientação mística baseada no
                    seu momento atual
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="Me senti ansioso hoje..."
                    value={oracleQuestion}
                    onChange={(value: string) => setOracleQuestion(value)}
                    className="border-purple-200 focus:border-purple-400"
                  />

                  {oracleResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200"
                    >
                      <p className="text-sm text-gray-700 italic leading-relaxed">
                        {oracleResponse}
                      </p>
                    </motion.div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleOracleConsult}
                      disabled={!oracleQuestion.trim() || !!oracleResponse}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                    >
                      {oracleResponse ? "Consultado" : "Consultar Oráculo"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOracleModal(false);
                        setOracleQuestion("");
                        setOracleResponse("");
                      }}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diário Modal */}
        <AnimatePresence>
          {showJournalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowJournalModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <PenTool className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Diário da Alma
                  </h3>
                  <p className="text-sm text-gray-600">
                    Escreva em poucas palavras o que sentiu...
                  </p>
                </div>

                <div className="space-y-4">
                  <textarea
                    placeholder="Hoje me senti conectado com minha intuição..."
                    value={journalText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setJournalText(e.target.value)
                    }
                    rows={4}
                    className="w-full border border-purple-200 rounded-lg p-3 focus:border-purple-400 focus:outline-none resize-none"
                  />

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleJournalSave}
                      disabled={!journalText.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      Salvar Reflexão
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowJournalModal(false);
                        setJournalText("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
