'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface CheckoutFormData {
  email: string;
  name: string;
  cpf: string;
  phone: string;
  cardData?: {
    number: string;
    expiry: string;
    cvv: string;
    holder: string;
  };
}

interface CardData {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
}

interface PaymentResult {
  success: boolean;
  data?: {
    paymentId?: string;
    checkoutUrl?: string;
    qrCode?: string;
    pixCode?: string;
    amount: number;
  };
  error?: string;
}

export interface CheckoutComponentProps {
  onClose: () => void;
}

export function CheckoutComponent({ onClose }: CheckoutComponentProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Checkout</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Plano Básico</h3>
            <p className="text-2xl font-bold mb-2">R$ 47/mês</p>
            <ul className="space-y-2 text-sm">
              <li>✅ Atendimento 24/7</li>
              <li>✅ Respostas em 3 segundos</li>
              <li>✅ Qualificação automática</li>
              <li>✅ Setup incluído</li>
              <li>✅ 7 dias grátis</li>
            </ul>
          </div>

          <button
            onClick={() => {
              window.location.href = '/checkout?plan=basic';
            }}
            className="w-full py-3 px-4 bg-violet-500 text-white rounded-lg font-semibold hover:bg-violet-600 transition-colors"
          >
            Começar Agora
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
