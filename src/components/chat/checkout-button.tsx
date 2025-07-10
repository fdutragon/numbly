'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard } from 'lucide-react';
import { usePWA } from '@/lib/pwa-manager';

interface CheckoutButtonProps {
  planType: 'basic' | 'pro';
  className?: string;
}

export function CheckoutButton({
  planType,
  className = '',
}: CheckoutButtonProps) {
  const router = useRouter();
  const { startCartRecovery } = usePWA();

  const handleCheckout = () => {
    // Iniciar cart recovery quando usuário vai para checkout
    startCartRecovery();
    router.push(`/checkout?plan=${planType}`);
  };

  const planDetails = {
    basic: {
      name: 'Plano Básico',
      price: 'R$ 49/mês',
    },
    pro: {
      name: 'Plano Pro',
      price: 'R$ 99/mês',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`mt-3 ${className}`}
    >
      <Button
        onClick={handleCheckout}
        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-xs h-8 px-3"
        size="sm"
      >
        <CreditCard className="h-3 w-3 mr-1.5" />
        <span className="font-medium">
          {planDetails[planType].name} - {planDetails[planType].price}
        </span>
        <ArrowRight className="h-3 w-3 ml-1.5" />
      </Button>
    </motion.div>
  );
}
