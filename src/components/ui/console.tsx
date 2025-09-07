import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, RefreshCw, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ValidationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  clause?: string;
  line?: number;
}

interface ConsoleProps {
  className?: string;
  validations?: ValidationItem[];
  showUnsavedWarning?: boolean;
}

function ConsoleComponent({ className, validations = [], showUnsavedWarning = true }: ConsoleProps) {
  const [showUnsavedNotification, setShowUnsavedNotification] = useState(false);
  
  // Timer para mostrar notificação de 'não salvo' após 30 segundos
  useEffect(() => {
    if (!showUnsavedWarning) return;
    
    const timer = setTimeout(() => {
      setShowUnsavedNotification(true);
    }, 30000); // 30 segundos
    
    return () => clearTimeout(timer);
  }, [showUnsavedWarning]);
  
  // Função para dispensar a notificação
  const dismissUnsavedNotification = useCallback(() => {
    setShowUnsavedNotification(false);
  }, []);
  const mockValidations = useMemo(() => [
    {
      id: '1',
      type: 'error' as const,
      message: 'CPF inválido na cláusula 3.1',
      clause: 'Dados do Contratante',
      line: 15,
    },
    {
      id: '2',
      type: 'warning' as const,
      message: 'Data de vencimento muito próxima',
      clause: 'Prazo de Vigência',
      line: 28,
    },
    {
      id: '3',
      type: 'success' as const,
      message: 'Cláusula de rescisão conforme legislação',
      clause: 'Rescisão Contratual',
      line: 45,
    },
    {
      id: '4',
      type: 'info' as const,
      message: 'Sugestão: adicionar cláusula de confidencialidade',
      clause: 'Disposições Gerais',
      line: 52,
    },
  ], []);

  const displayValidations = useMemo(() => {
    return validations.length > 0 ? validations : mockValidations;
  }, [validations, mockValidations]);

  const getIcon = useCallback((type: ValidationItem['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  }, []);

  const getValidationBorderClass = useCallback((type: ValidationItem['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'success':
        return 'border-l-green-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-muted';
    }
  }, []);

  const errorCount = useMemo(() => displayValidations.filter(v => v.type === 'error').length, [displayValidations]);
  const warningCount = useMemo(() => displayValidations.filter(v => v.type === 'warning').length, [displayValidations]);
  const successCount = useMemo(() => displayValidations.filter(v => v.type === 'success').length, [displayValidations]);
  const infoCount = useMemo(() => displayValidations.filter(v => v.type === 'info').length, [displayValidations]);

  const overallStatus = useMemo(() => {
    if (errorCount > 0) return 'error';
    if (warningCount > 0) return 'warning';
    return 'success';
  }, [errorCount, warningCount]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header limpo e centralizado */}
      <div className="px-4 py-4 border-b border-border/30">
        <div className="flex items-center justify-center mb-4">
          <div className="text-center">
            <h2 className="text-sm font-medium text-foreground">Console de Conformidade</h2>
            <p className="text-xs text-muted-foreground mt-1">Análise em tempo real</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                overallStatus === 'error' && 'bg-red-500',
                overallStatus === 'warning' && 'bg-amber-500',
                overallStatus === 'success' && 'bg-green-500'
              )} />
              {overallStatus === 'error' && 'Requer Atenção'}
              {overallStatus === 'warning' && 'Revisar'}
              {overallStatus === 'success' && 'Conforme'}
            </div>
          </div>
          
          {/* Estatísticas simplificadas */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-xs font-medium text-foreground">{errorCount}</span>
              <span className="text-xs text-muted-foreground">Erros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-medium text-foreground">{warningCount}</span>
              <span className="text-xs text-muted-foreground">Avisos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs font-medium text-foreground">{successCount}</span>
              <span className="text-xs text-muted-foreground">OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Info className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-medium text-foreground">{infoCount}</span>
              <span className="text-xs text-muted-foreground">Info</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notificação de não salvo */}
      {showUnsavedNotification && (
        <div className="mx-4 mt-4 p-3 border border-border/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Documento não salvo
                </p>
                <p className="text-xs text-muted-foreground">
                  Suas alterações podem ser perdidas. Considere criar uma conta para salvar.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissUnsavedNotification}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <AlertCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Cards de validação modernos */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {displayValidations.map((validation) => (
            <Card
              key={validation.id}
              className={cn(
                'group cursor-pointer transition-all duration-200 hover:shadow-md border-l-4',
                getValidationBorderClass(validation.type)
              )}
              onClick={() => {
                // TODO: Implementar navegação para linha específica
                console.log(`Navegando para linha ${validation.line}`);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2">
                    {getIcon(validation.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed font-medium mb-2 group-hover:text-foreground/90 transition-colors">
                      {validation.message}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-1 font-medium border border-border/50"
                      >
                        {validation.clause}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">
                          Linha {validation.line}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Footer simplificado */}
      <div className="border-t border-border/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">
                {displayValidations.length} {displayValidations.length === 1 ? 'validação' : 'validações'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground/70">
              Última atualização: agora
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {errorCount === 0 && warningCount === 0 ? 'Tudo OK' : `${errorCount + warningCount} pendências`}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Revalidar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Console = memo(ConsoleComponent);
Console.displayName = 'Console';

export default Console;