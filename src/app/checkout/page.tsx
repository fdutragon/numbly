'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Copy, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CheckoutPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<'basic' | 'pro'>('basic');
  const [activeTab, setActiveTab] = useState('card');
  const [pixCode, setPixCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Get plan from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan') as 'basic' | 'pro';
    if (planParam) {
      setPlan(planParam);
    }
  }, []);

  // Regenerate QR code when theme changes
  useEffect(() => {
    if (pixCode) {
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '000000' : 'ffffff';
      const fgColor = isDark ? 'ffffff' : '000000';
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&bgcolor=${bgColor}&color=${fgColor}`;
      setQrCodeUrl(qrUrl);
    }
  }, [pixCode]);

  useEffect(() => {
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      if (pixCode) {
        const isDark = document.documentElement.classList.contains('dark');
        const bgColor = isDark ? '000000' : 'ffffff';
        const fgColor = isDark ? 'ffffff' : '000000';
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&bgcolor=${bgColor}&color=${fgColor}`;
        setQrCodeUrl(qrUrl);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [pixCode]);

  const planDetails = {
    basic: {
      name: 'Plano Básico',
      price: 'R$ 49',
      description: 'Até 1000 atendimentos/mês',
      features: ['Atendimento 24/7', 'Relatórios básicos', 'Suporte email']
    },
    pro: {
      name: 'Plano Pro',
      price: 'R$ 99',
      description: 'Atendimentos ilimitados',
      features: ['Atendimento 24/7', 'Relatórios avançados', 'Suporte prioritário', 'Integrações ilimitadas']
    }
  };

  const generatePixCode = () => {
    // Generate a fake PIX code for demo
    const code = `00020126580014br.gov.bcb.pix01367890-1234-5678-9012-123456789012520400005303986540${plan === 'pro' ? '99.00' : '49.00'}5802BR5925Clara AI Assistente6009SAO PAULO62070503***630445F2`;
    setPixCode(code);
    
    // Generate QR code URL with dark theme support
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '000000' : 'ffffff';
    const fgColor = isDark ? 'ffffff' : '000000';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}&bgcolor=${bgColor}&color=${fgColor}`;
    setQrCodeUrl(qrUrl);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardPayment = () => {
    // Simulate payment processing
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/?success=true');
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatCpf = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-medium">Checkout</h1>
          <div className="w-8" />
        </div>
      </motion.div>

      <div className="container max-w-md mx-auto px-4 py-4">
        {/* Plan Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">{planDetails[plan].name}</h2>
                <p className="text-xs text-muted-foreground">{planDetails[plan].description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{planDetails[plan].price}</p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="card" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                Cartão
              </TabsTrigger>
              <TabsTrigger value="pix" className="text-xs">
                <QrCode className="h-3 w-3 mr-1" />
                PIX
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-3">
              <Card className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Número do Cartão
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9\s]{13,19}"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="h-9 text-sm"
                      maxLength={19}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Nome no Cartão
                    </label>
                    <Input
                      type="text"
                      placeholder="João Silva"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Validade
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(\d{2})(\d{2})/, '$1/$2');
                          setCardExpiry(formatted);
                        }}
                        className="h-9 text-sm"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        CVV
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="h-9 text-sm"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      CPF
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="123.456.789-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      className="h-9 text-sm"
                      maxLength={14}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Telefone
                    </label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="h-9 text-sm"
                      maxLength={15}
                    />
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleCardPayment}
                className="w-full h-10 text-sm"
                disabled={!cardNumber || !cardName || !cardExpiry || !cardCvv || !cpf || !phone}
              >
                Pagar {planDetails[plan].price}
              </Button>
            </TabsContent>

            <TabsContent value="pix" className="space-y-3">
              <Card className="p-4">
                {!pixCode ? (
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Clique no botão abaixo para gerar o código PIX
                    </p>
                    <Button onClick={generatePixCode} className="h-9 text-sm">
                      Gerar PIX
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code PIX" 
                        className="mx-auto rounded-lg"
                      />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Escaneie o QR Code ou copie o código PIX
                      </p>
                      <div className="bg-muted rounded-lg p-2 text-xs font-mono break-all">
                        {pixCode}
                      </div>
                    </div>

                    <Button
                      onClick={copyPixCode}
                      variant="outline"
                      className="w-full h-9 text-sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar Código PIX
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Após o pagamento, você receberá um email de confirmação
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-lg p-6 max-w-sm w-full text-center"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2">Pagamento Aprovado!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sua assinatura foi ativada com sucesso. Redirecionando...
            </p>
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
