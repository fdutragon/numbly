'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWA } from '@/lib/pwa-manager';

export function PWAFeatures() {
  const [pwaInfo, setPWAInfo] = useState<{
    isStandalone: boolean;
    canInstall: boolean;
    notificationPermission: NotificationPermission;
    isCartRecoveryActive: boolean;
    userId: string;
  } | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);
  const {
    sendFunNotification,
    startCartRecovery,
    stopCartRecovery,
    isCartRecoveryActive,
    getPWAInfo,
    showInstallPrompt
  } = usePWA();

  useEffect(() => {
    const updatePWAInfo = () => {
      setPWAInfo(getPWAInfo());
    };
    
    updatePWAInfo();
    // Se quiser atualizar dinamicamente, adicione listeners customizados aqui
    // Exemplo: window.addEventListener('appinstalled', updatePWAInfo);
  }, [getPWAInfo]); // Adicionada dependência

  const handleSendNotification = async () => {
    await sendFunNotification();
    setNotificationSent(true);
    setTimeout(() => setNotificationSent(false), 3000);
  };

  const handleToggleCartRecovery = () => {
    if (isCartRecoveryActive) {
      stopCartRecovery();
    } else {
      startCartRecovery();
    }
    setPWAInfo(getPWAInfo());
  };

  const features = [
    {
      title: "📱 App Nativo",
      description: "Instale a Donna AI como um app em seu dispositivo",
      action: "Instalar PWA",
      onClick: showInstallPrompt,
      enabled: pwaInfo?.canInstall && !pwaInfo?.isStandalone
    },
    {
      title: "🔔 Notificações Push",
      description: "Receba lembretes e ofertas diretamente no seu dispositivo",
      action: notificationSent ? "Notificação Enviada! 🎉" : "Testar Notificação",
      onClick: handleSendNotification,
      enabled: pwaInfo?.notificationPermission !== 'denied'
    },
    {
      title: "🛒 Recuperação de Carrinho",
      description: "Sistema inteligente que lembra você de finalizar sua compra",
      action: isCartRecoveryActive ? "Parar Recuperação" : "Iniciar Recuperação",
      onClick: handleToggleCartRecovery,
      enabled: true
    },
    {
      title: "⚡ Acesso Rápido",
      description: "Abra a Donna AI instantaneamente, mesmo offline",
      action: "Sempre Disponível",
      onClick: () => {},
      enabled: pwaInfo?.isStandalone
    }
  ];

  return (
    <div className="w-full h-full min-h-screen bg-background relative">
      <button
        className="absolute top-4 right-4 z-50 text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border/50 hover:border-border"
        onClick={() => {
          window.location.href = '/';
        }}
        aria-label="Fechar"
        type="button"
      >
        <span className="text-2xl leading-none">×</span>
      </button>
      
      <div className="max-w-4xl mx-auto p-6 pt-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Donna AI - PWA Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transforme seu dispositivo em uma máquina de vendas 24/7
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 border-border/50 hover:border-violet-200 dark:hover:border-violet-800">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                <Button
                  onClick={feature.onClick}
                  disabled={!feature.enabled}
                  className="w-full font-semibold"
                  variant={feature.enabled ? "default" : "outline"}
                  size="lg"
                >
                  {feature.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status da PWA */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Status da PWA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${pwaInfo?.isStandalone ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="font-medium">App Instalado: {pwaInfo?.isStandalone ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${pwaInfo?.notificationPermission === 'granted' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="font-medium">Notificações: {pwaInfo?.notificationPermission || 'Não permitidas'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${isCartRecoveryActive ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                <span className="font-medium">Cart Recovery: {isCartRecoveryActive ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cronograma de Recuperação */}
        {isCartRecoveryActive && (
          <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200">
                Cronograma de Recuperação de Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div>
                  <span className="font-medium">5 minutos: "Esqueceu algo?"</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div>
                  <span className="font-medium">30 minutos: "Sentimos sua falta!"</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div>
                  <span className="font-medium">2 horas: "Oferta especial!"</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">4</div>
                  <span className="font-medium">24 horas: "Última chance!"</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">5</div>
                  <span className="font-medium">3 dias: "Volte e ganhe!"</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
