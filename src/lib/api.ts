const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.error || `Erro na API: ${response.statusText}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: async (userData: {
    nome: string;
    dataNascimento: string;
    numeroDestino: number;
    pushEnabled: boolean;
  }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  me: async () => {
    return apiRequest('/auth/me_new');
  },

  updateProfile: async (updates: {
    nome?: string;
    pushEnabled?: boolean;
  }) => {
    return apiRequest('/auth/me_new', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message: string) => {
    return apiRequest<{ response: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  getSuggestedQuestions: async () => {
    return apiRequest<{ questions: string[] }>('/ai/prompt');
  },
};

// Compatibilidade API
export const compatibilidadeApi = {
  calculate: async (pessoa2: { nome: string; dataNascimento: string }) => {
    return apiRequest('/ai/compatibility', {
      method: 'POST',
      body: JSON.stringify(pessoa2),
    });
  },
};

// Push API
export const pushApi = {
  subscribe: async (subscription: PushSubscription) => {
    return apiRequest('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  },

  validate: async () => {
    return apiRequest('/push/validate');
  },
};

// Reports API
export const reportsApi = {
  generate: async () => {
    return apiRequest('/ai/reports');
  },
};
