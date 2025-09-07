import React, { memo, useCallback, useState } from 'react';
import { Download, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CreateAccountModal from '@/components/ui/create-account-modal';

interface HeaderProps {
  className?: string;
  onDownload?: () => void;
  onSave?: () => void;
}

function HeaderComponent({ className, onDownload, onSave }: HeaderProps) {
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else {
      console.log('Downloading document...');
    }
  }, [onDownload]);

  const handleSave = useCallback(() => {
    // Mostrar modal de criação de conta ao invés de salvar diretamente
    setShowCreateAccountModal(true);
  }, []);
  
  const handleAccountCreated = useCallback(() => {
    // Após criar conta, executar o salvamento
    if (onSave) {
      onSave();
    } else {
      console.log('Saving document after account creation...');
    }
  }, [onSave]);

  return (
    <header className={cn('flex items-center justify-between px-3 h-12 border-b border-border/50 bg-background/95 backdrop-blur-sm', className)}>
      {/* Logo e Título */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-semibold">N</span>
          </div>
          <span className="text-sm font-medium text-foreground">Nexus Editor</span>
        </div>
      </div>
      
      {/* Ações Essenciais */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 px-3 text-xs">
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Salvar
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 px-3 text-xs">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Exportar
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      <CreateAccountModal 
        open={showCreateAccountModal}
        onOpenChange={setShowCreateAccountModal}
        onAccountCreated={handleAccountCreated}
      />
    </header>
  );
}

const Header = memo(HeaderComponent);
Header.displayName = 'Header';

export default Header;