'use client';

import dynamic from 'next/dynamic';

const Chat = dynamic(
  () => import('@/components/chat/chat').then(mod => ({ default: mod.Chat })),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function Page() {
  return (
    <main className="min-h-0 h-full w-full overflow-hidden">
      <Chat />
    </main>
  );
}
