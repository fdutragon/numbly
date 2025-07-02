import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';
import { z } from 'zod';
import webpush from 'web-push';

// 🔒 Interfaces TypeScript para type safety
interface PushMessage {
  title: string;
  message: string;
  url?: string;
  icon?: string;
  badge?: string;
  sendToAll?: boolean;
  testMode?: boolean;
}

interface PushResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    sent: number;
    failed: number;
    total: number;
    errors?: string[];
  };
}

export const dynamic = 'force-dynamic';

// Rate limiting para push notifications (muito restritivo)
const PUSH_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 3 // Apenas 3 envios por 5 minutos
} as const;

// Schema de validação para push notifications
const pushMessageSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título muito longo'),
  body: z.string()
    .min(1, 'Mensagem é obrigatória')
    .max(500, 'Mensagem muito longa'),
  url: z.string().url('URL inválida').optional(),
  icon: z.string().url('URL do ícone inválida').optional(),
  badge: z.string().url('URL do badge inválida').optional(),
  sendToAll: z.boolean().default(false),
  testMode: z.boolean().default(false),
  targetDeviceId: z.string().optional(), // Adicionar suporte para deviceId específico
  targetUserId: z.string().optional(), // Adicionar suporte para userId específico
});

// Configurar VAPID keys
webpush.setVapidDetails(
  'mailto:contato@numbly.life',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM-LZJptK7S0_ZOKMo0oXGvGJrZEEBiE4r1AiOQeQkHG7jn8QaVF9k',
  process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE'
);

/**
 * 🔐 Verificar se usuário é admin
 */
async function isAdmin(req: NextRequest): Promise<boolean> {
  // TODO: Implementar verificação real de admin
  // Por enquanto, permitir apenas IPs específicos ou em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  return adminEmails.length > 0; // Simplificado por enquanto
}

/**
 * 📤 POST - Enviar push notification
 * POST /api/push/send
 */
