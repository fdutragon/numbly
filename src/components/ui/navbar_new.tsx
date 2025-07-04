'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, MessageCircle, Users, User, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Início', href: '/dashboard', icon: Home },
  { name: 'Amor', href: '/compatibilidade', icon: Heart },
  { name: 'Oráculo', href: '/chat', icon: MessageCircle, highlight: true },
  { name: 'Amigos', href: '/friends', icon: Users },
  { name: 'Perfil', href: '/profile', icon: User },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isHighlight = item.highlight;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all duration-200',
                isActive
                  ? isHighlight
                    ? 'text-purple-600'
                    : 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center mb-1 transition-all duration-200',
                isHighlight
                  ? isActive
                    ? 'w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-lg'
                    : 'w-8 h-8 bg-gray-100 rounded-full'
                  : isActive
                    ? 'w-8 h-8 bg-gray-100 rounded-full'
                    : 'w-6 h-6'
              )}>
                <Icon className={cn(
                  'transition-all duration-200',
                  isHighlight
                    ? isActive
                      ? 'w-5 h-5 text-white'
                      : 'w-4 h-4 text-gray-600'
                    : isActive
                      ? 'w-4 h-4'
                      : 'w-5 h-5'
                )} />
                
                {isHighlight && isActive && (
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
              
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                isActive
                  ? isHighlight
                    ? 'text-purple-600'
                    : 'text-gray-900'
                  : 'text-gray-500'
              )}>
                {item.name}
              </span>
              
              {isActive && (
                <div className={cn(
                  'absolute -bottom-[9px] w-1 h-1 rounded-full transition-all duration-200',
                  isHighlight ? 'bg-purple-600' : 'bg-gray-900'
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
