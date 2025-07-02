import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import webpush, { PushSubscription } from 'web-push';
import { db } from "@/lib/db";
import { addSecurityLog } from '@/lib/security/security-logger';

// Schema de validação
const CartRecoverySchema = z.object({
  deviceId: z.string().min(1, 'Device ID é obrigatório'),
  stage: z.enum(['first', 'second', 'third'], { required_error: 'Stage é obrigatório' }),
  timestamp: z.number().optional(),
  pendingUserData: z.record(z.any()).optional()
});

// Configurar web-push com as credenciais de ambiente
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'contato@numbly.life'),
  vapidKeys.publicKey || 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM-LZJptK7S0_ZOKMo0oXGvGJrZEEBiE4r1AiOQeQkHG7jn8QaVF9k',
  vapidKeys.privateKey || 'YOUR_PRIVATE_KEY_HERE'
);

// Mensagens de recuperação de carrinho
const RECOVERY_MESSAGES = {
  first: {
    title: "Seu mapa numerológico está esperando por você! 🌟",
    body: "Você estava prestes a descobrir segredos sobre sua vida. Volte e complete seu mapa agora!",
    icon: "/icon-192x192.svg",
    image: "/thumb.jpg",
    badge: "/icon-96x96.svg",
    tag: "cart-recovery-1",
    data: {
      url: "/?utm_source=push&utm_medium=recovery&utm_campaign=cart_recovery_10min",
      type: "cart_recovery",
      stage: "first"
    }
  },
  second: {
    title: "🔮 Faltou pouco para sua revelação numerológica!",
    body: "Seu destino está escrito nos números. Não perca a chance de descobri-lo hoje!",
    icon: "/icon-192x192.svg",
    image: "/thumb.jpg",
    badge: "/icon-96x96.svg",
    tag: "cart-recovery-2",
    data: {
      url: "/?utm_source=push&utm_medium=recovery&utm_campaign=cart_recovery_2h",
      type: "cart_recovery",
      stage: "second"
    }
  },
  third: {
    title: "✨ Última chance: Seu mapa numerológico está esperando!",
    body: "Descubra seus números de destino e transforme sua vida ainda hoje!",
    icon: "/icon-192x192.svg",
    image: "/thumb.jpg",
    badge: "/icon-96x96.svg",
    tag: "cart-recovery-3",
    data: {
      url: "/?utm_source=push&utm_medium=recovery&utm_campaign=cart_recovery_24h",
      type: "cart_recovery",
      stage: "third" 
    }
  }
} as const;

type RecoveryStage = keyof typeof RECOVERY_MESSAGES;

