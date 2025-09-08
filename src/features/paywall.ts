import { db } from '@/data/db';

/**
 * Verifica se o usuário pode usar funcionalidades de IA
 * @returns true se pode usar, false caso contrário
 */
export async function canUseAI(): Promise<boolean> {
  try {
    const flags = await db.flags.get('usage');
    if (!flags) {
      // Se não existe flags, ainda não usou a edição grátis
      return true;
    }
    
    // Pode usar se tem feature desbloqueada OU ainda não usou a edição grátis
    return flags.feature_unlocked?.includes('ai') || !flags.free_ai_used;
  } catch (error) {
    console.error('Erro ao verificar permissões de IA:', error);
    return false;
  }
}

/**
 * Marca que o usuário usou a edição gratuita de IA
 */
export async function markFreeAiUsed(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const existingFlags = await db.flags.get('usage');
    
    const flags = existingFlags ?? {
      id: 'usage' as const,
      free_ai_used: false,
      guest_id: getOrCreateGuestId(),
      feature_unlocked: [],
      updated_at: now
    };
    
    // Marca como usado
    flags.free_ai_used = true;
    flags.updated_at = now;
    
    await db.flags.put(flags);
    
    console.log('Edição gratuita de IA marcada como usada');
  } catch (error) {
    console.error('Erro ao marcar edição grátis como usada:', error);
  }
}

/**
 * Desbloqueia funcionalidade de IA (após pagamento)
 */
export async function unlockAIFeature(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const existingFlags = await db.flags.get('usage');
    
    const flags = existingFlags ?? {
      id: 'usage' as const,
      free_ai_used: false,
      guest_id: getOrCreateGuestId(),
      feature_unlocked: [],
      updated_at: now
    };
    
    // Adiciona 'ai' às features desbloqueadas se não estiver já
    if (!flags.feature_unlocked.includes('ai')) {
      flags.feature_unlocked.push('ai');
      flags.updated_at = now;
      
      await db.flags.put(flags);
      console.log('Funcionalidade de IA desbloqueada');
    }
  } catch (error) {
    console.error('Erro ao desbloquear IA:', error);
  }
}

/**
 * Verifica se o usuário já usou a edição gratuita
 */
export async function hasUsedFreeEdit(): Promise<boolean> {
  try {
    const flags = await db.flags.get('usage');
    return flags?.free_ai_used ?? false;
  } catch (error) {
    console.error('Erro ao verificar edição grátis:', error);
    return false;
  }
}

/**
 * Verifica se o usuário tem features premium desbloqueadas
 */
export async function hasPremiumFeatures(): Promise<boolean> {
  try {
    const flags = await db.flags.get('usage');
    return flags?.feature_unlocked?.includes('ai') ?? false;
  } catch (error) {
    console.error('Erro ao verificar features premium:', error);
    return false;
  }
}

/**
 * Obtém o status completo do paywall do usuário
 */
export async function getPaywallStatus(): Promise<{
  canUseAI: boolean;
  hasUsedFreeEdit: boolean;
  hasPremium: boolean;
  guestId: string;
}> {
  try {
    const flags = await db.flags.get('usage');
    const guestId = flags?.guest_id ?? getOrCreateGuestId();
    
    return {
      canUseAI: await canUseAI(),
      hasUsedFreeEdit: flags?.free_ai_used ?? false,
      hasPremium: flags?.feature_unlocked?.includes('ai') ?? false,
      guestId
    };
  } catch (error) {
    console.error('Erro ao obter status do paywall:', error);
    const guestId = getOrCreateGuestId();
    return {
      canUseAI: true, // Fallback para permitir primeira tentativa
      hasUsedFreeEdit: false,
      hasPremium: false,
      guestId
    };
  }
}

/**
 * Reseta o sistema de paywall (útil para desenvolvimento/testes)
 */
export async function resetPaywallStatus(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const flags = {
      id: 'usage' as const,
      free_ai_used: false,
      guest_id: getOrCreateGuestId(),
      feature_unlocked: [],
      updated_at: now
    };
    
    await db.flags.put(flags);
    console.log('Status do paywall resetado');
  } catch (error) {
    console.error('Erro ao resetar paywall:', error);
  }
}

/**
 * Obtém ou cria um ID de guest único
 */
function getOrCreateGuestId(): string {
  const storageKey = 'numbly_guest_id';
  let guestId = localStorage.getItem(storageKey);
  
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(storageKey, guestId);
  }
  
  return guestId;
}

/**
 * Guard para verificar permissões antes de executar ação de IA
 * @param action Função a ser executada se permitido
 * @param onBlocked Função a ser executada se bloqueado (mostrar upsell)
 * @returns Promise com resultado da ação ou undefined se bloqueado
 */
export async function withAIGuard<T>(
  action: () => Promise<T>,
  onBlocked: () => void
): Promise<T | undefined> {
  const canUse = await canUseAI();
  
  if (!canUse) {
    onBlocked();
    return undefined;
  }
  
  try {
    const result = await action();
    
    // Se chegou até aqui e ainda não marcou como usado, marcar
    const status = await getPaywallStatus();
    if (!status.hasUsedFreeEdit && !status.hasPremium) {
      await markFreeAiUsed();
    }
    
    return result;
  } catch (error) {
    console.error('Erro na execução da ação de IA:', error);
    throw error;
  }
}

/**
 * Hook de React para usar o estado do paywall
 * (Para ser usado em componentes React)
 */
export function usePaywallStatus() {
  const [status, setStatus] = React.useState({
    canUseAI: true,
    hasUsedFreeEdit: false,
    hasPremium: false,
    guestId: '',
    loading: true
  });
  
  React.useEffect(() => {
    getPaywallStatus().then(paywallStatus => {
      setStatus({
        ...paywallStatus,
        loading: false
      });
    });
  }, []);
  
  const refreshStatus = React.useCallback(async () => {
    const paywallStatus = await getPaywallStatus();
    setStatus({
      ...paywallStatus,
      loading: false
    });
  }, []);
  
  return {
    ...status,
    refreshStatus,
    markFreeAiUsed: async () => {
      await markFreeAiUsed();
      await refreshStatus();
    },
    unlockAI: async () => {
      await unlockAIFeature();
      await refreshStatus();
    }
  };
}

// Adicionar React import para o hook
import React from 'react';

export default {
  canUseAI,
  markFreeAiUsed,
  unlockAIFeature,
  hasUsedFreeEdit,
  hasPremiumFeatures,
  getPaywallStatus,
  resetPaywallStatus,
  withAIGuard,
  usePaywallStatus
};
