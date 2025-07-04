// --- ATENÇÃO: Este arquivo só deve ser importado em API routes ou scripts server-side ---
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@numbly.life';

  console.log('[VAPID] Configurando VAPID:', { VAPID_SUBJECT, hasPublicKey: !!VAPID_PUBLIC_KEY, hasPrivateKey: !!VAPID_PRIVATE_KEY });

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys are not set in environment variables');
  }

  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  
  vapidConfigured = true;
}

export interface SendPushOptions {
  subscription: PushSubscription;
  payload: string;
}

export async function sendPush({ subscription, payload }: SendPushOptions): Promise<boolean> {
  try {
    ensureVapidConfigured();
    console.log('[PUSH] Enviando push notification...', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      payloadSize: payload.length
    });
    
    const result = await webpush.sendNotification(subscription, payload);
    console.log('[PUSH] Push enviado com sucesso:', result.statusCode);
    return true;
  } catch (error) {
    console.error('[PUSH] Erro ao enviar push notification:', {
      error: error instanceof Error ? error.message : error,
      subscription: subscription.endpoint.substring(0, 50) + '...',
      payloadPreview: payload.substring(0, 100) + '...'
    });
    return false;
  }
}
