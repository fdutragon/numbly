import React, { memo, useCallback, useMemo } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
}

function ConsoleComponent({ className, validations = [] }: ConsoleProps) {
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

  const getStatusColor = useCallback((type: ValidationItem['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-destructive bg-destructive/5';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'info':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-l-muted';
    }
  }, []);

  const errorCount = useMemo(() => displayValidations.filter(v => v.type === 'error').length, [displayValidations]);
  const warningCount = useMemo(() => displayValidations.filter(v => v.type === 'warning').length, [displayValidations]);

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="flex items-center justify-between p-4 pb-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conformidade</h2>
        <div className="flex items-center gap-1">
          {errorCount > 0 && (
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
          )}
          {warningCount > 0 && (
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {displayValidations.map((validation) => (
            <div
              key={validation.id}
              className={cn(
                'group p-3 rounded-lg cursor-pointer transition-all duration-200 border shadow-sm bg-card/50 backdrop-blur-sm',
                'hover:shadow-md hover:bg-card/80 hover:border-border/60',
                validation.type === 'error' && 'border-red-200/60 hover:border-red-300/80 hover:bg-red-50/30 dark:border-red-800/40 dark:hover:border-red-700/60 dark:hover:bg-red-950/20',
                validation.type === 'warning' && 'border-amber-200/60 hover:border-amber-300/80 hover:bg-amber-50/30 dark:border-amber-800/40 dark:hover:border-amber-700/60 dark:hover:bg-amber-950/20',
                validation.type === 'success' && 'border-green-200/60 hover:border-green-300/80 hover:bg-green-50/30 dark:border-green-800/40 dark:hover:border-green-700/60 dark:hover:bg-green-950/20',
                validation.type === 'info' && 'border-blue-200/60 hover:border-blue-300/80 hover:bg-blue-50/30 dark:border-blue-800/40 dark:hover:border-blue-700/60 dark:hover:bg-blue-950/20'
              )}
              onClick={() => {
                // TODO: Implementar navegação para linha específica
                console.log(`Navegando para linha ${validation.line}`);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {getIcon(validation.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {validation.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                      {validation.clause}
                    </Badge>
                    <span className="text-xs text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      L{validation.line}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            {displayValidations.length} {displayValidations.length === 1 ? 'item' : 'itens'}
          </span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-muted/50">
            <RefreshCw className="w-3 h-3 mr-1" />
            Revalidar
          </Button>
        </div>
      </div>
    </div>
  );
}

const Console = memo(ConsoleComponent);
Console.displayName = 'Console';

export default Console;