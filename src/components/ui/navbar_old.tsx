'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, MessageCircle, Users, User, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
	{ name: '', href: '/dashboard', icon: Home },
	{ name: '', href: '/about', icon: Info },
	{ name: 'Oráculo', href: '/chat', icon: Bot, highlight: true },
	{ name: '', href: '/friends', icon: Users },
	{ name: '', href: '/profile', icon: User },
];

export function NavBar() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950/90 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950/90 shadow-2xl border-t border-gray-800/80 px-2 py-1.5 z-50 backdrop-blur-xl">
			<div className="flex items-center justify-center gap-1 max-w-md mx-auto">
				{navItems.map((item, idx) => {
					const isActive = pathname === item.href;
					const Icon = item.icon;
					const isCenter = idx === 2;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex flex-col items-center flex-1 px-1 py-0.5 rounded-xl transition-all duration-150 group',
								isCenter
									? 'relative z-10'
									: '',
								isActive
									? 'text-purple-400 bg-purple-900/40 shadow-md scale-105'
									: 'text-gray-400 hover:text-purple-300 hover:bg-gray-800/60'
							)}
							style={isCenter ? { minWidth: 72 } : { minWidth: 48 }}
						>
							<span className={cn(
								'relative flex items-center justify-center',
								isCenter ? 'rounded-full bg-gradient-to-br from-purple-700 via-blue-700 to-purple-900 shadow-xl border-4 border-gray-950 -mt-6 mb-0.5 w-14 h-14 scale-110 animate-float' : 'mb-0.5 w-6 h-6'
							)}>
								{isCenter ? (
									<>
										<Icon className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(168,85,247,0.5)]" />
										<Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 opacity-80 animate-pulse" />
									</>
								) : (
									<Icon className="w-5 h-5" />
								)}
							</span>
							{item.name && (
								<span className={cn(
									'text-[10px] font-semibold tracking-tight leading-none mt-0.5',
									isCenter ? 'text-purple-200' : ''
								)}>
									{item.name}
								</span>
							)}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
