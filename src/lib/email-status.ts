// Cache global para email IDs
interface EmailCacheData {
  scheduledEmailIds: string[];
  timestamp: number;
  email: string;
}

declare global {
  var emailIdsCache: Map<string, EmailCacheData> | undefined;
}

// Função para notificar que os IDs de email estão prontos
export function notifyEmailIdsReady(orderId: string, scheduledEmailIds: string[]): boolean {
  try {
    // Verificar se existe um callback ou sistema de notificação
    // Por enquanto, apenas loggar
    console.log(`[EMAIL STATUS] IDs prontos para order ${orderId}:`, scheduledEmailIds);
    return true;
  } catch (error) {
    console.error('[EMAIL STATUS] Erro ao notificar IDs prontos:', error);
    return false;
  }
}
