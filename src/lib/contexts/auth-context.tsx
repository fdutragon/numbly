'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUserStore, User, MapaNumerologico } from '@/lib/stores/user-store';
import { getOrCreateDeviceId } from '../device-id';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (deviceId?: string) => Promise<boolean>;
  loginWithJWT: (jwt: string) => Promise<boolean>; // Novo método
  logout: () => void;
  refreshUserData: () => Promise<void>;
  checkPushPermissions: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constantes para gestão de sessão
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const SESSION_STORAGE_KEY = 'numbly_session';
const DEVICE_ID_KEY = 'device_id';
const LAST_LOGIN_ATTEMPT_KEY = 'last_login_attempt';
const LOGIN_COOLDOWN_MS = 5000; // 5 segundos de cooldown

// Gerenciamento robusto de sessão
class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Armazena dados da sessão localmente
  storeSession(userData: any, sessionId?: string) {
    if (typeof window === 'undefined') return;
    const sessionData = {
      user: userData,
      timestamp: Date.now(),
      sessionId: sessionId || Date.now().toString(),
      deviceId: localStorage.getItem(DEVICE_ID_KEY)
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }

  // Recupera dados da sessão local
  getStoredSession() {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      const session = JSON.parse(stored);
      
      // Verifica se a sessão não expirou (30 dias)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (session.timestamp < thirtyDaysAgo) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch {
      return null;
    }
  }

  // Limpa sessão local
  clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  // Verifica permissões de push notification
  async checkPushPermissions(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return Notification.permission === 'granted';
    }
  }

  // Inicia monitoramento de sessão
  startSessionMonitoring(checkCallback: () => Promise<void>) {
    if (this.sessionCheckInterval) return;
    
    this.sessionCheckInterval = setInterval(async () => {
      if (this.isChecking) return;
      this.isChecking = true;
      
      try {
        // Verifica se push ainda está ativo
        const pushActive = await this.checkPushPermissions();
        if (!pushActive) {
          console.log('[SESSION] Push desativado, fazendo logout...');
          this.clearSession();
          await checkCallback();
          return;
        }
        
        // Verifica se a sessão ainda é válida no servidor
        await checkCallback();
      } finally {
        this.isChecking = false;
      }
    }, SESSION_CHECK_INTERVAL);
  }

  // Para monitoramento de sessão
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

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
  const sessionManager = SessionManager.getInstance();

  // Carrega dados do usuário do servidor
  const loadUserDataFromServer = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      if (data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        if (data.mapa) {
          setMapa(data.mapa);
        }
        
        // Armazena sessão localmente
        sessionManager.storeSession({
          user: data.user,
          mapa: data.mapa
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AUTH] Erro ao carregar dados do servidor:', error);
      return false;
    }
  };

  // Carrega dados da sessão (local primeiro, depois servidor)
  const loadUserData = useCallback(async (): Promise<boolean> => {
    // Primeiro tenta carregar da sessão local
    const storedSession = sessionManager.getStoredSession();
    if (storedSession?.user) {
      console.log('[AUTH] Carregando sessão local');
      setIsAuthenticated(true);
      setUser(storedSession.user);
      if (storedSession.mapa) {
        setMapa(storedSession.mapa);
      }
      
      // Verifica no servidor em background
      loadUserDataFromServer().catch(() => {
        console.log('[AUTH] Falha ao validar sessão no servidor, mantendo local');
      });
      
      return true;
    }
    
    // Se não há sessão local, tenta carregar do servidor
    return await loadUserDataFromServer();
  }, [setUser, setMapa, sessionManager]);

  // Verifica permissões de push
  const checkPushPermissions = useCallback(async (): Promise<boolean> => {
    return await sessionManager.checkPushPermissions();
  }, [sessionManager]);

  // Login automático via push ou manual
  const login = useCallback(async (deviceId?: string): Promise<boolean> => {
    try {
      if (!canAttemptLogin()) return false;
      recordLoginAttempt();

      const id = deviceId || await getOrCreateDeviceId();
      const response = await fetch('/api/auth/check-device-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          deviceId: id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Recarrega dados do usuário após login
          const success = await loadUserDataFromServer();
          if (success) {
            // Inicia monitoramento de sessão
            sessionManager.startSessionMonitoring(async () => {
              const stillValid = await loadUserDataFromServer();
              if (!stillValid) {
                logout();
              }
            });
          }
          return success;
        }
      }
      return false;
    } catch (error) {
      console.error('[AUTH] Erro ao fazer login:', error);
      return false;
    }
  }, [sessionManager]);

  // Logout (apenas se push for desativado ou erro crítico)
  const logout = useCallback(() => {
    console.log('[AUTH] Fazendo logout...');
    sessionManager.stopSessionMonitoring();
    sessionManager.clearSession();
    setIsAuthenticated(false);
    setUser({} as User);
    setMapa({} as MapaNumerologico);
    
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [setUser, setMapa, sessionManager]);

  // Login via JWT (autenticação automática do push)
  const loginWithJWT = useCallback(async (jwt: string): Promise<boolean> => {
    try {
      console.log('[AUTH] Tentando login via JWT...');
      
      const response = await fetch('/api/auth/login-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ jwt }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('[AUTH] Login via JWT bem-sucedido');
          setIsAuthenticated(true);
          setUser(data.user);
          if (data.mapa) {
            setMapa(data.mapa);
          }
          
          // Armazena sessão localmente
          sessionManager.storeSession({
            user: data.user,
            mapa: data.mapa
          });
          
          // Inicia monitoramento de sessão
          sessionManager.startSessionMonitoring(async () => {
            const stillValid = await loadUserDataFromServer();
            if (!stillValid) {
              logout();
            }
          });
          
          return true;
        }
      }
      
      console.error('[AUTH] Falha no login via JWT');
      return false;
    } catch (error) {
      console.error('[AUTH] Erro ao fazer login via JWT:', error);
      return false;
    }
  }, [setUser, setMapa, sessionManager, logout]);

  // Refresh dos dados do usuário
  const refreshUserData = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  // Efeito de inicialização: carrega sessão e inicia monitoramento
  useEffect(() => {
    const init = async () => {
      try {
        console.log('[AUTH] Inicializando autenticação...');
        const success = await loadUserData();
        
        if (success) {
          // Verifica permissões de push
          const pushEnabled = await checkPushPermissions();
          if (!pushEnabled) {
            console.log('[AUTH] Push não está ativo, mantendo usuário logado mesmo assim');
          }
          
          // Inicia monitoramento de sessão
          sessionManager.startSessionMonitoring(async () => {
            const pushStillActive = await checkPushPermissions();
            if (!pushStillActive) {
              console.log('[AUTH] Push foi desativado, fazendo logout');
              logout();
              return;
            }
            
            // Verifica se sessão ainda é válida
            const stillValid = await loadUserDataFromServer();
            if (!stillValid) {
              logout();
            }
          });
        }
        
        setIsAuthenticated(success);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Listener para mensagens do service worker (JWT do push)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('[AUTH] Mensagem do Service Worker:', event.data);
      
      if (event.data?.type === 'AUTH_JWT_LOGIN' && event.data?.jwt) {
        console.log('[AUTH] JWT recebido do push, fazendo login automático...');
        loginWithJWT(event.data.jwt).then(success => {
          if (success) {
            console.log('[AUTH] Login automático via push bem-sucedido!');
          } else {
            console.error('[AUTH] Falha no login automático via push');
          }
        });
      }
    };
    
    // Registra listener para mensagens do service worker
    if (typeof window !== 'undefined' && 'navigator' in window && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    init();
    
    // Cleanup on unmount
    return () => {
      sessionManager.stopSessionMonitoring();
      if (typeof window !== 'undefined' && 'navigator' in window && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [loginWithJWT]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      login,
      loginWithJWT, // Novo método disponível no contexto
      logout,
      refreshUserData,
      checkPushPermissions
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
