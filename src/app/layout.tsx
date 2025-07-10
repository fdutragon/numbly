import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Donna AI – Sua Vendedora Digital 24/7',
  description:
    'Transforme seu WhatsApp em uma máquina de vendas com a Donna AI. Atendimento, vendas e automação 24h por dia para escalar seu negócio.',
};

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
        <title>Donna AI – Sua Vendedora Digital 24/7</title>
        <meta
          name="description"
          content="Transforme seu WhatsApp em uma máquina de vendas com a Donna AI. Atendimento, vendas e automação 24h por dia para escalar seu negócio."
        />
      </head>
      <body className="antialiased bg-white text-black">
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  );
}
