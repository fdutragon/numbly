import { OpenAI } from 'openai';
import { db } from '@/data/db';
import { getClauseIndex, cacheAutocompleteSuggestion, getCachedSuggestions } from '@/data/dao';
import { canUseAI, withAIGuard } from '@/features/paywall';

// Cliente OpenAI configurado
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY || '',
  dangerouslyAllowBrowser: true
});

/**
 * Interface para requisição de sugestão
 */
interface SuggestionRequest {
  text: string;
  context?: string;
  clauseId?: string;
  documentId?: string;
  position?: number;
}

/**
 * Interface para resposta de sugestão
 */
interface SuggestionResponse {
  suggestion: string;
  confidence: number; // 0-1
  reasoning?: string;
  fromCache: boolean;
}

/**
 * Configurações de contexto para diferentes tipos de cláusulas
 */
const CLAUSE_CONTEXTS = {
  'pagamento': {
    keywords: ['valor', 'pagamento', 'prazo', 'vencimento', 'parcela'],
    template: 'Esta cláusula trata de condições de pagamento e deve incluir valores, prazos e condições.'
  },
  'prazo': {
    keywords: ['prazo', 'data', 'vencimento', 'término', 'início'],
    template: 'Esta cláusula define prazos e deve ser específica quanto a datas e condições.'
  },
  'responsabilidade': {
    keywords: ['responsável', 'obrigação', 'compromisso', 'dever'],
    template: 'Esta cláusula define responsabilidades e obrigações das partes.'
  },
  'penalidade': {
    keywords: ['multa', 'penalidade', 'sanção', 'descumprimento'],
    template: 'Esta cláusula estabelece penalidades por descumprimento.'
  },
  'garantia': {
    keywords: ['garantia', 'segurança', 'caução', 'fiança'],
    template: 'Esta cláusula trata de garantias e seguranças contratuais.'
  },
  'rescisão': {
    keywords: ['rescisão', 'término', 'cancelamento', 'encerramento'],
    template: 'Esta cláusula define condições para rescisão ou término do contrato.'
  }
};

/**
 * Detecta o tipo de cláusula baseado no conteúdo
 */
function detectClauseType(text: string): string {
  const normalizedText = text.toLowerCase();
  
  for (const [type, config] of Object.entries(CLAUSE_CONTEXTS)) {
    const matchCount = config.keywords.filter(keyword => 
      normalizedText.includes(keyword)
    ).length;
    
    if (matchCount >= 2) {
      return type;
    }
  }
  
  return 'geral';
}

/**
 * Gera contexto para a IA baseado no histórico e índice
 */
async function buildAIContext(request: SuggestionRequest): Promise<string> {
  let context = 'Você é um assistente jurídico especializado em contratos brasileiros. ';
  
  // Contexto do documento se disponível
  if (request.documentId) {
    try {
      const document = await db.documents.get(request.documentId);
      if (document) {
        context += `Documento: "${document.title}". `;
      }
    } catch (error) {
      console.warn('Erro ao buscar documento:', error);
    }
  }
  
  // Contexto da cláusula se disponível
  if (request.clauseId) {
    try {
      const clauseIndex = await getClauseIndex(request.clauseId);
      if (clauseIndex) {
        context += `Resumo da cláusula: ${clauseIndex.summary}. `;
      }
      
      const clause = await db.clauses.get(request.clauseId);
      if (clause) {
        context += `Título da cláusula: "${clause.title}". `;
        
        // Detectar tipo de cláusula
        const clauseType = detectClauseType(`${clause.title} ${clause.body}`);
        if (clauseType !== 'geral' && CLAUSE_CONTEXTS[clauseType as keyof typeof CLAUSE_CONTEXTS]) {
          context += CLAUSE_CONTEXTS[clauseType as keyof typeof CLAUSE_CONTEXTS].template + ' ';
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar contexto da cláusula:', error);
    }
  }
  
  // Contexto adicional fornecido
  if (request.context) {
    context += `Contexto adicional: ${request.context}. `;
  }
  
  context += 'Complete o texto de forma natural, mantendo linguagem jurídica formal. ';
  context += 'Seja conciso (máximo 50 palavras) e contextualmente apropriado.';
  
  return context;
}

/**
 * Gera sugestão usando OpenAI
 */
async function generateAISuggestion(
  request: SuggestionRequest,
  context: string
): Promise<string> {
  try {
    const prompt = `${context}\n\nTexto a completar: "${request.text}"\n\nCompleção:`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente jurídico brasileiro especializado em redação de contratos. Forneça completions naturais e adequados ao contexto legal.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
      stop: ['\n\n', '\"'],
    });
    
    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Erro na geração de sugestão AI:', error);
    throw error;
  }
}

/**
 * Calcula confiança da sugestão baseado em métricas
 */
function calculateConfidence(
  suggestion: string, 
  originalText: string,
  hasContext: boolean
): number {
  let confidence = 0.5; // Base
  
  // Boost por ter contexto
  if (hasContext) confidence += 0.2;
  
  // Boost por tamanho adequado
  if (suggestion.length > 10 && suggestion.length < 200) confidence += 0.1;
  
  // Boost por ter pontuação adequada
  if (/[.!?]$/.test(suggestion.trim())) confidence += 0.1;
  
  // Penalty por repetição do texto original
  if (suggestion.toLowerCase().includes(originalText.toLowerCase())) {
    confidence -= 0.2;
  }
  
  // Boost por termos jurídicos
  const legalTerms = [
    'conforme', 'mediante', 'nos termos', 'fica estabelecido',
    'as partes', 'contratante', 'contratada', 'acordo'
  ];
  
  const hasLegalTerms = legalTerms.some(term => 
    suggestion.toLowerCase().includes(term)
  );
  
  if (hasLegalTerms) confidence += 0.1;
  
  return Math.min(Math.max(confidence, 0), 1);
}

