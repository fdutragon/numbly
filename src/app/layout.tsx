'use client';

import { Inter } from "next/font/google";
import { useEffect } from 'react';
import "./globals.css";
import { AuthProvider } from '@/lib/contexts/auth-context';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const registerSW = async () => {
      try {
        console.log('[SW] Iniciando registro do Service Worker...');
        
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
          console.warn('[SW] Service Worker não suportado neste navegador');
          return;
        }

        // Limpa registros antigos se houver
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }

        // Registra o novo SW
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('[SW] ✅ Service Worker registrado com sucesso:', registration);

        // Atualiza imediatamente se houver uma nova versão
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Monitora atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[SW] Nova versão do Service Worker encontrada');

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                console.log('[SW] Nova versão instalada, pronta para ativação');
              }
            });
          }
        });

        // Recarrega a página quando o SW for atualizado
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Service Worker atualizado, recarregando...');
          window.location.reload();
        });

      } catch (error) {
        console.error('[SW] ❌ Erro ao registrar Service Worker:', error);
      }
    };

    registerSW();
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <title>Numbly Oráculo - Sua Jornada Numerológica</title>
        <meta name="description" content="Descubra os mistérios da numerologia com o Numbly Oráculo. Mapa numerológico personalizado, compatibilidade amorosa e orientação espiritual através da IA." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1E1E2E" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.svg" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icon-128x128.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icon-384x384.svg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.svg" />
      </head>
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
    </html>
  );
}
