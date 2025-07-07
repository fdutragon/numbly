'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, QrCode, CheckCircle, AlertCircle, Loader2, X, Phone, MessageCircle, Copy } from 'lucide-react';

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
  plan = 'basic'
}: CheckoutComponentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix'>('credit');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    name: '',
    cpf: '',
    phone: '',
  });

  const plans = {
    basic: {
      name: 'Clara Basic',
      price: 97,
      features: [
        'Automação WhatsApp',
        'Campanhas básicas',
        'Suporte via chat',
        'Dashboard simples'
      ]
    },
    pro: {
      name: 'Clara Pro',
      price: 197,
      features: [
        'Automação WhatsApp avançada',
        'Campanhas ilimitadas',
        'Suporte prioritário',
        'Dashboard completo',
        'Relatórios avançados',
        'Integração com CRM'
      ]
    }
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
        [field]: value
      }
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
    const isBasicDataValid = formData.name.trim() !== '' && 
                            validateEmail(formData.email) && 
                            validateCPF(formData.cpf) && 
                            formData.phone.replace(/\D/g, '').length >= 10;
    
    if (paymentMethod === 'credit') {
      return isBasicDataValid && 
             formData.cardData !== undefined &&
             formData.cardData.number.replace(/\D/g, '').length >= 13 &&
             formData.cardData.expiry.length === 5 &&
             formData.cardData.cvv.length >= 3 &&
             formData.cardData.holder.trim() !== '';
    }
    
    return isBasicDataValid;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setPaymentResult({
        success: false,
        error: 'Por favor, preencha todos os campos corretamente.'
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
        paymentMethod
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
        
        // Auto close after successful payment (credit card)
        if (paymentMethod === 'credit') {
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentResult({
        success: false,
        error: 'Erro ao processar pagamento. Tente novamente.'
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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-xl w-full h-full max-w-6xl max-h-[95vh] overflow-auto shadow-2xl border border-gray-200 dark:border-gray-700 m-4"
      >
        <Card className="border-0 shadow-none h-full">
          <CardHeader className="relative p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl font-bold">Finalizar Compra</CardTitle>
            <CardDescription className="text-base mt-2">
              Complete os dados para garantir seu plano {plans[plan].name}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna esquerda - Formulário */}
              <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Dados pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome completo</label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Seu nome completo"
                          className="h-12"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">E-mail</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="seu@email.com"
                          className="h-12"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">CPF</label>
                        <Input
                          type="text"
                          value={formData.cpf}
                          onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                          placeholder="000.000.000-00"
                          className="h-12"
                          maxLength={14}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telefone</label>
                        <Input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                          placeholder="(11) 99999-9999"
                          className="h-12"
                          maxLength={15}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Forma de pagamento</h3>
                    <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'credit' | 'pix')}>
                      <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value="credit" className="flex items-center gap-2 h-10">
                          <CreditCard className="w-4 h-4" />
                          Cartão de crédito
                        </TabsTrigger>
                        <TabsTrigger value="pix" className="flex items-center gap-2 h-10">
                          <QrCode className="w-4 h-4" />
                          PIX
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="credit" className="space-y-4 mt-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Número do cartão</label>
                            <Input
                              type="text"
                              value={formData.cardData?.number || ''}
                              onChange={(e) => handleCardDataChange('number', formatCardNumber(e.target.value))}
                              placeholder="0000 0000 0000 0000"
                              className="h-12"
                              maxLength={19}
                              required={paymentMethod === 'credit'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Nome no cartão</label>
                            <Input
                              type="text"
                              value={formData.cardData?.holder || ''}
                              onChange={(e) => handleCardDataChange('holder', e.target.value)}
                              placeholder="Nome como no cartão"
                              className="h-12"
                              required={paymentMethod === 'credit'}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Validade</label>
                              <Input
                                type="text"
                                value={formData.cardData?.expiry || ''}
                                onChange={(e) => handleCardDataChange('expiry', formatExpiry(e.target.value))}
                                placeholder="MM/AA"
                                className="h-12"
                                maxLength={5}
                                required={paymentMethod === 'credit'}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">CVV</label>
                              <Input
                                type="text"
                                value={formData.cardData?.cvv || ''}
                                onChange={(e) => handleCardDataChange('cvv', e.target.value.replace(/\D/g, ''))}
                                placeholder="000"
                                className="h-12"
                                maxLength={4}
                                required={paymentMethod === 'credit'}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pix" className="mt-6">
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <QrCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                          <h3 className="font-semibold text-xl mb-2">Pagamento via PIX</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Após clicar em "Finalizar compra", você receberá o código PIX para pagamento instantâneo
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !isFormValid()}
                    className="w-full h-14 text-lg font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Finalizar compra - R$ ${plans[plan].price}`
                    )}
                  </Button>
                </form>
              </div>

              {/* Coluna direita - Resumo e Resultado */}
              <div className="space-y-6">
                {/* Plan Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-bold text-xl mb-2">{plans[plan].name}</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    R$ {plans[plan].price}<span className="text-sm font-normal">/mês</span>
                  </div>
                  <ul className="space-y-2">
                    {plans[plan].features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment Result */}
                {paymentResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-xl border-2 ${
                      paymentResult.success
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {paymentResult.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                      <span className={`font-semibold text-lg ${
                        paymentResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {paymentResult.success ? 'Pagamento processado!' : 'Erro no pagamento'}
                      </span>
                    </div>
                    
                    {paymentResult.error && (
                      <p className="text-red-600 dark:text-red-400 mb-4">
                        {paymentResult.error}
                      </p>
                    )}
                    
                    {paymentResult.success && paymentMethod === 'credit' && (
                      <p className="text-green-600 dark:text-green-400 mb-4">
                        Retornando ao chat em instantes...
                      </p>
                    )}
                    
                    {paymentResult.data?.pixCode && (
                      <div className="space-y-3">
                        <p className="font-medium text-base">Código PIX:</p>
                        <div className="relative">
                          <code className="block p-4 bg-white dark:bg-gray-900 rounded-lg text-sm break-all border border-gray-200 dark:border-gray-700">
                            {paymentResult.data.pixCode}
                          </code>
                          <Button
                            onClick={() => copyToClipboard(paymentResult.data?.pixCode || '')}
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cole este código no seu app bancário para finalizar o pagamento
                        </p>
                      </div>
                    )}
                    
                    {paymentResult.data?.qrCode && (
                      <div className="space-y-3">
                        <p className="font-medium text-base">QR Code PIX:</p>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                          <img 
                            src={paymentResult.data.qrCode} 
                            alt="QR Code PIX" 
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Escaneie com a câmera do seu banco ou copie o código acima
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Support Section */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-4">Precisa de ajuda?</h3>
                  <div className="space-y-3">
                    <a
                      href="https://wa.me/5513988658518"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <div>
                        <div className="font-medium">WhatsApp</div>
                        <div className="text-sm opacity-90">(13) 98865-8518</div>
                      </div>
                    </a>
                    <a
                      href="tel:+5513988658518"
                      className="flex items-center gap-3 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Telefone</div>
                        <div className="text-sm opacity-90">(13) 98865-8518</div>
                      </div>
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Suporte humano disponível para ajudar com sua compra
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
