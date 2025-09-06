import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ValidationItem {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
  clause?: string;
}

interface ConsoleProps {
  className?: string;
  validations?: ValidationItem[];
}

const Console: React.FC<ConsoleProps> = ({ className, validations = [] }) => {
  const getIcon = (type: ValidationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />;
    }
  };

  const getBadgeVariant = (type: ValidationItem['type']) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
    }
  };

  const mockValidations: ValidationItem[] = [
    {
      id: '1',
      type: 'success',
      message: 'Formato de CPF válido',
      clause: 'Cláusula 1'
    },
    {
      id: '2',
      type: 'warning',
      message: 'Data de vencimento próxima',
      clause: 'Cláusula 3'
    },
    {
      id: '3',
      type: 'error',
      message: 'CNPJ inválido detectado',
      clause: 'Cláusula 5'
    }
  ];

  const displayValidations = validations.length > 0 ? validations : mockValidations;

  return (
    <div 
      className={cn(
        'flex flex-col h-full bg-card border-r border-border',
        className
      )}
      role="complementary"
      aria-label="Console de conformidade"
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Console</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Validações e conformidade
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {displayValidations.map((validation) => (
            <div
              key={validation.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${validation.type}: ${validation.message}`}
            >
              {getIcon(validation.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={getBadgeVariant(validation.type)}
                    className="text-xs"
                  >
                    {validation.type.toUpperCase()}
                  </Badge>
                  {validation.clause && (
                    <span className="text-xs text-muted-foreground">
                      {validation.clause}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {validation.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Console;