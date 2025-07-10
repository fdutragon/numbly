'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Bell } from 'lucide-react';

const Chat = dynamic(
  () => import('@/components/chat/chat').then(mod => ({ default: mod.Chat })),
  {
    ssr: false,
    loading: () => null,
  }
);

const PWAFeatures = dynamic(
  () => import('@/components/pwa/pwa-features').then(mod => ({ default: mod.PWAFeatures })),
  {
    ssr: false,
    loading: () => null,
  }
);

const SalesFlowDemo = dynamic(
  () => import('@/components/chat/sales-flow-demo').then(mod => ({ default: mod.SalesFlowDemo })),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function Page() {
  const [showPWAFeatures, setShowPWAFeatures] = useState(false);
  const [showSalesDemo, setShowSalesDemo] = useState(false);

  return (
    <main className="min-h-0 h-full w-full overflow-hidden relative">
      {/* Demo Buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          onClick={() => setShowSalesDemo(true)}
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
        >
          <Bell className="w-4 h-4 mr-2" />
          Ver Demo
        </Button>
        
        <Button
          onClick={() => setShowPWAFeatures(!showPWAFeatures)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          PWA Features
        </Button>
      </div>

      {/* Sales Demo Modal */}
      <SalesFlowDemo
        isVisible={showSalesDemo}
        onClose={() => setShowSalesDemo(false)}
        onStartDemo={() => {
          // Aqui você pode adicionar lógica para iniciar a demonstração do chat
          console.log('🚀 Iniciando demonstração de vendas!');
        }}
      />

      {/* PWA Features Modal/Panel */}
      {showPWAFeatures && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">🚀 Recursos PWA da Donna AI</h2>
              <Button
                onClick={() => setShowPWAFeatures(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
            <PWAFeatures />
          </div>
        </div>
      )}

      {/* Chat Principal */}
      <Chat />
    </main>
  );
}
