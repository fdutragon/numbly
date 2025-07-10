'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Copy,
  CheckCircle,
  QrCode,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<'basic' | 'pro'>('basic');
  const [activeTab, setActiveTab] = useState('card');
  const [pixCode, setPixCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Customer data
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');

  // Card data
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    // Get plan from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan') as 'basic' | 'pro';
    if (planParam) {
      setPlan(planParam);
    }
  }, []);

  const planDetails = {
    basic: {
      name: 'Plano Básico',
      price: 'R$ 47',
      description: 'Até 1000 atendimentos/mês',
      features: ['Atendimento 24/7', 'Relatórios básicos', 'Suporte email'],
    },
    pro: {
      name: 'Plano Pro',
      price: 'R$ 99',
      description: 'Atendimentos ilimitados',
      features: [
        'Atendimento 24/7',
        'Relatórios avançados',
        'Suporte prioritário',
        'Integrações ilimitadas',
      ],
    },
  };

  const safeParseJson = async (response: Response) => {
    try {
      const data = await response.json();
      if (data && typeof data === 'object') return data;
      return {};
    } catch {
      return {};
    }
  };

  const isErroDeFluxo = (msg: string) => {
    if (!msg) return false;
    return (
      msg.includes('Transação não autorizada') ||
      msg.includes('Order is Cancelled') ||
      msg.includes('Cartão recusado') ||
      msg.includes('Erro no processamento') ||
      msg.includes('Pedido foi cancelado') ||
      msg.includes('Cartão recusado pelo banco') ||
      msg.includes('Erro interno do gateway') ||
      msg.includes('Pedido não encontrado')
    );
  };

  const generatePixCode = async () => {
    if (!customerName || !customerEmail || !customerPhone || !customerCpf) {
      alert('Por favor, preencha todos os dados do cliente');
      return;
    }

    setProcessing(true);
    try {
      console.log('🔄 Iniciando geração de PIX...');
      const response = await fetch('/api/appmax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          name: customerName,
          document: customerCpf.replace(/\D/g, ''), // Enviar como 'document'
          telephone: customerPhone.replace(/\D/g, ''), // Enviar como 'telephone'
          paymentMethod: 'pix',
          plan: plan, // Envia o plano selecionado para a API
        }),
      });

      const result = await safeParseJson(response);
      if (result.success) {
        // Use os dados retornados pela API AppMax (estrutura correta)
        if (result.pix_emv) {
          setPixCode(result.pix_emv);
          console.log(
            '✅ PIX Code recebido:',
            result.pix_emv.substring(0, 50) + '...'
          );
        }
        if (result.qr_code_img) {
          setQrCodeUrl(result.qr_code_img);
          console.log('✅ QR Code URL recebido:', result.qr_code_img);
        }

        console.log('✅ PIX gerado com sucesso:', {
          orderId: result.order_id,
          customerId: result.customer_id,
          qrCodeBase64: result.qr_code_base64,
          checkoutUrl: result.checkout_url,
        });
      } else {
        let errorMessage = 'Erro ao gerar PIX';
        if (result.error) {
          errorMessage = result.error;
        } else if (result.message) {
          errorMessage = result.message;
        } else if (response.status === 400) {
          errorMessage = 'Dados inválidos para gerar PIX';
        } else if (response.status === 500) {
          errorMessage = 'Erro interno do servidor';
        } else if (!result || Object.keys(result).length === 0) {
          errorMessage = 'Erro de comunicação com o servidor. Tente novamente.';
        }
        // Só loga erro inesperado
        if (!isErroDeFluxo(errorMessage)) {
          console.error('❌ Erro na resposta:', errorMessage);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar PIX:', error);

      // Melhorar mensagem de erro baseada no tipo
      let errorMessage = 'Erro ao conectar com servidor';

      if (error instanceof SyntaxError) {
        // Erro de parsing JSON - servidor pode ter retornado HTML/texto
        errorMessage = 'Erro de comunicação com o servidor. Tente novamente.';
      } else if (error instanceof TypeError) {
        // Erro de rede/conectividade
        errorMessage =
          'Erro de conexão. Verifique sua internet e tente novamente.';
      }

      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardPayment = async () => {
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !customerCpf ||
      !cardNumber ||
      !cardName ||
      !cardExpiry ||
      !cardCvv
    ) {
      alert('Por favor, preencha todos os dados');
      return;
    }

    setProcessing(true);
    try {
      console.log('🔄 Iniciando pagamento com cartão...');
      const response = await fetch('/api/appmax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          name: customerName,
          document: customerCpf.replace(/\D/g, ''), // Enviar como 'document'
          telephone: customerPhone.replace(/\D/g, ''), // Enviar como 'telephone'
          paymentMethod: 'credit-card',
          plan: plan, // Envia o plano selecionado para a API
          creditCard: {
            number: cardNumber.replace(/\s/g, ''),
            name: cardName,
            month: cardExpiry.split('/')[0],
            year: cardExpiry.split('/')[1],
            cvv: cardCvv,
            document_number: customerCpf.replace(/\D/g, ''),
          },
        }),
      });

      const result = await safeParseJson(response);
      if (result.success) {
        console.log('✅ Pagamento processado com sucesso:', {
          orderId: result.order_id,
          customerId: result.customer_id,
          creditCard: result.credit_card,
        });

        setShowSuccess(true);
        setTimeout(() => {
          router.push('/?success=true');
        }, 2000);
      } else {
        let errorMessage = 'Erro no pagamento';
        if (result.error) {
          errorMessage = result.error;
        } else if (result.message) {
          errorMessage = result.message;
        } else if (!result || Object.keys(result).length === 0) {
          errorMessage = 'Erro de comunicação com o servidor. Tente novamente.';
        } else {
          switch (response.status) {
            case 400:
              errorMessage = 'Dados do cartão inválidos';
              break;
            case 422:
              errorMessage = 'Cartão recusado ou dados incorretos';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor - tente novamente';
              break;
            default:
              errorMessage = 'Erro desconhecido';
          }
        }
        // Só loga erro inesperado
        if (!isErroDeFluxo(errorMessage)) {
          console.error('❌ Erro na resposta:', errorMessage);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Erro no pagamento:', error);

      // Melhorar mensagem de erro baseada no tipo
      let errorMessage = 'Erro ao conectar com servidor';

      if (error instanceof SyntaxError) {
        // Erro de parsing JSON - servidor pode ter retornado HTML/texto
        errorMessage = 'Erro de comunicação com o servidor. Tente novamente.';
      } else if (error instanceof TypeError) {
        // Erro de rede/conectividade
        errorMessage =
          'Erro de conexão. Verifique sua internet e tente novamente.';
      }

      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
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
    // Aplica máscara incremental conforme digita
    const v = value.replace(/\D/g, '');
    if (v.length <= 3) return v;
    if (v.length <= 6) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Persistência dos dados do cliente
  useEffect(() => {
    // Restaurar dados ao carregar
    const saved = localStorage.getItem('clara_checkout_customer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.email) setCustomerEmail(parsed.email);
        if (parsed.phone) setCustomerPhone(parsed.phone);
        if (parsed.cpf) setCustomerCpf(parsed.cpf);
      } catch {}
    }
  }, []);

  useEffect(() => {
    // Salvar sempre que algum campo mudar
    const data = {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      cpf: customerCpf,
    };
    localStorage.setItem('clara_checkout_customer', JSON.stringify(data));
  }, [customerName, customerEmail, customerPhone, customerCpf]);

  return (
    <div className="min-h-screen bg-background h-screen overflow-y-auto max-h-dvh">
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
                <h2 className="text-sm font-medium">
                  {planDetails[plan].name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {planDetails[plan].description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{planDetails[plan].price}</p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Customer Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Dados do Cliente</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  placeholder="João Silva"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="joao@email.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="(11) 99999-9999"
                    value={customerPhone}
                    onChange={e => {
                      const formatted = formatPhone(e.target.value);
                      setCustomerPhone(formatted);
                    }}
                    className="h-9 text-sm"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    CPF
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="123.456.789-00"
                    value={customerCpf}
                    onChange={e => {
                      setCustomerCpf(formatCpf(e.target.value));
                    }}
                    className="h-9 text-sm"
                    maxLength={14}
                  />
                </div>
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
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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
                      onChange={e =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
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
                      onChange={e => setCardName(e.target.value)}
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
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(
                            /(\d{2})(\d{2})/,
                            '$1/$2'
                          );
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
                        onChange={e =>
                          setCardCvv(e.target.value.replace(/\D/g, ''))
                        }
                        className="h-9 text-sm"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleCardPayment}
                className="w-full h-10 text-sm"
                disabled={
                  processing ||
                  !customerName ||
                  !customerEmail ||
                  !customerPhone ||
                  !customerCpf ||
                  !cardNumber ||
                  !cardName ||
                  !cardExpiry ||
                  !cardCvv
                }
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
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
                    <Button
                      onClick={generatePixCode}
                      className="h-9 text-sm"
                      disabled={
                        processing ||
                        !customerName ||
                        !customerEmail ||
                        !customerPhone ||
                        !customerCpf
                      }
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Gerar PIX
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {qrCodeUrl && (
                      <div className="text-center">
                        <Image
                          src={qrCodeUrl}
                          alt="QR Code PIX"
                          width={256}
                          height={256}
                          className="mx-auto rounded-lg"
                        />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        {qrCodeUrl
                          ? 'Escaneie o QR Code ou copie o código PIX'
                          : 'Copie o código PIX abaixo'}
                      </p>
                      <div className="bg-muted rounded-lg p-2 text-xs font-mono break-all max-h-24 overflow-y-auto">
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
                      <p className="text-xs text-muted-foreground mb-3">
                        Após o pagamento, você receberá um email de confirmação
                      </p>
                    </div>
                  </div>
                )}
              </Card>
              {/* Card separado para o botão de ajuda */}
              <Card className="p-4 mt-2">
                <div className="text-center">
                  <Button
                    onClick={() =>
                      window.open(
                        'https://wa.me/5511999999999?text=Olá! Preciso de ajuda com minha assinatura Clara AI',
                        '_blank'
                      )
                    }
                    variant="outline"
                    className="w-full h-9 text-sm"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Ajuda via WhatsApp
                  </Button>
                </div>
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
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
