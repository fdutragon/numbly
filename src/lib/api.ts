'use client';

import { useAuth } from '@/lib/contexts/auth-context';

// 🚨 Classe de erro para APIs
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// 🌐 Base URL da API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// 🔧 Hook base para requisições autenticadas
export function useApiRequest() {
  const { token, logout } = useAuth();

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Auto-logout em caso de token inválido
      if (response.status === 401 && token) {
        logout();
        throw new ApiError(401, 'Sessão expirada');
      }

      return response;
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  };

  return { makeRequest };
}

// 🔒 API de autenticação
export function useAuthApi() {
  const { makeRequest } = useApiRequest();

  return {
    login: async (deviceId: string) => {
      const response = await makeRequest(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'device',
          deviceId,
          platform: 'web',
          deviceName: navigator.userAgent,
        }),
      });
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },
    
    logout: async () => {
      const response = await makeRequest(`${API_BASE_URL}/auth/logout`, {
        method: 'POST'
      });
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },
    
    getSession: async () => {
      const response = await makeRequest(`${API_BASE_URL}/auth/me`);
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    }
  };
}

// 👤 API de usuários
export function useUserApi() {
  const { makeRequest } = useApiRequest();

  return {
    register: async (userData: {
      nome: string;
      dataNascimento: string;
      numeroDestino: number;
      pushEnabled: boolean;
    }) => {
      const response = await makeRequest(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },

    updateProfile: async (updates: {
      nome?: string;
      pushEnabled?: boolean;
    }) => {
      const response = await makeRequest(`${API_BASE_URL}/auth/me_new`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },

    refreshProfile: async () => {
      const response = await makeRequest(`${API_BASE_URL}/auth/me`);
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },
  };
}

// 💬 API de chat com IA
export function useChatApi() {
  const { makeRequest } = useApiRequest();

  return {
    sendMessage: async (message: string, context?: any) => {
      const response = await makeRequest(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({ 
          prompt: message,
          ...context
        }),
      });
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },

    getSuggestedQuestions: async () => {
      const response = await makeRequest(`${API_BASE_URL}/ai/prompt`);
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },
  };
}

// 🤝 API de compatibilidade
export function useCompatibilidadeApi() {
  const { makeRequest } = useApiRequest();

  return {
    calculate: async (pessoa2: { nome: string; dataNascimento: string }) => {
      const response = await makeRequest(`${API_BASE_URL}/ai/compatibility`, {
        method: 'POST',
        body: JSON.stringify(pessoa2),
      });
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },
  };
}

// 🔔 API de notificações push
export function usePushApi() {
  const { makeRequest } = useApiRequest();

  return {
    subscribe: async (subscription: PushSubscription) => {
      const response = await makeRequest(`${API_BASE_URL}/push/subscribe`, {
        method: 'POST',
        body: JSON.stringify(subscription),
      });
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },

    validate: async () => {
      const response = await makeRequest(`${API_BASE_URL}/push/validate`);
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },
  };
}

// 📊 API de relatórios
export function useReportsApi() {
  const { makeRequest } = useApiRequest();

  return {
    generate: async () => {
      const response = await makeRequest(`${API_BASE_URL}/ai/reports`);
      if (!response.ok) throw new ApiError(response.status, await response.text());
      return response.json();
    },
  };
}
