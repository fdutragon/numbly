'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/user-store';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  
  const logout = () => {
    clearUser();
    router.push('/');
  };
  
  const requireAuth = (redirectTo: string = '/register') => {
    useEffect(() => {
      if (!user) {
        router.push(redirectTo);
      }
    }, [user, redirectTo, router]);
  };

  return {
    user,
    isAuthenticated: !!user,
    logout,
    requireAuth
  };
}

export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const router = useRouter();
  const { user } = useUserStore();
  
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, redirectTo, router]);
}
