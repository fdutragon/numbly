'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, 
  Sparkles, 
  CreditCard, 
  Smartphone,
  AlertCircle,
  Loader2,
  QrCode
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const checkoutSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface PaymentState {
  status: 'idle' | 'processing' | 'qr_generated' | 'checking_payment' | 'success' | 'error';
  qrCode?: string;
  paymentId?: string;
  errorMessage?: string;
}

export function CheckoutSection() {
  const [hasOrderBump, setHasOrderBump] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>({ status: 'idle' });
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange'
  });

  const basePrice = 247;
  const bumpPrice = 97;
  const totalPrice = hasOrderBump ? basePrice + bumpPrice : basePrice;

  const onSubmit = async (data: CheckoutFormData) => {
    setPaymentState({ status: 'processing' });

    try {
      // Create payment via Appmax API
      const paymentResponse = await fetch('/api/appmax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          cpf: data.cpf,
          phone: data.phone,
          amount: totalPrice,
          product: hasOrderBump ? 'Clara + Criativos' : 'Clara',
          orderBump: hasOrderBump
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      const paymentData = await paymentResponse.json();
      
      if (paymentData.success && paymentData.data?.qrCode) {
        setPaymentState({
          status: 'qr_generated',
          qrCode: paymentData.data.qrCode,
          paymentId: paymentData.data.paymentId
        });

        // Start polling for payment confirmation
        startPaymentPolling(paymentData.data.paymentId);
      } else {
        throw new Error(paymentData.error || 'Erro desconhecido');
      }
    } catch (error) {
      setPaymentState({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  const startPaymentPolling = (paymentId: string) => {
    setPaymentState(prev => ({ ...prev, status: 'checking_payment' }));

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/appmax/check-payment?paymentId=${paymentId}`);
        const data = await response.json();

        if (data.status === 'paid') {
          clearInterval(pollInterval);
          setPaymentState({ status: 'success' });
          // Redirect to success page or show onboarding
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-onboarding'));
          }, 2000);
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(pollInterval);
          setPaymentState({
            status: 'error',
            errorMessage: 'Pagamento não foi confirmado'
          });
        }
      } catch (error) {
        console.error('Error polling payment:', error);
      }
    }, 3000);

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentState.status === 'checking_payment') {
        setPaymentState({
          status: 'error',
          errorMessage: 'Tempo limite excedido. Tente novamente.'
        });
      }
    }, 600000);
  };

  const resetPayment = () => {
    setPaymentState({ status: 'idle' });
  };

  if (paymentState.status === 'qr_generated' || paymentState.status === 'checking_payment') {
    return (
      <section id="checkout-section" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-4">
              {paymentState.status === 'checking_payment' ? 'Aguardando pagamento...' : 'Escaneie o QR Code'}
            </h3>
            
            <p className="text-muted-foreground mb-8">
              {paymentState.status === 'checking_payment' 
                ? 'Estamos verificando seu pagamento. Isso pode levar alguns minutos.'
                : 'Use o app do seu banco para escanear o código PIX abaixo'
              }
            </p>

            {paymentState.qrCode && (
              <div className="bg-white p-4 rounded-xl mx-auto mb-6 max-w-xs">
                <img 
                  src={paymentState.qrCode} 
                  alt="QR Code PIX" 
                  className="w-full h-auto"
                />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-blue-600 mb-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verificando pagamento...</span>
            </div>

            <Button 
              variant="outline" 
              onClick={resetPayment}
              className="mx-auto"
            >
              Voltar
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  if (paymentState.status === 'success') {
    return (
      <section id="checkout-section" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-4">
              Clara ativada com sucesso!
            </h3>
            
            <p className="text-muted-foreground mb-8">
              Seu pagamento foi confirmado. Agora vamos configurar sua Clara em poucos passos.
            </p>

            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-onboarding'))}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Configurar minha Clara
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="checkout-section" className="py-20 px-4 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent dark:via-purple-950/10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ative sua Clara agora
          </h2>
          <p className="text-xl text-muted-foreground">
            Comece a economizar tempo e dinheiro nas suas campanhas hoje mesmo
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Main Product */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-bold text-foreground">Plano Clara</h3>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                R$ {basePrice.toLocaleString('pt-BR')}/mês
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Monitoramento 24h das campanhas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Relatórios diários no WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Alertas automáticos de performance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Suporte 24h no WhatsApp
                </li>
              </ul>
            </div>

            {/* Order Bump */}
            <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 transition-all duration-300 ${
              hasOrderBump 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    hasOrderBump 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {hasOrderBump && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Adicionar criativos mensais
                  </h3>
                </div>
                <Switch
                  checked={hasOrderBump}
                  onCheckedChange={setHasOrderBump}
                />
              </div>
              
              <div className="text-2xl font-bold text-foreground mb-2">
                + R$ {bumpPrice.toLocaleString('pt-BR')}/mês
              </div>
              
              <p className="text-muted-foreground text-sm mb-3">
                Receba criativos otimizados para suas campanhas todos os meses
              </p>
              
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  10 criativos por mês
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  Otimizados para conversão
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  Baseados em dados da sua conta
                </li>
              </ul>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total mensal</p>
                  <div className="text-3xl font-bold">
                    R$ {totalPrice.toLocaleString('pt-BR')}
                  </div>
                </div>
                <Sparkles className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Dados para ativação
              </h3>

              {paymentState.status === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Erro no pagamento</span>
                  </div>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {paymentState.errorMessage}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome completo
                  </label>
                  <Input
                    {...register('name')}
                    placeholder="Seu nome completo"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="seu@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    WhatsApp
                  </label>
                  <Input
                    {...register('phone')}
                    placeholder="(11) 99999-9999"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    CPF
                  </label>
                  <Input
                    {...register('cpf')}
                    placeholder="000.000.000-00"
                    className={errors.cpf ? 'border-red-500' : ''}
                  />
                  {errors.cpf && (
                    <p className="text-red-500 text-sm mt-1">{errors.cpf.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!isValid || paymentState.status === 'processing'}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {paymentState.status === 'processing' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Ativar minha Clara
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="w-4 h-4" />
                  <span>Pagamento 100% seguro via PIX</span>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
