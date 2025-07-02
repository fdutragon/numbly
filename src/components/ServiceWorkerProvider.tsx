'use client';

import { useEffect, useRef } from 'react';
import { getOrCreateDeviceId } from '../lib/device-id';

// Variável global para evitar múltiplos registros
let swRegistered = false;

export function ServiceWorkerProvider() {
  const hasRun = useRef(false);
  
  useEffect(() => {
    // Evitar múltiplas execuções no desenvolvimento
    if (hasRun.current || swRegistered) {
      console.log('[SW] Já executado, pulando...');
      return;
    }
    
    hasRun.current = true;

    async function registerSW() {
      try {
        console.log('[SW] Início do processo de registro');

        if (!('serviceWorker' in navigator)) {
          console.warn('[SW] Service Worker não suportado');
          return;
        }

        // Verifica se já existe um SW registrado
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        let registration = existingRegistration;
        if (!registration) {
          // Registra o SW pela primeira vez
          registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: process.env.NODE_ENV === 'development' ? 'all' : 'none',
          });
          console.log('[SW] ✅ Service Worker registrado com sucesso:', registration);
          swRegistered = true;
        } else {
          console.log('[SW] Service Worker já existe, forçando update');
          swRegistered = true;
          await registration.update();
        }

        // Aguarda SW estar pronto
        await navigator.serviceWorker.ready;
        console.log('[SW] Service Worker ativo e controlando');

        // Setup push notifications
        await setupPushNotifications();

        // Monitora atualizações futuras (sem reload automático em desenvolvimento)
        if (process.env.NODE_ENV === 'production' && registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log('[SW] Nova versão do SW encontrada');
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] Nova versão disponível (requer reload manual)');
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('[SW] ❌ Erro ao registrar Service Worker:', error);
      }
    }

    // Helper para converter chave VAPID de Base64 para Uint8Array
    function urlBase64ToUint8Array(base64String: string): Uint8Array {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    async function setupPushNotifications() {
      // Solicitar permissão para notificações
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('[SW] Permissão de notificação:', permission);
        
        if (permission === 'granted') {
          // Criar subscription para push notifications
          const activeRegistration = await navigator.serviceWorker.getRegistration('/');
          if (activeRegistration && 'PushManager' in window) {
            try {
              const applicationServerKey = urlBase64ToUint8Array('BHfjZzoQtHUaLX-jTWO9UgBIRNH6tsmN-axYcDozi_J1yyjQnoOaxhL-6EUm8g6HeZ8eCrQ4haDjI_p9MborGmI');
              const subscription = await activeRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
              });
              
              console.log('[SW] ✅ Push subscription criada:', subscription);
              
              // Enviar subscription para o servidor
              const p256dhKey = subscription.getKey('p256dh');
              const authKey = subscription.getKey('auth');
              
              await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscription: {
                    endpoint: subscription.endpoint,
                    keys: {
                      p256dh: p256dhKey ? btoa(String.fromCharCode(...new Uint8Array(p256dhKey))) : '',
                      auth: authKey ? btoa(String.fromCharCode(...new Uint8Array(authKey))) : ''
                    }
                  }
                })
              });
              
              console.log('[SW] Subscription enviada para o servidor');
            } catch (error) {
              console.error('[SW] Erro ao criar push subscription:', error);
            }
          }
        }
      }
    }

    registerSW();

    (async () => {
      const deviceId = await getOrCreateDeviceId();
      console.log('[DEVICE_ID] DeviceId utilizado:', deviceId);
      // Aqui você pode enviar o deviceId para o backend, associar ao usuário, etc.
    })();
  }, []);

  return null;
}