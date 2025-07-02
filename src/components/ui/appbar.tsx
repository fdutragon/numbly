'use client';

import React from 'react';
import { useUserStore } from '@/lib/stores/user-store';
import Link from 'next/link';

interface AppBarProps {
  title: string;
  backHref?: string;
  subtitle?: string;
  showProfile?: boolean;
  actions?: React.ReactNode;
}

export function AppBar({ 
  title, 
  backHref, 
  subtitle, 
  showProfile = true, 
  actions 
}: AppBarProps) {
  const { user } = useUserStore();

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 shadow-lg">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            {backHref && (
              <Link 
                href={backHref} 
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>✨</span>
                <span>{title}</span>
              </h1>
              {subtitle && (
                <p className="text-purple-100 text-sm mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {actions}
            
            {showProfile && user?.nome && (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-white font-medium text-sm">
                    Olá, {user.nome.split(' ')[0]}! 👋
                  </div>
                  <div className="text-purple-200 text-xs">
                    Destino: {user.numeroDestino || '?'}
                  </div>
                </div>
                
                <Link 
                  href="/profile"
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Gradiente inferior para profundidade */}
      <div className="h-1 bg-gradient-to-r from-purple-800 via-purple-900 to-blue-800"></div>
    </div>
  );
}
