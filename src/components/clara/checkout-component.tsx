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

interface CheckoutComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: PaymentResult) => void;
  plan?: 'basic' | 'pro';
}

export function CheckoutComponent({
  isOpen,
  onClose,
  onSuccess,
  plan = 'basic',
}: CheckoutComponentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix'>(
    'credit'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    name: '',
    cpf: '',
    phone: '',
  });

  const plans = {
    basic: {
      name: 'Donna IA',
      price: 47,
      features: [
        'Vendedora Digital 24/7',
        'Qualificação automática',
        'Follow-up inteligente',
        'Setup completo incluído',
      ],
    },
    pro: {
      name: 'Donna Pro',
      price: 97,
      features: [
        'Tudo do plano básico',
        'Relatórios avançados',
        'Suporte prioritário',
        'Integrações ilimitadas',
        'IA personalizada',
      ],
    },
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCardDataChange = (field: keyof CardData, value: string) => {
    setFormData(prev => ({
      ...prev,
      cardData: {
        number: '',
        expiry: '',
        cvv: '',
        holder: '',
        ...prev.cardData,
        [field]: value,
      },
    }));
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})\d+?$/, '$1');
  };

  const formatExpiry = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2}\/\d{2})\d+?$/, '$1');
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;

    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF[10])) return false;

    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = (): boolean => {
    const isBasicDataValid =
      formData.name.trim() !== '' &&
      validateEmail(formData.email) &&
      validateCPF(formData.cpf) &&
      formData.phone.replace(/\D/g, '').length >= 10;

    if (paymentMethod === 'credit') {
      return (
        isBasicDataValid &&
        formData.cardData !== undefined &&
        formData.cardData.number.replace(/\D/g, '').length >= 13 &&
        formData.cardData.expiry.length === 5 &&
        formData.cardData.cvv.length >= 3 &&
        formData.cardData.holder.trim() !== ''
      );
    }

    return isBasicDataValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setPaymentResult({
        success: false,
        error: 'Por favor, preencha todos os campos corretamente.',
      });
      return;
    }

    setIsLoading(true);
    setPaymentResult(null);

    try {
      const paymentData = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        isPWA: false,
        plan: plan,
        paymentMethod,
      };

      const response = await fetch('/api/appmax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      setPaymentResult(result);

      if (result.success) {
        onSuccess?.(result);
        if (result.data?.checkoutUrl) {
          window.open(result.data.checkoutUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentResult({
        success: false,
        error: 'Erro ao processar pagamento. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-auto"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative p-4 pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">Finalizar Compra</CardTitle>
            <CardDescription className="text-xs">
              Complete os dados para garantir seu plano {plans[plan].name}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Plan Summary */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                <h3 className="font-semibold text-base mb-1">
                  {plans[plan].name}
                </h3>
                <div className="text-xl font-bold text-blue-600 mb-2">
                  R$ {plans[plan].price}
                  <span className="text-xs font-normal">/mês</span>
                </div>
                <ul className="space-y-0.5 text-xs">
                  {plans[plan].features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Customer Data */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Nome completo
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      E-mail
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      CPF
                    </label>
                    <Input
                      type="text"
                      value={formData.cpf}
                      onChange={e =>
                        handleInputChange('cpf', formatCPF(e.target.value))
                      }
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Telefone
                    </label>
                    <Input
                      type="text"
                      value={formData.phone}
                      onChange={e =>
                        handleInputChange('phone', formatPhone(e.target.value))
                      }
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  Forma de pagamento
                </label>
                <Tabs
                  value={paymentMethod}
                  onValueChange={value =>
                    setPaymentMethod(value as 'credit' | 'pix')
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="credit"
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Cartão de crédito
                    </TabsTrigger>
                    <TabsTrigger
                      value="pix"
                      className="flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      PIX
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="credit" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Número do cartão
                        </label>
                        <Input
                          type="text"
                          value={formData.cardData?.number || ''}
                          onChange={e =>
                            handleCardDataChange(
                              'number',
                              formatCardNumber(e.target.value)
                            )
                          }
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          required={paymentMethod === 'credit'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nome no cartão
                        </label>
                        <Input
                          type="text"
                          value={formData.cardData?.holder || ''}
                          onChange={e =>
                            handleCardDataChange('holder', e.target.value)
                          }
                          placeholder="Nome como no cartão"
                          required={paymentMethod === 'credit'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Validade
                          </label>
                          <Input
                            type="text"
                            value={formData.cardData?.expiry || ''}
                            onChange={e =>
                              handleCardDataChange(
                                'expiry',
                                formatExpiry(e.target.value)
                              )
                            }
                            placeholder="MM/AA"
                            maxLength={5}
                            required={paymentMethod === 'credit'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            CVV
                          </label>
                          <Input
                            type="text"
                            value={formData.cardData?.cvv || ''}
                            onChange={e =>
                              handleCardDataChange(
                                'cvv',
                                e.target.value.replace(/\D/g, '')
                              )
                            }
                            placeholder="000"
                            maxLength={4}
                            required={paymentMethod === 'credit'}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pix" className="mt-4">
                    <div className="text-center p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <QrCode className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">
                        Pagamento via PIX
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Após clicar em "Finalizar compra", você receberá o
                        código PIX
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Payment Result */}
              {paymentResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    paymentResult.success
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {paymentResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        paymentResult.success
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}
                    >
                      {paymentResult.success
                        ? 'Pagamento processado!'
                        : 'Erro no pagamento'}
                    </span>
                  </div>
                  {paymentResult.error && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {paymentResult.error}
                    </p>
                  )}
                  {paymentResult.data?.pixCode && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Código PIX:</p>
                      <code className="block p-2 bg-white dark:bg-gray-900 rounded text-xs break-all">
                        {paymentResult.data.pixCode}
                      </code>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !isFormValid()}
                className="w-full h-12 text-lg font-semibold"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </span>
                ) : (
                  `Finalizar compra - R$ ${plans[plan].price}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
