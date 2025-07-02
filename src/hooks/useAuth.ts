'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/lib/contexts/auth-context';
import { useUserStore } from '@/lib/stores/user-store';

export function useAuth() {
  const router = useRouter();
  const userStore = useUserStore();
  const auth = useAuthContext();
  
  const requireAuth = (redirectTo?: string) => {
    useEffect(() => {
      // Só redireciona se não estiver carregando E não estiver autenticado
      if (!auth.isLoading && !auth.isAuthenticated && redirectTo) {
        router.push(redirectTo);
      }
    }, [auth.isAuthenticated, auth.isLoading, redirectTo, router]);
  };

  return {
    ...auth,
    ...userStore, // Inclui todos os dados do user store
    requireAuth,
  };
}

export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);
}
