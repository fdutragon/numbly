import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Donna AI – Sua Vendedora Digital 24/7',
  description:
    'Transforme seu WhatsApp em uma máquina de vendas com a Donna AI. Atendimento, vendas e automação 24h por dia para escalar seu negócio.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Donna AI',
  },
  openGraph: {
    title: 'Donna AI – Sua Vendedora Digital 24/7',
    description: 'Transforme seu WhatsApp em uma máquina de vendas com a Donna AI',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donna AI – Sua Vendedora Digital 24/7',
    description: 'Transforme seu WhatsApp em uma máquina de vendas com a Donna AI',
  },
};

export function generateViewport() {
  return {
    themeColor: '#3b82f6',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover'
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Donna AI" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        
        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="shortcut icon" href="/icons/icon.svg" />
        
        {/* Safari Pinned Tab */}
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#3b82f6" />
      </head>
      <body className="antialiased bg-white text-black">
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  );
}
