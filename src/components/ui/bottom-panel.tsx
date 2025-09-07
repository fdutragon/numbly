import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, AlertTriangle, Info, AlertCircle, Terminal, Bug, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface LogEntry {
  id: string;
  type: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  source?: string;
}

interface BottomPanelProps {
  className?: string;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    type: 'info',
    message: 'Documento salvo automaticamente',
    timestamp: new Date(Date.now() - 30000),
    source: 'AutoSave'
  },
  {
    id: '2',
    type: 'warning',
    message: 'Cláusula 3.2 pode precisar de revisão legal',
    timestamp: new Date(Date.now() - 120000),
    source: 'LegalCheck'
  },
  {
    id: '3',
    type: 'error',
    message: 'Falha na validação do CPF: formato inválido',
    timestamp: new Date(Date.now() - 300000),
    source: 'Validator'
  },
  {
    id: '4',
    type: 'debug',
    message: 'Executando autocomplete para cláusula atual',
    timestamp: new Date(Date.now() - 5000),
    source: 'AI'
  }
];

function LogIcon({ type }: { type: LogEntry['type'] }) {
  switch (type) {
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
    case 'info':
      return <Info className="w-3.5 h-3.5 text-blue-500" />;
    case 'debug':
      return <Bug className="w-3.5 h-3.5 text-gray-500" />;
    default:
      return <Info className="w-3.5 h-3.5 text-gray-500" />;
  }
}

function LogEntry({ log }: { log: LogEntry }) {
  const timeString = log.timestamp.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-muted/30 text-xs">
      <LogIcon type={log.type} />
      <span className="text-muted-foreground font-mono">{timeString}</span>
      {log.source && (
        <Badge variant="outline" className="h-4 px-1.5 text-xs">
          {log.source}
        </Badge>
      )}
      <span className="flex-1 text-foreground">{log.message}</span>
    </div>
  );
}

export default function BottomPanel({ 
  className, 
  initialHeight = 200, 
  minHeight = 100, 
  maxHeight = 400 
}: BottomPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState('console');
  const [currentFile, setCurrentFile] = useState('contrato-prestacao-servicos.docx');
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const logs = mockLogs;
  const errorCount = logs.filter(log => log.type === 'error').length;
  const warningCount = logs.filter(log => log.type === 'warning').length;
  const infoCount = logs.filter(log => log.type === 'info').length;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    e.preventDefault();
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = startYRef.current - e.clientY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeightRef.current + deltaY));
    setHeight(newHeight);
  }, [isResizing, minHeight, maxHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleClose = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return (
    <div 
      ref={panelRef}
      className={cn(
        'bg-background border-t border-border/50 transition-all duration-200 ease-in-out',
        className
      )}
      style={{ 
        height: isExpanded ? `${height}px` : '32px',
        minHeight: isExpanded ? `${minHeight}px` : '32px'
      }}
    >
      {/* Resize Handle */}
      {isExpanded && (
        <div
          className="h-1 bg-transparent hover:bg-blue-500/20 cursor-row-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={toggleExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </Button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium">Console</span>
            
            {/* Contadores */}
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-500">{errorCount}</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-yellow-500">{warningCount}</span>
                </div>
              )}
              {infoCount > 0 && (
                <div className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-500">{infoCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="h-8 bg-transparent border-b border-border/50 rounded-none px-3">
              <TabsTrigger value="console" className="h-6 px-3 text-xs data-[state=active]:bg-muted">
                <Terminal className="w-3 h-3 mr-1.5" />
                Console
              </TabsTrigger>
              <TabsTrigger value="problems" className="h-6 px-3 text-xs data-[state=active]:bg-muted">
                <AlertTriangle className="w-3 h-3 mr-1.5" />
                Problemas
                {(errorCount + warningCount) > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-xs">
                    {errorCount + warningCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="output" className="h-6 px-3 text-xs data-[state=active]:bg-muted">
                <Info className="w-3 h-3 mr-1.5" />
                Saída
              </TabsTrigger>
              <TabsTrigger value="visiting" className="h-6 px-3 text-xs data-[state=active]:bg-muted">
                <Eye className="w-3 h-3 mr-1.5" />
                Visitando
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="console" className="flex-1 overflow-y-auto m-0 p-0">
              <div className="space-y-0">
                {logs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="problems" className="flex-1 overflow-y-auto m-0 p-0">
              <div className="space-y-0">
                {logs.filter(log => log.type === 'error' || log.type === 'warning').map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="output" className="flex-1 overflow-y-auto m-0 p-0">
              <div className="space-y-0">
                {logs.filter(log => log.type === 'info' || log.type === 'debug').map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="visiting" className="flex-1 overflow-y-auto m-0 p-0">
              <div className="p-3">
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{currentFile}</div>
                    <div className="text-xs text-muted-foreground">Documento ativo • Última modificação: há 2 minutos</div>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estatísticas</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cláusulas:</span>
                      <span>12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Palavras:</span>
                      <span>1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Caracteres:</span>
                      <span>8,934</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Páginas:</span>
                      <span>3</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs">Salvo automaticamente</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      

    </div>
  );
}