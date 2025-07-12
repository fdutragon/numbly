import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Donna AI – Sua Vendedora Digital 24/7',
  description:
    'Transforme seu WhatsApp em uma máquina de vendas com a Donna AI. Atendimento, vendas e automação 24h por dia para escalar seu negócio.',
  manifest: '/manifest.json',
  keywords: [
    'donna ai',
    'whatsapp',
    'vendas',
    'automação',
    'chatbot',
    'assistente virtual',
    'pwa',
    'inteligência artificial',
    'crm',
    'follow-up',
    'suporte',
    'negócios',
    'vendedora digital',
    '24/7',
    'saas',
    'lead',
    'conversão',
    'marketing',
    'brasil',
    'startup',
    'tecnologia',
    'inovação',
  ],
  authors: [
    { name: 'Donna AI', url: 'https://donna.app.br' },
    { name: 'Felipe Dutra', url: 'https://github.com/fdutragon' },
  ],
  creator: 'Donna AI',
  publisher: 'Donna AI',
  metadataBase: new URL('https://donna.app.br'),
  alternates: {
    canonical: 'https://donna.app.br',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  category: 'technology',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Donna AI',
  },
  openGraph: {
    title: 'Donna AI – Sua Vendedora Digital 24/7',
    description: 'Transforme seu WhatsApp em uma máquina de vendas com a Donna AI. Atendimento, vendas e automação 24h por dia para escalar seu negócio.',
    url: 'https://donna.app.br',
    siteName: 'Donna AI',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: 'https://donna.app.br/icons/icon-512x512.svg',
        width: 512,
        height: 512,
        alt: 'Donna AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donna AI – Sua Vendedora Digital 24/7',
    description: 'Transforme seu WhatsApp em uma máquina de vendas com a Donna AI. Atendimento, vendas e automação 24h por dia para escalar seu negócio.',
    site: '@donnaai',
    creator: '@donnaai',
    images: ['https://donna.app.br/icons/icon-512x512.svg'],
  },
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/icons/icon.svg',
    apple: '/icons/icon.svg',
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#3b82f6' },
    ],
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
