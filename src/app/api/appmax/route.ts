import { NextRequest, NextResponse } from "next/server";
import {
  authGuard,
  logSecurityEvent,
  checkRateLimit,
} from "@/lib/security/auth-guard";
import type { SecurityContext } from "@/lib/security/auth-guard";
import { z } from "zod";
import crypto from "crypto";

// 🔒 Interfaces TypeScript para type safety
interface ProductConfig {
  NAME: string;
  SKU: string;
  PRICE_BROWSER: number;
  PRICE_PWA: number;
  CURRENCY: string;
}

interface PaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    paymentId?: string;
    checkoutUrl?: string;
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

export const dynamic = "force-dynamic";

// Configurações centralizadas do produto
const PRODUCT_CONFIG: ProductConfig = {
  NAME: "Assinatura Numbly Club",
  SKU: "NUMEROLOGICA-CLUB-001",
  PRICE_BROWSER: 97.0,
  PRICE_PWA: 27.0,
  CURRENCY: "BRL",
};

// Rate limiting para pagamentos (muito restritivo)
const PAYMENT_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 3, // Apenas 3 tentativas por 5 minutos
} as const;

// Schema de validação para pagamentos
const paymentSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  cpf: z
    .string()
    .regex(/^\d{11}$/, "CPF deve ter 11 dígitos")
    .optional(),
  phone: z.string().min(10, "Telefone inválido").optional(),
  isPWA: z.boolean().default(false),
  cardData: z
    .object({
      number: z.string().min(13, "Número do cartão inválido"),
      expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Data de expiração inválida"),
      cvv: z.string().min(3, "CVV inválido"),
      holder: z.string().min(2, "Nome do portador inválido"),
    })
    .optional(),
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
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");
}

/**
 * 📊 Enviar evento InitiateCheckout para o TikTok Pixel
 */
async function sendTikTokInitiateCheckoutEvent(
  email: string,
  isPWA: boolean,
): Promise<void> {
  try {
    // Verificar se as credenciais do TikTok estão configuradas
    if (!process.env.TT_PIXEL_ID || !process.env.TT_ACCESS_TOKEN) {
      console.log(
        "[TikTok Pixel] Credenciais não configuradas, pulando tracking",
      );
      return;
    }

    const hashedEmail = hashEmail(email);
    const eventTime = Math.floor(Date.now() / 1000);
    const price = getPrice(isPWA);

    const payload: TikTokEvent = {
      event_source: "web",
      event_source_id: process.env.TT_PIXEL_ID,
      data: [
        {
          event: "InitiateCheckout",
          event_time: eventTime,
          user: {
            email: hashedEmail,
          },
          properties: {
            currency: PRODUCT_CONFIG.CURRENCY,
            value: price,
            content_type: "product",
            content_name: PRODUCT_CONFIG.NAME,
          },
        },
      ],
    };

    console.log("[TikTok Pixel] Enviando evento InitiateCheckout:", {
      email: email.substring(0, 3) + "***",
      price,
      isPWA,
      eventTime,
    });

    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": process.env.TT_ACCESS_TOKEN,
        },
        body: JSON.stringify(payload),
      },
    );

    if (response.ok) {
      const result = await response.json();
      console.log("[TikTok Pixel] ✅ Evento enviado com sucesso:", result);
    } else {
      const error = await response.text();
      console.error(
        "[TikTok Pixel] ❌ Erro ao enviar evento:",
        response.status,
        error,
      );
    }
  } catch (error: unknown) {
    console.error("[TikTok Pixel] ❌ Erro inesperado:", (error as Error).message);
  }
}

/**
 * 💳 POST - Processar pagamento AppMax
 * POST /api/appmax
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<PaymentResponse>> {
  let securityContext: SecurityContext | undefined;

  try {
    // 1. 🛡️ Validação de segurança
    try {
      securityContext = await authGuard(req);
    } catch (error: unknown) {
      return NextResponse.json<PaymentResponse>(
        {
          success: false,
          error: "Acesso negado",
          message: "Falha na validação de segurança",
        },
        { status: 403 },
      );
    }

    // 2. 🚦 Rate limiting muito restritivo para pagamentos
    const paymentKey = `payment_${securityContext.ip}`;
    if (
      !checkRateLimit(
        paymentKey,
        PAYMENT_RATE_LIMIT.window,
        PAYMENT_RATE_LIMIT.max,
      )
    ) {
      logSecurityEvent(
        "RATE_LIMITED",
        securityContext,
        "Payment attempts exceeded",
      );
      return NextResponse.json<PaymentResponse>(
        {
          success: false,
          error: "Muitas tentativas de pagamento",
          message:
            "Limite de tentativas excedido. Tente novamente em 5 minutos.",
        },
        { status: 429 },
      );
    }

    // 3. 📝 Validar dados de entrada
    const body = await req.json().catch(() => ({}));

    let validatedData: z.infer<typeof paymentSchema>;
    try {
      validatedData = paymentSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => e.message).join(", ");
        logSecurityEvent(
          "SUSPICIOUS",
          securityContext,
          `Invalid payment data: ${errorMessages}`,
        );

        return NextResponse.json<PaymentResponse>(
          {
            success: false,
            error: "Dados inválidos",
            message: error.errors[0]?.message || "Dados de pagamento inválidos",
          },
          { status: 400 },
        );
      }
      throw error;
    }

    const { email, isPWA } = validatedData;

    // 4. 💰 Calcular preço baseado no tipo (PWA vs Browser)
    const amount = getPrice(isPWA || false);

    // 5. 📊 Enviar tracking para TikTok Pixel
    await sendTikTokInitiateCheckoutEvent(email, isPWA || false);

    // 6. 💳 Processar pagamento com AppMax
    if (!process.env.APPMAX_API_KEY) {
      console.error("APPMAX_API_KEY não configurada");
      return NextResponse.json<PaymentResponse>(
        {
          success: false,
          error: "Configuração inválida",
          message: "Gateway de pagamento não configurado",
        },
        { status: 500 },
      );
    }

    // TODO: Implementar integração real com AppMax
    // Por enquanto, simular resposta de sucesso para desenvolvimento
    const mockPaymentId = `appmax_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    console.log("🔮 Processando pagamento AppMax:", {
      email: email.substring(0, 3) + "***",
      amount,
      currency: PRODUCT_CONFIG.CURRENCY,
      isPWA,
      paymentId: mockPaymentId,
    });

    // 7. ✅ Log de sucesso
    logSecurityEvent(
      "AUTH_SUCCESS",
      securityContext,
      `Payment initiated: ${mockPaymentId}, amount: ${amount}`,
    );

    return NextResponse.json<PaymentResponse>({
      success: true,
      message: "Pagamento processado com sucesso",
      data: {
        paymentId: mockPaymentId,
        amount,
        currency: PRODUCT_CONFIG.CURRENCY,
        checkoutUrl: `https://checkout.appmax.com.br/${mockPaymentId}`, // Mock URL
      },
    });
  } catch (error: unknown) {
    console.error("🚨 Erro ao processar pagamento AppMax:", error);

    if (securityContext) {
      logSecurityEvent(
        "SUSPICIOUS",
        securityContext,
        `AppMax payment error: ${(error as Error).message}`,
      );
    }

    return NextResponse.json<PaymentResponse>(
      {
        success: false,
        error: "Erro interno",
        message: "Falha ao processar pagamento",
      },
      { status: 500 },
    );
  }
}
