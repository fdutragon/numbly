// PWA Manager - Gerencia push notifications e cart recovery
import { nanoid } from 'nanoid';

export class PWAManager {
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private userId: string;
  private isCartRecoveryActive: boolean = false;

  constructor() {
    this.userId = this.getUserId();
    this.initializeServiceWorker();
  }

  private getUserId(): string {
    if (typeof window === 'undefined') {
      return 'ssr-user-' + nanoid();
    }
    
    let userId = localStorage.getItem('donna-user-id');
    if (!userId) {
      userId = nanoid();
      localStorage.setItem('donna-user-id', userId);
    }
    return userId;
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration;
        
        // Escutar mensagens do service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        // Configurar push subscription se suportado
        await this.setupPushSubscription();
        
        console.log('Service Worker registrado com sucesso');
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    }
  }

  private async setupPushSubscription() {
    try {
      if (!this.serviceWorker || !('PushManager' in window)) {
        console.log('Push notifications não suportadas');
        return;
      }

      // Buscar VAPID public key do servidor
      const response = await fetch('/api/push');
      await response.json();
      
      // Verificar se já tem subscription
      const existingSubscription = await this.serviceWorker.pushManager.getSubscription();
      
      if (!existingSubscription) {
        console.log('✅ Push subscription configurada');
      }
      // Salva a subscription no localStorage para debug
      if (existingSubscription) {
        localStorage.setItem('donna-push-subscription', JSON.stringify(existingSubscription));
        // Exibe endpoint/token para debug
        console.log('Push Subscription endpoint:', existingSubscription.endpoint);
      }
    } catch (error) {
      console.error('Erro ao configurar push subscription:', error);
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { data } = event;
    
    if (data.type === 'NOTIFICATION_CLICKED') {
      // Lidar com cliques em notificações
      console.log('Notificação clicada:', data);
    }
  }

  // Solicitar permissão para notificações
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Verificar se PWA está instalada
  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone ||
      document.referrer.includes('android-app://')
    );
  }

  // Verificar se pode ser instalada
  canInstall(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Enviar notificação divertida para demonstração
  async sendFunNotification(): Promise<void> {
    const permission = await this.requestNotificationPermission();
    
    if (permission === 'granted' && this.serviceWorker) {
      this.serviceWorker.active?.postMessage({
        type: 'SEND_FUN_NOTIFICATION'
      });
    }
  }

  // Envia push local (apenas para debug, sem backend)
  async sendLocalPush(title: string, body: string) {
    if (this.serviceWorker && Notification.permission === 'granted') {
      this.serviceWorker.active?.postMessage({
        type: 'SEND_FUN_NOTIFICATION',
        data: { title, body }
      });
    }
  }

  // Iniciar cart recovery
  startCartRecovery(): void {
    if (typeof window === 'undefined') return;
    
    if (this.serviceWorker && !this.isCartRecoveryActive) {
      this.isCartRecoveryActive = true;
      this.serviceWorker.active?.postMessage({
        type: 'START_CART_RECOVERY',
        userId: this.userId
      });
      
      // Salvar estado no localStorage
      localStorage.setItem('donna-cart-recovery-active', 'true');
      localStorage.setItem('donna-cart-recovery-start', Date.now().toString());
    }
  }

  // Parar cart recovery (quando usuario compra)
  stopCartRecovery(): void {
    if (typeof window === 'undefined') return;
    
    if (this.serviceWorker && this.isCartRecoveryActive) {
      this.isCartRecoveryActive = false;
      this.serviceWorker.active?.postMessage({
        type: 'STOP_CART_RECOVERY',
        userId: this.userId
      });
      
      // Limpar estado do localStorage
      localStorage.removeItem('donna-cart-recovery-active');
      localStorage.removeItem('donna-cart-recovery-start');
    }
  }

  // Verificar se cart recovery está ativo
  isCartRecoveryRunning(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const isActive = localStorage.getItem('donna-cart-recovery-active') === 'true';
    const startTime = localStorage.getItem('donna-cart-recovery-start');
    
    // Se passou mais de 4 dias, desativar automaticamente
    if (isActive && startTime) {
      const elapsed = Date.now() - parseInt(startTime);
      const fourDays = 4 * 24 * 60 * 60 * 1000;
      
      if (elapsed > fourDays) {
        this.stopCartRecovery();
        return false;
      }
    }
    
    return isActive;
  }

  // Obter informações da PWA
  getPWAInfo(): {
    isStandalone: boolean;
    canInstall: boolean;
    notificationPermission: NotificationPermission;
    isCartRecoveryActive: boolean;
    userId: string;
  } {
    return {
      isStandalone: this.isStandalone(),
      canInstall: this.canInstall(),
      notificationPermission: typeof window !== 'undefined' ? Notification.permission : 'default',
      isCartRecoveryActive: this.isCartRecoveryRunning(),
      userId: this.userId
    };
  }

  // Mostrar banner de instalação
  showInstallPrompt(): void {
    // Este método seria chamado quando o evento 'beforeinstallprompt' for disparado
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; background: #3b82f6; color: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">📱 Instalar Donna AI</h3>
        <p style="margin: 0 0 12px 0; font-size: 14px;">Tenha a Donna AI sempre à mão! Instale como um app.</p>
        <button onclick="this.parentElement.remove()" style="background: white; color: #3b82f6; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
          Instalar Agora
        </button>
        <button onclick="this.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-left: 8px;">
          Depois
        </button>
      </div>
    `;
    
    document.body.appendChild(installBanner);
    
    // Remover automaticamente após 10 segundos
    setTimeout(() => {
      if (installBanner.parentElement) {
        installBanner.remove();
      }
    }, 10000);
  }
}

// Instância global
export const pwaManager = new PWAManager();

// Hook React para usar o PWA Manager
export function usePWA() {
  return {
    sendFunNotification: () => pwaManager.sendFunNotification(),
    sendLocalPush: (title: string, body: string) => pwaManager.sendLocalPush(title, body),
    startCartRecovery: () => pwaManager.startCartRecovery(),
    stopCartRecovery: () => pwaManager.stopCartRecovery(),
    isCartRecoveryActive: pwaManager.isCartRecoveryRunning(),
    getPWAInfo: () => pwaManager.getPWAInfo(),
    requestNotificationPermission: () => pwaManager.requestNotificationPermission(),
    showInstallPrompt: () => pwaManager.showInstallPrompt()
  };
}
