'use client';

import dynamic from 'next/dynamic';

const Chat = dynamic(
  () => import('@/components/chat/chat').then(mod => ({ default: mod.Chat })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-0 h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    ),
  }
);

export default function Page() {
  return (
    <main className="min-h-0 h-full w-full overflow-hidden">
      <Chat />
    </main>
  );
}
