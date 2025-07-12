'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  Download, 
  Clock,
  TrendingUp,
  Gift,
  Rocket,
  Crown,
  Play,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { usePWA } from '@/lib/pwa-manager';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_STEPS } from '@/lib/sales-copy';

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

  const steps = [
    {
      title: DEMO_STEPS.step1.title,
      subtitle: DEMO_STEPS.step1.subtitle
    },
    {
      title: DEMO_STEPS.step2.title,
      subtitle: DEMO_STEPS.step2.subtitle
    },
    {
      title: DEMO_STEPS.step3.title,
      subtitle: DEMO_STEPS.step3.subtitle
    },
    {
      title: DEMO_STEPS.step4.title,
      subtitle: DEMO_STEPS.step4.subtitle
    }
  ];

  const featureCards = [
    {
      icon: <Bell className="w-8 h-8 text-primary" />, // Notificação
      title: 'Teste a Demo na Prática',
      description: 'Veja como a Donna AI recupera vendas e engaja clientes com notificações push reais. Experimente a automação de vendas em tempo real.'
    },
    {
      icon: <Smartphone className="w-8 h-8 text-primary" />, // PWA
      title: 'PWA: Instale como App',
      description: 'Tenha o seu negócio no bolso do cliente. Instale como app, envie push, aumente recorrência e fidelização.'
    }
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleInstallApp = () => {
    showInstallPrompt();
    handleNextStep();
  };

  const handleStartSelling = () => {
    onStartDemo();
    onClose();
  };

  // Funções e variáveis restauradas para evitar erros de referência
  const handleNotificationDemo = async () => {
    setIsPlaying(true);
    await sendFunNotification();
    if (typeof window !== 'undefined' && window.localStorage) {
      const mod = await import('@/lib/pwa-manager');
      mod.usePWA().sendLocalPush('Push Local', 'Notificação enviada localmente sem backend!');
    }
    setHasSeenNotification(true);
    setTimeout(() => {
      setIsPlaying(false);
      handleNextStep();
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="modal-container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay z-modal bg-black/80 dark:bg-black/90 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="modal-content z-modal-content elevation-5 bg-background"
        >
          {/* Features Cards Destacados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {featureCards.map((card, idx) => (
              <Card key={idx} className="elevation-2 border-thin">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  {card.icon}
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

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
                className="space-y-8"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 bg-red-500/10 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-4"
                  >
                    <TrendingUp className="w-4 h-4" />
                    ALERTA: Você está perdendo dinheiro agora
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    {DEMO_STEPS.step1.title}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {DEMO_STEPS.step1.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {DEMO_STEPS.step1.cards.map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-300 elevation-2 border-thin">
                        <CardHeader className="pb-4">
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{card.icon}</div>
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold text-foreground mb-2">
                                {card.title}
                              </CardTitle>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {card.description}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {card.results.map((result, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (index * 0.1) + (i * 0.05) }}
                                className="flex items-center gap-2"
                              >
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <span className="text-sm font-medium text-foreground">{result}</span>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center pt-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={handleNextStep}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold elevation-2"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Ver Como Funciona na Prática
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚡ Demonstração completa em 2 minutos
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Notification Demo */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  >
                    <Bell className="w-10 h-10 text-primary" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    {DEMO_STEPS.step2.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    {DEMO_STEPS.step2.subtitle}
                  </p>
                </div>

                <div className="max-w-lg mx-auto">
                  <div className="bg-card border border-thin rounded-2xl p-6 elevation-2 mb-6">
                    <h3 className="font-semibold text-foreground mb-4 text-center">
                      📱 Exemplos de notificações que seus clientes receberão:
                    </h3>
                    <div className="space-y-3">
                      {DEMO_STEPS.step2.examples.map((example, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm text-foreground font-medium">{example}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-muted-foreground italic">
                      {DEMO_STEPS.step2.impact}
                    </p>
                  </div>

                  <Button
                    onClick={handleNotificationDemo}
                    disabled={isPlaying}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold elevation-2"
                  >
                    {isPlaying ? (
                      <>
                        <Gift className="w-5 h-5 mr-2 animate-bounce" />
                        Enviando para você agora...
                      </>
                    ) : hasSeenNotification ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Notificação Enviada! 🎉
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        TESTAR NOTIFICAÇÃO AGORA
                      </>
                    )}
                  </Button>

                  {hasSeenNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center"
                    >
                      <p className="text-green-600 font-medium mb-2">
                        ✅ Perfeito! Você sentiu o poder das notificações push!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Agora imagine isso chegando para TODOS os seus clientes automaticamente...
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: App Installation */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  >
                    <Download className="w-10 h-10 text-primary" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    {DEMO_STEPS.step3.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    {DEMO_STEPS.step3.subtitle}
                  </p>
                </div>

                <div className="max-w-lg mx-auto">
                  <div className="grid gap-4 mb-8">
                    {DEMO_STEPS.step3.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-card border border-thin rounded-xl elevation-1"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">{benefit.icon}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleInstallApp}
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold elevation-2"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      INSTALAR COMO APP AGORA
                    </Button>

                    <Button
                      onClick={handleNextStep}
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      Continuar sem instalar
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                    <p className="text-sm text-blue-600 font-medium">
                      📱 Você pode instalar depois. O importante é ver o poder que terá!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Ready to Sell */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 elevation-3"
                  >
                    <Rocket className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <h2 className="text-4xl font-bold text-foreground mb-4">
                    {DEMO_STEPS.step4.title}
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {DEMO_STEPS.step4.subtitle}
                  </p>
                </div>

                <div className="max-w-3xl mx-auto">
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-600/10 border border-green-500/20 rounded-2xl p-8 elevation-2 mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                      💪 Seus Novos Superpoderes de Vendas:
                    </h3>
                    
                    <div className="grid gap-4">
                      {DEMO_STEPS.step4.competitive_advantages.map((advantage, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-card/50 rounded-lg"
                        >
                          <span className="text-lg">{advantage}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {DEMO_STEPS.step4.metrics.map((metric, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + (index * 0.1) }}
                        className="text-center p-4 bg-card border border-thin rounded-xl elevation-1"
                      >
                        <div className="text-2xl font-bold text-primary mb-1">
                          {metric.split(' ')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {metric.split(' ').slice(1).join(' ')}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 }}
                      className="space-y-6"
                    >
                      <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        <Clock className="w-4 h-4" />
                        OFERTA EXPIRA EM 48 HORAS
                      </div>
                      
                      <Button
                        onClick={handleStartSelling}
                        size="lg"
                        className="w-full max-w-md bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-xl py-6 font-bold elevation-3"
                      >
                        <Rocket className="w-6 h-6 mr-3" />
                        QUERO DOMINAR MEU MERCADO
                      </Button>
                      
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-foreground">
                          💰 APENAS R$ 47/mês (valor normal R$ 497)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          🔒 30 dias de garantia total + configuração em 48h
                        </p>
                        <p className="text-xs text-red-600 font-medium">
                          ⚡ Restam apenas 47 vagas para esta oferta
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
