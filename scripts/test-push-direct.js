const webpush = require('web-push');

// Configurar VAPID
const vapidKeys = {
  publicKey: 'BHfjZzoQtHUaLX-jTWO9UgBIRNH6tsmN-axYcDozi_J1yyjQnoOaxhL-6EUm8g6HeZ8eCrQ4haDjI_p9MborGmI',
  privateKey: 'I7WcIWaXxzvfWeOOIu9wvdboOq30v_ofuI3xYnrIWIQ'
};

webpush.setVapidDetails(
  'mailto:contato@numbly.life',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Subscription de teste (você precisa substituir por uma real do DevTools)
const testSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/ENDPOINT_AQUI',
  keys: {
    p256dh: 'KEY_AQUI',
    auth: 'AUTH_AQUI'
  }
};

// Payload de teste
const payload = JSON.stringify({
  title: 'Teste do Numbly!',
  body: 'Se você está vendo isso, o push está funcionando!',
  icon: '/icon-192x192.svg',
  url: '/dashboard'
});

// Enviar push
webpush.sendNotification(testSubscription, payload)
  .then(result => {
    console.log('✅ Push enviado com sucesso:', result.statusCode);
  })
  .catch(error => {
    console.error('❌ Erro ao enviar push:', error);
  });
