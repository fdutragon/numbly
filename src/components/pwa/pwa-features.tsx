'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWA } from '@/lib/pwa-manager';
import { useCartRecovery } from '@/lib/cart-recovery-system';
import { AnalyticsModal } from './analytics-modal';

export function PWAFeatures() {
  const [pwaInfo, setPWAInfo] = useState<{
    isStandalone: boolean;
    canInstall: boolean;
    notificationPermission: NotificationPermission;
    isCartRecoveryActive: boolean;
    userId: string;
  } | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const {
    sendFunNotification,
    getPWAInfo,
    showInstallPrompt
  } = usePWA();
  
  const {
    startSession,
    startRecovery,
    pauseRecovery,
    getCurrentSession
  } = useCartRecovery();

  // Estado do cart recovery
  const [isCartRecoveryActive, setIsCartRecoveryActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Função simples para solicitar permissão
  const requestNotificationPermissionDirect = () => {
    if (!('Notification' in window)) {
      alert('❌ Seu navegador não suporta notificações.');
      return Promise.resolve('denied' as NotificationPermission);
    }

    console.log('🔔 Estado atual da permissão:', Notification.permission);

    // Se já concedida, retornar
    if (Notification.permission === 'granted') {
      return Promise.resolve('granted' as NotificationPermission);
    }

    // Sempre tentar solicitar permissão, mesmo se o estado for 'denied'
    // Isso permite que o usuário mude de ideia
    return Notification.requestPermission();
  };

  useEffect(() => {
    // Carregar informações PWA apenas uma vez na montagem
    const updatePWAInfo = () => {
      const info = getPWAInfo();
      setPWAInfo(info);
    };
    
    updatePWAInfo();
    
    // Verificar se há uma sessão de cart recovery ativa
    const checkCartRecoveryStatus = () => {
      const currentSession = getCurrentSession();
      if (currentSession && currentSession.recoveryActive) {
        setIsCartRecoveryActive(true);
        setCurrentSessionId(currentSession.sessionId);
      }
    };
    
    checkCartRecoveryStatus();
    
    // Opcional: Adicionar listeners para eventos específicos
    const handleAppInstalled = () => updatePWAInfo();
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePWAInfo();
      }
    };
    
    const handleOpenAnalytics = () => setShowAnalytics(true);
    const handleCloseAnalytics = () => setShowAnalytics(false);
    
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('openAnalyticsModal', handleOpenAnalytics);
    window.addEventListener('closeAnalyticsModal', handleCloseAnalytics);
    
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('openAnalyticsModal', handleOpenAnalytics);
      window.removeEventListener('closeAnalyticsModal', handleCloseAnalytics);
    };
  }, [getCurrentSession, getPWAInfo]); // Adicionando dependências necessárias

  const handleSendNotification = async () => {
    console.log('🔔 Iniciando teste de notificação...');
    
    try {
      const permission = await requestNotificationPermissionDirect();
      console.log('🔔 Permissão obtida:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Enviando notificação de teste...');
        
        // Enviar notificação de teste primeiro
        const testNotification = new Notification('🎉 Teste de Notificação', {
          body: 'Perfeito! As notificações estão funcionando. Agora você receberá alertas inteligentes da Donna AI.',
          icon: '/icons/icon-192x192.png',
          tag: 'test-notification'
        });

        // Fechar após 3 segundos
        setTimeout(() => testNotification.close(), 3000);

        await sendFunNotification();
        setNotificationSent(true);
        
        // Automaticamente adicionar usuário à recuperação de carrinho
        if (!isCartRecoveryActive) {
          const demoItems = [
            {
              id: 'donna-ai-starter',
              name: 'Donna AI - Assistente Inteligente',
              price: 97,
              quantity: 1,
              image: '/icons/icon-192x192.png'
            }
          ];
          
          const sessionId = startSession(demoItems, { 
            email: 'demo@example.com' 
          });
          
          setCurrentSessionId(sessionId);
          setIsCartRecoveryActive(true);
          startRecovery(sessionId);
        }
        
        setTimeout(() => setNotificationSent(false), 3000);
      } else if (permission === 'denied') {
        console.log('❌ Permissão negada pelo usuário');
        alert('❌ Você escolheu bloquear as notificações.\n\nPara reativar:\n1. Clique no ícone de cadeado/escudo na barra de endereços\n2. Permitir notificações\n3. Recarregue a página');
      } else {
        console.log('⚠️ Permissão não concedida:', permission);
        alert('⚠️ Permissão de notificação não foi concedida. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      alert('❌ Erro ao solicitar permissão de notificação.');
    }
  };

  const handleTestCartRecovery = async () => {
    console.log('🛒 Iniciando teste de cart recovery...');
    
    if (isCartRecoveryActive) {
      // Parar recuperação ativa
      console.log('⏸️ Pausando cart recovery ativo...');
      if (currentSessionId) {
        pauseRecovery(currentSessionId);
      }
      setIsCartRecoveryActive(false);
      setCurrentSessionId(null);
      return;
    }

    try {
      const permission = await requestNotificationPermissionDirect();
      console.log('🔔 Permissão para cart recovery:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Iniciando cart recovery...');
        
        // Criar carrinho de demonstração
        const demoItems = [
          {
            id: 'donna-ai-starter',
            name: 'Donna AI - Assistente Inteligente',
            price: 97,
            quantity: 1,
            image: '/icons/icon-192x192.png'
          }
        ];
        
        const sessionId = startSession(demoItems, { 
          email: 'demo@example.com' 
        });
        
        console.log('🛒 Sessão criada:', sessionId);
        
        setCurrentSessionId(sessionId);
        setIsCartRecoveryActive(true);
        
        // Iniciar processo de recuperação
        startRecovery(sessionId);
        
        // Enviar primeira notificação de demonstração
        await sendFunNotification();
        
        alert('✅ Recuperação de carrinho ativada! Você receberá notificações nos próximos minutos simulando um carrinho abandonado.');
      } else if (permission === 'denied') {
        console.log('❌ Permissão negada para cart recovery');
        alert('❌ Você escolheu bloquear as notificações.\n\nPara testar a recuperação de carrinho:\n1. Clique no ícone de cadeado/escudo na barra de endereços\n2. Permitir notificações\n3. Recarregue a página e tente novamente');
      } else {
        console.log('⚠️ Permissão não concedida para cart recovery');
        alert('⚠️ A recuperação de carrinho precisa de notificações para funcionar. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro no cart recovery:', error);
      alert('❌ Erro ao ativar recuperação de carrinho.');
    }
  };

  const [installLoading, setInstallLoading] = useState(false);
  const features = [
    {
      title: "📱 Central da Donna",
      description: "Sua central de comando: configure relatórios de atendimento, marketing, campanhas e muito mais. Tudo na palma da sua mão.",
      action: pwaInfo?.isStandalone ? "App já instalado" : installLoading ? "Aguardando..." : "Instalar App",
      onClick: async () => {
        if (pwaInfo?.canInstall && !pwaInfo?.isStandalone && !installLoading) {
          setInstallLoading(true);
          await showInstallPrompt();
          setTimeout(() => setInstallLoading(false), 2000);
        }
      },
      enabled: pwaInfo?.canInstall && !pwaInfo?.isStandalone && !installLoading
    },
    {
      title: "🔔 Alertas Inteligentes",
      description: "Receba notificações instantâneas de pedidos, pagamentos e eventos importantes do seu negócio.",
      action: notificationSent ? "Notificação Enviada! 🎉" : "Testar Notificação",
      onClick: handleSendNotification,
      enabled: true // Sempre habilitado
    },
    {
      title: "🛒 Recuperação Automática",
      description: "Reconquiste clientes automaticamente via push e WhatsApp quando abandonarem o carrinho.",
      action: isCartRecoveryActive ? "Parar Recuperação" : "Testar Recuperação",
      onClick: handleTestCartRecovery,
      enabled: true
    },
    // Removido: Sempre Online
    {
      title: "📊 Analytics & IA",
      description: "Relatórios inteligentes com simulações de conversas, gráficos de conversão e insights avançados.",
      action: "Ver Análises",
      onClick: () => {
        window.dispatchEvent(new CustomEvent('openAnalyticsModal'));
      },
      enabled: true
    }
  ];

  if (showAnalytics) {
    return <AnalyticsModal />;
  }

  return (
    <div className="w-full h-full min-h-screen bg-background relative overflow-y-auto">
      {/* Header fixo com botão de fechar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">D</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-base lg:text-lg">Donna AI</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">PWA e recursos avançados</p>
            </div>
          </div>
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('closePWAModal'));
            }}
            aria-label="Fechar modal"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-foreground">
            Central de Comando
          </h1>
          <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
            Configure seu negócio, monitore vendas e automatize conversões em tempo real
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:gap-6 mb-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
            >
              <CardHeader className="pb-2 lg:pb-3">
                <CardTitle className="text-lg lg:text-xl font-semibold text-foreground flex items-center gap-2">
                  <span className="text-xl lg:text-2xl">{feature.title.split(' ')[0]}</span>
                  <span>{feature.title.split(' ').slice(1).join(' ')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-foreground mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base">{feature.description}</p>
                <Button
                  onClick={feature.onClick}
                  disabled={!feature.enabled}
                  className="w-full font-semibold transition-all duration-200 rounded-lg border-2 border-violet-500 text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950 dark:text-violet-400 lg:text-base lg:py-3"
                  variant="outline"
                  size="lg"
                >
                  {feature.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Cronograma de Recuperação */}
        {isCartRecoveryActive && (
          <Card className="border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800 mb-8">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2 text-lg lg:text-xl">
                <span className="text-xl lg:text-2xl">🛒</span>
                Cronograma de Recuperação Automática
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 lg:space-y-4">
                {[
                  { step: 1, time: "5 minutos", message: "🤔 Esqueceu algo no seu carrinho?", emoji: "⏱️" },
                  { step: 2, time: "30 minutos", message: "😊 Sentimos sua falta! Finalize agora", emoji: "💭" },
                  { step: 3, time: "2 horas", message: "🎁 Oferta especial só para você!", emoji: "🔥" },
                  { step: 4, time: "24 horas", message: "⚡ Última chance! Não perca esta oportunidade", emoji: "⏰" },
                  { step: 5, time: "3 dias", message: "🎉 Volte e ganhe um desconto exclusivo!", emoji: "💎" }
                ].map(({ step, time, message, emoji }) => (
                  <div key={step} className="flex items-center gap-4 p-3 lg:p-4 rounded-lg bg-white/80 dark:bg-gray-800/50">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm lg:text-base shadow-sm">
                      {step}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm lg:text-base text-foreground">{emoji} {time}: "{message}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer com informações adicionais */}
        <div className="text-center py-8 lg:py-12 border-t border-border">
          <p className="text-muted-foreground text-sm lg:text-base">
            💡 <strong>Dica:</strong> Instale a Central da Donna para ter controle total do seu negócio sempre à mão
          </p>
        </div>
      </div>
    </div>
  );
}
