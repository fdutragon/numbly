import { NextRequest, NextResponse } from "next/server";
import { Resend } from 'resend';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';
import { z } from 'zod';
import crypto from 'crypto';

// 🔒 Interfaces TypeScript para type safety

interface WebhookResponse {
  received: boolean;
  message?: string;
  error?: string;
  email?: string;
  customerName?: string;
  orderAmount?: number;
  event?: string;
  pixels?: {
    tiktok: PixelResponse | null;
    meta: PixelResponse | null;
  };
  emailSent?: boolean;
  reason?: string;
  timestamp: string;
}

interface PixelResponse {
  success: boolean;
  status?: number;
  data?: any;
  error?: any;
}

export const dynamic = 'force-dynamic';

// Rate limiting para webhooks (mais permissivo)
const WEBHOOK_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 50 // 50 webhooks por minuto
} as const;

// Schema de validação para webhook
const webhookSchema = z.object({
  event: z.string().min(1, 'Event é obrigatório'),
  data: z.object({
    customer: z.object({
      email: z.string().email('Email inválido'),
      name: z.string().optional(),
    }).optional(),
    order: z.object({
      amount: z.number().optional(),
    }).optional(),
  }).optional(),
});

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 📧 Helper para determinar email de destino baseado no ambiente
 */
function getTestEmail(originalEmail: string): string {
  const isDevMode = process.env.NODE_ENV === 'development' || 
                   (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');
  
  return isDevMode ? 'delivered@resend.dev' : originalEmail;
}

/**
 * 🔐 Função para fazer hash SHA-256 do email
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

/**
 * 🎯 Enviar evento Purchase para o TikTok Pixel
 */
async function sendTikTokPurchaseEvent(email: string, amount: number = 17): Promise<PixelResponse> {
  console.log(`[TikTok Pixel] Enviando evento para ${email} (R$ ${amount})`);
  
  try {
    if (!process.env.TT_PIXEL_ID || !process.env.TT_ACCESS_TOKEN) {
      return {
        success: false,
        status: 0,
        error: {
          message: 'Credenciais TikTok Pixel não configuradas',
          TT_PIXEL_ID: !!process.env.TT_PIXEL_ID,
          TT_ACCESS_TOKEN: !!process.env.TT_ACCESS_TOKEN
        }
      };
    }

    const hashedEmail = hashEmail(email);
    const eventTime = Math.floor(Date.now() / 1000);
    
    const payload = {
      event_source: "web",
      event_source_id: process.env.TT_PIXEL_ID,
      data: [
        {
          event: "Purchase",
          event_time: eventTime,
          user: { email: hashedEmail },
          properties: { currency: "BRL", value: amount, content_type: "product" },
          page: { url: "https://numbly.life" }
        }
      ]
    };

    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Access-Token': process.env.TT_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.json();
    
    if (response.ok) {
      return { success: true, status: response.status, data: responseBody };
    } else {
      return { success: false, status: response.status, error: responseBody };
    }
  } catch (error: any) {
    return { success: false, status: 0, error: { message: error.message, stack: error.stack } };
  }
}

/**
 * 📘 Enviar evento Purchase para o Meta Pixel (Facebook)
 */
async function sendMetaPurchaseEvent(email: string, amount: number = 17): Promise<PixelResponse> {
  console.log(`[Meta Pixel] Enviando evento para ${email} (R$ ${amount})`);
  
  try {
    if (!process.env.META_PIXEL_ID || !process.env.META_CAPI_TOKEN) {
      return {
        success: false,
        status: 0,
        error: {
          message: 'Credenciais Meta Pixel não configuradas',
          META_PIXEL_ID: !!process.env.META_PIXEL_ID,
          META_CAPI_TOKEN: !!process.env.META_CAPI_TOKEN
        }
      };
    }

    const hashedEmail = hashEmail(email);
    const eventTime = Math.floor(Date.now() / 1000);
    
    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: eventTime,
          action_source: "website",
          user_data: { em: hashedEmail },
          custom_data: { currency: "BRL", value: amount }
        }
      ],
      test_event_code: process.env.META_TEST_EVENT_CODE || ""
    };

    const apiUrl = `https://graph.facebook.com/v18.0/${process.env.META_PIXEL_ID}/events`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.META_CAPI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.json();
    
    if (response.ok) {
      return { success: true, status: response.status, data: responseBody };
    } else {
      return { success: false, status: response.status, error: responseBody };
    }
  } catch (error: any) {
    return { success: false, status: 0, error: { message: error.message, stack: error.stack } };
  }
}



// Template do email de boas-vindas
const WELCOME_EMAIL_TEMPLATE = {
  subject: '🎉 Bem-vindo(a) ao Numbly! Seu acesso está liberado',
  html: `
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Header -->
      <div style="background: linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%); padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 PARABÉNS!</h1>
        <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Seu pagamento foi confirmado</p>
      </div>
      
      <!-- Conteúdo principal -->
      <div style="padding: 35px;">
        <p style="font-size: 18px; margin: 0 0 25px 0; color: #e5e7eb;">Olá <strong>{{{FIRST_NAME|there}}}</strong>,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
          Seu pagamento foi <strong style="color: #10b981;">confirmado com sucesso!</strong> Agora você tem acesso completo aos seus segredos numerológicos.
        </p>

        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <h3 style="color: #10b981; font-size: 18px; margin: 0 0 15px 0;">🔮 Sua Dashboard Premium inclui:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #d1d5db; line-height: 1.8;">
            <li><strong style="color: #10b981;">Mapa Numerológico Completo</strong> - Sua missão de vida revelada</li>
            <li><strong style="color: #10b981;">Compatibilidade Amorosa Ilimitada</strong> - Teste com qualquer pessoa</li>
            <li><strong style="color: #10b981;">Números da Sorte Personalizados</strong> - Para cada área da sua vida</li>
            <li><strong style="color: #10b981;">Análises Detalhadas</strong> - Personalidade, carreira e relacionamentos</li>
            <li><strong style="color: #10b981;">Acesso Vitalício</strong> - Sem mensalidades ou renovações</li>
          </ul>
        </div>

        <!-- CTA Principal -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="{{{DASHBOARD_LINK}}}" style="display: inline-block; background: linear-gradient(90deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 20px 45px; border-radius: 50px; font-weight: bold; font-size: 19px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);">
            🚀 ACESSAR DASHBOARD
          </a>
        </div>
      </div>
    </div>
  `
};

