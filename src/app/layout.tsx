import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Numbly AI Chat',
  description: 'AI-powered chat application with Groq',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Calcula a altura do viewport para dispositivos móveis
            function setViewportHeight() {
              const vh = window.innerHeight * 0.01;
              document.documentElement.style.setProperty('--vh', vh + 'px');
            }
            
            // Adiciona classe safari-view com segurança
            function addSafariView() {
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                  if (document.body) {
                    document.body.classList.add('safari-view');
                  }
                });
              } else {
                if (document.body) {
                  document.body.classList.add('safari-view');
                }
              }
            }
            
            // Executa as funções
            setViewportHeight();
            addSafariView();
            
            // Atualiza viewport height quando redimensiona ou muda orientação
            window.addEventListener('resize', setViewportHeight);
            window.addEventListener('orientationchange', function() {
              setTimeout(setViewportHeight, 100);
            });
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
