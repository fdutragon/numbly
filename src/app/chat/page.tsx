'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Chat = dynamic(() => import('@/components/chat/chat').then(mod => ({ default: mod.Chat })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex items-center gap-2 text-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Carregando Clara...</span>
      </div>
    </div>
  ),
});

export default function ChatPage() {
  return <Chat />;
}
