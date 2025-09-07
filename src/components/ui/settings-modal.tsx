import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Palette, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsSaved?: () => void;
}

interface UserSettings {
  name: string;
  email: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
  };
  editor: {
    autoSave: boolean;
    spellCheck: boolean;
    wordWrap: boolean;
  };
}

export default function SettingsModal({
  open,
  onOpenChange,
  onSettingsSaved
}: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>({
    name: 'Usuário',
    email: 'usuario@email.com',
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      analytics: true,
      crashReports: true
    },
    editor: {
      autoSave: true,
      spellCheck: true,
      wordWrap: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section] as any,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implementar salvamento das configurações no Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Configurações salvas:', settings);
      setHasChanges(false);
      onSettingsSaved?.();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja sair mesmo assim?');
      if (!confirm) return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Configurações
          </DialogTitle>
          <DialogDescription>
            Personalize sua experiência no editor.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="text-xs">
              <User className="w-3.5 h-3.5 mr-1" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">
              <Bell className="w-3.5 h-3.5 mr-1" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Privacidade
            </TabsTrigger>
            <TabsTrigger value="editor" className="text-xs">
              <Palette className="w-3.5 h-3.5 mr-1" />
              Editor
            </TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto max-h-96 mt-4">
            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tema</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => handleInputChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notificações por email</Label>
                  <p className="text-xs text-muted-foreground">Receber atualizações por email</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => handleNestedChange('notifications', 'email', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notificações push</Label>
                  <p className="text-xs text-muted-foreground">Receber notificações no navegador</p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => handleNestedChange('notifications', 'push', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Marketing</Label>
                  <p className="text-xs text-muted-foreground">Receber ofertas e novidades</p>
                </div>
                <Switch
                  checked={settings.notifications.marketing}
                  onCheckedChange={(checked) => handleNestedChange('notifications', 'marketing', checked)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Analytics</Label>
                  <p className="text-xs text-muted-foreground">Ajudar a melhorar o produto</p>
                </div>
                <Switch
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) => handleNestedChange('privacy', 'analytics', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Relatórios de erro</Label>
                  <p className="text-xs text-muted-foreground">Enviar relatórios automáticos de erro</p>
                </div>
                <Switch
                  checked={settings.privacy.crashReports}
                  onCheckedChange={(checked) => handleNestedChange('privacy', 'crashReports', checked)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="editor" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Salvamento automático</Label>
                  <p className="text-xs text-muted-foreground">Salvar alterações automaticamente</p>
                </div>
                <Switch
                  checked={settings.editor.autoSave}
                  onCheckedChange={(checked) => handleNestedChange('editor', 'autoSave', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Correção ortográfica</Label>
                  <p className="text-xs text-muted-foreground">Destacar erros de ortografia</p>
                </div>
                <Switch
                  checked={settings.editor.spellCheck}
                  onCheckedChange={(checked) => handleNestedChange('editor', 'spellCheck', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Quebra de linha</Label>
                  <p className="text-xs text-muted-foreground">Quebrar linhas longas automaticamente</p>
                </div>
                <Switch
                  checked={settings.editor.wordWrap}
                  onCheckedChange={(checked) => handleNestedChange('editor', 'wordWrap', checked)}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="min-w-24"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}