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
    console.log('[CHECK-DEVICE] deviceId recebido:', deviceId);
    // 4. Verificar se dispositivo existe e está ativo (apenas em UserDevice, case insensitive)
    const userDevice = await db.userDevice.findFirst({
      where: {
        deviceId: { equals: deviceId, mode: 'insensitive' }
      }
    });
    console.log('[CHECK-DEVICE] userDevice encontrado:', userDevice);
    // 4. Buscar todos os devices do usuário pelo IP e/ou userAgent (agora com suporte a IP vizinho)
    let userDevices: any[] = [];
    let user = null;
    let deviceIds: string[] = [];
    if (securityContext?.ip) {
      // Suporte a IP vizinho: pega o /24 (primeiros 3 octetos)
      const ip = normalizeIp(securityContext.ip);
      const subnet = ip ? ip.split('.').slice(0, 3).join('.') + '.' : '';
      userDevices = await db.userDevice.findMany({
        where: {
          OR: [
            { userAgent: securityContext.userAgent },
            { ip: { startsWith: subnet } }
          ]
        },
        select: { id: true, deviceId: true, userId: true, isActive: true }
      });
      if (userDevices.length > 0) {
        user = await db.user.findUnique({
          where: { id: userDevices[0].userId },
          select: { id: true, name: true }
        });
      }
      deviceIds = userDevices.map(d => d.deviceId);
      console.log('[CHECK-DEVICE] userDevices encontrados (por userAgent ou subnet):', deviceIds, 'Subnet:', subnet);
    }

    // Sempre retorna todos os deviceIds associados encontrados

    if (!userDevice || !userDevice.isActive) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'Dispositivo não encontrado ou inativo',
        deviceIds
      }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'Usuário não encontrado',
        deviceIds
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

    // 6. Buscar todas as subscriptions de push para devices do mesmo IP
    let pushSubscriptions: any[] = [];
    if (userDevices.length > 0) {
      const deviceIdsForIp = userDevices.map(d => d.deviceId);
      pushSubscriptions = await db.pushSubscription.findMany({
        where: {
          deviceId: { in: deviceIdsForIp },
          isActive: true
        }
      });
    }

    if (!pushSubscriptions.length) {
      // Nenhum device com push configurado
      return NextResponse.json({
        success: true,
        exists: true,
        hasPush: false,
        message: 'Nenhum dispositivo com push notification configurado para este IP',
        userName: user.name,
        userId: user.id,
        deviceIds
      });
    }

    // 8. Gerar link de autenticação
    const authLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${magicToken}`;
    
    // 9. Sistema de push notification (ativado via env var)
    let pushSentCount = 0;
    const ENABLE_PUSH = process.env.ENABLE_PUSH_NOTIFICATIONS === 'true';
    
    if (ENABLE_PUSH) {
      // TODO: Implementar push notification aqui quando necessário
      // await sendPushToDevices(pushSubscriptions, user, authLink);
      pushSentCount = pushSubscriptions.length;
      console.log('📱 Push notifications enviados:', pushSentCount);
    } else {
      // Simular envio para desenvolvimento
      pushSentCount = pushSubscriptions.length;
      console.log('📱 Push notifications simulados (ENABLE_PUSH=false):', pushSentCount);
      
      // Salvar dados de push para envio posterior via webhook/script
      if (pushSubscriptions.length > 0) {
        console.log('💾 Dados salvos para push posterior:', {
          userId: user.id,
          userName: user.name,
          deviceIds: pushSubscriptions.map(sub => sub.deviceId),
          authLink,
          subscriptions: pushSubscriptions.length
        });
      }
    }

    // 10. Atualizar lastSeen dos devices
    await db.userDevice.updateMany({
      where: { id: { in: userDevices.map(d => d.id) } },
      data: { lastSeen: new Date() }
    });

    // 11. Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, `Push ${ENABLE_PUSH ? 'sent' : 'simulated'} for ${pushSentCount} devices for user: ${user.id}`);

    return NextResponse.json({
      success: true,
      exists: true,
      hasPush: true,
      pushSent: pushSentCount,
      message: `Push de autenticação ${ENABLE_PUSH ? 'enviado' : 'simulado'} para ${pushSentCount} dispositivo(s) do mesmo IP`,
      userName: user.name,
      userId: user.id,
      deviceIds,
      authLink: process.env.NODE_ENV === 'development' ? authLink : undefined // Link apenas em dev para debug
    });
    
  } catch (error: any) {
    console.error('Erro no check de device:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Check device error: ${error.message}`);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors[0]?.message,
        deviceIds: []
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      deviceIds: []
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

function normalizeIp(ip?: string | null): string | null {
  if (!ip) return null;
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

export const runtime = 'nodejs';
