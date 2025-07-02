'use client';

import React from 'react';
import { useUserStore } from '@/lib/stores/user-store';

interface AppBarProps {
  title: string;
  backHref?: string;
}

export function AppBar({ title, backHref }: AppBarProps) {
  const { user } = useUserStore();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {backHref && (
            <a href={backHref} className="text-gray-600 hover:text-gray-900">
              Voltar
            </a>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {user?.nome && (
            <span className="text-sm text-gray-600">
              Olá, {user.nome.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
