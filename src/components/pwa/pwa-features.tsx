'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Download, Zap, ShoppingCart, Star } from 'lucide-react';
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
    setPWAInfo(getPWAInfo());
    // Se quiser atualizar dinamicamente, adicione listeners customizados aqui
    // Exemplo: window.addEventListener('appinstalled', () => setPWAInfo(getPWAInfo()));
  }, []); // Corrigido: roda só no mount

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
    <div className="w-full max-w-6xl mx-auto p-6 bg-background/95 rounded-2xl shadow-xl relative">
      <button
        className="absolute top-4 left-4 z-50 text-muted-foreground hover:text-foreground transition-colors bg-white/70 dark:bg-black/40 rounded-full p-2 shadow-md"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.reload();
          }
        }}
        aria-label="Fechar"
        type="button"
      >
        <span className="text-2xl leading-none">×</span>
      </button>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          🚀 Donna AI - Sua Vendedora no Bolso
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Transforme seu dispositivo em uma máquina de vendas 24/7
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow bg-card/90 dark:bg-card/80 border border-thin">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground mb-1">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
              <Button
                onClick={feature.onClick}
                disabled={!feature.enabled}
                className="w-full"
                variant={feature.enabled ? "default" : "outline"}
              >
                {feature.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status da PWA */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>📊 Status da PWA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${pwaInfo?.isStandalone ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>App Instalado: {pwaInfo?.isStandalone ? 'Sim' : 'Não'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${pwaInfo?.notificationPermission === 'granted' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>Notificações: {pwaInfo?.notificationPermission || 'Não permitidas'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isCartRecoveryActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <span>Cart Recovery: {isCartRecoveryActive ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Cronograma de Recuperação */}
      {isCartRecoveryActive && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">
              🕐 Cronograma de Recuperação de Carrinho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <span>5 minutos: "🛒 Esqueceu algo?"</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <span>30 minutos: "💔 Sentimos sua falta!"</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <span>2 horas: "🔥 Oferta especial!"</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <span>24 horas: "⏰ Última chance!"</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                <span>3 dias: "🎯 Volte e ganhe!"</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
