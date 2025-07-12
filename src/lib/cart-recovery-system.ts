// Sistema de Recuperação de Carrinho - Cart Recovery
import { nanoid } from 'nanoid';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartRecoveryConfig {
  enabled: boolean;
  maxMessages: number;
  intervals: number[]; // delays em minutos
  messages: CartRecoveryMessage[];
}

interface CartRecoveryMessage {
  id: number;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  requireInteraction?: boolean;
}

interface CartSession {
  sessionId: string;
  deviceId: string;
  items: CartItem[];
  totalValue: number;
  createdAt: number;
  lastUpdated: number;
  email?: string;
  phone?: string;
  recoveryActive: boolean;
  messagesSent: number;
  nextMessageAt?: number;
}

export class CartRecoverySystem {
  private config: CartRecoveryConfig;
  private storageKey = 'donna-cart-session';
  private deviceIdKey = 'donna-device-id';
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeDeviceId();
  }

  private getDefaultConfig(): CartRecoveryConfig {
    return {
      enabled: true,
      maxMessages: 5,
      intervals: [
        5,      // 5 minutos após abandono
        30,     // 30 minutos
        120,    // 2 horas  
        720,    // 12 horas
        1440    // 24 horas
      ],
      messages: [
        {
          id: 1,
          title: "🛒 Esqueceu algo?",
          body: "Você estava quase finalizando sua compra da Donna AI. Que tal terminar agora?",
          icon: "/icons/cart-notification.png",
          actionUrl: "/checkout",
          requireInteraction: true
        },
        {
          id: 2,
          title: "💔 Sentimos sua falta!",
          body: "A Donna AI está esperando por você. Finalize sua compra e transforme seu negócio hoje!",
          icon: "/icons/heart-notification.png",
          actionUrl: "/checkout?discount=10",
          requireInteraction: true
        },
        {
          id: 3,
          title: "🔥 Oferta especial!",
          body: "Últimas horas para garantir a Donna AI com 15% de desconto. Não perca!",
          icon: "/icons/fire-notification.png",
          actionUrl: "/checkout?discount=15",
          requireInteraction: true
        },
        {
          id: 4,
          title: "⏰ Última chance!",
          body: "Sua oportunidade de ter a Donna AI está acabando. Finalize agora com 20% OFF!",
          icon: "/icons/clock-notification.png",
          actionUrl: "/checkout?discount=20",
          requireInteraction: true
        },
        {
          id: 5,
          title: "🎯 Volte e ganhe!",
          body: "Que tal uma nova chance? A Donna AI pode revolucionar suas vendas ainda hoje!",
          icon: "/icons/target-notification.png",
          actionUrl: "/checkout?discount=25",
          requireInteraction: true
        }
      ]
    };
  }

  private initializeDeviceId(): string {
    if (typeof window === 'undefined') return 'ssr-device-' + nanoid();
    
    let deviceId = localStorage.getItem(this.deviceIdKey);
    if (!deviceId) {
      deviceId = 'device-' + nanoid();
      localStorage.setItem(this.deviceIdKey, deviceId);
      console.log('🆔 Novo Device ID criado para Cart Recovery:', deviceId);
    }
    return deviceId;
  }

  // Iniciar nova sessão de carrinho
  public startCartSession(items: CartItem[], userInfo?: { email?: string; phone?: string }): string {
    const deviceId = this.initializeDeviceId();
    const sessionId = 'cart-' + nanoid();
    
    const session: CartSession = {
      sessionId,
      deviceId,
      items,
      totalValue: items.reduce((total, item) => total + (item.price * item.quantity), 0),
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      email: userInfo?.email,
      phone: userInfo?.phone,
      recoveryActive: false,
      messagesSent: 0
    };

    this.saveSession(session);
    console.log('🛒 Nova sessão de carrinho iniciada:', sessionId);
    
    return sessionId;
  }

  // Atualizar carrinho (reset do timer de recovery)
  public updateCart(sessionId: string, items: CartItem[]): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.items = items;
    session.totalValue = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    session.lastUpdated = Date.now();

    // Se estava em recovery, pausar
    if (session.recoveryActive) {
      this.pauseRecovery(sessionId);
    }

    this.saveSession(session);
    console.log('🛒 Carrinho atualizado:', sessionId);
  }

  // Iniciar processo de recuperação de carrinho
  public startRecovery(sessionId: string): void {
    if (!this.config.enabled) {
      console.log('❌ Cart Recovery desabilitado');
      return;
    }

    const session = this.getSession(sessionId);
    if (!session || session.items.length === 0) {
      console.log('❌ Sessão inválida ou carrinho vazio');
      return;
    }

    if (session.recoveryActive) {
      console.log('⚠️ Recovery já ativo para esta sessão');
      return;
    }

    session.recoveryActive = true;
    session.messagesSent = 0;
    session.nextMessageAt = Date.now() + (this.config.intervals[0] * 60 * 1000);

    this.saveSession(session);
    this.scheduleNextMessage(sessionId);

    console.log('🚀 Cart Recovery iniciado para sessão:', sessionId);

    // Enviar evento para analytics (opcional)
    this.trackEvent('cart_recovery_started', {
      sessionId,
      deviceId: session.deviceId,
      cartValue: session.totalValue
    });
  }

  // Pausar recuperação (quando usuário retorna)
  public pauseRecovery(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.recoveryActive = false;
    delete session.nextMessageAt;
    this.saveSession(session);

    // Cancelar timer ativo
    const activeTimer = this.activeTimers.get(sessionId);
    if (activeTimer) {
      clearTimeout(activeTimer);
      this.activeTimers.delete(sessionId);
    }

    console.log('⏸️ Cart Recovery pausado para sessão:', sessionId);
  }

  // Finalizar carrinho (compra concluída)
  public completeCart(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    this.pauseRecovery(sessionId);
    
    // Remover sessão
    if (typeof window !== 'undefined') {
      const sessions = this.getAllSessions();
      const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredSessions));
    }

    console.log('✅ Carrinho finalizado com sucesso:', sessionId);

    // Enviar evento para analytics
    this.trackEvent('cart_completed', {
      sessionId,
      deviceId: session.deviceId,
      cartValue: session.totalValue
    });
  }

  // Agendar próxima mensagem
  private scheduleNextMessage(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session || !session.recoveryActive) return;

    if (session.messagesSent >= this.config.maxMessages) {
      console.log('📝 Máximo de mensagens atingido para sessão:', sessionId);
      this.pauseRecovery(sessionId);
      return;
    }

    const nextInterval = this.config.intervals[session.messagesSent];
    if (!nextInterval) return;

    const delay = nextInterval * 60 * 1000; // converter minutos para ms
    
    const timer = setTimeout(() => {
      this.sendRecoveryMessage(sessionId);
    }, delay);

    this.activeTimers.set(sessionId, timer);

    console.log(`⏰ Próxima mensagem agendada em ${nextInterval} minutos para sessão:`, sessionId);
  }

  // Enviar mensagem de recuperação
  private async sendRecoveryMessage(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session || !session.recoveryActive) return;

    const messageConfig = this.config.messages[session.messagesSent];
    if (!messageConfig) return;

    try {
      // Tentar enviar push notification
      await this.sendPushNotification(session.deviceId, messageConfig, session);
      
      // Atualizar contador
      session.messagesSent++;
      session.lastUpdated = Date.now();
      
      if (session.messagesSent < this.config.maxMessages) {
        session.nextMessageAt = Date.now() + (this.config.intervals[session.messagesSent] * 60 * 1000);
      }
      
      this.saveSession(session);

      console.log(`📧 Mensagem ${session.messagesSent} enviada para sessão:`, sessionId);

      // Agendar próxima mensagem se ainda há mais
      if (session.messagesSent < this.config.maxMessages) {
        this.scheduleNextMessage(sessionId);
      } else {
        console.log('✅ Todas as mensagens de recovery enviadas para sessão:', sessionId);
        this.pauseRecovery(sessionId);
      }

      // Enviar evento para analytics
      this.trackEvent('cart_recovery_message_sent', {
        sessionId,
        deviceId: session.deviceId,
        cartValue: session.totalValue
      });

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de recovery:', error);
    }
  }

  // Enviar push notification
  private async sendPushNotification(
    deviceId: string, 
    message: CartRecoveryMessage, 
    session: CartSession
  ): Promise<void> {
    try {
      // Verificar se Service Worker está disponível
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker não suportado');
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        throw new Error('Service Worker não registrado');
      }

      // Buscar subscription existente
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Enviar via servidor
        const response = await fetch('/api/push/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            recovery: true,
            message: {
              title: message.title,
              body: message.body,
              icon: message.icon,
              data: {
                sessionId: session.sessionId,
                actionUrl: message.actionUrl,
                deviceId
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error('Erro no servidor de push');
        }

        console.log('🚀 Push notification enviada via servidor');
      } else {
        // Fallback: notificação local via Service Worker
        registration.active?.postMessage({
          type: 'SEND_CART_RECOVERY_NOTIFICATION',
          data: {
            title: message.title,
            body: message.body,
            icon: message.icon,
            sessionId: session.sessionId,
            actionUrl: message.actionUrl
          }
        });

        console.log('📱 Notificação local enviada via Service Worker');
      }

    } catch (error) {
      console.error('❌ Erro ao enviar push notification:', error);
      
      // Fallback final: tentar notificação do navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(message.title, {
          body: message.body,
          icon: message.icon,
          tag: `cart-recovery-${session.sessionId}`,
          requireInteraction: message.requireInteraction
        });
        console.log('🔔 Notificação do navegador enviada como fallback');
      }
    }
  }

  // Gerenciamento de sessões
  private saveSession(session: CartSession): void {
    if (typeof window === 'undefined') return;

    const sessions = this.getAllSessions();
    const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(sessions));
  }

  private getSession(sessionId: string): CartSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.sessionId === sessionId) || null;
  }

  private getAllSessions(): CartSession[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Limpeza automática de sessões antigas
  public cleanupOldSessions(): void {
    const sessions = this.getAllSessions();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

    const activeSessions = sessions.filter(session => {
      const age = now - session.createdAt;
      return age < maxAge;
    });

    if (activeSessions.length !== sessions.length) {
      localStorage.setItem(this.storageKey, JSON.stringify(activeSessions));
      console.log('🧹 Sessões antigas removidas');
    }
  }

  // Analytics (para implementar integração)
  private trackEvent(event: string, data: { sessionId?: string; deviceId?: string; cartValue?: number }): void {
    // Implementar integração com Google Analytics, Mixpanel, etc.
    console.log(`📊 Analytics Event: ${event}`, data);
    
    // Exemplo para Google Analytics
    if (typeof window !== 'undefined' && (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag('event', event, {
        custom_parameter_1: data.sessionId,
        custom_parameter_2: data.deviceId,
        value: data.cartValue
      });
    }
  }

  // Obter estatísticas
  public getStats(): {
    totalSessions: number;
    activeSessions: number;
    averageCartValue: number;
    recoveryRate: number;
  } {
    const sessions = this.getAllSessions();
    const activeSessions = sessions.filter(s => s.recoveryActive);
    const totalValue = sessions.reduce((sum, s) => sum + s.totalValue, 0);
    const completedSessions = sessions.filter(s => !s.recoveryActive && s.messagesSent > 0);
    
    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      averageCartValue: sessions.length > 0 ? totalValue / sessions.length : 0,
      recoveryRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0
    };
  }

  // Configuração personalizada
  public updateConfig(newConfig: Partial<CartRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração de Cart Recovery atualizada:', this.config);
  }

  // Reativar recovery para uma sessão específica
  public reactivateRecovery(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    if (session.messagesSent < this.config.maxMessages) {
      this.startRecovery(sessionId);
    }
  }

  // Obter informações da sessão atual
  public getCurrentSession(): CartSession | null {
    const sessions = this.getAllSessions();
    const deviceId = this.initializeDeviceId();
    
    // Retornar a sessão mais recente do dispositivo atual
    return sessions
      .filter(s => s.deviceId === deviceId)
      .sort((a, b) => b.lastUpdated - a.lastUpdated)[0] || null;
  }
}

// Instância global
export const cartRecoverySystem = new CartRecoverySystem();

// Hook React para usar o Cart Recovery System
export function useCartRecovery() {
  return {
    startSession: (items: CartItem[], userInfo?: { email?: string; phone?: string }) => 
      cartRecoverySystem.startCartSession(items, userInfo),
    updateCart: (sessionId: string, items: CartItem[]) => 
      cartRecoverySystem.updateCart(sessionId, items),
    startRecovery: (sessionId: string) => 
      cartRecoverySystem.startRecovery(sessionId),
    pauseRecovery: (sessionId: string) => 
      cartRecoverySystem.pauseRecovery(sessionId),
    completeCart: (sessionId: string) => 
      cartRecoverySystem.completeCart(sessionId),
    getCurrentSession: () => 
      cartRecoverySystem.getCurrentSession(),
    getStats: () => 
      cartRecoverySystem.getStats(),
    cleanup: () => 
      cartRecoverySystem.cleanupOldSessions()
  };
}

// Tipos exportados para uso em outros arquivos
export type { CartItem, CartSession, CartRecoveryConfig, CartRecoveryMessage };