// Função para enviar push notification
async function sendPushNotification(subscription: PushSubscription, payload: string): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error: any) {
    console.error('Erro ao enviar push:', error.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Validação da requisição
    const body = await req.json();
    const validatedData = CartRecoverySchema.parse(body);

    const { deviceId, stage, timestamp, pendingUserData } = validatedData;

    // Log de início
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/push/cart-recovery',
      method: 'POST'
    }, `Cart recovery push started`, { 
      deviceId: deviceId.substring(0, 8) + '...',
      stage
    });

    console.log(`🛒 Iniciando recuperação de carrinho - Device: ${deviceId}, Stage: ${stage}`);

    // Verificar se a subscription existe no banco
    const subscriptionRecord = await db.pushSubscription.findUnique({
      where: { deviceId }
    });
    
    if (!subscriptionRecord) {
      console.error(`❌ Subscription não encontrada para deviceId: ${deviceId}`);
      
      addSecurityLog('warn', {
        ip,
        userAgent,
        endpoint: '/api/push/cart-recovery',
        method: 'POST'
      }, 'Subscription not found for cart recovery', { deviceId });
      
      return NextResponse.json({
        success: false, 
        error: 'Subscription não encontrada'
      }, { status: 404 });
    }
    
    // Verificar se o usuário já comprou
    if (subscriptionRecord.hasPurchased) {
      console.log(`⏭️ Usuário já realizou compra, ignorando recuperação: ${deviceId}`);
      
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário já realizou compra'
      });
    }
    
    // Desserializar o objeto de subscription
    let subscription: PushSubscription;
    try {
      subscription = JSON.parse(subscriptionRecord.subscription);
    } catch (error: any) {
      console.error(`❌ Erro ao desserializar subscription: ${error.message}`);
      
      addSecurityLog('warn', {
        ip,
        userAgent,
        endpoint: '/api/push/cart-recovery',
        method: 'POST'
      }, 'Invalid subscription data', { deviceId, error: error.message });
      
      return NextResponse.json({
        success: false, 
        error: 'Dados de subscription inválidos'
      }, { status: 400 });
    }
    
    // Buscar mensagem apropriada para o stage
    const message = RECOVERY_MESSAGES[stage as RecoveryStage];
    if (!message) {
      return NextResponse.json({
        success: false, 
        error: 'Stage de recuperação inválido'
      }, { status: 400 });
    }
    
    // Preparar o payload da notificação
    const notificationPayload = JSON.stringify({
      title: message.title,
      body: message.body,
      icon: message.icon,
      image: message.image,
      badge: message.badge,
      tag: message.tag,
      data: {
        ...message.data,
        timestamp: timestamp || Date.now(),
        deviceId: deviceId,
        pendingUserData: pendingUserData || null
      },
      actions: [
        {
          action: 'complete',
          title: '✨ Completar agora',
          icon: '/icon-72x72.svg'
        },
        {
          action: 'dismiss',
          title: 'Dispensar',
          icon: '/icon-72x72.svg'
        }
      ]
    });
    
    console.log(`📤 Enviando notificação de ${stage} para device: ${deviceId}`);
    
    // Enviar a notificação
    const success = await sendPushNotification(subscription, notificationPayload);
    
    if (success) {
      // Atualizar último envio
      await db.pushSubscription.update({
        where: { deviceId },
        data: {
          pushSent: true,
          pushSentAt: new Date(),
          lastUpdated: new Date()
        }
      });
      
      const processingTime = Date.now() - startTime;
      
      // Log de sucesso
      addSecurityLog('info', {
        ip,
        userAgent,
        endpoint: '/api/push/cart-recovery',
        method: 'POST'
      }, 'Cart recovery push sent successfully', {
        deviceId: deviceId.substring(0, 8) + '...',
        stage,
        processingTime
      });
      
      console.log(`✅ Notificação de recuperação ${stage} enviada com sucesso para ${deviceId}`);
      
      return NextResponse.json({
        success: true,
        message: `Notificação de recuperação ${stage} enviada com sucesso`,
        stage,
        title: message.title,
        processingTime
      });
      
    } else {
      // Marcar subscription como inativa se falhou
      await db.pushSubscription.update({
        where: { deviceId },
        data: { 
          isActive: false,
          lastUpdated: new Date()
        }
      });
      
      addSecurityLog('warn', {
        ip,
        userAgent,
        endpoint: '/api/push/cart-recovery',
        method: 'POST'
      }, 'Cart recovery push failed', { deviceId, stage });
      
      console.error(`❌ Falha ao enviar notificação para ${deviceId}`);
      
      return NextResponse.json({
        success: false,
        error: 'Falha ao enviar notificação push'
      }, { status: 500 });
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('Erro na recuperação de carrinho:', error);
    
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/push/cart-recovery',
      method: 'POST'
    }, `Cart recovery error: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      processingTime
    });

    // Tratamento específico para erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos fornecidos',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao processar recuperação de carrinho'
    }, { status: 500 });
  }
}

// GET: Buscar estatísticas de recuperação de carrinho
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');
    
    if (deviceId) {
      // Buscar dados específicos de um device
      const subscription = await db.pushSubscription.findUnique({
        where: { deviceId },
        select: {
          deviceId: true,
          isActive: true,
          hasPurchased: true,
          pushSent: true,
          pushSentAt: true,
          createdAt: true
        }
      });
      
      if (!subscription) {
        return NextResponse.json({
          error: 'Device não encontrado'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        device: subscription
      });
    }
    
    // Estatísticas gerais de push notifications
    const stats = await db.pushSubscription.groupBy({
      by: ['hasPurchased'],
      _count: {
        id: true
      },
      where: {
        pushSent: true
      }
    });
    
    // Total de usuários que receberam push
    const totalPushUsers = await db.pushSubscription.count({
      where: {
        pushSent: true
      }
    });
    
    // Taxa de conversão
    const convertedUsers = await db.pushSubscription.count({
      where: {
        pushSent: true,
        hasPurchased: true
      }
    });
    
    const conversionRate = totalPushUsers > 0 ? (convertedUsers / totalPushUsers) * 100 : 0;
    
    // Log de consulta
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/push/cart-recovery',
      method: 'GET'
    }, 'Cart recovery stats retrieved', { 
      totalPushUsers,
      convertedUsers,
      conversionRate: Math.round(conversionRate * 100) / 100
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalPushUsers,
        converted: convertedUsers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        breakdown: stats
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas de recuperação:', error);
    
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/push/cart-recovery',
      method: 'GET'
    }, `Cart recovery stats error: ${error.message}`);

    return NextResponse.json({
      error: 'Erro ao buscar estatísticas'
    }, { status: 500 });
  }
}
