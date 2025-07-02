'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserStore, User, MapaNumerologico } from '@/lib/stores/user-store';
import { getOrCreateDeviceId } from '../device-id';

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
const LAST_LOGIN_ATTEMPT_KEY = 'last_login_attempt';
const LOGIN_COOLDOWN_MS = 5000; // 5 segundos de cooldown entre tentativas

// Variável global para controlar inicialização única (evita múltiplas execuções no dev mode)
let globalInitialized = false;

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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { setUser, setMapa } = useUserStore();

  const isAuthenticated = !!token;

  // Funções auxiliares
  const saveToken = (newToken: string) => {
    if (typeof window !== 'undefined') {
      setToken(newToken);
      localStorage.setItem(TOKEN_KEY, newToken);
    }
  };

  const clearToken = () => {
    if (typeof window !== 'undefined') {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    }
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
      if (process.env.NODE_ENV !== 'development' && 
          typeof window !== 'undefined' && 
          window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1') {
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
  const loadUserData = async (userToken: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      if (!response.ok) {
        // Só limpa token se for 401 (não autorizado) e não estiver em desenvolvimento
        if (response.status === 401) {
          if (process.env.NODE_ENV !== 'development' && 
              typeof window !== 'undefined' && 
              window.location.hostname !== 'localhost' && 
              window.location.hostname !== '127.0.0.1') {
            console.warn('Token inválido durante carregamento de dados');
            clearToken();
          } else {
            // Em dev/local, só loga o erro e não faz logout automático
            console.warn('Token 401 ignorado em ambiente de desenvolvimento/local');
          }
        }
        return false;
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
      return false;
    }
  };

  // Auto login com rate limiting
  const autoLogin = async (): Promise<void> => {
    try {
      console.log('[AUTO_LOGIN] Verificando se pode tentar login...');
      if (!canAttemptLogin()) {
        console.log('[AUTO_LOGIN] Rate limit ativo, pulando tentativa');
        setIsLoading(false);
        return;
      }
      console.log('[AUTO_LOGIN] Iniciando auto-login...');
      recordLoginAttempt();
      const deviceId = await getOrCreateDeviceId();
      console.log('[AUTO_LOGIN] DeviceId que será usado para login:', deviceId);
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
          console.log('[AUTO_LOGIN] Token recebido, salvando...');
          saveToken(data.token);
          await loadUserData(data.token);
          console.log('[AUTO_LOGIN] Auto-login concluído com sucesso');
        }
      } else {
        console.warn('[AUTO_LOGIN] Falha no auto-login:', response.status);
      }
    } catch (error) {
      console.error('[AUTO_LOGIN] Erro no auto-login:', error);
      clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Login manual
  const login = async (deviceId?: string): Promise<boolean> => {
    try {
      const id = deviceId || await getOrCreateDeviceId();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'device',
          deviceId: id,
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
    // Evitar execução no servidor
    if (typeof window === 'undefined') return;
    
    // Evitar múltiplas inicializações globalmente (especialmente importante no dev mode)
    if (globalInitialized) {
      console.log('[AUTH_INIT] Já inicializado globalmente, pulando...');
      setIsLoading(false);
      return;
    }
    
    // Evitar múltiplas inicializações locais
    if (initialized) return;
    
    const initializeAuth = async () => {
      globalInitialized = true;
      setInitialized(true);
      console.log('[AUTH_INIT] Inicializando autenticação...');
      
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        console.log('[AUTH_INIT] Token encontrado, carregando dados do usuário...');
        setToken(savedToken);
        const success = await loadUserData(savedToken);
        if (success) {
          console.log('[AUTH_INIT] Usuário carregado com sucesso, parando inicialização');
          setIsLoading(false);
          return; // Para aqui se já está autenticado
        } else {
          console.log('[AUTH_INIT] Token inválido, limpando...');
          clearToken();
        }
      }
      
      // Só fazer auto-login se não há token válido
      console.log('[AUTH_INIT] Fazendo auto-login...');
      await autoLogin();
    };

    initializeAuth();
  }, []); // Dependências vazias para executar apenas uma vez

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
