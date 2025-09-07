'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testDexiePersistence, cleanupTestData } from '@/data/test-dexie';

interface TestResult {
  isOpen?: boolean;
  tablesCount?: number;
  messagesCount?: number;
  directCount?: number;
  outboxCount?: number;
  success?: boolean;
  error?: string;
}

export function DexieTest() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    console.log('🚀 Iniciando teste do Dexie...');
    
    try {
      const testResult = await testDexiePersistence();
      setResult(testResult);
      console.log('📊 Resultado do teste:', testResult);
    } catch (error) {
      console.error('❌ Erro durante o teste:', error);
      setResult({ 
        error: error instanceof Error ? error.message : String(error),
        success: false 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    console.log('🧹 Limpando dados de teste...');
    await cleanupTestData();
    setResult(null);
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Teste de Persistência Dexie</h3>
      
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          variant="default"
        >
          {isLoading ? 'Testando...' : 'Testar Dexie'}
        </Button>
        
        <Button 
          onClick={handleCleanup}
          variant="outline"
        >
          Limpar Dados
        </Button>
      </div>

      {result && (
        <div className="space-y-2 text-sm">
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>Status:</strong> {result.success ? '✅ Funcionando' : '❌ Com problemas'}
          </div>
          
          {result.error && (
            <div className="p-3 rounded bg-red-100 text-red-800">
              <strong>Erro:</strong> {result.error}
            </div>
          )}
          
          {result.isOpen !== undefined && (
            <div className="p-2 bg-muted rounded">
              <strong>Banco aberto:</strong> {result.isOpen ? 'Sim' : 'Não'}
            </div>
          )}
          
          {result.tablesCount !== undefined && (
            <div className="p-2 bg-muted rounded">
              <strong>Tabelas:</strong> {result.tablesCount}
            </div>
          )}
          
          {result.messagesCount !== undefined && (
            <div className="p-2 bg-muted rounded">
              <strong>Mensagens encontradas:</strong> {result.messagesCount}
            </div>
          )}
          
          {result.directCount !== undefined && (
            <div className="p-2 bg-muted rounded">
              <strong>Total no banco:</strong> {result.directCount}
            </div>
          )}
          
          {result.outboxCount !== undefined && (
            <div className="p-2 bg-muted rounded">
              <strong>Itens na outbox:</strong> {result.outboxCount}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded text-sm">
        <strong>💡 Dica:</strong> Abra o console do navegador (F12) para ver logs detalhados do teste.
      </div>
    </div>
  );
}