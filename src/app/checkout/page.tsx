'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, QrCode, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
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

  const handleCardDataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      cardData: {
        ...prev.cardData,
        [field]: value
      } as any
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
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
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
        cpf: formData.cpf.replace(/\D/g, ''), // Remove pontos e traços do CPF
        phone: formData.phone.replace(/\D/g, ''), // Remove formatação do telefone
        isPWA: false,
        plan: selectedPlan,
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

      if (result.success && result.data?.checkoutUrl) {
        window.open(result.data.checkoutUrl, '_blank');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Escolha seu plano Clara
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Automatize suas vendas e transforme seu negócio
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Plan Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Selecione seu plano
                  </CardTitle>
                  <CardDescription>
                    Escolha o plano ideal para seu negócio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(plans).map(([key, plan]) => (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPlan === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(key as 'basic' | 'pro')}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {plan.price}<span className="text-sm font-normal">/mês</span>
                          </p>
                        </div>
                        {selectedPlan === key && (
                          <CheckCircle className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Dados para pagamento</CardTitle>
                  <CardDescription>
                    Preencha seus dados para finalizar a compra
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Data */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Nome completo
                          </label>
                          <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Seu nome completo"
                            className={formData.name.trim() === '' && paymentResult?.error ? 'border-red-500' : ''}
                            required
                          />
                          {formData.name.trim() === '' && paymentResult?.error && (
                            <p className="text-red-500 text-xs mt-1">Nome é obrigatório</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            E-mail
                          </label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="seu@email.com"
                            className={!validateEmail(formData.email) && formData.email && paymentResult?.error ? 'border-red-500' : ''}
                            required
                          />
                          {!validateEmail(formData.email) && formData.email && paymentResult?.error && (
                            <p className="text-red-500 text-xs mt-1">E-mail inválido</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            CPF
                          </label>
                          <Input
                            type="text"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            className={!validateCPF(formData.cpf) && formData.cpf && paymentResult?.error ? 'border-red-500' : ''}
                            required
                          />
                          {!validateCPF(formData.cpf) && formData.cpf && paymentResult?.error && (
                            <p className="text-red-500 text-xs mt-1">CPF inválido</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Telefone
                          </label>
                          <Input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                            placeholder="(11) 99999-9999"
                            maxLength={15}
                            className={formData.phone.replace(/\D/g, '').length < 10 && formData.phone && paymentResult?.error ? 'border-red-500' : ''}
                            required
                          />
                          {formData.phone.replace(/\D/g, '').length < 10 && formData.phone && paymentResult?.error && (
                            <p className="text-red-500 text-xs mt-1">Telefone inválido</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <label className="block text-sm font-medium mb-4">
                        Forma de pagamento
                      </label>
                      <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'credit' | 'pix')}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="credit" className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Cartão de crédito
                          </TabsTrigger>
                          <TabsTrigger value="pix" className="flex items-center gap-2">
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
                                onChange={(e) => handleCardDataChange('number', formatCardNumber(e.target.value))}
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
                                onChange={(e) => handleCardDataChange('holder', e.target.value)}
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
                                  onChange={(e) => handleCardDataChange('expiry', formatExpiry(e.target.value))}
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
                                  onChange={(e) => handleCardDataChange('cvv', e.target.value.replace(/\D/g, ''))}
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
                            <h3 className="font-semibold text-lg mb-2">Pagamento via PIX</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Após clicar em "Finalizar compra", você receberá o código PIX para pagamento
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Plano selecionado:</span>
                        <span>{plans[selectedPlan].name}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">R$ {plans[selectedPlan].price}</span>
                      </div>
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
                          <span className={`font-medium ${
                            paymentResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                          }`}>
                            {paymentResult.success ? 'Pagamento processado!' : 'Erro no pagamento'}
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
                      className="w-full h-12 text-lg font-semibold disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        `Finalizar compra - R$ ${plans[selectedPlan].price}`
                      )}
                    </Button>

                    <div className="text-center text-sm text-gray-500">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Pagamento seguro processado pela Appmax
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
