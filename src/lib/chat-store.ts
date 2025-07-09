import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type ClaraState, createInitialClaraState } from './clara-ai-engine';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isTyping?: boolean;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  claraState?: ClaraState;
};

interface ChatStore {
  threads: ChatThread[];
  currentThreadId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  
  // Actions
  createThread: () => string;
  setCurrentThread: (threadId: string) => void;
  addMessage: (threadId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (threadId: string, messageId: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  getCurrentThread: () => ChatThread | null;
  deleteThread: (threadId: string) => void;
  updateClaraState: (threadId: string, state: ClaraState) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      threads: [],
      currentThreadId: null,
      isLoading: false,
      isTyping: false,

      createThread: () => {
        // Only generate dynamic values when actually called (client-side)
        const threadId = typeof window !== 'undefined' 
          ? `thread_${crypto.randomUUID()}` 
          : `thread_temp_${Math.random().toString(36).substr(2, 9)}`;
        
        const timestamp = typeof window !== 'undefined' ? Date.now() : 0;
        
        const newThread: ChatThread = {
          id: threadId,
          title: 'New Chat',
          messages: [],
          createdAt: timestamp,
          updatedAt: timestamp,
          claraState: {
            ...createInitialClaraState(),
            lastInteraction: timestamp,
            salesMetrics: {
              ...createInitialClaraState().salesMetrics,
              lastActiveTime: timestamp,
            },
          },
        };

        set((state) => ({
          threads: [newThread, ...state.threads],
          currentThreadId: threadId,
        }));

        return threadId;
      },

      setCurrentThread: (threadId) => {
        set({ currentThreadId: threadId });
      },

      addMessage: (threadId, message: Omit<Message, 'id' | 'timestamp'>) => {
        // Geração de ID e timestamp só no cliente
        let messageId = '';
        let timestamp = 0;
        if (typeof window !== 'undefined') {
          messageId = `msg_${crypto.randomUUID()}`;
          timestamp = Date.now();
        } else {
          // SSR: use valores fixos para evitar mismatch
          messageId = 'ssr-msg';
          timestamp = 0;
        }
        const messageWithMeta: Message = {
          ...message,
          id: messageId,
          timestamp,
        };
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, messageWithMeta],
                  updatedAt: Date.now(),
                }
              : thread
          ),
        }));
      },

      updateMessage: (threadId, messageId, updates) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: thread.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: typeof window !== 'undefined' ? Date.now() : 0,
                }
              : thread
          ),
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setTyping: (typing) => set({ isTyping: typing }),

      getCurrentThread: () => {
        const { threads, currentThreadId } = get();
        return threads.find((thread) => thread.id === currentThreadId) || null;
      },

      deleteThread: (threadId) => {
        set((state) => ({
          threads: state.threads.filter((thread) => thread.id !== threadId),
          currentThreadId: state.currentThreadId === threadId ? null : state.currentThreadId,
        }));
      },

      updateClaraState: (threadId: string, state: ClaraState) => {
        set((currentState) => ({
          threads: currentState.threads.map((thread) =>
            thread.id === threadId
              ? { 
                  ...thread, 
                  claraState: state,
                  updatedAt: typeof window !== 'undefined' ? Date.now() : 0,
                }
              : thread
          ),
        }));
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        threads: state.threads,
        currentThreadId: state.currentThreadId,
      }),
    }
  )
);
