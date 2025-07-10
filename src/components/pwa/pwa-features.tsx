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
    // Atualizar informações da PWA
    setPWAInfo(getPWAInfo());
  }, [getPWAInfo]);

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
      icon: <Download className="w-6 h-6" />,
      title: "📱 App Nativo",
      description: "Instale a Donna AI como um app em seu dispositivo",
      action: "Instalar PWA",
      onClick: showInstallPrompt,
      enabled: pwaInfo?.canInstall && !pwaInfo?.isStandalone
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "🔔 Notificações Push",
      description: "Receba lembretes e ofertas diretamente no seu dispositivo",
      action: notificationSent ? "Notificação Enviada! 🎉" : "Testar Notificação",
      onClick: handleSendNotification,
      enabled: pwaInfo?.notificationPermission !== 'denied'
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "🛒 Recuperação de Carrinho",
      description: "Sistema inteligente que lembra você de finalizar sua compra",
      action: isCartRecoveryActive ? "Parar Recuperação" : "Iniciar Recuperação",
      onClick: handleToggleCartRecovery,
      enabled: true
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "⚡ Acesso Rápido",
      description: "Abra a Donna AI instantaneamente, mesmo offline",
      action: "Sempre Disponível",
      onClick: () => {},
      enabled: pwaInfo?.isStandalone
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          🚀 Donna AI - Sua Vendedora no Bolso
        </h2>
        <p className="text-gray-600 text-lg">
          Transforme seu dispositivo em uma máquina de vendas 24/7
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {feature.icon}
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{feature.description}</p>
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

      {/* Diferencial de Negócio */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500" />
            💼 Diferencial Competitivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold">Seu Próprio Chat App</h4>
                <p className="text-gray-600">
                  Seus clientes podem instalar sua loja como um app e ter acesso direto à Donna AI
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold">Notificações Inteligentes</h4>
                <p className="text-gray-600">
                  Envie promoções, lembretes e ofertas diretamente para seus clientes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold">Recuperação Automática</h4>
                <p className="text-gray-600">
                  5 notificações estratégicas para recuperar vendas perdidas sem banco de dados
                </p>
              </div>
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
