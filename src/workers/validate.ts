/**
 * Web Worker para validação de conformidade legal
 * Executa validações em background sem bloquear a UI
 */

// Tipos de dados que o worker receberá
interface ValidationRequest {
  clauses: Array<{
    id: string;
    body: string;
    title: string;
  }>;
}

interface ValidationResult {
  id: string;
  status: 'OK' | 'ALERTA' | 'ERRO';
  issues: ValidationIssue[];
  score: number; // 0-100, onde 100 é perfeito
}

interface ValidationIssue {
  type: 'cpf' | 'cnpj' | 'data' | 'valor' | 'clausula' | 'formatacao' | 'juridico';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
  position?: { start: number; end: number };
}

// Padrões regex para validações
const PATTERNS = {
  // CPF: 999.999.999-99 ou 99999999999
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}[-\.]?\d{2}\b/g,
  cpf_valid: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  
  // CNPJ: 99.999.999/9999-99 ou 99999999999999
  cnpj: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}[-\.]?\d{2}\b/g,
  cnpj_valid: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  
  // Data: DD/MM/AAAA ou DD-MM-AAAA
  data: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/g,
  data_valid: /^\d{2}\/\d{2}\/\d{4}$/,
  
  // Valores monetários: R$ 9.999,99
  valor: /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g,
  
  // CEP: 99999-999
  cep: /\b\d{5}-?\d{3}\b/g,
  cep_valid: /^\d{5}-\d{3}$/,
  
  // Telefone: (99) 99999-9999
  telefone: /\(?(?:\+55\s?)?\(?[1-9]{2}\)?\s?\d{4,5}[-\s]?\d{4}\b/g,
  
  // Email básico
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

// Palavras-chave que indicam contextos específicos
const KEYWORDS = {
  cpf_context: ['cpf', 'cadastro', 'pessoa física', 'contribuinte'],
  cnpj_context: ['cnpj', 'empresa', 'pessoa jurídica', 'razão social'],
  valor_context: ['valor', 'preço', 'pagamento', 'multa', 'taxa', 'honorários'],
  prazo_context: ['prazo', 'vencimento', 'data limite', 'até o dia'],
};

/**
 * Valida um documento CPF
 */
function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return parseInt(cpf.charAt(9)) === digit1 && parseInt(cpf.charAt(10)) === digit2;
}

/**
 * Valida um documento CNPJ
 */
function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(cnpj.charAt(i)) * weights1[i];
  }
  let digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(cnpj.charAt(i)) * weights2[i];
  }
  let digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  
  return parseInt(cnpj.charAt(12)) === digit1 && parseInt(cnpj.charAt(13)) === digit2;
}

/**
 * Valida se uma data é válida
 */
function isValidDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (!match) return false;
  
  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day &&
         year >= 1900 && year <= 2100;
}

/**
 * Valida uma cláusula específica
 */
