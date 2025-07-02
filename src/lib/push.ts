// Configuração do VAPID para push notifications
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

  async initialize(): Promise<boolean> {
    try {
      // Primeiro verificar suporte
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications não suportadas neste browser');
        return false;
      }

      // Registrar Service Worker
      this.registration = await this.registerServiceWorker();
      return !!this.registration;
    } catch (error) {
      console.error('Erro ao inicializar PushService:', error);
      return false;
    }
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
      // Primeiro verificar se já existe um SW registrado
      const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
      
      if (existingRegistration) {
        console.log('Service Worker já registrado:', existingRegistration);
        this.registration = existingRegistration;
        
        // Aguardar que esteja ativo
        if (existingRegistration.active) {
          return existingRegistration;
        }
        
        // Se estiver instalando ou ativando, aguardar
        if (existingRegistration.installing || existingRegistration.waiting) {
          await new Promise<void>((resolve) => {
            const worker = existingRegistration.installing || existingRegistration.waiting;
            if (worker) {
              worker.addEventListener('statechange', () => {
                if (worker.state === 'activated') {
                  resolve();
                }
              });
            } else {
              resolve();
            }
          });
        }
        
        return existingRegistration;
      }

      // Se não existe, registrar novo
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registrado:', this.registration);
      
      // Aguardar que esteja ativo
      await new Promise<void>((resolve, reject) => {
        if (this.registration!.active) {
          resolve();
          return;
        }

        const worker = this.registration!.installing || this.registration!.waiting;
        if (worker) {
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
              resolve();
            } else if (worker.state === 'redundant') {
              reject(new Error('Service Worker ficou redundante'));
            }
          });
        } else {
          // Aguardar um pouco e verificar novamente
          setTimeout(() => {
            if (this.registration!.active) {
              resolve();
            } else {
              reject(new Error('Service Worker não ficou ativo'));
            }
          }, 1000);
        }
      });
      
      return this.registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return null;
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      // Garantir que o Service Worker esteja registrado e ativo
      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
      }

      if (!this.registration) {
        console.error('Não foi possível registrar o Service Worker');
        return null;
      }

      // Verificar se o Service Worker está ativo
      if (!this.registration.active) {
        console.error('Service Worker não está ativo');
        return null;
      }

      // Verificar se já existe uma subscription
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Subscription já existe:', existingSubscription);
        return existingSubscription;
      }

      // Criar nova subscription
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('Nova subscription criada:', subscription);

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

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        console.error('Erro ao enviar subscription para o servidor:', response.status);
      }

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

// Inicializar automaticamente quando o módulo for carregado no browser
if (typeof window !== 'undefined') {
  pushService.initialize().catch(console.error);
}
