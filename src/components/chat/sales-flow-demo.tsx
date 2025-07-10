'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  Bell, 
  Download, 
  Smartphone, 
  Star, 
  Zap,
  ShoppingCart,
  Clock,
  TrendingUp,
  Users,
  Gift,
  Target,
  Rocket,
  Crown,
  Play,
  CheckCircle2
} from 'lucide-react';
import { usePWA } from '@/lib/pwa-manager';
import { motion, AnimatePresence } from 'framer-motion';

interface SalesFlowDemoProps {
  isVisible: boolean;
  onClose: () => void;
  onStartDemo: () => void;
}

export function SalesFlowDemo({ isVisible, onClose, onStartDemo }: SalesFlowDemoProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSeenNotification, setHasSeenNotification] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const {
    sendFunNotification,
    showInstallPrompt
  } = usePWA();

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "💬 Chat Inteligente 24/7",
      description: "Atendimento automático que nunca dorme",
      benefits: ["Resposta em segundos", "Qualificação automática", "Follow-up inteligente"],
      color: "blue"
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "🔔 Notificações Push",
      description: "Seus clientes recebem ofertas direto no celular",
      benefits: ["Aumento de 40% nas vendas", "Engagement constante", "Lembretes automáticos"],
      color: "purple"
    },
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: "🛒 Recuperação de Carrinho",
      description: "5 notificações estratégicas recuperam vendas perdidas",
      benefits: ["60% dos carrinhos recuperados", "Automático e inteligente", "Sem banco de dados"],
      color: "green"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "📱 App Nativo do Cliente",
      description: "Seu chat vira um app no celular dos clientes",
      benefits: ["Presença constante", "Acesso instantâneo", "Funciona offline"],
      color: "indigo"
    }
  ];

  const steps = [
    {
      title: "🎯 Demonstração Interativa",
      subtitle: "Veja como a Donna AI revoluciona suas vendas"
    },
    {
      title: "🔔 Teste as Notificações",
      subtitle: "Experimente como seus clientes receberão suas ofertas"
    },
    {
      title: "📱 Instale como App",
      subtitle: "Transforme em um app nativo no seu dispositivo"
    },
    {
      title: "🚀 Pronto para Vender!",
      subtitle: "Agora você tem superpoderes de vendas"
    }
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleTryNotification = async () => {
    setIsPlaying(true);
    await sendFunNotification();
    setHasSeenNotification(true);
    
    setTimeout(() => {
      setIsPlaying(false);
      handleNextStep();
    }, 2000);
  };

  const handleInstallApp = () => {
    showInstallPrompt();
    handleNextStep();
  };

  const handleStartSelling = () => {
    onStartDemo();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay z-modal"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="modal-content z-modal-content elevation-5"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-thin border-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Donna AI</h1>
                  <p className="text-sm text-muted-foreground">Demonstração Exclusiva</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      index + 1 <= currentStep 
                        ? 'bg-primary' 
                        : 'bg-muted/30'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-foreground">
                  {steps[currentStep - 1]?.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {steps[currentStep - 1]?.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {/* Step 1: Overview */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {steps[currentStep - 1].title}
                  </h2>
                  <p className="text-gray-600">
                    {steps[currentStep - 1].subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 border-${feature.color}-500`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className={`p-2 bg-${feature.color}-100 rounded-lg`}>
                              {feature.icon}
                            </div>
                            {feature.title}
                          </CardTitle>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {feature.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <Button
                    onClick={handleNextStep}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Começar Demonstração
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Notification Demo */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="max-w-md mx-auto">
                  <Bell className="w-20 h-20 text-purple-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {steps[currentStep - 1].title}
                  </h2>
                  <p className="text-gray-600 mb-8">
                    {steps[currentStep - 1].subtitle}
                  </p>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 mb-6">
                    <h3 className="font-semibold text-purple-900 mb-3">
                      💼 Imagine seus clientes recebendo:
                    </h3>
                    <ul className="text-sm text-purple-800 space-y-2">
                      <li>🎯 "Nova oferta especial só para você!"</li>
                      <li>🔥 "Últimas horas de desconto!"</li>
                      <li>⭐ "Produto que você estava vendo está disponível!"</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleTryNotification}
                    disabled={isPlaying}
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isPlaying ? (
                      <>
                        <Gift className="w-5 h-5 mr-2 animate-bounce" />
                        Enviando Notificação...
                      </>
                    ) : hasSeenNotification ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Notificação Enviada! 🎉
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        Receber Notificação Demonstrativa
                      </>
                    )}
                  </Button>

                  {hasSeenNotification && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-green-600 text-sm mt-4"
                    >
                      ✅ Perfeito! Você viu como funciona. Seus clientes receberão assim!
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: App Installation */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="max-w-md mx-auto">
                  <Download className="w-20 h-20 text-green-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {steps[currentStep - 1].title}
                  </h2>
                  <p className="text-gray-600 mb-8">
                    {steps[currentStep - 1].subtitle}
                  </p>

                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-green-900">Acesso Instantâneo</h4>
                        <p className="text-sm text-green-700">Abra com um toque na tela inicial</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-blue-900">Funciona Offline</h4>
                        <p className="text-sm text-blue-700">Sempre disponível, mesmo sem internet</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-purple-900">Experiência Nativa</h4>
                        <p className="text-sm text-purple-700">Como um app de verdade</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleInstallApp}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Instalar Como App
                  </Button>

                  <Button
                    onClick={handleNextStep}
                    variant="ghost"
                    className="w-full mt-2"
                  >
                    Continuar sem instalar
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Ready to Sell */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="max-w-2xl mx-auto">
                  <Rocket className="w-24 h-24 text-indigo-600 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    🚀 Parabéns! Você tem superpoderes!
                  </h2>
                  <p className="text-gray-600 text-lg mb-8">
                    Agora você pode oferecer uma experiência única que nenhum concorrente tem
                  </p>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-xl border border-indigo-200 mb-8">
                    <h3 className="text-xl font-bold text-indigo-900 mb-6">
                      💼 Seu Diferencial Competitivo Exclusivo:
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">+60% mais vendas com cart recovery</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium">Notificações push personalizadas</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">App nativo para cada cliente</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Star className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm font-medium">Presença 24/7 no bolso dos clientes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleStartSelling}
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg py-4"
                    >
                      <Rocket className="w-6 h-6 mr-2" />
                      Começar a Vender com Superpoderes!
                    </Button>
                    
                    <p className="text-sm text-gray-500">
                      🎯 Agora você pode converter visitantes em clientes como nunca antes!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
