import React, { useState } from 'react';
import { User, Settings, CreditCard, LogIn, UserPlus, LogOut, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  className?: string;
  isAuthenticated?: boolean;
  userPlan?: 'free' | 'premium';
  onLogin?: () => void;
  onSignup?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onBilling?: () => void;
}

export default function UserMenu({
  className,
  isAuthenticated = false,
  userPlan = 'free',
  onLogin,
  onSignup,
  onLogout,
  onSettings,
  onBilling
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = () => {
    setIsOpen(false);
    onLogin?.();
  };

  const handleSignup = () => {
    setIsOpen(false);
    onSignup?.();
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout?.();
  };

  const handleSettings = () => {
    setIsOpen(false);
    onSettings?.();
  };

  const handleBilling = () => {
    setIsOpen(false);
    onBilling?.();
  };

  if (!isAuthenticated) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">Visitante</span>
            <span className="text-[10px] text-muted-foreground">Acesso limitado</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            onClick={handleSignup}
            className="h-6 px-2 text-[10px] font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Criar Conta
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogin}
            className="h-5 px-2 text-[10px] font-medium"
          >
            <LogIn className="w-2.5 h-2.5 mr-1" />
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            'w-full justify-start p-2 h-auto hover:bg-accent/50',
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-foreground">Usuário</span>
                {userPlan === 'premium' && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
              </div>
              <Badge 
                variant={userPlan === 'premium' ? 'default' : 'secondary'} 
                className="text-[9px] h-3 px-1"
              >
                {userPlan === 'premium' ? 'Premium' : 'Gratuito'}
              </Badge>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettings} className="text-xs">
          <Settings className="w-3.5 h-3.5 mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleBilling} className="text-xs">
          <CreditCard className="w-3.5 h-3.5 mr-2" />
          Pagamentos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-xs text-red-600">
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}