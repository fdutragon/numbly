import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xl',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-12 h-12 text-3xl'
  };

  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold font-sans transition-all duration-200 hover:scale-105 cursor-pointer shadow-md',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label="Logo N"
      tabIndex={0}
    >
      N
    </div>
  );
};

export default Logo;