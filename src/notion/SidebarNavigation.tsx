import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarNavigationProps {
  pages: { id: string; title: string }[];
  currentPageId: string;
  onSelect: (id: string) => void;
}

export function SidebarNavigation({ pages, currentPageId, onSelect }: SidebarNavigationProps) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-full flex flex-col">
      <div className="p-4 font-bold text-lg text-white">Notion</div>
      <nav className="flex-1 overflow-y-auto">
        {pages.map(page => (
          <button
            key={page.id}
            className={cn(
              'w-full text-left px-4 py-2 rounded transition-colors',
              page.id === currentPageId ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'
            )}
            onClick={() => onSelect(page.id)}
          >
            {page.title}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button className="w-full py-2 text-sm text-gray-400 hover:text-white">+ Nova Página</button>
      </div>
    </aside>
  );
}
