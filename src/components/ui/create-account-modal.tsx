import React, { useState } from 'react';
import { User, Mail, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CreateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated?: () => void;
}

export default function CreateAccountModal({ 
  open, 
  onOpenChange, 
  onAccountCreated 
}: CreateAccountModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular criação de conta
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Conta criada:', formData);
    setIsLoading(false);
    onOpenChange(false);
    
    if (onAccountCreated) {
      onAccountCreated();
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', password: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Criar Conta
          </DialogTitle>
          <DialogDescription>
            Crie sua conta para salvar e sincronizar seus documentos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10"
                minLength={8}
                required
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
        
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{' '}
            <button className="text-blue-500 hover:underline">
              Termos de Uso
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}