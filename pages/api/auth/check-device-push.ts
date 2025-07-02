// --- CORREÇÃO: Garante que webpush NUNCA vaze para client/app ---
// Este arquivo é uma API route (Pages Router), seguro para Node.js-only
// Nunca importe webpush, crypto, ou db em hooks, components ou libs usadas no client/app
// Se precisar de push no client, sempre chame esta rota via fetch/AJAX
// ---

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { db } from '../../../src/lib/db';
import { randomUUID } from 'crypto';
import { authGuard, logSecurityEvent, checkRateLimit } from '../../../src/lib/security/auth-guard';
import type { SecurityContext } from '../../../src/lib/security/auth-guard';

// Schema de validação para check de device
const CheckDeviceSchema = z.object({
  deviceId: z.string().uuid('Device ID deve ser um UUID válido')
});

// Rate limiting para check de device
const CHECK_DEVICE_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 5 // 5 verificações por minuto
};

function normalizeIp(ip?: string | null): string | null {
  if (!ip) return null;
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

async function sendPushNotification(subscription: any, payload: { title: string; body: string; url?: string; icon?: string }) {
  // Importa web-push dinamicamente para garantir que nunca vaze para client/app
  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'test@example.com'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  );
  // Garante que subscription é objeto, não string
  const pushSub = typeof subscription.subscription === 'string'
    ? JSON.parse(subscription.subscription)
    : subscription.subscription;
  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    icon: payload.icon
  });
  await webpush.sendNotification(pushSub, pushPayload);
}

/**
 * POST /api/auth/check-device-push
 * Verifica se deviceId existe e dispara push automático para login (Pages Router)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let securityContext: SecurityContext | undefined;
  
  // LOG DETALHADO DO BODY PARA DEBUG
  console.log('[CHECK-DEVICE-PUSH] req.body recebido:', req.body);

  try {
    // Converter NextApiRequest para formato esperado pelo authGuard
    const mockRequest = {
      headers: {
        get: (key: string) => {
          const k = key.toLowerCase();
          const value = req.headers[k];
          if (Array.isArray(value)) return value[0];
          return value;
        }
      },
      json: async () => req.body,
      url: req.url || '',
      method: req.method || 'POST',
      nextUrl: { pathname: req.url || '' }
    } as any;

    // 1. Validação de segurança
    securityContext = await authGuard(mockRequest);
    
    // 2. Rate limiting
    const checkKey = `check_device_${securityContext.ip}`;
    if (!checkRateLimit(checkKey, CHECK_DEVICE_RATE_LIMIT.window, CHECK_DEVICE_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Check device rate limit exceeded');
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 1 minuto.' });
    }
    
    // 3. Validar dados de entrada
    const { deviceId } = CheckDeviceSchema.parse(req.body);
    console.log('[CHECK-DEVICE-PUSH] deviceId recebido:', deviceId);

    // 4. Buscar todos os devices ativos do mesmo subnet/IP do request
    let userDevices: any[] = [];
    let deviceIds: string[] = [];
    let user = null;
    if (securityContext?.ip) {
      const ip = normalizeIp(securityContext.ip);
      const subnet = ip ? ip.split('.').slice(0, 3).join('.') + '.' : '';
      userDevices = await db.userDevice.findMany({
        where: {
          isActive: true,
          ip: { startsWith: subnet }
        },
        select: { id: true, deviceId: true, userId: true, isActive: true }
      });
      deviceIds = userDevices.map(d => d.deviceId);
      console.log('[CHECK-DEVICE-PUSH] Devices ativos do mesmo subnet:', deviceIds, 'Subnet:', subnet);
      if (userDevices.length > 0) {
        user = await db.user.findUnique({
          where: { id: userDevices[0].userId },
          select: { id: true, name: true }
        });
      }
    }
    if (!userDevices.length) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Nenhum device ativo encontrado para este IP/subnet',
        deviceIds: []
      });
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Usuário não encontrado para este IP/subnet',
        deviceIds
      });
    }

    // Buscar todas as subscriptions de push para devices do mesmo IP/subnet
    const pushSubscriptions = await db.pushSubscription.findMany({
      where: {
        deviceId: { in: deviceIds },
        isActive: true
      }
    });
    if (!pushSubscriptions.length) {
      return res.json({
        success: true,
        exists: true,
        hasPush: false,
        message: 'Nenhum dispositivo com push notification configurado para este IP/subnet',
        userName: user.name,
        userId: user.id,
        deviceIds
      });
    }

    // 6. Autenticar imediatamente e gerar token JWT
    const token = await (await import('../../../src/lib/auth')).createToken({
      userId: user.id,
      deviceId: deviceIds[0],
      nome: user.name || ''
    });

    // 7. Enviar push notification automático para todos os devices do usuário (link direto para dashboard)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`;
    let pushSentCount = 0;
    
    for (const sub of pushSubscriptions) {
      try {
        await sendPushNotification(sub, {
          title: `Olá, ${user.name}!`,
          body: 'Toque para acessar o Numbly',
          url: dashboardUrl,
          icon: '/icon-192x192.svg'
        });
        pushSentCount++;
        console.log('🚀 Push automático enviado:', {
          deviceId: sub.deviceId,
          userName: user.name,
          dashboardUrl
        });
      } catch (pushError) {
        console.error('Erro ao enviar push automático:', pushError);
      }
    }

    // 8. Atualizar lastSeen dos devices
    await db.userDevice.updateMany({
      where: { id: { in: userDevices.map(d => d.id) } },
      data: { lastSeen: new Date() }
    });

    // 9. Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, `Auto-push sent to ${pushSentCount} devices for user: ${user.id}`);

    // 10. Resposta com cookie seguro
    const response = res.json({
      success: true,
      exists: true,
      hasPush: true,
      pushSent: pushSentCount,
      message: `Push de autenticação enviado para ${pushSentCount} dispositivo(s) do mesmo IP`,
      userName: user.name,
      userId: user.id,
      deviceIds,
      token
    });

    res.setHeader('Set-Cookie', [
      `auth-token=${token}; HttpOnly; Path=/; SameSite=Strict; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} Max-Age=${7 * 24 * 60 * 60}`
    ]);

    return response;
    
  } catch (error: any) {
    console.error('Erro no check de device:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Check device error: ${error.message}`);
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors[0]?.message,
        deviceIds: []
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      deviceIds: []
    });
  }
}