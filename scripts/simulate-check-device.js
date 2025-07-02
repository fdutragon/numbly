#!/usr/bin/env node

/**
 * Script para simular o fluxo completo de check-device com push
 * Uso: node scripts/simulate-check-device.js [deviceId]
 */

const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
require('dotenv').config();

const db = new PrismaClient();

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'test@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

function normalizeIp(ip) {
  if (!ip) return null;
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

async function sendPushNotification(subscription, payload) {
  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag || 'auth-push',
    requireInteraction: true
  });
  await webpush.sendNotification(subscription.subscription, pushPayload);
}

async function simulateCheckDevice(targetDeviceId) {
  console.log('🔍 Simulando fluxo completo de check-device...');
  
  try {
    // Usar deviceId fornecido ou buscar um ativo
    let deviceId = targetDeviceId;
    if (!deviceId) {
      const activeDevice = await db.userDevice.findFirst({
        where: { isActive: true }
      });
      if (!activeDevice) {
        console.error('❌ Nenhum device ativo encontrado no banco.');
        process.exit(1);
      }
      deviceId = activeDevice.deviceId;
    }

    console.log(`📱 Testando com deviceId: ${deviceId}`);

    // 1. Verificar se dispositivo existe
    const userDevice = await db.userDevice.findFirst({
      where: {
        deviceId: { equals: deviceId, mode: 'insensitive' }
      }
    });

    if (!userDevice || !userDevice.isActive) {
      console.error('❌ Dispositivo não encontrado ou inativo');
      return;
    }

    console.log('✅ Device encontrado:', {
      id: userDevice.id,
      userId: userDevice.userId,
      deviceName: userDevice.deviceName
    });

    // 2. Buscar usuário
    const user = await db.user.findUnique({
      where: { id: userDevice.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.error('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email
    });

    // 3. Buscar devices por IP (simulando IP local)
    const simulatedIp = '127.0.0.1';
    const subnet = '127.0.0.';
    
    const userDevices = await db.userDevice.findMany({
      where: {
        OR: [
          { userId: user.id },
          { ip: { startsWith: subnet } }
        ]
      },
      select: { id: true, deviceId: true, userId: true, isActive: true }
    });

    console.log(`✅ Encontrados ${userDevices.length} devices relacionados`);

    // 4. Criar magic token
    const magicToken = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await db.magicToken.create({
      data: {
        token: magicToken,
        email: `device_${deviceId}@numbly.local`,
        expiresAt,
        used: false
      }
    });

    console.log('✅ Magic token criado:', magicToken.substring(0, 8) + '...');

    // 5. Buscar push subscriptions
    const deviceIdsForIp = userDevices.map(d => d.deviceId);
    const pushSubscriptions = await db.pushSubscription.findMany({
      where: {
        deviceId: { in: deviceIdsForIp },
        isActive: true
      }
    });

    console.log(`📤 Encontradas ${pushSubscriptions.length} subscriptions para push`);

    if (!pushSubscriptions.length) {
      console.log('⚠️ Nenhuma subscription de push encontrada.');
      return;
    }

    // 6. Gerar link de autenticação
    const authLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify?token=${magicToken}`;
    console.log('🔗 Link de auth gerado:', authLink);

    // 7. Enviar push notifications
    let pushSentCount = 0;
    for (const sub of pushSubscriptions) {
      try {
        await sendPushNotification(sub, {
          title: `Olá, ${user.name}! 🧮`,
          body: 'Toque para acessar sua conta no Numbly',
          url: authLink,
          icon: '/icon-192x192.svg',
          badge: '/icon-96x96.svg',
          tag: 'auth-login'
        });
        pushSentCount++;
        console.log(`✅ Push enviado para device: ${sub.deviceId}`);
      } catch (pushError) {
        console.error(`❌ Erro ao enviar push para ${sub.deviceId}:`, pushError.message);
        
        // Se subscription expirou, remover
        if (pushError.statusCode === 410) {
          await db.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false }
          });
          console.log(`🗑️ Subscription ${sub.deviceId} marcada como inativa`);
        }
      }
    }

    // 8. Atualizar lastSeen dos devices
    await db.userDevice.updateMany({
      where: { id: { in: userDevices.map(d => d.id) } },
      data: { lastSeen: new Date() }
    });

    console.log('🎉 Simulação completa!');
    console.log(`📊 Resultado: ${pushSentCount}/${pushSubscriptions.length} pushes enviados`);
    console.log('📱 Verifique seu dispositivo para ver as notificações.');

    // 9. Testar modo de teste local se configurado
    const testDeviceId = process.env.TEST_PUSH_DEVICE_ID;
    const testIp = process.env.TEST_PUSH_IP;
    
    if (testDeviceId || testIp) {
      console.log('\n🧪 Testando modo de teste local...');
      
      let targetTestDeviceId = testDeviceId;
      if (!targetTestDeviceId && testIp === simulatedIp) {
        const deviceByIp = await db.userDevice.findFirst({
          where: { ip: testIp },
          select: { deviceId: true }
        });
        if (deviceByIp) targetTestDeviceId = deviceByIp.deviceId;
      }
      
      if (targetTestDeviceId && (targetTestDeviceId === deviceId || testIp === simulatedIp)) {
        const testPushSub = await db.pushSubscription.findFirst({
          where: {
            deviceId: targetTestDeviceId,
            isActive: true
          }
        });
        
        if (testPushSub) {
          try {
            await sendPushNotification(testPushSub, {
              title: '🧪 Push de Teste Local',
              body: 'Este é um push de teste enviado para seu PC!',
              url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
              icon: '/icon-192x192.svg',
              badge: '/icon-96x96.svg',
              tag: 'test-push'
            });
            console.log('✅ Push de teste local enviado!');
          } catch (error) {
            console.error('❌ Erro no push de teste:', error.message);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  } finally {
    await db.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const targetDeviceId = process.argv[2];
  simulateCheckDevice(targetDeviceId);
}

module.exports = { simulateCheckDevice };
