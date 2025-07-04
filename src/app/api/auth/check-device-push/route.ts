import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import { createToken } from '@/lib/auth';
import { sendPush } from '@/lib/push-server';

const CheckDeviceSchema = z.object({
  deviceId: z.string().uuid('Device ID deve ser um UUID válido'),
});

const CHECK_DEVICE_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 5, // 5 verificações por minuto
};

function normalizeIp(ip?: string | null): string | null {
  if (!ip) return null;
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let securityContext: any;
  try {
    const body = await req.json();
    securityContext = await authGuard(req);
    const checkKey = `check_device_${securityContext.ip}`;
    if (!checkRateLimit(checkKey, CHECK_DEVICE_RATE_LIMIT.window, CHECK_DEVICE_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Check device rate limit exceeded');
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 minuto.' }, { status: 429 });
    }
    const { deviceId } = CheckDeviceSchema.parse(body);
    const normalizedIp = securityContext?.ip ? normalizeIp(securityContext.ip) : null;
    let userDevices: any[] = [];
    let deviceIds: string[] = [];
    if (normalizedIp) {
      userDevices = await db.userDevice.findMany({
        where: { isActive: true, ip: normalizedIp },
        select: { id: true, deviceId: true, userId: true, isActive: true },
      });
      deviceIds = userDevices.map((d) => d.deviceId);
    }
    if (!userDevices.length) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'Nenhum device ativo encontrado para este IP',
        deviceIds: [],
      }, { status: 404 });
    }
    const pushSubscriptions = await db.pushSubscription.findMany({
      where: { deviceId: { in: deviceIds }, isActive: true },
    });
    if (!pushSubscriptions.length) {
      return NextResponse.json({
        success: true,
        exists: true,
        hasPush: false,
        message: 'Nenhum dispositivo com push notification configurado para este IP',
        deviceIds,
      });
    }
    const token = randomUUID();
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (process.env.NODE_ENV === 'development' || baseUrl?.includes('localhost')) {
      baseUrl = 'http://localhost:3000';
    }
    const fallbackLink = `${baseUrl}/dashboard`;
    let userName = '';
    let jwt: string | undefined = undefined;
    if (userDevices.length > 0 && userDevices[0].userId) {
      const user = await db.user.findUnique({
        where: { id: userDevices[0].userId },
        select: { name: true, email: true, id: true },
      });
      userName = user?.name || '';
      jwt = await createToken({
        userId: userDevices[0].userId,
        email: user?.email || '',
        nome: user?.name || '',
        deviceId: userDevices[0].deviceId,
      });
    }
    let pushSentCount = 0;
    for (const sub of pushSubscriptions) {
      try {
        await sendPush({
          subscription: typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription,
          payload: JSON.stringify({
            title: userName ? `Olá, ${userName}! Acesse o Numbly!` : `Acesse o Numbly!`,
            body: 'Toque para acessar automaticamente o Numbly.',
            url: fallbackLink,
            icon: '/icon-192x192.svg',
            jwt,
          }),
        });
        pushSentCount++;
      } catch (pushError) {
        console.error('Erro ao enviar push automático:', pushError);
      }
    }
    await db.userDevice.updateMany({
      where: { id: { in: userDevices.map((d) => d.id) } },
      data: { lastSeen: new Date() },
    });
    logSecurityEvent('AUTH_SUCCESS', securityContext, `Auto-push sent to ${pushSentCount} devices for IP: ${normalizedIp}`);
    
    const response = NextResponse.json({
      success: true,
      exists: true,
      hasPush: true,
      pushSent: pushSentCount,
      message: `Push de autenticação enviado para ${pushSentCount} dispositivo(s) do mesmo IP`,
      deviceIds,
      token,
      authLink: fallbackLink,
      userName,
    });

    // Definir cookie de autenticação se temos JWT
    if (jwt) {
      response.cookies.set('auth-token', jwt, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 604800, // 7 dias
      });
    }

    return response;
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
        deviceIds: [],
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      deviceIds: [],
    }, { status: 500 });
  }
}
