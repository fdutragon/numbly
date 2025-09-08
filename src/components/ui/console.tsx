import React, { memo, useCallback, useMemo, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getClausesByDocument } from '@/data/dao';
import type { ValidationResult, ValidationIssue } from '@/workers/validate';
import { getVariables, setVariables } from '@/data/variables';
import type { ContractVariables } from '@/data/variables';

interface ConsoleProps {
  className?: string;
  documentId?: string;
}

function ConsoleComponent({ className, documentId }: ConsoleProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [vars, setVars] = useState<ContractVariables>({
    partyAName: '',
    partyAId: '',
    partyBName: '',
    partyBId: '',
    contractValue: '',
    city: '',
    state: '',
    startDate: '',
    endDate: '',
    address: '',
  });

  // Inicializar worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const newWorker = new Worker(new URL('../../workers/validate.ts', import.meta.url), {
          type: 'module'
        });
        
        newWorker.onmessage = (e) => {
          const { results, error } = e.data;
          
          if (error) {
            console.error('Worker validation error:', error);
          } else if (results) {
            setValidationResults(results);
          }
          
          setIsValidating(false);
        };
        
        setWorker(newWorker);
        
        return () => {
          newWorker.terminate();
        };
      } catch (error) {
        console.error('Failed to initialize validation worker:', error);
      }
    }
  }, []);

  // Executar validação quando documento mudar
  useEffect(() => {
    if (documentId) {
      runValidation();
    }
  }, [documentId]);

  // Carregar variáveis do contrato
  useEffect(() => {
    try {
      setVars(getVariables());
    } catch {}
  }, []);

  const updateVar = useCallback((key: keyof ContractVariables, value: string) => {
    setVars(prev => {
      const next = { ...prev, [key]: value } as ContractVariables;
      setVariables({ [key]: value });
      return next;
    });
  }, []);

  const runValidation = useCallback(async () => {
    if (!worker || !documentId) {
      return;
    }

    try {
      setIsValidating(true);
      const clauses = await getClausesByDocument(documentId);
      
      const clausesToValidate = clauses.map(clause => ({
        id: clause.id,
        title: clause.title,
        body: clause.body
      }));

      worker.postMessage({ clauses: clausesToValidate });
    } catch (error) {
      console.error('Error running validation:', error);
      setIsValidating(false);
    }
  }, [worker, documentId]);

  // Converter ValidationResult para formato de display
  const displayValidations = useMemo(() => {
    if (validationResults.length === 0) {
      // Mock data para quando não há documento
      return [
        {
          id: '1',
          type: 'info' as const,
          message: 'Nenhum documento carregado para validação',
          clause: 'Sistema',
        },
      ];
    }

    const items: Array<{
      id: string;
      type: 'success' | 'warning' | 'error' | 'info';
      message: string;
      clause?: string;
    }> = [];

    validationResults.forEach((result) => {
      if (result.issues.length === 0) {
        items.push({
          id: result.id + '_ok',
          type: 'success',
          message: `Cláusula validada com sucesso (Score: ${result.score}/100)`,
          clause: result.id,
        });
      } else {
        result.issues.forEach((issue, index) => {
          items.push({
            id: result.id + '_' + index,
            type: issue.severity === 'high' ? 'error' : 
                  issue.severity === 'medium' ? 'warning' : 'info',
            message: issue.message + (issue.suggestion ? ` - ${issue.suggestion}` : ''),
            clause: result.id,
          });
        });
      }
    });

    return items;
  }, [validationResults]);

  const getIcon = useCallback((type: 'success' | 'warning' | 'error' | 'info') => {
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

  const getStatusColor = useCallback((type: 'success' | 'warning' | 'error' | 'info') => {
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
        {/* Variáveis (topo) */}
        <div className="space-y-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wide">Variáveis do Contrato</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Parte A - Nome" value={vars.partyAName} onChange={e => updateVar('partyAName', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Parte A - CPF/CNPJ" value={vars.partyAId} onChange={e => updateVar('partyAId', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Parte B - Nome" value={vars.partyBName} onChange={e => updateVar('partyBName', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Parte B - CPF/CNPJ" value={vars.partyBId} onChange={e => updateVar('partyBId', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Valor (R$)" value={vars.contractValue} onChange={e => updateVar('contractValue', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Cidade" value={vars.city} onChange={e => updateVar('city', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Estado" value={vars.state} onChange={e => updateVar('state', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Início (DD/MM/AAAA)" value={vars.startDate} onChange={e => updateVar('startDate', e.target.value)} />
            <input className="h-8 rounded-md border bg-background px-2 text-xs" placeholder="Término (DD/MM/AAAA)" value={vars.endDate} onChange={e => updateVar('endDate', e.target.value)} />
          </div>
          <textarea className="min-h-16 rounded-md border bg-background px-2 py-1 text-xs" placeholder="Endereço completo" value={vars.address} onChange={e => updateVar('address', e.target.value)} />
          <div className="h-px bg-border/60" />
        </div>

        {/* Alerts (abaixo) */}
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
                // TODO: Implementar navegação para cláusula específica
                console.log(`Navegando para cláusula ${validation.clause}`);
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs hover:bg-muted/50"
            onClick={runValidation}
            disabled={isValidating || !documentId}
          >
            {isValidating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            {isValidating ? 'Validando...' : 'Revalidar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const Console = memo(ConsoleComponent);
Console.displayName = 'Console';

export default Console;