/**
 * Sistema de Push Notifications - Implementação Futura
 * 
 * Este arquivo contém a lógica completa para push notifications
 * que pode ser ativada quando necessário.
 * 
 * Para ativar:
 * 1. Instalar: npm install web-push
 * 2. Configurar VAPID keys no .env
 * 3. Definir ENABLE_PUSH_NOTIFICATIONS=true no .env
 * 4. Importar e usar as funções deste arquivo no route.ts
 */

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

interface PushSubscription {
  id: string;
  deviceId: string;
  subscription: any;
  isActive: boolean;
}

/**
 * Configurar web-push com VAPID keys
 */
export async function configurePush() {
  // Dynamic import para evitar erro de build
  const webpush = (await import('web-push')).default;
  
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'test@example.com'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  );
  
  return webpush;
}

/**
 * Enviar push notification para uma subscription
 */
export async function sendPushNotification(subscription: PushSubscription, payload: PushPayload) {
  try {
    const webpush = await configurePush();
    const pushPayload = JSON.stringify(payload);
    
    await webpush.sendNotification(subscription.subscription, pushPayload);
    console.log('🚀 Push enviado para deviceId:', subscription.deviceId);
    return true;
  } catch (error) {
    console.error('Erro ao enviar push para', subscription.deviceId, ':', error);
    return false;
  }
}

/**
 * Enviar push para múltiplos devices
 */
export async function sendPushToDevices(
  subscriptions: PushSubscription[], 
  user: { id: string; name: string }, 
  authLink: string
) {
  let sentCount = 0;
  
  for (const sub of subscriptions) {
    const success = await sendPushNotification(sub, {
      title: `Olá, ${user.name}!`,
      body: 'Toque para acessar sua conta',
      url: authLink,
      icon: '/icon-192x192.svg'
    });
    
    if (success) sentCount++;
  }
  
  console.log(`📱 Push enviado para ${sentCount}/${subscriptions.length} dispositivos`);
  return sentCount;
}

/**
 * Enviar push de teste local
 */
export async function sendTestPush(deviceId: string, subscription: PushSubscription) {
  return await sendPushNotification(subscription, {
    title: 'Push de Teste Local',
    body: 'Este é um push de teste enviado para seu PC!',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    icon: '/icon-192x192.svg'
  });
}

/**
 * Verificar se deve enviar push de teste
 */
export function shouldSendTestPush(deviceId: string, ip?: string): boolean {
  const testDeviceId = process.env.TEST_PUSH_DEVICE_ID;
  const testIp = process.env.TEST_PUSH_IP;
  
  if (testDeviceId && deviceId === testDeviceId) return true;
  if (testIp && ip === testIp) return true;
  
  return false;
}

/**
 * Exemplo de como usar no route.ts:
 * 
 * import { sendPushToDevices, shouldSendTestPush, sendTestPush } from '@/lib/push-future';
 * 
 * // No handler do route.ts:
 * if (ENABLE_PUSH) {
 *   // Push normal
 *   pushSentCount = await sendPushToDevices(pushSubscriptions, user, authLink);
 *   
 *   // Push de teste se aplicável
 *   if (shouldSendTestPush(deviceId, securityContext.ip)) {
 *     const testSub = pushSubscriptions.find(s => s.deviceId === deviceId);
 *     if (testSub) {
 *       await sendTestPush(deviceId, testSub);
 *     }
 *   }
 * }
 */
