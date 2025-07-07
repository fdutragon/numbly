import { NextRequest, NextResponse } from "next/server";
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';
import { z } from 'zod';
import crypto from "crypto";

// 🔒 Interfaces TypeScript para type safety
interface ProductConfig {
  NAME: string;
  SKU: string;
  PRICE_BROWSER: number;
  PRICE_PWA: number;
  CURRENCY: string;
}

interface PaymentRequest {
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  isPWA?: boolean;
  cardData?: {
    number: string;
    expiry: string;
    cvv: string;
    holder: string;
  };
}

interface PaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    paymentId?: string;
    checkoutUrl?: string;
    qrCode?: string;
    amount?: number;
    currency?: string;
  };
}

interface TikTokEvent {
  event_source: string;
  event_source_id: string;
  data: Array<{
    event: string;
    event_time: number;
    user: {
      email: string;
    };
    properties: {
      currency: string;
      value: number;
      content_type: string;
      content_name: string;
    };
  }>;
}

export const dynamic = 'force-dynamic';

// Configurações centralizadas do produto
const PRODUCT_CONFIG: ProductConfig = {
  NAME: "Assinatura Numbly Club",
  SKU: "NUMEROLOGICA-CLUB-001", 
  PRICE_BROWSER: 97.00,
  PRICE_PWA: 27.00,
  CURRENCY: "BRL"
};

// Configurações para Clara
const CLARA_CONFIG = {
  NAME: "Clara IA - Assistente Google Ads",
  SKU: "CLARA-AI-001",
  PRICE: 247.00,
  BUMP_NAME: "Criativos Mensais",
  BUMP_SKU: "CLARA-CRIATIVOS-001", 
  BUMP_PRICE: 97.00,
  CURRENCY: "BRL"
};

// Rate limiting para pagamentos (muito restritivo)
const PAYMENT_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 3 // Apenas 3 tentativas por 5 minutos
} as const;

// Schema de validação para pagamentos
const paymentSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  isPWA: z.boolean().default(false),
  cardData: z.object({
    number: z.string().min(13, 'Número do cartão inválido'),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Data de expiração inválida'),
    cvv: z.string().min(3, 'CVV inválido'),
    holder: z.string().min(2, 'Nome do portador inválido')
  }).optional()
});

// Schema específico para Clara
const claraPaymentSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  amount: z.number().min(247, 'Valor mínimo inválido'),
  product: z.string().min(1, 'Produto obrigatório'),
  orderBump: z.boolean().default(false)
});

/**
 * 💰 Obter preço baseado no ambiente
 */
function getPrice(isPWA: boolean): number {
  return isPWA ? PRODUCT_CONFIG.PRICE_PWA : PRODUCT_CONFIG.PRICE_BROWSER;
}

/**
 * 🔐 Fazer hash SHA-256 do email
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

/**
 * 📊 Enviar evento InitiateCheckout para o TikTok Pixel
 */
async function sendTikTokInitiateCheckoutEvent(email: string, isPWA: boolean): Promise<void> {
  try {
    // Verificar se as credenciais do TikTok estão configuradas
    if (!process.env.TT_PIXEL_ID || !process.env.TT_ACCESS_TOKEN) {
      console.log('[TikTok Pixel] Credenciais não configuradas, pulando tracking');
      return;
    }

    const hashedEmail = hashEmail(email);
    const eventTime = Math.floor(Date.now() / 1000);
    const price = getPrice(isPWA);

    const payload: TikTokEvent = {
      "event_source": "web",
      "event_source_id": process.env.TT_PIXEL_ID,
      "data": [
        {
          "event": "InitiateCheckout",
          "event_time": eventTime,
          "user": {
            "email": hashedEmail
          },
          "properties": {
            "currency": PRODUCT_CONFIG.CURRENCY,
            "value": price,
            "content_type": "product",
            "content_name": PRODUCT_CONFIG.NAME
          }
        }
      ]
    };

    console.log('[TikTok Pixel] Enviando evento InitiateCheckout:', {
      email: email.substring(0, 3) + '***',
      price,
      isPWA,
      eventTime
    });

    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': process.env.TT_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[TikTok Pixel] ✅ Evento enviado com sucesso:', result);
    } else {
      const error = await response.text();
      console.error('[TikTok Pixel] ❌ Erro ao enviar evento:', response.status, error);
    }

  } catch (error: any) {
    console.error('[TikTok Pixel] ❌ Erro inesperado:', error.message);
  }
}

/**
 * 💳 Processar pagamento Clara
 */
