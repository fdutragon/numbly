#!/usr/bin/env node

/**
 * Script para configurar dados de teste no banco
 * Cria usuário demo, device e subscription para testes
 */

const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
require('dotenv').config();

const db = new PrismaClient();

async function setupTestData() {
  console.log('🔧 Configurando dados de teste...');
  
  try {
    // 1. Criar ou buscar usuário de teste
    let testUser = await db.user.findFirst({
      where: { email: 'teste@numbly.life' }
    });

    if (!testUser) {
      testUser = await db.user.create({
        data: {
          name: 'Usuário de Teste',
          email: 'teste@numbly.life',
          birthDate: new Date('1990-01-01'),
          isPremium: false,
          numerologyData: {
            numeroDestino: 7,
            numeroAlma: 3,
            numeroExpressao: 5,
            numeroPersonalidadeExterna: 2,
            numeroMotivacao: 1,
            numeroImpressao: 8
          }
        }
      });
      console.log('✅ Usuário de teste criado:', testUser.email);
    } else {
      console.log('✅ Usuário de teste encontrado:', testUser.email);
    }

    // 2. Criar device de teste
    const testDeviceId = process.env.TEST_PUSH_DEVICE_ID || randomUUID();
    
    let testDevice = await db.userDevice.findFirst({
      where: { deviceId: testDeviceId }
    });

    if (!testDevice) {
      testDevice = await db.userDevice.create({
        data: {
          userId: testUser.id,
          deviceId: testDeviceId,
          deviceName: 'PC Teste Local',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/Test',
          platform: 'desktop',
          ip: '127.0.0.1',
          isActive: true
        }
      });
      console.log('✅ Device de teste criado:', testDeviceId);
    } else {
      await db.userDevice.update({
        where: { id: testDevice.id },
        data: {
          userId: testUser.id,
          isActive: true,
          ip: '127.0.0.1',
          lastSeen: new Date()
        }
      });
      console.log('✅ Device de teste atualizado:', testDeviceId);
    }

    // 3. Subscription de exemplo (você precisa registrar uma real via browser)
    const existingSubscription = await db.pushSubscription.findFirst({
      where: { deviceId: testDeviceId }
    });

    if (!existingSubscription) {
      console.log('⚠️ Nenhuma push subscription encontrada para este device.');
      console.log('📱 Para testar push notifications:');
      console.log('   1. Acesse seu app no browser');
      console.log('   2. Permita notificações quando solicitado');
      console.log('   3. O deviceId será:', testDeviceId);
      console.log('\n💡 Ou use um deviceId existente com: node scripts/test-push-local.js [deviceId]');
    } else {
      console.log('✅ Push subscription encontrada para device:', testDeviceId);
    }

    // 4. Mostrar resumo
    console.log('\n📊 Resumo dos dados de teste:');
    console.log(`   👤 Usuário: ${testUser.name} (${testUser.email})`);
    console.log(`   📱 Device ID: ${testDeviceId}`);
    console.log(`   🏠 IP Local: 127.0.0.1`);
    
    // Listar todos os devices ativos
    const allDevices = await db.userDevice.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true } },
        pushSubscriptions: { where: { isActive: true } }
      }
    });

    console.log('\n📱 Devices ativos encontrados:');
    allDevices.forEach(device => {
      console.log(`   • ${device.deviceId} (${device.user.name}) - ${device.pushSubscriptions.length} subscription(s)`);
    });

    // 5. Configurar variáveis de ambiente
    console.log('\n🔧 Para testes locais, adicione ao seu .env:');
    console.log(`TEST_PUSH_DEVICE_ID=${testDeviceId}`);
    console.log(`TEST_PUSH_IP=127.0.0.1`);

  } catch (error) {
    console.error('❌ Erro ao configurar dados de teste:', error);
  } finally {
    await db.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData };
