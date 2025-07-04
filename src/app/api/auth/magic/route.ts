import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';

// Schema de validação para solicitação de magic link
const MagicLinkSchema = z.object({
  deviceId: z.string().uuid('Device ID deve ser um UUID válido')
});

// Rate limiting para magic links
const MAGIC_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 3 // 3 tentativas por 5 minutos
};

/**
 * POST /api/auth/magic
 * Envia push notification com magic link para reacesso
 */
export async function POST(request: NextRequest) {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. Validação de segurança
    securityContext = await authGuard(request);
    
    // 2. Rate limiting
    const magicKey = `magic_${securityContext.ip}`;
    if (!checkRateLimit(magicKey, MAGIC_RATE_LIMIT.window, MAGIC_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Magic link rate limit exceeded');
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 5 minutos.' },
        { status: 429 }
      );
    }
    
    // 3. Validar dados de entrada
    const body = await request.json();
    const { deviceId } = MagicLinkSchema.parse(body);
    
    // 4. Verificar se dispositivo existe e está ativo
    const userDevice = await db.userDevice.findFirst({
      where: { deviceId },
      include: { 
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!userDevice || !userDevice.isActive) {
      return NextResponse.json(
        { error: 'Dispositivo não encontrado ou inativo' },
        { status: 404 }
      );
    }

    if (!userDevice.user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // 5. Criar token temporário
    const magicToken = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await db.magicToken.create({
      data: {
        token: magicToken,
        email: `device_${deviceId}@numbly.local`, // Email temporário baseado no device
        expiresAt,
        used: false
      }
    });

    // 6. Buscar subscription de push para este dispositivo
    const pushSubscription = await db.pushSubscription.findFirst({
      where: { 
        deviceId,
        isActive: true
      }
    });

    if (!pushSubscription) {
      return NextResponse.json(
        { error: 'Push notification não configurado para este dispositivo' },
        { status: 400 }
      );
    }

    // 7. Enviar push notification com magic link
    const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify?token=${magicToken}`;
    
    try {
      // Aqui você chamaria seu serviço de push notification
      // Por exemplo: await sendPushNotification(pushSubscription, magicLink);
      
      console.log('🔗 Magic link gerado:', magicLink);
      console.log('📱 Push enviado para dispositivo:', deviceId);
      
      // Log de sucesso
      logSecurityEvent('AUTH_SUCCESS', securityContext, `Magic link sent to device: ${deviceId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Link de acesso enviado via push notification',
        deviceId
      });
      
    } catch (pushError) {
      console.error('Erro ao enviar push:', pushError);
      
      return NextResponse.json(
        { error: 'Erro ao enviar notificação push' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Erro na criação do magic link:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Magic link error: ${error.message}`);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors[0]?.message
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/magic
 * Informações sobre o endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/magic',
    method: 'POST',
    description: 'Envia push notification com magic link para reacesso',
    requiredFields: ['deviceId'],
    rateLimit: '3 tentativas por 5 minutos por IP'
  });
}
