// --- ATENÇÃO: Nunca importe webpush no topo deste arquivo! ---
// Toda lógica de push server deve ser feita em API routes/scripts
// Este arquivo só pode conter código client-safe (Service Worker, subscribe, etc)
// ---

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export class PushService {
  private static instance: PushService;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): PushService {
    if (!PushService.instance) {
      PushService.instance = new PushService();
    }
    return PushService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este browser não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker não suportado');
      return null;
    }

    try {
      console.log('Tentando registrar Service Worker no caminho:', '/sw.js');
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', this.registration);
      return this.registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return null;
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Enviar subscription para o servidor
      const subscriptionData = {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
            auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
          }
        },
        deviceId: this.generateDeviceId(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      return subscription;
    } catch (error) {
      console.error('Erro ao subscrever push:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      return;
    }

    await this.registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    });
  }

  private generateDeviceId(): string {
    // Gerar ID único do dispositivo baseado em características do browser
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('numbly-fingerprint', 10, 50);
    const canvasFingerprint = canvas.toDataURL();
    
    const deviceInfo = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvasFingerprint.slice(-50) // Últimos 50 chars
    ].join('|');
    
    // Hash simples
    let hash = 0;
    for (let i = 0; i < deviceInfo.length; i++) {
      const char = deviceInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `device_${Math.abs(hash)}_${Date.now()}`;
  }
}

export const pushService = PushService.getInstance();
