import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nome: string;
  dataNascimento: string;
  isAuthenticated: boolean;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user: { ...user, isAuthenticated: true }, isLoading: false }),
      logout: () => set({ user: null, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Hook para facilitar o uso
export const useAuth = () => {
  const { user, isLoading, setUser, logout, setLoading } = useAuthStore();
  
  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      logout();
      window.location.href = '/api/auth/register';
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user?.isAuthenticated,
    checkAuth,
    logout: handleLogout,
    setUser,
  };
};
