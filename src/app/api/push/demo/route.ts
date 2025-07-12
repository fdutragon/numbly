import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Forçar uso do Node.js runtime
export const runtime = 'nodejs';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:your-email@domain.com';

// Configurar VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web-push configurado com VAPID keys');
} else {
  console.error('❌ VAPID keys ausentes. PUBLIC:', !!VAPID_PUBLIC_KEY, 'PRIVATE:', !!VAPID_PRIVATE_KEY);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log('🚀 Push Demo endpoint chamado');
  
  try {
    console.log('📋 Verificando VAPID keys...');
    console.log('VAPID_PUBLIC_KEY exists:', !!VAPID_PUBLIC_KEY);
    console.log('VAPID_PRIVATE_KEY exists:', !!VAPID_PRIVATE_KEY);
    console.log('VAPID_SUBJECT:', VAPID_SUBJECT);
    
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('❌ VAPID keys missing');
      return NextResponse.json({ 
        error: 'VAPID keys ausentes no backend',
        debug: {
          hasPublicKey: !!VAPID_PUBLIC_KEY,
          hasPrivateKey: !!VAPID_PRIVATE_KEY,
          subject: VAPID_SUBJECT,
          env: process.env.NODE_ENV
        }
      }, { status: 500 });
    }
    
    console.log('📦 Parsing request body...');
    const { subscription, recovery } = await req.json();
    console.log('Subscription endpoint:', subscription?.endpoint?.substring(0, 50) + '...');
    
    if (!subscription) {
      console.error('❌ No subscription provided');
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
          })).catch((err) => {
            console.error('Erro ao enviar push recovery:', err);
          });
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

    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      console.error('Erro ao enviar push demo:', err);
      if (err instanceof Error) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
      return new Response(JSON.stringify({ error: 'Erro desconhecido ao enviar push' }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Erro geral no endpoint push/demo:', error);
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    return new Response(JSON.stringify({ error: 'Erro desconhecido' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
