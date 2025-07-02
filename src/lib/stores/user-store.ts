import { create } from 'zustand';

export interface User {
  id?: string;
  nome: string;
  dataNascimento: string;
  numeroDestino: number;
  numeroSorte?: number;
  plano: 'gratuito' | 'premium';
  pushEnabled: boolean;
  created?: string;
}

export interface MapaNumerologico {
  numeroDestino: number;
  numeroSorte: number;
  potencial: string;
  bloqueios: string[];
  desafios: string[];
  fortalezas: string[];
  amor: string;
  cicloVida: {
    fase: string;
    descricao: string;
    periodo: string;
  };
}

export interface Compatibilidade {
  pessoa1: User;
  pessoa2: Pick<User, 'nome' | 'dataNascimento'>;
  score: number;
  areas: {
    amor: number;
    comunicacao: number;
    financas: number;
    familia: number;
  };
  descricao: string;
  sugestoes: string[];
}

interface UserStore {
  user: User | null;
  mapa: MapaNumerologico | null;
  perguntasRestantes: number;
  historicoPergunta: Array<{
    pergunta: string;
    resposta: string;
    timestamp: string;
  }>;
  
  // Actions
  setUser: (user: User) => void;
  setMapa: (mapa: MapaNumerologico) => void;
  updateUser: (updates: Partial<User>) => void;
  addPergunta: (pergunta: string, resposta: string) => void;
  decrementPergunta: () => void;
  clearUser: () => void;
  resetPerguntas: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  mapa: null,
  perguntasRestantes: 3, // Para usuários gratuitos
  historicoPergunta: [],

  setUser: (user) => set({ user }),
  
  setMapa: (mapa) => set({ mapa }),
  
  updateUser: (updates) => 
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  
  addPergunta: (pergunta, resposta) =>
    set((state) => ({
      historicoPergunta: [
        {
          pergunta,
          resposta,
          timestamp: new Date().toISOString(),
        },
        ...state.historicoPergunta,
      ].slice(0, 20), // Manter apenas as últimas 20
    })),
  
  decrementPergunta: () =>
    set((state) => ({
      perguntasRestantes: Math.max(0, state.perguntasRestantes - 1),
    })),
  
  clearUser: () => set({ 
    user: null, 
    mapa: null, 
    perguntasRestantes: 3, 
    historicoPergunta: [] 
  }),
  
  resetPerguntas: () => set({ perguntasRestantes: 3 }),
}));
