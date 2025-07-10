'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

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
      {/* Chat Principal */}
      <Chat />
    </main>
  );
}
