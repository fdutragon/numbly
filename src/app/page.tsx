'use client';

import dynamic from 'next/dynamic';

const Chat = dynamic(
  () => import('@/components/chat/chat').then(mod => ({ default: mod.Chat })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    ),
  }
);

export default function Page() {
  return (
    <main style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <Chat />
    </main>
  );
}
