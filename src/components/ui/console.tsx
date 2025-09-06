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
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4" />;
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
    <div className={cn('flex flex-col h-full bg-background border rounded-lg', className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Console de Conformidade</h2>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount} erro{errorCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              {warningCount} aviso{warningCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {displayValidations.map((validation) => (
            <div
              key={validation.id}
              className={cn(
                'p-3 rounded-md border-l-4 cursor-pointer hover:bg-accent/50 transition-colors',
                getStatusColor(validation.type)
              )}
              onClick={() => {
                // TODO: Implementar navegação para linha específica
                console.log(`Navegando para linha ${validation.line}`);
              }}
            >
              <div className="flex items-start gap-3">
                {getIcon(validation.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {validation.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {validation.clause}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      Linha {validation.line}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total: {displayValidations.length} item{displayValidations.length !== 1 ? 's' : ''}</span>
          <Button variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
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