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
import { generateToken } from '../../../src/lib/security/jwt';

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

async function sendPushNotification(subscription: any, payload: { title: string; body: string; url?: string; icon?: string; jwt?: string }) {
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
    icon: payload.icon,
    jwt: payload.jwt // Inclui JWT se fornecido
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

    // 4. Buscar todos os devices ativos do IP (não precisa buscar user)
    let userDevices: any[] = [];
    let deviceIds: string[] = [];
    let normalizedIp = securityContext?.ip ? normalizeIp(securityContext.ip) : null;
    if (normalizedIp) {
      userDevices = await db.userDevice.findMany({
        where: {
          isActive: true,
          ip: normalizedIp
        },
        select: { id: true, deviceId: true, userId: true, isActive: true }
      });
      deviceIds = userDevices.map(d => d.deviceId);
    }
    if (!userDevices.length) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Nenhum device ativo encontrado para este IP',
        deviceIds: []
      });
    }
    // Buscar todas as subscriptions de push para devices do mesmo IP
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
        message: 'Nenhum dispositivo com push notification configurado para este IP',
        deviceIds
      });
    }
    // 6. Gerar token simples (UUID) para uso manual caso necessário (backup)
    const token = randomUUID();
    
    // 6.1. Gerar link base para casos onde o JWT não funcionar
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (process.env.NODE_ENV === 'development' || baseUrl?.includes('localhost')) {
      baseUrl = 'http://localhost:3000';
    }
    const fallbackLink = `${baseUrl}/dashboard`; // Link sem token
    // Buscar nome do usuário para personalizar o push
    let userName = '';
    let jwt: string | undefined = undefined;
    if (userDevices.length > 0 && userDevices[0].userId) {
      const user = await db.user.findUnique({
        where: { id: userDevices[0].userId },
        select: { name: true, email: true, id: true }
      });
      userName = user?.name || '';
      // Gerar JWT válido para o usuário
      jwt = generateToken({
        userId: userDevices[0].userId,
        email: user?.email || '',
        nome: user?.name || '',
        deviceId: userDevices[0].deviceId
      });
    }
    let pushSentCount = 0;
    for (const sub of pushSubscriptions) {
      try {
        await sendPushNotification(sub, {
          title: userName ? `Olá, ${userName}! Acesse o Numbly!` : `Acesse o Numbly!`,
          body: 'Toque para acessar automaticamente o Numbly.',
          url: fallbackLink, // Link sem token, apenas para fallback
          icon: '/icon-192x192.svg',
          jwt // JWT que fará a autenticação automática
        });
        pushSentCount++;
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
    logSecurityEvent('AUTH_SUCCESS', securityContext, `Auto-push sent to ${pushSentCount} devices for IP: ${normalizedIp}`);
    // 10. Resposta (não retorna mais o token ou link para evitar uso manual)
    const response = res.json({
      success: true,
      exists: true,
      hasPush: true,
      pushSent: pushSentCount,
      message: `Push de autenticação enviado para ${pushSentCount} dispositivo(s). Clique na notificação para entrar automaticamente.`,
      deviceIds,
      userName // retorna para uso opcional no front
    });
    res.setHeader('Set-Cookie', []); // Não seta cookie de auth
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