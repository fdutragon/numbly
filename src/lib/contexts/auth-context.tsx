'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserStore, User, MapaNumerologico } from '@/lib/stores/user-store';
import { getOrCreateDeviceId } from '../device-id';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (deviceId: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEVICE_ID_KEY = 'device_id';
const LAST_LOGIN_ATTEMPT_KEY = 'last_login_attempt';
const LOGIN_COOLDOWN_MS = 5000; // 5 segundos de cooldown entre tentativas

// Rate limiting para evitar muitas requisições
function canAttemptLogin(): boolean {
  if (typeof window === 'undefined') return false;
  
  const lastAttempt = localStorage.getItem(LAST_LOGIN_ATTEMPT_KEY);
  if (!lastAttempt) return true;
  
  const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
  return timeSinceLastAttempt > LOGIN_COOLDOWN_MS;
}

function recordLoginAttempt(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_LOGIN_ATTEMPT_KEY, Date.now().toString());
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setUser, setMapa } = useUserStore();

  // Carrega dados do usuário
  const loadUserData = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // Importante: inclui cookies na requisição
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setUser({} as User);
          setMapa({} as MapaNumerologico);
        }
        return false;
      }
      
      const data = await response.json();
      if (data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        if (data.mapa) {
          setMapa(data.mapa);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return false;
    }
  };

  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  // Login 
  const login = async (deviceId?: string): Promise<boolean> => {
    try {
      if (!canAttemptLogin()) return false;
      recordLoginAttempt();

      const id = deviceId || await getOrCreateDeviceId();
      const response = await fetch('/api/auth/check-device-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante: aceita cookies na resposta
        body: JSON.stringify({
          deviceId: id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadUserData();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    setUser({} as User);
    setMapa({} as MapaNumerologico);
    if (router) {
      router.push('/');
    }
  };

  // Refresh dos dados do usuário
  const refreshUserData = async () => {
    await loadUserData();
  };

  // Efeito de inicialização: verifica autenticação
  useEffect(() => {
    const init = async () => {
      try {
        const success = await loadUserData();
        setIsAuthenticated(success);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
