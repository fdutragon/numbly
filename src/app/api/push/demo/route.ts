import { NextRequest, NextResponse } from 'next/server';

// Importação dinâmica para funcionar em Node (não Edge)
let webpush: typeof import('web-push') | undefined;
(async () => {
  try {
    const mod = await import('web-push');
    webpush = mod.default || mod;
  } catch {
    webpush = undefined;
  }
})();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT!;

if (webpush) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    if (!webpush) {
      return NextResponse.json({ error: 'web-push não disponível no runtime atual' }, { status: 500 });
    }
    const { subscription, recovery } = await req.json();
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription não enviada' }, { status: 400 });
    }

    // Se recovery=true, dispara 5 pushs com delays progressivos (em background)
    if (recovery) {
      const messages = [
        { delay: 0, title: '🛒 Esqueceu algo?', body: 'Você estava quase finalizando sua compra da Donna AI. Que tal terminar agora?' },
        { delay: 5 * 60 * 1000, title: '💔 Sentimos sua falta!', body: 'A Donna AI está esperando por você. Finalize sua compra e transforme seu negócio hoje!' },
        { delay: 30 * 60 * 1000, title: '🔥 Oferta especial!', body: 'Últimas horas para garantir a Donna AI com desconto especial. Não perca!' },
        { delay: 2 * 60 * 60 * 1000, title: '⏰ Última chance!', body: 'Sua oportunidade de ter a Donna AI está acabando. Finalize agora!' },
        { delay: 24 * 60 * 60 * 1000, title: '🎯 Volte e ganhe!', body: 'Que tal uma nova chance? A Donna AI pode revolucionar suas vendas ainda hoje!' }
      ];
      messages.forEach(({ delay, title, body }, idx) => {
        setTimeout(() => {
          webpush!.sendNotification(subscription, JSON.stringify({
            title,
            body,
            icon: '/icons/icon.svg',
            tag: `cart-recovery-${idx+1}`,
            requireInteraction: true
          })).catch(() => {});
        }, delay);
      });
      return NextResponse.json({ success: true, recovery: true });
    }

    // Push demo único
    const payload = JSON.stringify({
      title: 'Demo Donna AI',
      body: 'Esta é uma notificação real enviada via Web Push!',
      icon: '/icons/icon.svg',
      tag: 'demo-notification',
      requireInteraction: true
    });

    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 });
  }
}
