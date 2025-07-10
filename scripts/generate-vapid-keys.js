const crypto = require('crypto');

function generateVAPIDKeys() {
  const vapidKeys = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  const publicKey = vapidKeys.publicKey.toString('base64url');
  const privateKey = vapidKeys.privateKey.toString('base64url');

  console.log('🔑 VAPID Keys geradas com sucesso!\n');
  console.log('📋 Adicione estas variáveis ao seu .env:\n');
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:your-email@domain.com`);
  console.log('\n✅ Substitua "your-email@domain.com" pelo seu email real\n');
  
  // Criar arquivo .env.example se não existir
  const fs = require('fs');
  const envExample = `# VAPID Keys para Push Notifications
VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=mailto:your-email@domain.com

# Outras variáveis de ambiente
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
RESEND_API_KEY=your_resend_api_key_here
APPMAX_API_KEY=your_appmax_api_key_here
APPMAX_SECRET=your_appmax_secret_here
`;

  try {
    fs.writeFileSync('.env.example', envExample);
    console.log('📝 Arquivo .env.example criado com as VAPID keys!\n');
  } catch (error) {
    console.log('⚠️  Não foi possível criar .env.example, mas as keys foram geradas!\n');
  }

  return {
    publicKey,
    privateKey,
    subject: 'mailto:your-email@domain.com'
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  generateVAPIDKeys();
}

module.exports = { generateVAPIDKeys };
