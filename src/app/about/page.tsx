'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AppLayout } from '@/components/ui/app-layout';
import { Sparkles, Star, Heart, Lightbulb, Target, Users } from 'lucide-react';
import { NavBar } from '@/components/ui/navbar';

export default function AboutPage() {
  const features = [
    {
      icon: Sparkles,
      title: 'Numerologia Avançada',
      description: 'Algoritmos precisos baseados em estudos milenares da numerologia pitagórica.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Star,
      title: 'Mapa Personalizado',
      description: 'Análise completa baseada no seu nome e data de nascimento únicos.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Heart,
      title: 'Compatibilidade',
      description: 'Descubra a afinidade numerológica com pessoas importantes da sua vida.',
      color: 'from-pink-500 to-red-500'
    },
    {
      icon: Lightbulb,
      title: 'IA Especializada',
      description: 'Chat inteligente com conhecimento profundo em numerologia e espiritualidade.',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const values = [
    {
      icon: Target,
      title: 'Precisão',
      description: 'Cálculos exatos baseados em métodos tradicionais validados.'
    },
    {
      icon: Users,
      title: 'Comunidade',
      description: 'Conecte-se com outras pessoas na jornada de autoconhecimento.'
    },
    {
      icon: Heart,
      title: 'Bem-estar',
      description: 'Promovemos o crescimento pessoal e espiritual através dos números.'
    }
  ];

  return (
    <AppLayout title="Sobre">
      <div className="max-w-2xl mx-auto px-4 space-y-6 bg-neutral-50 py-8 pb-20">
        {/* Header minimalista */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Numbly Life
          </h1>
          <p className="text-neutral-600 leading-relaxed">
            Sua jornada de autoconhecimento através da sabedoria milenar dos números.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Nossa Missão</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Democratizar o acesso à numerologia, oferecendo ferramentas precisas e 
                intuitivas para que cada pessoa possa descobrir seu potencial único através 
                dos números. Acreditamos que o autoconhecimento é o primeiro passo para 
                uma vida mais plena e consciente.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">O que oferecemos</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Nossos Valores</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{value.title}</h3>
                    <p className="text-sm text-gray-700">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Entre em Contato</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-3">
                Tem sugestões, dúvidas ou quer compartilhar sua experiência? 
                Adoraríamos ouvir você!
              </p>
              <div className="text-sm text-gray-700">
                <p>📧 contato@numbly.life</p>
                <p>🌐 www.numbly.life</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center text-sm text-gray-500 py-4"
        >
          <p>✨ Feito com amor para sua jornada espiritual ✨</p>
        </motion.div>
      </div>
     
      {/* Navbar */}
      <NavBar />
    </AppLayout>
  );
}
