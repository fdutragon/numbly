import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ClaraScriptFlow } from './clara-script';

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
  claraFlow?: ClaraScriptFlow;
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
  updateClaraFlow: (threadId: string, flow: Partial<ClaraScriptFlow>) => void;
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
          claraFlow: {
            currentStage: 'greeting',
            userResponses: [],
            hesitationCount: 0,
            noResponseCount: 0,
            lastInteraction: timestamp,
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
        // Use client-safe ID generation
        const messageId = typeof window !== 'undefined' 
          ? `msg_${crypto.randomUUID()}` 
          : `msg_temp_${Math.random().toString(36).substr(2, 9)}`;
        
        const timestamp = typeof window !== 'undefined' ? Date.now() : 0;
        
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
                  updatedAt: typeof window !== 'undefined' ? Date.now() : 0,
                  title: thread.messages.length === 0 
                    ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                    : thread.title,
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

      updateClaraFlow: (threadId, flow) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? { 
                  ...thread, 
                  claraFlow: { 
                    ...thread.claraFlow!,
                    ...flow,
                    lastInteraction: typeof window !== 'undefined' ? Date.now() : 0,
                  },
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
