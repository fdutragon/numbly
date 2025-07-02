'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserStore, User, MapaNumerologico } from '@/lib/stores/user-store';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (deviceId: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const DEVICE_ID_KEY = 'device_id';

// Gerar ou recuperar deviceId
function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setUser, setMapa } = useUserStore();

  const isAuthenticated = !!token;

  // Funções auxiliares
  const saveToken = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
  };

  const clearToken = () => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  // Fazer requisição autenticada
  const makeAuthRequest = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && token) {
      if (process.env.NODE_ENV !== 'development' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        clearToken();
        setUser({} as User);
        setMapa({} as MapaNumerologico);
      } else {
        // Em dev/local, só loga o erro e não faz logout automático
        console.warn('401 recebido, mas ignorado em ambiente de desenvolvimento/local');
      }
    }

    return response;
  };

  // Carrega dados do usuário
  const loadUserData = async (userToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      if (!response.ok) {
        // Só limpa token se for 401 (não autorizado)
        if (response.status === 401) {
          if (process.env.NODE_ENV !== 'development' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            console.warn('Token inválido durante carregamento de dados');
            clearToken();
          } else {
            // Em dev/local, só loga o erro e não faz logout automático
            console.warn('Token 401 ignorado em ambiente de desenvolvimento/local');
          }
        }
        throw new Error(`Falha ao carregar dados do usuário: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        if (data.mapa) {
          setMapa(data.mapa);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Não limpar token aqui, deixar para o caller decidir
      return false;
    }
  };

  // Auto login
  const autoLogin = async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'device',
          deviceId,
          platform: 'web',
          deviceName: navigator.userAgent,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          saveToken(data.token);
          await loadUserData(data.token);
        }
      }
    } catch (error) {
      console.error('Erro no auto-login:', error);
      clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Login manual
  const login = async (deviceId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'device',
          deviceId,
          platform: 'web',
          deviceName: navigator.userAgent,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          saveToken(data.token);
          return await loadUserData(data.token);
        }
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      clearToken();
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      clearToken();
      setUser({} as User);
      setMapa({} as MapaNumerologico);
    }
  };

  // Refresh dados do usuário
  const refreshUserData = async () => {
    if (token) {
      await loadUserData(token);
    }
  };

  // Carrega o token salvo ao inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken);
        loadUserData(savedToken).then(success => {
          if (!success) {
            autoLogin();
          } else {
            setIsLoading(false);
          }
        });
      } else {
        autoLogin();
      }
    }
  }, []);

  const contextValue: AuthContextType = {
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
