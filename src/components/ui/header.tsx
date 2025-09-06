import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
  onDownload?: () => void;
}

const Header: React.FC<HeaderProps> = ({ className, onDownload }) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDownload();
    }
  };

  return (
    <header 
      className={cn(
        'flex items-center justify-between px-6 py-4 bg-background border-b border-border',
        className
      )}
      role="banner"
    >
      <div className="flex items-center">
        <Logo size="md" />
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Baixar documento"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Download
        </Button>
      </div>
    </header>
  );
};

export default Header;