/**
 * 💳 POST - Webhook da AppMax para processar pagamentos
 * POST /api/appmax/webhook
 */
export async function POST(req: NextRequest): Promise<NextResponse<WebhookResponse>> {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. 🛡️ Validação de segurança (mais permissiva para webhooks)
    try {
      securityContext = await authGuard(req);
    } catch (error: any) {
      securityContext = {
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || '',
        riskScore: 0,
        timestamp: Date.now(),
        endpoint: '/api/appmax/webhook',
        method: 'POST'
      };
    }

    // 2. 🚦 Rate limiting para webhooks
    const webhookKey = `webhook_appmax_${securityContext.ip}`;
    if (!checkRateLimit(webhookKey, WEBHOOK_RATE_LIMIT.window, WEBHOOK_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'AppMax webhook rate limit exceeded');
      return NextResponse.json<WebhookResponse>({
        received: true,
        error: 'Rate limit excedido',
        timestamp: new Date().toISOString()
      }, { status: 429 });
    }

    // 3. 📝 Parsear e validar payload
    const body = await req.json().catch(() => ({}));
    console.log("[Appmax Webhook] Recebido:", body);

    let validatedData: z.infer<typeof webhookSchema>;
    try {
      validatedData = webhookSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid webhook data: ${error.errors.map(e => e.message).join(', ')}`);
        
        return NextResponse.json<WebhookResponse>({
          received: true,
          error: 'Dados inválidos',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      throw error;
    }

    // 4. 🎯 Processar eventos de pagamento
    const paymentEvents = ["OrderPaidByPix", "OrderApproved", "OrderAuthorized", "OrderPaid"];
    
    if (paymentEvents.includes(validatedData.event)) {
      const email = validatedData.data?.customer?.email;
      const customerName = validatedData.data?.customer?.name;
      const orderAmount = validatedData.data?.order?.amount || 47;
      
      if (!email) {
        console.error("[Appmax Webhook] Email do cliente não encontrado no payload.");
        return NextResponse.json<WebhookResponse>({
          received: true,
          error: 'Email não encontrado',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      console.log(`[Appmax Webhook] 📧 Processando email: ${email}`);

      // 5.  Enviar email de boas-vindas
      let emailSent = false;
      
      if (process.env.RESEND_API_KEY) {
        try {
          const targetEmail = getTestEmail(email);
          const firstName = customerName ? customerName.split(' ')[0] : 'Amigo(a)';
          const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://numbly.life';
          const dashboardLink = `${baseUrl}/dashboard`;
          
          const personalizedHtml = WELCOME_EMAIL_TEMPLATE.html
            .replace(/{{{FIRST_NAME}}}/g, firstName)
            .replace(/{{{DASHBOARD_LINK}}}/g, dashboardLink);
          
          const emailResult = await resend.emails.send({
            from: 'Numbly <noreply@numbly.life>',
            to: [targetEmail],
            subject: WELCOME_EMAIL_TEMPLATE.subject,
            html: personalizedHtml,
            headers: {
              'X-Welcome-Email': 'true',
              'X-User-Email': email,
              'X-Customer-Name': customerName || 'N/A'
            }
          });
          
          console.log(`[Appmax Webhook] Email de boas-vindas enviado para ${targetEmail}:`, emailResult);
          emailSent = true;
        } catch (emailError) {
          console.error(`[Appmax Webhook] Erro ao enviar email de boas-vindas:`, emailError);
        }
      }

      // 6. 🎯 Enviar eventos para pixels
      const pixelResponses = {
        tiktok: null as PixelResponse | null,
        meta: null as PixelResponse | null
      };

      try {
        pixelResponses.tiktok = await sendTikTokPurchaseEvent(email, orderAmount);
      } catch (tiktokError: any) {
        console.error(`[Appmax Webhook] Erro TikTok:`, tiktokError);
        pixelResponses.tiktok = { success: false, error: tiktokError.message };
      }

      try {
        pixelResponses.meta = await sendMetaPurchaseEvent(email, orderAmount);
      } catch (metaError: any) {
        console.error(`[Appmax Webhook] Erro Meta:`, metaError);
        pixelResponses.meta = { success: false, error: metaError.message };
      }

      // 7. ✅ Log de sucesso
      logSecurityEvent('AUTH_SUCCESS', securityContext, `AppMax payment processed for ${email}`);

      return NextResponse.json<WebhookResponse>({
        received: true,
        email: email,
        customerName: customerName,
        orderAmount: orderAmount,
        event: validatedData.event,
        pixels: pixelResponses,
        emailSent: emailSent,
        timestamp: new Date().toISOString()
      });

    } else {
      console.log(`[Appmax Webhook] ⚠️ Evento não reconhecido: ${validatedData.event}`);
      return NextResponse.json<WebhookResponse>({
        received: true,
        event: validatedData.event,
        message: "Evento não processado",
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error("[Appmax Webhook] Erro:", error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `AppMax webhook error: ${error.message}`);
    }
    
    return NextResponse.json<WebhookResponse>({
      received: true,
      error: "Erro no processamento do webhook",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}