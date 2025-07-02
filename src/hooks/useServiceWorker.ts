import { useEffect } from 'react';

/**
 * Hook para registrar o Service Worker de forma robusta e logar tudo para debug.
 * Agora registra imediatamente no mount do client.
 */
export function useServiceWorker(registrationPath = '/sw.js') {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[useServiceWorker] Não está no browser ou serviceWorker não suportado');
      return;
    }
    console.log('[useServiceWorker] Registrando Service Worker em', registrationPath);
    navigator.serviceWorker.register(registrationPath)
      .then(reg => {
        console.info('✅ Service Worker registrado:', reg);
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch(err => {
        console.error('❌ Erro ao registrar Service Worker:', err);
      });
  }, [registrationPath]);
}