export async function POST(req: NextRequest): Promise<NextResponse<PushResponse>> {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. 🛡️ Validação de segurança
    try {
      securityContext = await authGuard(req);
    } catch (error: any) {
      return NextResponse.json<PushResponse>({
        success: false,
        error: 'Não autenticado',
        message: 'Acesso negado'
      }, { status: 401 });
    }

    // 2. 🔧 Verificar se é admin
    const isUserAdmin = await isAdmin(req);
    if (!isUserAdmin) {
      logSecurityEvent('SUSPICIOUS', securityContext, 'Tentativa não autorizada de envio de push notification');
      return NextResponse.json<PushResponse>({
        success: false,
        error: 'Acesso negado',
        message: 'Permissão insuficiente'
      }, { status: 403 });
    }

    // 3. 🚦 Rate limiting muito restritivo para push
    const pushKey = `push_send_${securityContext.ip}`;
    if (!checkRateLimit(pushKey, PUSH_RATE_LIMIT.window, PUSH_RATE_LIMIT.max, { allowLocalhost: true })) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Push notification rate limit exceeded');
      return NextResponse.json<PushResponse>({
        success: false,
        error: 'Muitas tentativas',
        message: 'Limite de envio de notificações excedido. Tente novamente em 5 minutos.'
      }, { status: 429 });
    }

    // 4. 📝 Validar dados de entrada
    const requestBody = await req.json().catch(() => ({}));
    
    let validatedData: z.infer<typeof pushMessageSchema>;
    try {
      validatedData = pushMessageSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid push data: ${errorMessages}`);
        
        return NextResponse.json<PushResponse>({
          success: false,
          error: 'Dados inválidos',
          message: error.errors[0]?.message || 'Dados de entrada inválidos'
        }, { status: 400 });
      }
      throw error;
    }

    const { title, body: messageBody, url, icon, badge, sendToAll, testMode, targetDeviceId, targetUserId } = validatedData;

    // 5. 🎯 Definir critérios de envio
    let whereClause: any = {
      isActive: true
    };

    // Se tem target específico, filtrar por ele
    if (targetDeviceId) {
      whereClause.deviceId = targetDeviceId;
    } else if (targetUserId) {
      // TODO: Implementar busca por userId quando disponível
      console.log('Filtro por userId ainda não implementado');
    } else if (!sendToAll) {
      // Se sendToAll não for true e não tem target específico, aplicar filtros normais
      whereClause = {
        ...whereClause,
        hasPurchased: false,
        pushSent: false,
        // Opcional: enviar apenas para quem instalou há mais de X horas
        installedAt: {
          lte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas atrás
        }
      };
    }

    // No modo teste, limitar a apenas algumas subscriptions
    const takeLimit = testMode ? 5 : undefined;

    // 6. 🔍 Buscar subscriptions elegíveis
    const eligibleSubscriptions = await db.pushSubscription.findMany({
      where: whereClause,
      ...(takeLimit && { take: takeLimit })
    });

    console.log(`🎯 Enviando push para ${eligibleSubscriptions.length} usuários ${sendToAll ? '(TODOS)' : '(FILTRADOS)'} ${testMode ? '(MODO TESTE)' : ''}`);

    // 7. 📊 Preparar métricas de envio
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // 8. 📤 Enviar push para cada subscription elegível
    for (const sub of eligibleSubscriptions) {
      try {
        // Parse da subscription JSON
        let subscriptionData;
        try {
          subscriptionData = JSON.parse(sub.subscription);
        } catch (parseError) {
          console.error(`❌ Erro ao parsear subscription ${sub.id}:`, parseError);
          results.failed++;
          results.errors.push(`Subscription ${sub.id}: Invalid JSON format`);
          continue;
        }

        const subscription = {
          endpoint: subscriptionData.endpoint || sub.endpoint,
          keys: subscriptionData.keys || {
            p256dh: subscriptionData.p256dh,
            auth: subscriptionData.auth
          }
        };

        // Validar se temos os dados necessários
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
          console.error(`❌ Subscription incompleta ${sub.id}`);
          results.failed++;
          results.errors.push(`Subscription ${sub.id}: Missing required fields`);
          continue;
        }

        const payload = JSON.stringify({
          title,
          body: messageBody,
          url: url || '/',
          icon: icon || '/icon-192x192.svg',
          badge: badge || '/icon-72x72.svg',
          timestamp: Date.now(),
          requireInteraction: false,
          silent: false
        });

        await webpush.sendNotification(subscription, payload);
        results.sent++;

        // Marcar como enviado se não for modo teste
        if (!testMode) {
          await db.pushSubscription.update({
            where: { id: sub.id },
            data: { 
              pushSent: true,
              pushSentAt: new Date()
            }
          });
        }

      } catch (error: any) {
        console.error(`❌ Falha ao enviar push para ${sub.id}:`, error.message);
        results.failed++;
        results.errors.push(`Subscription ${sub.id}: ${error.message}`);

        // Marcar subscription como inativa se falhou permanentemente
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false }
          });
        }
      }
    }

    // 9. ✅ Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, 
      `Push notification sent: ${results.sent} success, ${results.failed} failed`);

    return NextResponse.json<PushResponse>({
      success: true,
      message: `Push notification enviada com sucesso para ${results.sent} usuários`,
      data: {
        sent: results.sent,
        failed: results.failed,
        total: eligibleSubscriptions.length,
        ...(results.errors.length > 0 && { errors: results.errors })
      }
    });

  } catch (error: any) {
    console.error("🚨 Erro ao enviar push notification:", error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Push send error: ${error.message}`);
    }
    
    return NextResponse.json<PushResponse>(
      { 
        success: false, 
        error: 'Erro interno',
        message: 'Falha ao enviar push notification' 
      },
      { status: 500 }
    );
  }
}