function validateClause(clause: { id: string; body: string; title: string }): ValidationResult {
  const issues: ValidationIssue[] = [];
  let score = 100;
  
  const text = `${clause.title} ${clause.body}`.toLowerCase();
  
  // Validação de CPFs
  const cpfMatches = clause.body.match(PATTERNS.cpf);
  if (cpfMatches) {
    cpfMatches.forEach(cpf => {
      const hasContext = KEYWORDS.cpf_context.some(keyword => text.includes(keyword));
      
      if (!PATTERNS.cpf_valid.test(cpf)) {
        issues.push({
          type: 'cpf',
          severity: 'medium',
          message: `CPF ${cpf} está em formato incorreto`,
          suggestion: 'Use o formato 999.999.999-99'
        });
        score -= 10;
      } else if (!isValidCPF(cpf)) {
        issues.push({
          type: 'cpf',
          severity: 'high',
          message: `CPF ${cpf} é inválido`,
          suggestion: 'Verifique os dígitos do CPF'
        });
        score -= 15;
      }
      
      if (!hasContext) {
        issues.push({
          type: 'cpf',
          severity: 'low',
          message: 'CPF encontrado sem contexto claro',
          suggestion: 'Adicione "CPF" antes do número'
        });
        score -= 5;
      }
    });
  }
  
  // Validação de CNPJs
  const cnpjMatches = clause.body.match(PATTERNS.cnpj);
  if (cnpjMatches) {
    cnpjMatches.forEach(cnpj => {
      const hasContext = KEYWORDS.cnpj_context.some(keyword => text.includes(keyword));
      
      if (!PATTERNS.cnpj_valid.test(cnpj)) {
        issues.push({
          type: 'cnpj',
          severity: 'medium',
          message: `CNPJ ${cnpj} está em formato incorreto`,
          suggestion: 'Use o formato 99.999.999/9999-99'
        });
        score -= 10;
      } else if (!isValidCNPJ(cnpj)) {
        issues.push({
          type: 'cnpj',
          severity: 'high',
          message: `CNPJ ${cnpj} é inválido`,
          suggestion: 'Verifique os dígitos do CNPJ'
        });
        score -= 15;
      }
      
      if (!hasContext) {
        issues.push({
          type: 'cnpj',
          severity: 'low',
          message: 'CNPJ encontrado sem contexto claro',
          suggestion: 'Adicione "CNPJ" antes do número'
        });
        score -= 5;
      }
    });
  }
  
  // Validação de datas
  const dataMatches = clause.body.match(PATTERNS.data);
  if (dataMatches) {
    dataMatches.forEach(data => {
      if (!isValidDate(data)) {
        issues.push({
          type: 'data',
          severity: 'high',
          message: `Data ${data} é inválida`,
          suggestion: 'Verifique se a data existe no calendário'
        });
        score -= 15;
      } else if (!PATTERNS.data_valid.test(data)) {
        issues.push({
          type: 'data',
          severity: 'low',
          message: `Data ${data} não está no formato padrão DD/MM/AAAA`,
          suggestion: 'Padronize as datas como DD/MM/AAAA'
        });
        score -= 5;
      }
    });
  }
  
  // Validação de valores monetários
  const valorMatches = clause.body.match(PATTERNS.valor);
  if (valorMatches) {
    valorMatches.forEach(valor => {
      const hasContext = KEYWORDS.valor_context.some(keyword => text.includes(keyword));
      
      if (!hasContext) {
        issues.push({
          type: 'valor',
          severity: 'low',
          message: `Valor ${valor} sem contexto claro`,
          suggestion: 'Especifique o que o valor representa'
        });
        score -= 5;
      }
    });
  }
  
  // Validação de formatação
  if (clause.body.length < 10) {
    issues.push({
      type: 'formatacao',
      severity: 'medium',
      message: 'Cláusula muito curta',
      suggestion: 'Expanda o conteúdo da cláusula'
    });
    score -= 10;
  }
  
  if (!/[.!?]$/.test(clause.body.trim())) {
    issues.push({
      type: 'formatacao',
      severity: 'low',
      message: 'Cláusula não termina com pontuação',
      suggestion: 'Adicione ponto final'
    });
    score -= 3;
  }
  
  // Validação jurídica básica
  const juridicalTerms = [
    'conforme', 'de acordo com', 'nos termos', 'mediante',
    'fica estabelecido', 'as partes', 'contratante', 'contratada'
  ];
  
  const hasJuridicalTerms = juridicalTerms.some(term => text.includes(term));
  if (!hasJuridicalTerms && clause.title.toLowerCase().includes('cláusula')) {
    issues.push({
      type: 'juridico',
      severity: 'medium',
      message: 'Linguagem jurídica pode ser aprimorada',
      suggestion: 'Use termos mais formais e específicos'
    });
    score -= 8;
  }
  
  // Determinar status geral
  let status: 'OK' | 'ALERTA' | 'ERRO' = 'OK';
  if (issues.some(issue => issue.severity === 'high')) {
    status = 'ERRO';
  } else if (issues.some(issue => issue.severity === 'medium') || issues.length > 3) {
    status = 'ALERTA';
  }
  
  return {
    id: clause.id,
    status,
    issues,
    score: Math.max(0, score)
  };
}

/**
 * Handler principal do Web Worker
 */
self.onmessage = (e: MessageEvent<ValidationRequest>) => {
  try {
    const { clauses } = e.data;
    
    if (!Array.isArray(clauses)) {
      throw new Error('Dados inválidos: clauses deve ser um array');
    }
    
    const results: ValidationResult[] = clauses.map(clause => {
      try {
        return validateClause(clause);
      } catch (error) {
        return {
          id: clause.id,
          status: 'ERRO' as const,
          issues: [{
            type: 'juridico',
            severity: 'high',
            message: 'Erro interno na validação',
            suggestion: 'Tente novamente ou contate o suporte'
          }],
          score: 0
        };
      }
    });
    
    // Estatísticas gerais
    const stats = {
      total: results.length,
      ok: results.filter(r => r.status === 'OK').length,
      alerta: results.filter(r => r.status === 'ALERTA').length,
      erro: results.filter(r => r.status === 'ERRO').length,
      averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
    };
    
    // Enviar resultado de volta
    (self as any).postMessage({
      results,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Enviar erro de volta
    (self as any).postMessage({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
};

// Exports para TypeScript (não serão usados no worker)
export type { ValidationRequest, ValidationResult, ValidationIssue };
