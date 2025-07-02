import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/contexts/auth-context';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Numbly Oráculo - Sua Jornada Numerológica",
  description: "Descubra os mistérios da numerologia com o Numbly Oráculo. Mapa numerológico personalizado, compatibilidade amorosa e orientação espiritual através da IA.",
  keywords: "numerologia, oráculo, mapa numerológico, compatibilidade, espiritualidade, IA",
  authors: [{ name: "Numbly Oráculo" }],
  openGraph: {
    title: "Numbly Oráculo - Sua Jornada Numerológica",
    description: "Descubra os mistérios da numerologia com orientação personalizada",
    type: "website",
    locale: "pt_BR",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7C3AED',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.svg" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icon-128x128.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icon-384x384.svg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.svg" />
        <meta name="theme-color" content="#7C3AED" />
      </head>
      <body className={`${inter.className} antialiased bg-gradient-to-br from-purple-50 via-white to-blue-50 min-h-screen`}>
        <div className="relative">
          {/* Background decoration */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl" />
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
