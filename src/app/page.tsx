'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Bell, Download } from 'lucide-react';

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

export default function Page() {
  const [showPWAFeatures, setShowPWAFeatures] = useState(false);

  return (
    <main className="min-h-0 h-full w-full overflow-hidden relative">
      {/* PWA Features Banner */}
      <div className="absolute top-4 right-4 z-50">
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
