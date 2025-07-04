// --- ATENÇÃO: Este arquivo só deve ser importado em API routes ou scripts server-side ---
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.PUSH_NOTIFICATION_EMAIL || 'mailto:contato@numbly.life';

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
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    return false;
  }
}