async function processClaraPayment(data: z.infer<typeof claraPaymentSchema>): Promise<PaymentResponse> {
  const { email, name, amount, product, orderBump } = data;
  
  // Generate QR Code for PIX payment
  const paymentId = `clara_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  // Simulate QR Code generation (in production, integrate with real payment gateway)
  const qrCodeUrl = `data:image/svg+xml;base64,${Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="20" height="20" fill="black"/>
      <rect x="50" y="10" width="20" height="20" fill="black"/>
      <rect x="90" y="10" width="20" height="20" fill="black"/>
      <text x="100" y="120" text-anchor="middle" font-size="12">PIX QR Code</text>
      <text x="100" y="140" text-anchor="middle" font-size="10">R$ ${amount.toFixed(2)}</text>
      <text x="100" y="160" text-anchor="middle" font-size="8">${paymentId}</text>
    </svg>
  `).toString('base64')}`;

  console.log('🎯 Processando pagamento Clara:', {
    email: email.substring(0, 3) + '***',
    amount,
    product,
    orderBump,
    paymentId
  });

  return {
    success: true,
    message: "QR Code PIX gerado com sucesso",
    data: {
      paymentId,
      amount,
      currency: CLARA_CONFIG.CURRENCY,
      qrCode: qrCodeUrl
    }
  };
}

/**
 * 💳 POST - Processar pagamento AppMax
 * POST /api/appmax
 */
export async function POST(req: NextRequest): Promise<NextResponse<PaymentResponse>> {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. 🛡️ Validação de segurança
    try {
      securityContext = await authGuard(req);
    } catch (error: any) {
      return NextResponse.json<PaymentResponse>({
        success: false,
        error: 'Acesso negado',
        message: 'Falha na validação de segurança'
      }, { status: 403 });
    }

    // 2. 🚦 Rate limiting muito restritivo para pagamentos
    const paymentKey = `payment_${securityContext.ip}`;
    if (!checkRateLimit(paymentKey, PAYMENT_RATE_LIMIT.window, PAYMENT_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Payment attempts exceeded');
      return NextResponse.json<PaymentResponse>({
        success: false,
        error: 'Muitas tentativas de pagamento',
        message: 'Limite de tentativas excedido. Tente novamente em 5 minutos.'
      }, { status: 429 });
    }

    // 3. 📝 Validar dados de entrada
    const body = await req.json().catch(() => ({}));
    
    // Check if this is a Clara payment based on the presence of 'product' field
    const isClaraPayment = 'product' in body && body.product;
    
    if (isClaraPayment) {
      // Handle Clara payment
      let validatedData: z.infer<typeof claraPaymentSchema>;
      try {
        validatedData = claraPaymentSchema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(e => e.message).join(', ');
          logSecurityEvent('SUSPICIOUS', securityContext, `Invalid Clara payment data: ${errorMessages}`);
          
          return NextResponse.json<PaymentResponse>({
            success: false,
            error: 'Dados inválidos',
            message: error.errors[0]?.message || 'Dados de pagamento inválidos'
          }, { status: 400 });
        }
        throw error;
      }

      // Process Clara payment
      const result = await processClaraPayment(validatedData);
      
      logSecurityEvent('AUTH_SUCCESS', securityContext, 
        `Clara payment initiated: ${result.data?.paymentId}, amount: ${validatedData.amount}`);
      
      return NextResponse.json<PaymentResponse>(result);
    }
    
    // Handle legacy Numbly payment
    let validatedData: z.infer<typeof paymentSchema>;
    try {
      validatedData = paymentSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid payment data: ${errorMessages}`);
        
        return NextResponse.json<PaymentResponse>({
          success: false,
          error: 'Dados inválidos',
          message: error.errors[0]?.message || 'Dados de pagamento inválidos'
        }, { status: 400 });
      }
      throw error;
    }

    const { email, name, cpf, phone, isPWA, cardData } = validatedData;

    // 4. 💰 Calcular preço baseado no tipo (PWA vs Browser)
    const amount = getPrice(isPWA || false);

    // 5. 📊 Enviar tracking para TikTok Pixel
    await sendTikTokInitiateCheckoutEvent(email, isPWA || false);

    // 6. 💳 Processar pagamento com AppMax
    if (!process.env.APPMAX_API_KEY) {
      console.error('APPMAX_API_KEY não configurada');
      return NextResponse.json<PaymentResponse>({
        success: false,
        error: 'Configuração inválida',
        message: 'Gateway de pagamento não configurado'
      }, { status: 500 });
    }

    // TODO: Implementar integração real com AppMax
    // Por enquanto, simular resposta de sucesso para desenvolvimento
    const mockPaymentId = `appmax_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    console.log('🔮 Processando pagamento AppMax:', {
      email: email.substring(0, 3) + '***',
      amount,
      currency: PRODUCT_CONFIG.CURRENCY,
      isPWA,
      paymentId: mockPaymentId
    });

    // 7. ✅ Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, 
      `Payment initiated: ${mockPaymentId}, amount: ${amount}`);

    return NextResponse.json<PaymentResponse>({
      success: true,
      message: "Pagamento processado com sucesso",
      data: {
        paymentId: mockPaymentId,
        amount,
        currency: PRODUCT_CONFIG.CURRENCY,
        checkoutUrl: `https://checkout.appmax.com.br/${mockPaymentId}` // Mock URL
      }
    });

  } catch (error: any) {
    console.error("🚨 Erro ao processar pagamento AppMax:", error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `AppMax payment error: ${error.message}`);
    }
    
    return NextResponse.json<PaymentResponse>(
      { 
        success: false, 
        error: 'Erro interno',
        message: 'Falha ao processar pagamento' 
      },
      { status: 500 }
    );
  }
}
