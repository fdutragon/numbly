'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/stores/auth-store';
import { useReports } from '@/lib/stores/report-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading } = useAuth();
  const { initialize } = useReports();

  useEffect(() => {
    // Verificar autenticação na inicialização
    checkAuth();
    
    // Inicializar sistema de relatórios (limpar expirados)
    initialize();
  }, [checkAuth, initialize]);

  // Mostrar loading durante verificação inicial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
