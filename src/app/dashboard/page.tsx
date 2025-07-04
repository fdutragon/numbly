'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ReportModal } from '@/components/ui/report-modal';
import { useUserStore } from '@/lib/stores/user-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { Sparkles, Heart, MessageCircle, TrendingUp, Calendar, Star, ChevronLeft, ChevronRight, FileText, Settings } from 'lucide-react';
import { NavBar } from '@/components/ui/navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, mapa } = useUserStore();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    reportType: string;
    reportNumber?: number;
    title: string;
    icon: string;
  }>({
    isOpen: false,
    reportType: '',
    title: '',
    icon: ''
  });

  // Calcular dia pessoal atual
  const diaPessoalAtual = mapa ? (mapa.mesPessoal + new Date().getDate()) % 9 === 0 ? 9 : (mapa.mesPessoal + new Date().getDate()) % 9 : (new Date().getDate() % 9) + 1;
  
  // Estado para o blog diário
  const [blogData, setBlogData] = useState<{
    blogPosts: Array<{
      titulo: string;
      subtitulo: string;
      conteudo: string;
      categoria: string;
      numeroFoco: number;
      momento: string;
    }>;
    dicaEspecial: {
      titulo: string;
      conteudo: string;
      categoria: string;
    };
    energiaDominante: string;
    numeroSincronia: number;
  } | null>(null);
  const [loadingBlog, setLoadingBlog] = useState(true);

  // Funções auxiliares para mensagens temporais
  const getAnoPessoalMessage = (ano: number): string => {
    const mensagens = {
      1: "Ano de novos começos e liderança. Tempo de iniciar projetos importantes.",
      2: "Ano de cooperação e relacionamentos. Foque em parcerias e colaborações.",
      3: "Ano de criatividade e comunicação. Expresse seus talentos ao mundo.",
      4: "Ano de trabalho duro e construção. Estabeleça bases sólidas para o futuro.",
      5: "Ano de mudanças e liberdade. Abrace novas experiências e aventuras.",
      6: "Ano de responsabilidade familiar. Cuide daqueles que ama.",
      7: "Ano de reflexão e espiritualidade. Busque conhecimento interior.",
      8: "Ano de conquistas materiais. Foque em negócios e reconhecimento.",
      9: "Ano de finalização e serviço. Complete ciclos e ajude os outros."
    };
    return mensagens[ano as keyof typeof mensagens] || "Ano de crescimento pessoal.";
  };

  const getMesPessoalMessage = (mes: number): string => {
    const mensagens = {
      1: "Mês ideal para começar novos projetos",
      2: "Tempo de fortalecer relacionamentos",
      3: "Período criativo e de expressão",
      4: "Mês para organização e planejamento",
      5: "Tempo de mudanças e aventuras",
      6: "Período de cuidado e harmonia familiar",
      7: "Mês de introspecção e estudos",
      8: "Tempo de foco nos negócios",
      9: "Período de encerramento de ciclos"
    };
    return mensagens[mes as keyof typeof mensagens] || "Mês de desenvolvimento pessoal";
  };

  // Carregar dados do blog diário
  const loadDailyBlog = async () => {
    if (!user || !mapa) return;
    
    setLoadingBlog(true);
    try {
      const response = await fetch('/api/ai/reports/daily-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diaPessoal: diaPessoalAtual,
          numeroDestino: mapa.numeroDestino,
          mesPessoal: mapa.mesPessoal,
          anoPessoal: mapa.anoPessoal,
          nomeUsuario: user.name,
          palavrasChave: mapa.palavrasChave
        })
      });

      const result = await response.json();
      if (result.success) {
        setBlogData(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar blog diário:', error);
    } finally {
      setLoadingBlog(false);
    }
  };

  // Carregar blog quando dados estiverem disponíveis
  useEffect(() => {
    if (user && mapa) {
      loadDailyBlog();
    }
  }, [user, mapa]);

  const openReport = (reportType: string, title: string, icon: string, reportNumber?: number) => {
    setReportModal({
      isOpen: true,
      reportType,
      reportNumber,
      title: `Relatório: ${title}`,
      icon
    });
  };

  const closeReport = () => {
    setReportModal({
      isOpen: false,
      reportType: '',
      title: '',
      icon: ''
    });
  };

  // Carousel completo com todos os números numerológicos
  const numerologySlides = [
    {
      title: 'Número do Destino',
      number: mapa?.numeroDestino,
      description: 'Seu propósito de vida e missão principal',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      icon: '🎯',
      reportType: 'geral'
    },
    {
      title: 'Número da Alma',
      number: mapa?.numeroAlma,
      description: 'Sua motivação interior e desejos profundos',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      icon: '💖',
      reportType: 'espiritual'
    },
    {
      title: 'Número de Expressão',
      number: mapa?.numeroExpressao,
      description: 'Como você se expressa e se comunica com o mundo',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: '🎭',
      reportType: 'carreira'
    },
    {
      title: 'Personalidade Externa',
      number: mapa?.numeroPersonalidadeExterna,
      description: 'Como os outros te veem e sua primeira impressão',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      icon: '👤',
      reportType: 'geral'
    },
    {
      title: 'Número da Sorte',
      number: mapa?.numeroSorte,
      description: 'Energia que atrai oportunidades favoráveis',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      icon: '🍀',
      reportType: 'dinheiro'
    },
    {
      title: 'Número de Maturidade',
      number: mapa?.numeroMaturidade,
      description: 'Sua evolução após os 35 anos de idade',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      icon: '🌟',
      reportType: 'geral'
    },
    {
      title: 'Desafio Principal',
      number: mapa?.desafioPrincipal,
      description: 'Sua maior lição e crescimento nesta vida',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      icon: '⚡',
      reportType: 'espiritual'
    },
    {
      title: 'Desejo Oculto',
      number: mapa?.desejoOculto,
      description: 'Suas aspirações mais secretas e profundas',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      icon: '🔮',
      reportType: 'espiritual'
    },
    {
      title: 'Poder Interior',
      number: mapa?.poderInterior,
      description: 'Sua força espiritual e capacidade de transformação',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      icon: '🔥',
      reportType: 'espiritual'
    },
    {
      title: 'Ano Pessoal',
      number: mapa?.anoPessoal,
      description: 'A energia que rege este ano para você',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
      icon: '📅',
      reportType: 'anual'
    },
    {
      title: 'Mês Pessoal',
      number: mapa?.mesPessoal,
      description: 'A vibração específica deste mês',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      icon: '🌙',
      reportType: 'mensal'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % numerologySlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + numerologySlides.length) % numerologySlides.length);
  };

  if (authLoading || !user || !mapa) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header minimalista */}
      <div className="border-b border-gray-100 px-4 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-900">Olá, {user.name?.split(' ')[0] || 'Usuário'}</h1>
              <p className="text-xs text-gray-500">Seu mapa numerológico pessoal</p>
            </div>
          </div>
          <Link href="/profile">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </Link>
        </div>
      </div>

      {/* Container principal com padding bottom para navbar */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Bem-vindo - removido já que está no header */}

        {/* Carousel dos números principais */}
        <div className="relative">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Seus Números</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-500 px-2">
                  {currentSlide + 1}/{numerologySlides.length}
                </span>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 bg-gradient-to-br ${numerologySlides[currentSlide].color} rounded-2xl flex items-center justify-center text-4xl shadow-lg`}>
                  {numerologySlides[currentSlide].icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {numerologySlides[currentSlide].title}
                  </h3>
                  <p className="text-4xl font-bold text-purple-600 mb-2">
                    {numerologySlides[currentSlide].number}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {numerologySlides[currentSlide].description}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => openReport(
                  numerologySlides[currentSlide].reportType,
                  numerologySlides[currentSlide].title,
                  numerologySlides[currentSlide].icon,
                  numerologySlides[currentSlide].number
                )}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Relatório Completo
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Energia de hoje */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Energia de Hoje</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Dia Pessoal</h3>
                <p className="text-sm text-gray-600">Vibração do dia</p>
              </div>
              <div className="text-4xl font-bold text-purple-600">{diaPessoalAtual}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-1">Ano Pessoal</h4>
                <p className="text-2xl font-bold text-blue-600 mb-2">{mapa.anoPessoal}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{getAnoPessoalMessage(mapa.anoPessoal)}</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <h4 className="font-medium text-gray-900 mb-1">Mês Pessoal</h4>
                <p className="text-2xl font-bold text-green-600 mb-2">{mapa.mesPessoal}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{getMesPessoalMessage(mapa.mesPessoal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/compatibilidade" className="block">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-gray-900">Compatibilidade</h3>
              </div>
              <p className="text-sm text-gray-600">Descubra sua afinidade com outras pessoas</p>
            </div>
          </Link>

          <Link href="/friends" className="block">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-gray-900">Amigos</h3>
              </div>
              <p className="text-sm text-gray-600">Conecte-se com outros usuários</p>
            </div>
          </Link>

          <div 
            onClick={() => openReport('geral', 'Relatório Completo', '📊', mapa.numeroDestino)}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-gray-900">Relatórios</h3>
            </div>
            <p className="text-sm text-gray-600">Análises detalhadas personalizadas</p>
          </div>
        </div>

        {/* Blog diário */}
        {blogData && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Reflexão do Dia</h2>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3 text-lg">{blogData.dicaEspecial.titulo}</h3>
                <p className="text-green-800 leading-relaxed">{blogData.dicaEspecial.conteudo}</p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-700">Energia dominante:</span>
                  <strong className="text-purple-600">{blogData.energiaDominante}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Sincronia:</span>
                  <strong className="text-blue-600">{blogData.numeroSincronia}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de relatórios */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReport}
        reportType={reportModal.reportType}
        reportNumber={reportModal.reportNumber}
        title={reportModal.title}
        icon={reportModal.icon}
        userData={{
          user: {
            name: user.name,
            firstName: user.name?.split(' ')[0] || 'Usuário'
          },
          mapa
        }}
      />

      <NavBar />
    </div>
  );
}
