'use client';

import dynamic from 'next/dynamic';

const Chat = dynamic(
  () => import('@/components/chat/chat').then(mod => ({ default: mod.Chat })),
  {
    ssr: false,
    loading: () => null,
  }
);

import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    // Só reseta o chat em ambiente localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      try {
        // Limpa o estado do chat (Zustand persiste em localStorage)
        localStorage.removeItem('chat-store');
      } catch {}
    }
  }, []);

  return (
    <main className="min-h-0 h-full w-full overflow-hidden relative">
      {/* Chat Principal */}
      <Chat />
    </main>
  );
}
