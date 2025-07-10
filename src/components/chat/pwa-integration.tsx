'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Download, Smartphone, Star, Gift } from 'lucide-react';
import { usePWA } from '@/lib/pwa-manager';
import { motion } from 'framer-motion';

interface PWAIntegrationProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PWAIntegration({ isVisible, onClose }: PWAIntegrationProps) {
  const [step, setStep] = useState(1);
  const [hasTriedNotification, setHasTriedNotification] = useState(false);
  const {
    sendFunNotification,
    requestNotificationPermission,
    getPWAInfo,
    showInstallPrompt
  } = usePWA();

  const handleTryNotification = async () => {
    await sendFunNotification();
    setHasTriedNotification(true);
    setTimeout(() => {
      setStep(2);
    }, 2000);
  };

  const handleInstallApp = () => {
    showInstallPrompt();
    setStep(3);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 text-center">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">
                🔔 Experimenta as Notificações!
              </h2>
              
              <p className="text-gray-600">
                Veja como é ter a Donna AI sempre te lembrando das oportunidades de venda!
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Star className="w-4 h-4 inline mr-1" />
                  <strong>Diferencial único:</strong> Seus clientes podem ter o seu próprio chat app e receber notificações personalizadas!
                </p>
              </div>

              <Button
                onClick={handleTryNotification}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={hasTriedNotification}
              >
                {hasTriedNotification ? (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Notificação Enviada! 🎉
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Enviar Notificação Divertida
                  </>
                )}
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
              >
                Talvez depois
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">
                📱 Instale como App!
              </h2>
              
              <p className="text-gray-600">
                Tenha a Donna AI sempre à mão, como um app nativo no seu dispositivo!
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Acesso instantâneo</strong> - Abra com um toque
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Funciona offline</strong> - Sempre disponível
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Notificações push</strong> - Nunca perca uma venda
                  </p>
                </div>
              </div>

              <Button
                onClick={handleInstallApp}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar PWA
              </Button>

              <Button
                onClick={() => setStep(3)}
                variant="ghost"
                className="w-full"
              >
                Continuar sem instalar
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-purple-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">
                🚀 Agora você tem superpoderes!
              </h2>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">
                  💼 Vantagem Competitiva Exclusiva
                </h3>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>✅ Seus clientes podem instalar SEU chat como app</li>
                  <li>✅ Envie notificações push personalizadas</li>
                  <li>✅ Sistema de recuperação de carrinho automático</li>
                  <li>✅ Presença digital 24/7 no bolso dos clientes</li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Pronto para começar a vender como nunca antes?
                </p>
                
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Começar a Vender Agora!
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
