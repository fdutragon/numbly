import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';
import { pushSubscriptionSchema } from '@/lib/security/validation-schemas';
import type { PushSubscriptionInput } from '@/lib/security/validation-schemas';
import { z } from 'zod';

// 🔒 Interfaces TypeScript para type safety
interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

interface SubscribeRequest {
  subscription: PushSubscriptionData;
  deviceId?: string;
  userAgent?: string;
}

interface SubscribeResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    subscriptionId?: string;
    isNew?: boolean;
  };
  transactionId?: string;
}

export const dynamic = 'force-dynamic';

// Rate limiting para subscriptions
const SUBSCRIBE_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 10 // 10 subscriptions por 5 minutos
} as const;

/**
 * 📝 Função para log detalhado com timestamp
 */
function logWithTimestamp(message: string, data: any = {}): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data);
}

/**
 * 📱 POST - Criar/atualizar subscription de push notification
 * POST /api/push/subscribe
 */
export async function POST(req: NextRequest): Promise<NextResponse<SubscribeResponse>> {
  const transactionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  let securityContext: SecurityContext | undefined;
  
  try {
    logWithTimestamp(`[${transactionId}] 📥 Recebendo requisição para salvar subscription`);
    
    // 1. 🛡️ Validação de segurança básica (mais permissiva para subscriptions)
    try {
      securityContext = await authGuard(req);
    } catch (error: any) {
      // Para subscriptions, não exigir autenticação rigorosa
      securityContext = {
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || '',
        riskScore: 0,
        timestamp: Date.now(),
        endpoint: '/api/push/subscribe',
        method: 'POST'
      };
    }

    // 2. 🚦 Rate limiting para subscriptions
    const subKey = `push_subscribe_${securityContext.ip}`;
    if (!checkRateLimit(subKey, SUBSCRIBE_RATE_LIMIT.window, SUBSCRIBE_RATE_LIMIT.max, { allowLocalhost: true })) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Push subscription rate limit exceeded');
      return NextResponse.json<SubscribeResponse>({
        success: false,
        error: 'Muitas tentativas',
        message: 'Limite de registros de push notification excedido',
        transactionId
      }, { status: 429 });
    }

    // 3. 📝 Log de headers para debug
    const headers = Object.fromEntries(req.headers.entries());
    logWithTimestamp(`[${transactionId}] 📋 Headers da requisição:`, {
      contentType: headers['content-type'],
      userAgent: headers['user-agent'],
      origin: headers['origin'],
      host: headers['host'],
      retryAttempt: headers['x-push-retry'] || 'N/A'
    });

    // 4. 📄 Parsear e validar payload
    let payload: SubscribeRequest;
    try {
      const body = await req.json();
      payload = body as SubscribeRequest;
      
      logWithTimestamp(`[${transactionId}] ✅ Corpo da requisição parseado com sucesso`, {
        hasSubscription: !!payload.subscription,
        hasDeviceId: !!payload.deviceId,
        subscriptionEndpoint: payload.subscription?.endpoint?.substring(0, 50) + '...',
        hasKeys: !!(payload.subscription?.keys?.p256dh && payload.subscription?.keys?.auth)
      });
    } catch (parseError: any) {
      logWithTimestamp(`[${transactionId}] ❌ Erro ao parsear corpo da requisição:`, parseError);
      return NextResponse.json<SubscribeResponse>({
        success: false,
        error: 'Erro ao parsear payload',
        message: 'Dados inválidos na requisição',
        transactionId
      }, { status: 400 });
    }

    // 5. 🔍 Validar estrutura da subscription
    if (!payload.subscription || !payload.subscription.endpoint || !payload.subscription.keys) {
      logWithTimestamp(`[${transactionId}] ❌ Estrutura de subscription inválida`);
      return NextResponse.json<SubscribeResponse>({
        success: false,
        error: 'Subscription inválida',
        message: 'Dados de subscription malformados',
        transactionId
      }, { status: 400 });
    }

    // 5.5. 🔐 Validar com Zod schema
    try {
      pushSubscriptionSchema.parse(payload);
      logWithTimestamp(`[${transactionId}] ✅ Payload validado com sucesso pelo Zod`);
    } catch (validationError: any) {
      logWithTimestamp(`[${transactionId}] ❌ Erro de validação Zod:`, validationError.errors);
      return NextResponse.json<SubscribeResponse>({
        success: false,
        error: 'Dados inválidos',
        message: `Erro de validação: ${validationError.errors?.[0]?.message || 'Dados malformados'}`,
        transactionId
      }, { status: 400 });
    }

    // 6. 📊 Extrair dados da subscription
    const { subscription, deviceId } = payload;
    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // 7. 🔍 Verificar se já existe
    const existingSubscription = await db.pushSubscription.findFirst({
      where: {
        OR: [
          { endpoint },
          ...(deviceId ? [{ deviceId }] : [])
        ]
      }
    });

    let subscriptionRecord;
    let isNew = false;

    if (existingSubscription) {
      // 8a. 🔄 Atualizar subscription existente
      logWithTimestamp(`[${transactionId}] 🔄 Atualizando subscription existente:`, {
        id: existingSubscription.id,
        wasActive: existingSubscription.isActive
      });

      subscriptionRecord = await db.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          endpoint,
          subscription: JSON.stringify(subscription),
          deviceId: deviceId || existingSubscription.deviceId,
          userAgent: securityContext.userAgent || existingSubscription.userAgent,
          isActive: true
        }
      });
    } else {
      // 8b. 🆕 Criar nova subscription
      logWithTimestamp(`[${transactionId}] 🆕 Criando nova subscription`);
      isNew = true;

      subscriptionRecord = await db.pushSubscription.create({
        data: {
          endpoint,
          subscription: JSON.stringify(subscription),
          deviceId: deviceId || `device_${Date.now()}`,
          userAgent: securityContext.userAgent,
          isActive: true,
          installedAt: new Date()
        }
      });
    }

    // 9. ✅ Log de sucesso
    logWithTimestamp(`[${transactionId}] ✅ Subscription ${isNew ? 'criada' : 'atualizada'} com sucesso:`, {
      id: subscriptionRecord.id,
      deviceId: subscriptionRecord.deviceId,
      isActive: subscriptionRecord.isActive
    });

    logSecurityEvent('AUTH_SUCCESS', securityContext, 
      `Push subscription ${isNew ? 'created' : 'updated'}: ${subscriptionRecord.id}`);

    return NextResponse.json<SubscribeResponse>({
      success: true,
      message: `Subscription ${isNew ? 'registrada' : 'atualizada'} com sucesso`,
      data: {
        subscriptionId: subscriptionRecord.id,
        isNew
      },
      transactionId
    });

  } catch (error: any) {
    console.error(`🚨 [${transactionId}] Erro ao processar subscription:`, error);
    console.error(`🚨 [${transactionId}] Stack trace:`, error.stack);
    console.error(`🚨 [${transactionId}] Tipo do erro:`, typeof error);
    console.error(`🚨 [${transactionId}] Nome do erro:`, error.name);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Push subscription error: ${error.message}`);
    }
    
    return NextResponse.json<SubscribeResponse>(
      { 
        success: false, 
        error: 'Erro interno',
        message: `Falha ao processar subscription: ${error.message}`,
        transactionId
      },
      { status: 500 }
    );
  }
}
