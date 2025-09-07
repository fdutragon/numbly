import React, { useState } from 'react';
import { CreditCard, Check, Zap, Crown, Star, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: (plan: PlanType) => void;
}

type PlanType = 'free' | 'premium' | 'pro';

interface Plan {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    period: 'para sempre',
    description: 'Perfeito para começar',
    features: [
      '1 documento ativo',
      '1 edição de IA gratuita',
      'Exportação básica',
      'Suporte por email'
    ],
    icon: <Star className="w-5 h-5" />,
    color: 'text-gray-500'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.90,
    period: '/mês',
    description: 'Para uso profissional',
    features: [
      '10 documentos ativos',
      'IA ilimitada',
      'Exportação avançada (.docx, .pdf)',
      'Templates premium',
      'Suporte prioritário',
      'Histórico de versões'
    ],
    popular: true,
    icon: <Zap className="w-5 h-5" />,
    color: 'text-blue-500'
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 79.90,
    period: '/mês',
    description: 'Para equipes e escritórios',
    features: [
      'Documentos ilimitados',
      'IA avançada com GPT-4',
      'Colaboração em tempo real',
      'API personalizada',
      'Integração com sistemas',
      'Suporte 24/7',
      'Backup automático',
      'Compliance LGPD'
    ],
    icon: <Crown className="w-5 h-5" />,
    color: 'text-purple-500'
  }
];

export default function PaymentModal({
  open,
  onOpenChange,
  onPaymentSuccess
}: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const handleCardInputChange = (field: keyof typeof cardData, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    if (selectedPlan === 'free') {
      onPaymentSuccess?.(selectedPlan);
      onOpenChange(false);
      return;
    }

    setIsProcessing(true);
    
    try {
      // TODO: Implementar integração com gateway de pagamento (Stripe/PagSeguro)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Processando pagamento:', {
        plan: selectedPlan,
        method: paymentMethod,
        amount: plans.find(p => p.id === selectedPlan)?.price
      });
      
      // TODO: Atualizar status do usuário no Supabase
      onPaymentSuccess?.(selectedPlan);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro no pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            Escolha seu Plano
          </DialogTitle>
          <DialogDescription>
            Desbloqueie todo o potencial do editor jurídico com IA.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="plans" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="payment" disabled={selectedPlan === 'free'}>
              Pagamento
            </TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto max-h-96 mt-4">
            <TabsContent value="plans" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={cn(
                      'relative cursor-pointer transition-all hover:shadow-lg',
                      selectedPlan === plan.id && 'ring-2 ring-blue-500',
                      plan.popular && 'border-blue-500'
                    )}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                        Mais Popular
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center pb-2">
                      <div className={cn('mx-auto mb-2', plan.color)}>
                        {plan.icon}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="text-2xl font-bold">
                        {plan.price === 0 ? (
                          'Grátis'
                        ) : (
                          <>
                            <span className="text-sm">R$</span>
                            {plan.price.toFixed(2).replace('.', ',')}
                            <span className="text-sm font-normal text-muted-foreground">
                              {plan.period}
                            </span>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={selectedPlan === plan.id ? 'default' : 'outline'}
                      >
                        {selectedPlan === plan.id ? 'Selecionado' : 'Selecionar'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="payment" className="space-y-4">
              {selectedPlanData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Resumo do Pedido</span>
                      <Badge variant="secondary">{selectedPlanData.name}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total:</span>
                      <span>R$ {selectedPlanData.price.toFixed(2).replace('.', ',')}{selectedPlanData.period}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Tabs value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as 'card' | 'pix')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="card">Cartão de Crédito</TabsTrigger>
                  <TabsTrigger value="pix">PIX</TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={(e) => handleCardInputChange('number', e.target.value)}
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Nome no Cartão</Label>
                      <Input
                        id="cardName"
                        placeholder="João Silva"
                        value={cardData.name}
                        onChange={(e) => handleCardInputChange('name', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardExpiry">Validade</Label>
                        <Input
                          id="cardExpiry"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pix" className="space-y-4 mt-4">
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-sm">QR Code PIX</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Escaneie o código QR com seu app do banco
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ou copie e cole a chave PIX: <code className="bg-gray-100 px-2 py-1 rounded">pix@numby.com.br</code>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="min-w-32"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {selectedPlan === 'free' ? 'Continuar Grátis' : 'Finalizar Pagamento'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}