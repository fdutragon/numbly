import * as React from 'react';
import { cn } from '@/lib/utils';

interface EditorShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const EditorShell = ({
  children,
  className,
  ...props
}: EditorShellProps) => {
  return (
    <div
      className={cn(
        'relative w-full h-full flex-1 overflow-y-auto editor-content-padding',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};