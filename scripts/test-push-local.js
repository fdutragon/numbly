#!/usr/bin/env node

/**
 * Script de teste para push notifications - Roda em Node.js puro
 * Uso: node scripts/test-push-local.js [deviceId]
 */

const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const db = new PrismaClient();

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'test@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

async function testPushNotification() {
  console.log('🚀 Iniciando teste de push notification...');
  
  try {
    // Pegar deviceId do argumento ou usar o primeiro disponível
    const targetDeviceId = process.argv[2];
    
    let subscription;
    if (targetDeviceId) {
      console.log(`📱 Buscando subscription para deviceId: ${targetDeviceId}`);
      subscription = await db.pushSubscription.findFirst({
        where: {
          deviceId: targetDeviceId,
          isActive: true
        }
      });
    } else {
      console.log('📱 Buscando primeira subscription ativa...');
      subscription = await db.pushSubscription.findFirst({
        where: { isActive: true },
        include: {
          userDevice: true
        }
      });
    }

    if (!subscription) {
      console.error('❌ Nenhuma subscription ativa encontrada.');
      if (targetDeviceId) {
        console.log(`💡 Tente sem especificar deviceId: node scripts/test-push-local.js`);
      }
      process.exit(1);
    }

    console.log('✅ Subscription encontrada:', {
      deviceId: subscription.deviceId,
      endpoint: subscription.subscription.endpoint.substring(0, 50) + '...'
    });

    // Payload do push
    const payload = JSON.stringify({
      title: '🧮 Numbly - Teste Local',
      body: 'Push notification funcionando perfeitamente!',
      icon: '/icon-192x192.svg',
      badge: '/icon-96x96.svg',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      tag: 'test-push',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Abrir App'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ]
    });

    console.log('📤 Enviando push notification...');
    await webpush.sendNotification(subscription.subscription, payload);
    
    console.log('🎉 Push notification enviado com sucesso!');
    console.log('📱 Verifique seu dispositivo para ver a notificação.');
    
  } catch (error) {
    console.error('❌ Erro ao enviar push:', error);
    
    if (error.statusCode === 410) {
      console.log('💡 Subscription expirada, removendo do banco...');
      // Remover subscription inválida
      try {
        await db.pushSubscription.delete({
          where: { id: subscription.id }
        });
        console.log('🗑️ Subscription removida.');
      } catch (deleteError) {
        console.error('Erro ao remover subscription:', deleteError);
      }
    }
  } finally {
    await db.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testPushNotification();
}

module.exports = { testPushNotification };
