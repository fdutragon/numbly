'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const scrollToCheckout = () => {
    document.getElementById('checkout-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
    setIsExpanded(false);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      'Olá! Gostaria de saber mais sobre a Clara e como ela pode me ajudar com minhas campanhas do Google Ads.'
    );
    const whatsappUrl = `https://wa.me/5511999999999?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button
              key="button"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                y: [0, -5, 0]
              }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(true)}
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 max-w-xs"
            >
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-ping opacity-20" />
              
              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <MessageCircle className="w-6 h-6" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                
                <div className="hidden sm:block">
                  <p className="font-semibold text-sm">Falar com a Clara</p>
                  <p className="text-xs text-blue-100">Ative sua automação</p>
                </div>
                
                <Sparkles className="w-4 h-4 text-blue-200 hidden sm:block" />
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-80 md:w-96"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Clara IA</h3>
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Online
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-foreground">
                  👋 <strong>Olá!</strong> Sou a Clara, sua assistente de IA para Google Ads.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Posso te ajudar a monitorar suas campanhas 24h e economizar até 30% nos seus gastos.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">24h</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Monitoramento</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">30%</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Economia média</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={scrollToCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-3 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Ativar minha Clara
                  <ArrowRight className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={openWhatsApp}
                  variant="outline"
                  className="w-full rounded-xl py-3 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Conversar no WhatsApp
                </Button>
              </div>

              {/* Testimonial */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-muted-foreground italic">
                  "A Clara me ajudou a reduzir 40% dos gastos em apenas 2 semanas!"
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  - João, Agência Digital
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
