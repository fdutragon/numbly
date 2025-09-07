'use client';

import React, { useState } from 'react';
import { 
  InboxIcon, 
  FileTextIcon, 
  PenToolIcon, 
  SearchIcon, 
  UploadIcon, 
  UserPlusIcon,
  PlusIcon,
  EditIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NavbarProps {
  onNewDocument?: () => void;
  onImportDocument?: () => void;
  onInvitePerson?: () => void;
  onSearch?: (query: string) => void;
}

export default function Navbar({
  onNewDocument,
  onImportDocument,
  onInvitePerson,
  onSearch
}: NavbarProps) {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    setIsSearchOpen(false);
  };

  const navItems = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: InboxIcon,
      count: 3
    },
    {
      id: 'contracts',
      label: 'Meus Contratos',
      icon: FileTextIcon,
      count: 12
    },
    {
      id: 'signatures',
      label: 'Assinaturas Pendentes',
      icon: PenToolIcon,
      count: 5
    }
  ];

  return (
    <TooltipProvider>
      <div className="h-16 bg-background border-b border-border/30 flex items-center justify-between px-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-primary">
            Aether
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`flex items-center gap-2 px-4 py-2 h-9 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
                {item.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isActive 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Importar Documento */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-9"
                onClick={onImportDocument}
              >
                <UploadIcon className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Importar Documento</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Importar documento existente</p>
            </TooltipContent>
          </Tooltip>

          {/* Convidar Pessoa */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-9"
                onClick={onInvitePerson}
              >
                <UserPlusIcon className="w-4 h-4 text-green-600" />
                <span className="hidden sm:inline">Convidar Pessoa</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Convidar pessoa para colaborar</p>
            </TooltipContent>
          </Tooltip>

          {/* Novo Documento */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-9"
                onClick={onNewDocument}
              >
                <EditIcon className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Criar novo documento</p>
            </TooltipContent>
          </Tooltip>

          {/* Pesquisar */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    <SearchIcon className="w-4 h-4 text-orange-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pesquisar documentos</p>
                </TooltipContent>
              </Tooltip>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Pesquisar Documentos</h4>
                  <Input
                    placeholder="Digite sua pesquisa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Pesquisar
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TooltipProvider>
  );
}