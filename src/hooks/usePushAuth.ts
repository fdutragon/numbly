'use client';

import { useState, useEffect, useCallback } from 'react';

// 🔑 VAPID Keys - Colocar no .env em produção
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'BNxNcSEGSMFHxXdU9wW3xrSJdCqxQCqsJLXqNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdULXJNYR_lzCdU';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationHook {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  permission: NotificationPermission;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

export function usePushNotifications(): PushNotificationHook {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // 🔍 Verificar suporte inicial
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        checkExistingSubscription();
      }
    };

    checkSupport();
  }, []);

  // 📋 Verificar se já existe uma subscription
  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      
      if (subscription) {
        // Verificar se a subscription ainda é válida no servidor
        const response = await fetch('/api/push/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
        
        if (!response.ok) {
          // Subscription inválida, remover
          await subscription.unsubscribe();
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar subscription:', error);
    }
  }, []);

  // 🔔 Solicitar permissão
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications não são suportadas neste navegador');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      throw error;
    }
  }, [isSupported]);

  // ✅ Fazer subscription
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications não são suportadas');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Solicitar permissão se necessário
      let currentPermission = permission;
      if (currentPermission === 'default') {
        currentPermission = await requestPermission();
      }

      if (currentPermission !== 'granted') {
        throw new Error('Permissão de notificação negada');
      }

      // 2. Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Fazer subscription para push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 4. Enviar subscription para o servidor
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar subscription no servidor');
      }

      setIsSubscribed(true);
      console.log('✅ Push notifications ativadas com sucesso!');
      return true;

    } catch (error: any) {
      console.error('❌ Erro ao ativar push notifications:', error);
      setError(error.message);
      setIsSubscribed(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission]);

  // ❌ Cancelar subscription
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remover do servidor
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
      }
      
      setIsSubscribed(false);
      console.log('🔇 Push notifications desativadas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao desativar push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 🧪 Enviar notificação de teste
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) {
      throw new Error('Não está inscrito para push notifications');
    }

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEST',
          title: '🔮 Teste do Oráculo',
          body: 'Suas notificações estão funcionando perfeitamente! ✨',
          data: { url: '/dashboard' }
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar notificação de teste');
      }

      console.log('📤 Notificação de teste enviada!');
    } catch (error) {
      console.error('❌ Erro ao enviar teste:', error);
      throw error;
    }
  }, [isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission
  };
}

// 🛠️ Utilitários
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
