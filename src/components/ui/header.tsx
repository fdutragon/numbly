import React, { memo, useCallback } from 'react';
import { Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
  onDownload?: () => void;
}

function HeaderComponent({ className, onDownload }: HeaderProps) {
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else {
      // Mock download functionality
      console.log('Downloading document...');
      // Here you would implement the actual download logic
    }
  }, [onDownload]);

  return (
    <header className={cn('flex items-center justify-between px-6 h-16 border-b bg-background', className)}>
      <div className="flex items-center gap-4">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-muted-foreground">Salvo automaticamente</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Exportar .docx
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

const Header = memo(HeaderComponent);
Header.displayName = 'Header';

export default Header;