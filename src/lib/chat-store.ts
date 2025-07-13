import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isTyping?: boolean;
};

export type ChatThread = {
  id: string;
  messages: Message[];
  updatedAt: number;
  claraState?: Record<string, unknown>;
};

interface ChatStore {
  currentThreadId: string | null;
  threads: Record<string, ChatThread>;
  isLoading: boolean;
  isTyping: boolean;

  // Actions
  createThread: () => string;
  getCurrentThread: () => ChatThread | null;
  setCurrentThread: (threadId: string) => void;
  addMessage: (threadId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (threadId: string, messageId: string, updates: Partial<Message>) => void;
  updateClaraState: (threadId: string, state: Record<string, unknown>) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
}

// Função UUID simples
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentThreadId: null,
      threads: {},
      isLoading: false,
      isTyping: false,

      createThread: () => {
        const threadId = generateId();
        const timestamp = Date.now();
        
        set(state => ({
          threads: {
            ...state.threads,
            [threadId]: {
              id: threadId,
              messages: [],
              updatedAt: timestamp
            }
          },
          currentThreadId: threadId
        }));
        
        return threadId;
      },

      getCurrentThread: () => {
        const { currentThreadId, threads } = get();
        return currentThreadId ? threads[currentThreadId] : null;
      },

      setCurrentThread: (threadId) => {
        if (get().threads[threadId]) {
          set({ currentThreadId: threadId });
        }
      },

      addMessage: (threadId, message) => {
        const messageWithMeta = {
          ...message,
          id: generateId(),
          timestamp: Date.now()
        };

        set(state => ({
          threads: {
            ...state.threads,
            [threadId]: {
              ...state.threads[threadId],
              messages: [...state.threads[threadId].messages, messageWithMeta],
              updatedAt: Date.now()
            }
          }
        }));
      },

      updateMessage: (threadId, messageId, updates) => {
        set(state => ({
          threads: {
            ...state.threads,
            [threadId]: {
              ...state.threads[threadId],
              messages: state.threads[threadId].messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
              updatedAt: Date.now()
            }
          }
        }));
      },

      updateClaraState: (threadId, newState) => {
        set(state => {
          const thread = state.threads[threadId];
          if (!thread) return state;

          return {
            ...state,
            threads: {
              ...state.threads,
              [threadId]: {
                ...thread,
                claraState: newState,
                updatedAt: Date.now()
              }
            }
          };
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setTyping: (typing) => set({ isTyping: typing })
    }),
    {
      name: 'chat-store'
    }
  )
);
