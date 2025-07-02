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

  // Carrega o token salvo ao inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken);
        // Tenta carregar os dados do usuário com o token salvo
        loadUserData(savedToken);
      } else {
        // Se não há token, tenta fazer login automático com deviceId
        autoLogin();
      }
    }
  }, []);

  const autoLogin = async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      if (deviceId) {
        await login(deviceId);
      }
    } catch (error) {
      console.error('Erro no auto-login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (deviceId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        const newToken = data.token;
        setToken(newToken);
        localStorage.setItem(TOKEN_KEY, newToken);
        
        // Carrega os dados do usuário após o login
        await loadUserData(newToken);
        return true;
      } else {
        console.error('Erro no login:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        const userData = data.user;
        
        // Converte os dados da API para o formato esperado pelo store
        const formattedUser: User = {
          id: userData.id,
          nome: userData.name,
          dataNascimento: userData.birthDate,
          numeroDestino: userData.numerologyData?.numeroDestino || 0,
          numeroSorte: userData.numerologyData?.numeroSorte || 0,
          plano: 'gratuito' as const,
          pushEnabled: false,
          created: userData.createdAt,
        };

        setUser(formattedUser);

        // Se há dados numerológicos, configura o mapa
        if (userData.numerologyData) {
          const mapaData: MapaNumerologico = {
            numeroDestino: userData.numerologyData.numeroDestino || 0,
            numeroSorte: userData.numerologyData.numeroSorte || 0,
            potencial: userData.numerologyData.potencial || '',
            bloqueios: userData.numerologyData.bloqueios || [],
            fortalezas: userData.numerologyData.fortalezas || [],
            desafios: userData.numerologyData.desafios || [],
            amor: userData.numerologyData.amor || '',
            cicloVida: {
              fase: userData.numerologyData.cicloVida || 'Juventude',
              descricao: 'Fase de descobertas e crescimento',
              periodo: '2024-2025'
            }
          };
          setMapa(mapaData);
        }
      } else {
        console.error('Erro ao carregar dados do usuário:', data.error);
      }
    } catch (error) {
      console.error('Erro na requisição de dados do usuário:', error);
    }
  };

  const refreshUserData = async () => {
    if (token) {
      await loadUserData(token);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    const { clearUser } = useUserStore.getState();
    clearUser();
  };

  const value: AuthContextType = {
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook para adicionar automaticamente o token nas requisições
export function useApiRequest() {
  const { token } = useAuth();

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return { makeRequest };
}
