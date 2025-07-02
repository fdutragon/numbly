import webpush from 'web-push';
import { db } from '../src/lib/db';

async function main() {
  // Pegue a primeira subscription ativa do banco
  const sub = await db.pushSubscription.findFirst({
    where: { isActive: true },
  });
  if (!sub) {
    console.error('Nenhuma subscription ativa encontrada.');
    process.exit(1);
  }

  const payload = JSON.stringify({
    title: 'Push de Teste',
    body: 'Este é um push enviado localmente via script.',
    url: 'http://localhost:3000',
    icon: '/icon-192x192.svg',
  });

  try {
    // Corrige: sub.subscription é string (JSON), precisa ser objeto PushSubscription
    const pushSub: webpush.PushSubscription = typeof sub.subscription === 'string'
      ? JSON.parse(sub.subscription)
      : sub.subscription;
    await webpush.sendNotification(pushSub, payload);
    console.log('Push enviado com sucesso para', sub.deviceId);
  } catch (err) {
    console.error('Erro ao enviar push:', err);
  }
  process.exit(0);
}

main();
