'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  BarChart3, 
  Bell,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface IntroCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  action: string;
}

interface ChatIntroCardsProps {
  onCardClick: (cardId: string) => void;
  isVisible: boolean;
}

export function ChatIntroCards({ onCardClick, isVisible }: ChatIntroCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const introCards: IntroCard[] = [
    {
      id: 'whatsapp-domination',
      title: 'Atendimento Inteligente com Score IA',
      subtitle: 'Personalização e Prioridade Automática',
      description: 'Cada lead recebe mensagens personalizadas conforme o score e avança automaticamente pelo funil até a conversão.',
      icon: null,
      gradient: '',
      action: 'Quero atendimento inteligente'
    },
    {
      id: 'marketing-revolution',
      title: 'Recuperação de Carrinho Automática',
      subtitle: 'Funil de Resgate 24/7',
      description: 'Recupere vendas perdidas com sequências de mensagens automáticas e personalizadas para cada etapa do funil.',
      icon: null,
      gradient: '',
      action: 'Recuperar vendas agora'
    },
    {
      id: 'analytics-power',
      title: 'Pagamentos e Cobranças Sem Esforço',
      subtitle: 'Conversão e Retenção Automática',
      description: 'Envio de links, confirmação de pagamento e renovações automáticas integradas ao funil de vendas.',
      icon: null,
      gradient: '',
      action: 'Automatizar cobranças'
    }
  ];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto p-4"
    >
      {/* Header minimalista */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-1">Donna IA</h1>
        <p className="text-base text-gray-600 dark:text-gray-300">Qual funcionalidade vai revolucionar suas vendas?</p>
      </div>

      {/* Cards Grid Material Design */}
      <div className="grid md:grid-cols-3 gap-4">
        {introCards.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.08, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ scale: 1.025, boxShadow: '0 4px 24px 0 rgba(80,80,180,0.10)' }}
            onClick={() => onCardClick(card.id)}
            className={`relative flex flex-col items-start gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400/40 text-left`}
            style={{ minHeight: 180 }}
          >
            {/* Título */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 text-left">{card.title}</h3>
            {/* Subtítulo */}
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1 text-left">{card.subtitle}</span>
            {/* Descrição */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 flex-1 text-left">{card.description}</p>
            {/* Botão ação */}
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-violet-300 mt-auto text-left">
              {card.action}
              <ArrowRight className="w-4 h-4" />
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
