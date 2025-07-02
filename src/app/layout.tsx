import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/auth-context";

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
