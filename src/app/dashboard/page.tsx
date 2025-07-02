'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/ui/app-layout';
import { ReportModal } from '@/components/ui/report-modal';
import { useUserStore } from '@/lib/stores/user-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { Sparkles, Heart, MessageCircle, TrendingUp, Calendar, Star, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, mapa } = useUserStore();
  const { isLoading: authLoading } = useAuth();
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
  const diaPessoalAtual = mapa ? (mapa.mesPessoal + new Date().getDate()) % 9 === 0 ? 9 : (mapa.mesPessoal + new Date().getDate()) % 9 : new Date().getDate() % 9 + 1;
  
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
          nomeUsuario: user.nome,
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

  if (authLoading || !user || !mapa) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-900">Carregando seus dados...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Carousel completo com todos os números numerológicos
  const numerologySlides = [
    {
      title: 'Número do Destino',
      number: mapa.numeroDestino,
      description: 'Seu propósito de vida e missão principal',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      icon: '🎯',
      reportType: 'geral'
    },
    {
      title: 'Número da Alma',
      number: mapa.numeroAlma,
      description: 'Sua motivação interior e desejos profundos',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      icon: '💖',
      reportType: 'espiritual'
    },
    {
      title: 'Número de Expressão',
      number: mapa.numeroExpressao,
      description: 'Como você se expressa e se comunica com o mundo',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: '🎭',
      reportType: 'carreira'
    },
    {
      title: 'Personalidade Externa',
      number: mapa.numeroPersonalidadeExterna,
      description: 'Como os outros te veem e sua primeira impressão',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      icon: '👤',
      reportType: 'geral'
    },
    {
      title: 'Número da Sorte',
      number: mapa.numeroSorte,
      description: 'Energia que atrai oportunidades favoráveis',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      icon: '🍀',
      reportType: 'dinheiro'
    },
    {
      title: 'Número de Maturidade',
      number: mapa.numeroMaturidade,
      description: 'Sua evolução após os 35 anos de idade',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      icon: '🌟',
      reportType: 'geral'
    },
    {
      title: 'Desafio Principal',
      number: mapa.desafioPrincipal,
      description: 'Sua maior lição e crescimento nesta vida',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      icon: '⚡',
      reportType: 'espiritual'
    },
    {
      title: 'Desejo Oculto',
      number: mapa.desejoOculto,
      description: 'Suas aspirações mais secretas e profundas',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      icon: '🔮',
      reportType: 'espiritual'
    },
    {
      title: 'Poder Interior',
      number: mapa.poderInterior,
      description: 'Sua força espiritual e capacidade de transformação',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      icon: '🔥',
      reportType: 'espiritual'
    },
    {
      title: 'Ano Pessoal',
      number: mapa.anoPessoal,
      description: 'A energia que rege este ano para você',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
      icon: '📅',
      reportType: 'anual'
    },
    {
      title: 'Mês Pessoal',
      number: mapa.mesPessoal,
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

  const quickActions: Array<{
    title: string;
    description: string;
    icon: any;
    color: string;
    action: 'link' | 'report';
    href?: string;
    reportType?: string;
  }> = [
    {
      title: 'Chat com IA',
      description: 'Converse com o oráculo numerológico',
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600',
      action: 'link',
      href: '/chat'
    },
    {
      title: 'Relatório de Amor',
      description: 'Análise completa da sua vida amorosa',
      icon: Heart,
      color: 'from-pink-500 to-pink-600',
      action: 'report',
      reportType: 'amor'
    },
    {
      title: 'Relatório de Carreira',
      description: 'Descubra seu potencial profissional',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      action: 'report',
      reportType: 'carreira'
    },
    {
      title: 'Relatório de Prosperidade',
      description: 'Sua relação com dinheiro e abundância',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      action: 'report',
      reportType: 'dinheiro'
    }
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1 text-white">
                    Bem-vindo, {user.nome.split(' ')[0]}!
                  </h2>
                  <p className="text-purple-100">
                    Seu número do destino é <span className="font-bold text-2xl text-white">{user.numeroDestino}</span>
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Numerology Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Seus Números Numerológicos
              </h3>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Carousel Container */}
                <div className="overflow-hidden rounded-lg">
                  <motion.div
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {numerologySlides.map((slide, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <div className={`${slide.bgColor} rounded-lg p-6 text-center`}>
                          <div className="text-2xl mb-2">{slide.icon}</div>
                          <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${slide.color} flex items-center justify-center mx-auto mb-4`}>
                            <span className="text-3xl font-bold text-white">{slide.number}</span>
                          </div>
                          <h4 className={`text-xl font-semibold mb-2 ${slide.textColor}`}>
                            {slide.title}
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            {slide.description}
                          </p>
                          <Button
                            onClick={() => openReport(slide.reportType, slide.title, slide.icon, slide.number)}
                            size="sm"
                            className={`bg-gradient-to-r ${slide.color} hover:opacity-90 text-white border-0 shadow-sm`}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Relatório
                          </Button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevSlide}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {/* Dots Indicator */}
                  <div className="flex space-x-2">
                    {numerologySlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextSlide}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blog Diário - Notícias do Dia Pessoal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                Blog Numerológico - Dia {diaPessoalAtual}
              </h3>
              <p className="text-sm text-gray-600">
                Insights especiais para o seu dia pessoal
                {blogData && <span className="ml-2 text-indigo-600 font-medium">• {blogData.energiaDominante}</span>}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingBlog ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">Carregando insights do dia...</span>
                </div>
              ) : blogData ? (
                <div className="grid gap-4">
                  {/* Primeira Notícia */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white font-bold text-sm">{blogData.blogPosts[0].numeroFoco}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-1 rounded">
                            {blogData.blogPosts[0].categoria}
                          </span>
                          <span className="text-xs text-indigo-500">
                            {blogData.blogPosts[0].momento}
                          </span>
                        </div>
                        <h4 className="font-semibold text-indigo-900 mb-1">
                          {blogData.blogPosts[0].titulo}
                        </h4>
                        <p className="text-sm text-indigo-700 font-medium mb-2">
                          {blogData.blogPosts[0].subtitulo}
                        </p>
                        <div className="text-indigo-800 text-sm leading-relaxed mb-3">
                          {blogData.blogPosts[0].conteudo.split('\n\n')[0]}
                        </div>
                        <Button
                          onClick={() => openReport('diario', blogData.blogPosts[0].titulo, '📅', blogData.blogPosts[0].numeroFoco)}
                          size="sm"
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                        >
                          Ver Análise Completa
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Segunda Notícia */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white font-bold text-sm">{blogData.numeroSincronia}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded">
                            {blogData.blogPosts[1].categoria}
                          </span>
                          <span className="text-xs text-emerald-500">
                            {blogData.blogPosts[1].momento}
                          </span>
                        </div>
                        <h4 className="font-semibold text-emerald-900 mb-1">
                          {blogData.blogPosts[1].titulo}
                        </h4>
                        <p className="text-sm text-emerald-700 font-medium mb-2">
                          {blogData.blogPosts[1].subtitulo}
                        </p>
                        <div className="text-emerald-800 text-sm leading-relaxed mb-3">
                          {blogData.blogPosts[1].conteudo.split('\n\n')[0]}
                        </div>
                        <Button
                          onClick={() => openReport('sincronia', blogData.blogPosts[1].titulo, '🔮', blogData.numeroSincronia)}
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          Explorar Sincronias
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dica Especial */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm">💡</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-1 rounded">
                            {blogData.dicaEspecial.categoria}
                          </span>
                        </div>
                        <h5 className="font-semibold text-amber-900 mb-2">
                          {blogData.dicaEspecial.titulo}
                        </h5>
                        <p className="text-amber-800 text-sm leading-relaxed">
                          {blogData.dicaEspecial.conteudo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Fallback para quando não há dados da API
                <div className="grid gap-4">
                  {/* Primeira Notícia - Fallback */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white font-bold text-sm">{diaPessoalAtual}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-indigo-900 mb-2">
                          Energia do Seu Dia Pessoal
                        </h4>
                        <p className="text-indigo-800 text-sm leading-relaxed mb-3">
                          Hoje, com a vibração do número {diaPessoalAtual}, você está em sintonia com energias que favorecem {
                            diaPessoalAtual === 1 ? 'novos começos e iniciativas pessoais' :
                            diaPessoalAtual === 2 ? 'cooperação e relacionamentos harmoniosos' :
                            diaPessoalAtual === 3 ? 'criatividade e expressão artística' :
                            diaPessoalAtual === 4 ? 'organização e trabalho metódico' :
                            diaPessoalAtual === 5 ? 'aventuras e mudanças positivas' :
                            diaPessoalAtual === 6 ? 'cuidado familiar e responsabilidades' :
                            diaPessoalAtual === 7 ? 'introspecção e desenvolvimento espiritual' :
                            diaPessoalAtual === 8 ? 'conquistas materiais e reconhecimento' :
                            'finalização de ciclos e ajuda ao próximo'
                          }. Aproveite esta vibração única para potencializar suas ações.
                        </p>
                        <Button
                          onClick={() => openReport('diario', 'Relatório do Dia Pessoal', '📅', diaPessoalAtual)}
                          size="sm"
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                        >
                          Ver Análise Completa
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Segunda Notícia - Fallback */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-900 mb-2">
                          Sincronias Numerológicas de Hoje
                        </h4>
                        <p className="text-emerald-800 text-sm leading-relaxed mb-3">
                          A combinação do seu número do destino {mapa.numeroDestino} com o dia pessoal {diaPessoalAtual} cria uma sinergia especial. 
                          {(mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9} é o número resultante desta união, 
                          trazendo oportunidades para {
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 1 ? 'liderança e inovação' :
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 2 ? 'diplomacia e parcerias' :
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 3 ? 'comunicação e criatividade' :
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 4 ? 'estabilidade e construção' :
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 5 ? 'liberdade e experiências' :
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 6 ? 'harmonia e cuidado' :
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 7 ? 'sabedoria e análise' :
                            ((mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9) === 8 ? 'poder e conquistas' :
                            'compaixão e finalização'
                          }.
                        </p>
                        <Button
                          onClick={() => openReport('sincronia', 'Sincronias Numerológicas', '🔮', (mapa.numeroDestino + diaPessoalAtual) % 9 === 0 ? 9 : (mapa.numeroDestino + diaPessoalAtual) % 9)}
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          Explorar Sincronias
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dica do Dia - Fallback */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">💡</span>
                      </div>
                      <h5 className="font-medium text-amber-900">Dica Numerológica do Dia</h5>
                    </div>
                    <p className="text-amber-800 text-sm">
                      {mapa.palavrasChave.length > 0 && `Sua palavra-chave de hoje é "${mapa.palavrasChave[0]}". `}
                      Mantenha-se atento aos números que aparecem repetidamente ao seu redor - eles podem conter mensagens importantes do universo para o seu momento atual.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (action.action === 'link' && action.href) {
                      window.location.href = action.href;
                    } else if (action.action === 'report' && action.reportType) {
                      openReport(action.reportType, action.title, '📊', undefined);
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mr-3`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{action.title}</h4>
                    <p className="text-sm text-gray-700">{action.description}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Insight do Dia
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  Com seu <strong>Domínio Vibracional {mapa.dominioVibracional}</strong> e número do destino <strong>{user.numeroDestino}</strong>, 
                  hoje é um dia especial para você!
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <p className="text-gray-800 mb-2">
                    <strong>Ano Pessoal {mapa.anoPessoal}:</strong> {getAnoPessoalMessage(mapa.anoPessoal)}
                  </p>
                  <p className="text-gray-800">
                    <strong>Mês Pessoal {mapa.mesPessoal}:</strong> {getMesPessoalMessage(mapa.mesPessoal)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {mapa.palavrasChave.slice(0, 3).map((palavra, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800">
                      {palavra}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Números Especiais - Mestres e Cármicos */}
        {(mapa.numerosMestres.length > 0 || mapa.numerosCarmicos.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center text-gray-900">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                  Números Especiais
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {mapa.numerosMestres.length > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-700 mb-2 flex items-center">
                      ✨ Números Mestres
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {mapa.numerosMestres.map((numero, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {numero}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-yellow-700">
                      Você possui números mestres! Isso indica um potencial espiritual elevado e missões especiais nesta vida.
                    </p>
                  </div>
                )}
                
                {mapa.numerosCarmicos.length > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                      ⚡ Números Cármicos
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {mapa.numerosCarmicos.map((numero, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          {numero}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-red-700">
                      Números cármicos representam lições importantes e desafios que trazem grande crescimento espiritual.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Domínio Vibracional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                Seu Domínio Vibracional
              </h3>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold text-lg mb-4">
                  {mapa.dominioVibracional}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {mapa.palavrasChave.map((palavra, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {palavra}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Frequência Numérica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Star className="w-5 h-5 mr-2 text-blue-500" />
                Análise de Frequência
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Números Dominantes */}
              {mapa.numerosDominantes.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">🔥 Números Dominantes (Forças)</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {mapa.numerosDominantes.map((numero, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {numero} ({mapa.frequenciaNumerica[numero]}x)
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-green-700">
                    Estes números aparecem com frequência em seu nome, indicando talentos naturais e características marcantes.
                  </p>
                </div>
              )}
              
              {/* Números Faltantes */}
              {mapa.numerosFaltantes.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">💎 Números Faltantes (Desenvolvimentos)</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {mapa.numerosFaltantes.map((numero, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {numero}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-blue-700">
                    Números ausentes em seu nome representam áreas de crescimento e desenvolvimento pessoal.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Ciclo de Vida e Compatibilidade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-gray-900">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Seu Ciclo de Vida Atual
              </h3>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-indigo-700">
                    Fase: {mapa.cicloVida.fase}
                  </h4>
                  <span className="text-sm text-indigo-600 font-medium">
                    {mapa.cicloVida.periodo}
                  </span>
                </div>
                <p className="text-indigo-700 text-sm mb-2">
                  {mapa.cicloVida.descricao}
                </p>
                <div className="flex items-center">
                  <span className="text-xs text-indigo-600 mr-2">Número Regente:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {mapa.cicloVida.numeroRegente}
                  </span>
                </div>
              </div>
              
              {/* Compatibilidade Rápida */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-green-700 mb-2 text-sm">💚 Compatíveis</h5>
                  <div className="flex flex-wrap gap-1">
                    {mapa.numerosCompatíveis.slice(0, 4).map((numero, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {numero}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-orange-700 mb-2 text-sm">⚡ Desafiadores</h5>
                  <div className="flex flex-wrap gap-1">
                    {mapa.numerosDesafiadores.slice(0, 4).map((numero, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {numero}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center text-sm text-gray-500 py-4"
        >
          <p>✨ Feito com amor para sua jornada espiritual ✨</p>
        </motion.div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReport}
        reportType={reportModal.reportType}
        reportNumber={reportModal.reportNumber}
        userData={{
          name: user.nome,
          firstName: user.nome.split(' ')[0],
          birthDate: user.dataNascimento,
          numerologyData: {
            'Número do Destino': mapa.numeroDestino,
            'Número da Alma': mapa.numeroAlma,
            'Número de Expressão': mapa.numeroExpressao,
            'Personalidade Externa': mapa.numeroPersonalidadeExterna,
            'Número da Sorte': mapa.numeroSorte,
            'Número de Maturidade': mapa.numeroMaturidade,
            'Desafio Principal': mapa.desafioPrincipal,
            'Desejo Oculto': mapa.desejoOculto,
            'Poder Interior': mapa.poderInterior,
            'Ano Pessoal': mapa.anoPessoal,
            'Mês Pessoal': mapa.mesPessoal,
            'Domínio Vibracional': mapa.dominioVibracional,
            'Palavras-chave': mapa.palavrasChave.join(', ')
          }
        }}
        title={reportModal.title}
        icon={reportModal.icon}
      />
    </AppLayout>
  );
}
