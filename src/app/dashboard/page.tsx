'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/ui/app-layout';
import { useUserStore } from '@/lib/stores/user-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { Sparkles, Heart, MessageCircle, TrendingUp, Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, mapa } = useUserStore();
  const { isLoading: authLoading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Carousel com todos os números numerológicos
  const numerologySlides = [
    {
      title: 'Número do Destino',
      number: mapa.numeroDestino,
      description: 'Seu propósito de vida e missão principal',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Número da Sorte',
      number: mapa.numeroSorte,
      description: 'Energia que atrai oportunidades favoráveis',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Número Pessoal',
      number: user.numeroDestino,
      description: 'Sua essência e características únicas',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Ciclo de Vida',
      number: mapa.cicloVida.fase === 'Juventude' ? 1 : mapa.cicloVida.fase === 'Maturidade' ? 2 : 3,
      description: `Fase atual: ${mapa.cicloVida.fase}`,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % numerologySlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + numerologySlides.length) % numerologySlides.length);
  };

  const quickActions = [
    {
      title: 'Chat com IA',
      description: 'Converse com o oráculo',
      icon: MessageCircle,
      href: '/chat',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Compatibilidade',
      description: 'Teste sua afinidade',
      icon: Heart,
      href: '/compatibilidade',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Previsões',
      description: 'Veja o que te espera',
      icon: TrendingUp,
      href: '/previsoes',
      color: 'from-purple-500 to-purple-600'
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
                          <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${slide.color} flex items-center justify-center mx-auto mb-4`}>
                            <span className="text-3xl font-bold text-white">{slide.number}</span>
                          </div>
                          <h4 className={`text-xl font-semibold mb-2 ${slide.textColor}`}>
                            {slide.title}
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {slide.description}
                          </p>
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
                <Link key={action.title} href={action.href}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mr-3`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-700">{action.description}</p>
                    </div>
                  </motion.div>
                </Link>
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
              <p className="text-gray-700 leading-relaxed">
                Com seu número do destino {user.numeroDestino}, hoje é um dia favorável para 
                {user.numeroDestino % 2 === 0 
                  ? ' colaboração e trabalho em equipe. Sua energia receptiva está em alta.' 
                  : ' liderança e iniciativa. Sua energia ativa está em destaque.'
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
