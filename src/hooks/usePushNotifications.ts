'use client';

import { useState, useEffect } from 'react';
import { pushService } from '@/lib/push';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se o browser suporta notifications
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    setLoading(true);
    try {
      const granted = await pushService.requestPermission();
      setPermission(Notification.permission);
      setLoading(false);
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setLoading(false);
      return false;
    }
  };

  const subscribe = async () => {
    if (!isSupported || permission !== 'granted') return false;
    
    setLoading(true);
    try {
      // Garantir que o PushService está inicializado
      const initialized = await pushService.initialize();
      if (!initialized) {
        console.error('Falha ao inicializar PushService');
        setLoading(false);
        return false;
      }

      const subscription = await pushService.subscribeToPush();
      setIsSubscribed(!!subscription);
      setLoading(false);
      return !!subscription;
    } catch (error) {
      console.error('Erro ao subscrever:', error);
      setLoading(false);
      return false;
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const success = await pushService.unsubscribeFromPush();
      setIsSubscribed(!success);
      setLoading(false);
      return success;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      setLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    requestPermission,
    subscribe,
    unsubscribe
  };
}
