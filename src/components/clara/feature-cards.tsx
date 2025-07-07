'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { 
  MessageSquare, 
  Brain, 
  AlertTriangle, 
  Clock, 
  Smartphone,
  TrendingUp 
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: "Relatórios diários no WhatsApp",
    description: "Receba um resumo completo das suas campanhas todos os dias, direto no seu WhatsApp",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    icon: Brain,
    title: "Campanhas monitoradas com IA",
    description: "Nossa inteligência artificial analisa constantemente o desempenho das suas campanhas",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    icon: AlertTriangle,
    title: "Alerta automático de desempenho",
    description: "Seja notificado imediatamente quando algo não estiver funcionando como deveria",
    gradient: "from-yellow-500 to-orange-600"
  },
  {
    icon: Clock,
    title: "Atendimento 24h no seu Zap",
    description: "Tire dúvidas e receba suporte a qualquer hora, direto no WhatsApp",
    gradient: "from-purple-500 to-pink-600"
  },
  {
    icon: Smartphone,
    title: "Zero painel. Tudo no seu WhatsApp",
    description: "Esqueça interfaces complicadas. Tudo funciona pelo WhatsApp que você já usa",
    gradient: "from-indigo-500 to-blue-600"
  },
  {
    icon: TrendingUp,
    title: "Otimização automática de gastos",
    description: "A Clara identifica e sugere ajustes para melhorar o ROI das suas campanhas",
    gradient: "from-red-500 to-pink-600"
  }
];

interface FeatureCardProps {
  feature: typeof features[0];
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ 
        y: -10,
        transition: { duration: 0.3 }
      }}
      className="group"
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 h-full">
        {/* Gradient background on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
        
        {/* Icon */}
        <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
          {feature.title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>

        {/* Hover effect indicator */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
      </div>
    </motion.div>
  );
}

export function FeatureCards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features-section" className="py-20 px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-950/10" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            Benefícios da Clara
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Por que a Clara é diferente?
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Chega de perder tempo e dinheiro. A Clara cuida das suas campanhas para você focar no que realmente importa: vender.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.title} 
              feature={feature} 
              index={index} 
            />
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Pronto para automatizar suas campanhas?
            </h3>
            <p className="text-muted-foreground mb-6">
              Junte-se a centenas de anunciantes que já economizam tempo e dinheiro com a Clara
            </p>
            <button
              onClick={() => {
                document.getElementById('checkout-section')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Começar agora
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