/**
 * Função principal para obter sugestão de ghost autocomplete
 */
export async function getSuggestion(request: SuggestionRequest): Promise<SuggestionResponse> {
  try {
    // Verificar cache primeiro
    const cachedSuggestions = await getCachedSuggestions(request.clauseId || null, 3);
    
    if (cachedSuggestions.length > 0) {
      // Retornar primeira sugestão do cache
      return {
        suggestion: cachedSuggestions[0],
        confidence: 0.7,
        fromCache: true
      };
    }
    
    // Gerar nova sugestão com IA
    const suggestion = await withAIGuard(
      async () => {
        const context = await buildAIContext(request);
        return await generateAISuggestion(request, context);
      },
      () => {
        throw new Error('Limite de uso de IA atingido');
      }
    );
    
    if (!suggestion) {
      return {
        suggestion: '',
        confidence: 0,
        fromCache: false
      };
    }
    
    // Calcular confiança
    const hasContext = !!(request.context || request.clauseId || request.documentId);
    const confidence = calculateConfidence(suggestion, request.text, hasContext);
    
    // Fazer cache da sugestão
    if (suggestion.length > 5) {
      await cacheAutocompleteSuggestion(request.clauseId || null, suggestion);
    }
    
    return {
      suggestion,
      confidence,
      fromCache: false
    };
    
  } catch (error) {
    console.error('Erro ao gerar sugestão:', error);
    
    // Fallback para sugestões básicas
    return {
      suggestion: getFallbackSuggestion(request.text),
      confidence: 0.3,
      fromCache: false
    };
  }
}

/**
 * Sugestões de fallback quando a IA não está disponível
 */
function getFallbackSuggestion(text: string): string {
  const normalizedText = text.toLowerCase().trim();
  
  // Padrões comuns de completions jurídicas
  const patterns = [
    {
      triggers: ['o contratant', 'a contratant'],
      completions: ['e se compromete a', 'e fica obrigado a', 'e tem o dever de']
    },
    {
      triggers: ['fica estabelecid', 'estabelece-se que'],
      completions: ['o que segue:', 'as seguintes condições:', 'os termos seguintes:']
    },
    {
      triggers: ['prazo de', 'no prazo'],
      completions: ['30 (trinta) dias', '15 (quinze) dias úteis', '60 (sessenta) dias corridos']
    },
    {
      triggers: ['valor de', 'importância de'],
      completions: ['R$ _____ (______ reais)', 'R$ ___,__ (_____ reais)']
    },
    {
      triggers: ['em caso de desc', 'descumprimento'],
      completions: ['umprimento desta cláusula', 'umprimento das obrigações', 'umprimento do acordado']
    }
  ];
  
  for (const pattern of patterns) {
    const matchingTrigger = pattern.triggers.find(trigger => 
      normalizedText.includes(trigger)
    );
    
    if (matchingTrigger) {
      const randomCompletion = pattern.completions[
        Math.floor(Math.random() * pattern.completions.length)
      ];
      return randomCompletion;
    }
  }
  
  // Fallback genérico
  const genericCompletions = [
    'nos termos da legislação vigente.',
    'conforme estabelecido neste contrato.',
    'de acordo com as condições pactuadas.',
    'mediante acordo entre as partes.'
  ];
  
  return genericCompletions[Math.floor(Math.random() * genericCompletions.length)];
}

/**
 * Gera sugestão para melhoria de cláusula específica
 */
export async function suggestClauseImprovement(clauseId: string): Promise<string> {
  try {
    const canUse = await canUseAI();
    if (!canUse) {
      throw new Error('Limite de uso de IA atingido');
    }
    
    const clause = await db.clauses.get(clauseId);
    if (!clause) {
      throw new Error('Cláusula não encontrada');
    }
    
    const clauseIndex = await getClauseIndex(clauseId);
    
    const prompt = [
      'Você é um assistente jurídico especializado. Melhore a cláusula abaixo:',
      '',
      `TÍTULO: ${clause.title}`,
      `CONTEÚDO: ${clause.body}`,
      clauseIndex ? `RESUMO: ${clauseIndex.summary}` : '',
      '',
      'Mantenha o escopo original, mas melhore a clareza, precisão jurídica e formatação.',
      'Responda apenas com o texto melhorado da cláusula, sem comentários adicionais.'
    ].filter(Boolean).join('\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300
    });
    
    return response.choices[0]?.message?.content?.trim() || '';
    
  } catch (error) {
    console.error('Erro na sugestão de melhoria:', error);
    throw error;
  }
}

/**
 * Hook React para usar ghost autocomplete
 */
export function useGhostAutocomplete(delay: number = 1000) {
  const [suggestion, setSuggestion] = React.useState<SuggestionResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  const getSuggestionDebounced = React.useCallback(
    debounce(async (request: SuggestionRequest) => {
      setLoading(true);
      try {
        const result = await getSuggestion(request);
        setSuggestion(result);
      } catch (error) {
        console.error('Erro na sugestão:', error);
        setSuggestion(null);
      } finally {
        setLoading(false);
      }
    }, delay),
    [delay]
  );
  
  const clearSuggestion = React.useCallback(() => {
    setSuggestion(null);
  }, []);
  
  return {
    suggestion,
    loading,
    getSuggestion: getSuggestionDebounced,
    clearSuggestion
  };
}

// Função de debounce simples
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Importar React para os hooks
import React from 'react';

export default {
  getSuggestion,
  suggestClauseImprovement,
  useGhostAutocomplete
};
