'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

function Avatar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { children?: React.ReactNode }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full border-2 border-violet-500 bg-gradient-to-br from-violet-200 to-purple-200 shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Root>
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & { children?: React.ReactNode }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-gradient-to-br from-violet-400 to-purple-600 flex size-full items-center justify-center rounded-full text-white font-bold text-lg',
        className
      )}
      {...props}
    >
      {children ? children : <span>🤖</span>}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
