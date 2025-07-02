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
    console.log('[SW] Iniciando registro do Service Worker...');
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[SW] ✅ Service Worker registrado com sucesso:', registration);
          
          // Força update se houver uma versão esperando
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          // Event listeners para atualizações
          registration.addEventListener('updatefound', () => {
            console.log('[SW] Nova versão do Service Worker encontrada');
          });
        })
        .catch(error => {
          console.error('[SW] ❌ Erro ao registrar Service Worker:', error);
        });
    } else {
      console.warn('[SW] Service Worker não suportado neste navegador');
    }
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
