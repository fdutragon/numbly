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
      <div className="absolute top-4 right-4 z-[60] flex gap-2">
        <Button
          onClick={() => setShowSalesDemo(true)}
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white elevation-3 backdrop-blur-sm"
        >
          <Bell className="w-4 h-4 mr-2" />
          Ver Demo
        </Button>
        
        <Button
          onClick={() => setShowPWAFeatures(!showPWAFeatures)}
          variant="outline"
          size="sm"
          className="bg-background/90 backdrop-blur-sm border-thin border-border text-foreground hover:bg-muted/50 elevation-2"
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
        <div className="modal-overlay z-modal">
          <div className="modal-content z-modal-content elevation-5">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-thin border-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-6 h-6 text-primary" />
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">PWA Features</h1>
                    <p className="text-sm text-muted-foreground">Recursos Técnicos Avançados</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowPWAFeatures(false)}
                  className="w-10 h-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <PWAFeatures />
            </div>
          </div>
        </div>
      )}

      {/* Chat Principal */}
      <Chat />
    </main>
  );
}
