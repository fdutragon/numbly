// --- ATENÇÃO: Este arquivo só deve ser importado em API routes ou scripts server-side ---
import webpush from 'web-push';

// Configuração do VAPID para Web Push
if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('Web Push não configurado. Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY');
}

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'test@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

interface PushOptions {
  subscription: any;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

export async function sendPush({ subscription, title, body, url, icon, tag }: PushOptions) {
  try {
    // Garante que subscription é um objeto, não string
    const pushSub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: icon || '/icon-192x192.svg',
      tag: tag || 'default'
    });

    await webpush.sendNotification(pushSub, payload);
    return true;
  } catch (error) {
    console.error('Erro ao enviar push:', error);
    return false;
  }
}
