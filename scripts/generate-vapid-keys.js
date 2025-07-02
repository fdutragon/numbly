#!/usr/bin/env node

/**
 * Script para gerar VAPID keys automaticamente
 * Uso: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

function generateVapidKeys() {
  console.log('🔑 Gerando VAPID keys...');
  
  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    
    console.log('✅ VAPID keys geradas com sucesso!');
    console.log('\n📋 Copie e cole no seu .env:');
    console.log('');
    console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    console.log(`VAPID_EMAIL=seu-email@example.com`);
    console.log('');
    
    // Tentar atualizar .env automaticamente
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    if (fs.existsSync(envPath)) {
      console.log('🔧 Atualizando .env...');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Atualizar ou adicionar VAPID keys
      if (envContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*/,
          `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`
        );
      } else {
        envContent += `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
      }
      
      if (envContent.includes('VAPID_PRIVATE_KEY=')) {
        envContent = envContent.replace(
          /VAPID_PRIVATE_KEY=.*/,
          `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`
        );
      } else {
        envContent += `\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
      }
      
      if (!envContent.includes('VAPID_EMAIL=')) {
        envContent += `\nVAPID_EMAIL=seu-email@example.com`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env atualizado automaticamente!');
      console.log('⚠️ Não esqueça de configurar VAPID_EMAIL com seu email real.');
      
    } else if (fs.existsSync(envExamplePath)) {
      console.log('📝 Criando .env a partir do .env.example...');
      let envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      envContent = envContent.replace(
        'NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-public-key-aqui',
        `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`
      );
      
      envContent = envContent.replace(
        'VAPID_PRIVATE_KEY=sua-private-key-aqui',
        `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`
      );
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env criado com as novas keys!');
      console.log('⚠️ Configure as demais variáveis no .env conforme necessário.');
      
    } else {
      console.log('⚠️ Nenhum arquivo .env encontrado. Crie manualmente com as keys acima.');
    }
    
    console.log('\n🚀 Próximos passos:');
    console.log('1. Configure VAPID_EMAIL no .env');
    console.log('2. Execute: npm run test:setup');
    console.log('3. Execute: npm run dev');
    console.log('4. Acesse o app e permita notificações');
    console.log('5. Execute: npm run test:push');
    
  } catch (error) {
    console.error('❌ Erro ao gerar VAPID keys:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateVapidKeys();
}

module.exports = { generateVapidKeys };
