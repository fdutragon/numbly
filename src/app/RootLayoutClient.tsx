"use client";
import { AuthProvider } from '@/lib/contexts/auth-context';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  // Log para debug: garantir que o componente client está montando
  console.log('[RootLayoutClient] Montando componente client');
  useServiceWorker();
  return (
    <body className={`${inter.className} antialiased bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 min-h-screen`}>
      <div className="relative">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-700 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-800 rounded-full opacity-20 blur-3xl" />
        </div>
        {/* Main content */}
        <div className="relative z-10">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </div>
    </body>
  );
}
