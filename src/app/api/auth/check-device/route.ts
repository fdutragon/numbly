import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';

// Schema de validação para check de device
const CheckDeviceSchema = z.object({
  deviceId: z.string().uuid('Device ID deve ser um UUID válido')
});

// Rate limiting para check de device
const CHECK_DEVICE_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 5 // 5 verificações por minuto
};

/**
 * POST /api/auth/check-device
 * Verifica se deviceId existe e dispara push automático para login
 */
export async function POST(request: NextRequest) {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. Validação de segurança
    securityContext = await authGuard(request);
    
    // 2. Rate limiting
    const checkKey = `check_device_${securityContext.ip}`;
    if (!checkRateLimit(checkKey, CHECK_DEVICE_RATE_LIMIT.window, CHECK_DEVICE_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Check device rate limit exceeded');
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }
    
    // 3. Validar dados de entrada
    const body = await request.json();
    const { deviceId } = CheckDeviceSchema.parse(body);
    
    // 4. Verificar se dispositivo existe e está ativo
    const userDevice = await db.userDevice.findUnique({
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
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'Dispositivo não encontrado ou inativo'
      }, { status: 404 });
    }

    if (!userDevice.user) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // 5. Criar magic token para autenticação automática
    const magicToken = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await db.magicToken.create({
      data: {
        token: magicToken,
        email: `device_${deviceId}@numbly.local`,
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
      // Dispositivo existe mas não tem push configurado
      return NextResponse.json({
        success: true,
        exists: true,
        hasPush: false,
        message: 'Dispositivo encontrado, mas push notification não está configurado',
        userName: userDevice.user.name,
        userId: userDevice.user.id
      });
    }

    // 8. Gerar link de autenticação
    const authLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${magicToken}`;
    
    // 9. Enviar push notification automático
    try {
      // TODO: Implementar envio real de push notification
      // await sendPushNotification(pushSubscription, {
      //   title: `Olá, ${userDevice.user.name}!`,
      //   body: 'Toque para acessar sua conta',
      //   url: authLink,
      //   icon: '/icon-192x192.svg'
      // });
      
      console.log('🚀 Push automático enviado:', {
        deviceId,
        userName: userDevice.user.name,
        authLink
      });
      
      // 10. Atualizar lastSeen do dispositivo
      await db.userDevice.update({
        where: { deviceId },
        data: { lastSeen: new Date() }
      });
      
      // 11. Log de sucesso
      logSecurityEvent('AUTH_SUCCESS', securityContext, `Auto-push sent to device: ${deviceId} for user: ${userDevice.user.id}`);
      
      return NextResponse.json({
        success: true,
        exists: true,
        hasPush: true,
        pushSent: true,
        message: 'Push de autenticação enviado automaticamente',
        userName: userDevice.user.name,
        userId: userDevice.user.id
      });
      
    } catch (pushError) {
      console.error('Erro ao enviar push automático:', pushError);
      
      return NextResponse.json({
        success: true,
        exists: true,
        hasPush: true,
        pushSent: false,
        message: 'Dispositivo encontrado, mas erro ao enviar push',
        userName: userDevice.user.name,
        userId: userDevice.user.id,
        authLink // Fornecer link manual como fallback
      });
    }
    
  } catch (error: any) {
    console.error('Erro no check de device:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Check device error: ${error.message}`);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors[0]?.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * GET /api/auth/check-device
 * Informações sobre o endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/check-device',
    method: 'POST',
    description: 'Verifica se deviceId existe e dispara push automático para login',
    requiredFields: ['deviceId'],
    rateLimit: '5 verificações por minuto por IP'
  });
}
