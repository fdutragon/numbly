import Fuse from 'fuse.js';
import natural from 'natural';

export interface IntentionResult {
  intention: string;
  confidence: number;
  entities?: Record<string, any>;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords?: string[];
  context?: {
    isQuestion: boolean;
    hasUrgency: boolean;
    emotionalTone: string;
    topicCategory: string;
  };
}

// Configuração de patterns mais inteligentes alinhados com a engine
const INTENTION_PATTERNS = {
  payment: {
    keywords: ['pagar', 'comprar', 'contratar', 'assinar', 'ativar', 'checkout', 'valor', 'preço', 'quanto custa', 'investir', 'fechar', 'aceito', 'vamos lá', 'bora', 'quero'],
    phrases: ['quero contratar', 'vamos fechar', 'aceito a proposta', 'como faço para pagar', 'vou aderir', 'bora ativar', 'quero começar', 'aceito o plano'],
    weight: 1.3
  },
  objection_price: {
    keywords: ['caro', 'barato', 'desconto', 'não tenho', 'sem dinheiro', 'orçamento', 'custoso', 'muito', 'alto', 'impossível', 'condições'],
    phrases: ['está muito caro', 'não posso pagar', 'não tenho condições', 'fora do orçamento', 'muito alto para mim', 'não cabe no bolso'],
    weight: 1.2
  },
  objection_trust: {
    keywords: ['confiar', 'seguro', 'garantia', 'funciona', 'verdade', 'golpe', 'suspeito', 'real', 'mesmo', 'sério', 'dúvida'],
    phrases: ['não confio', 'é confiável', 'tem garantia', 'funciona mesmo', 'parece golpe', 'é sério isso', 'de verdade'],
    weight: 1.2
  },
  objection_timing: {
    keywords: ['depois', 'pensar', 'avaliar', 'decidir', 'consultar', 'tempo', 'agora não', 'mais tarde', 'semana', 'mês'],
    phrases: ['vou pensar', 'preciso avaliar', 'não é o momento', 'deixa para depois', 'vou consultar', 'mais tarde', 'semana que vem'],
    weight: 1.1
  },
  objection_need: {
    keywords: ['não preciso', 'não uso', 'desnecessário', 'já tenho', 'não serve', 'não é para mim', 'não vejo'],
    phrases: ['não vejo necessidade', 'não é para mim', 'já uso outro', 'não vai resolver', 'não preciso disso'],
    weight: 1.1
  },
  interest: {
    keywords: ['interessante', 'legal', 'bacana', 'gostei', 'quero saber', 'conte mais', 'explica', 'curioso', 'show', 'massa'],
    phrases: ['me interessei', 'quero entender melhor', 'como funciona', 'me explica mais', 'que legal', 'interessante isso'],
    weight: 1.2
  },
  qualification: {
    keywords: ['empresa', 'negócio', 'trabalho', 'atendo', 'clientes', 'vendo', 'serviço', 'consultório', 'loja', 'escritório'],
    phrases: ['tenho uma empresa', 'meu negócio', 'trabalho com', 'atendo clientes', 'sou empresário', 'tenho um consultório'],
    weight: 1.0
  },
  demo_request: {
    keywords: ['demonstração', 'demo', 'teste', 'experimentar', 'provar', 'exemplo', 'ver funcionando', 'mostrar', 'testar'],
    phrases: ['quero ver funcionando', 'pode mostrar', 'faz uma demo', 'quero testar', 'me mostra', 'como é'],
    weight: 1.2
  },
  contact: {
    keywords: ['email', 'telefone', 'whatsapp', 'contato', 'ligar', 'mensagem', 'falar', 'conversar'],
    phrases: ['meu email é', 'pode me ligar', 'manda no whats', 'entra em contato', 'vamos conversar'],
    weight: 1.0
  },
  urgency: {
    keywords: ['urgente', 'agora', 'hoje', 'rápido', 'imediato', 'pressa', 'correndo', 'já', 'logo'],
    phrases: ['preciso urgente', 'para hoje', 'com pressa', 'o quanto antes', 'preciso já', 'o mais rápido'],
    weight: 1.4
  },
  positive_engagement: {
    keywords: ['sim', 'claro', 'certamente', 'perfeito', 'ótimo', 'excelente', 'concordo', 'entendi', 'certo'],
    phrases: ['sim, quero', 'claro que sim', 'perfeito', 'pode ser', 'concordo', 'faz sentido'],
    weight: 1.1
  },
  negative_engagement: {
    keywords: ['não', 'nunca', 'jamais', 'impossível', 'nada', 'zero', 'nem', 'nenhum'],
    phrases: ['não quero', 'nem pensar', 'não me interessa', 'não vale a pena', 'não serve'],
    weight: 1.1
  },
  curiosity: {
    keywords: ['como', 'quando', 'onde', 'porque', 'qual', 'quanto', 'quem', 'que'],
    phrases: ['como funciona', 'quando começa', 'quanto tempo', 'qual a diferença', 'como é'],
    weight: 0.9
  }
};

// Extratores de entidades expandidos
const ENTITY_EXTRACTORS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?\d{1,3})?[\s.-]?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/g,
  money: /R\$\s*\d+([.,]\d{2})?/g,
  percentage: /\d+\s*%/g,
  businessType: {
    patterns: [
      'loja', 'clínica', 'consultório', 'escritório', 'restaurante', 'salão', 
      'oficina', 'e-commerce', 'agência', 'estética', 'advocacia', 'contabilidade',
      'marketing', 'imobiliária', 'academia', 'escola', 'curso', 'pet shop',
      'farmácia', 'laboratório', 'hospital', 'clínica médica', 'psicologia'
    ],
    extractor: (text: string) => {
      const lower = text.toLowerCase();
      for (const pattern of ENTITY_EXTRACTORS.businessType.patterns) {
        if (lower.includes(pattern)) return pattern;
      }
      return null;
    }
  },
  customerVolume: {
    patterns: /(\d+)\s*(clientes?|pessoas?|atendimentos?)/gi,
    extractor: (text: string) => {
      const match = text.match(ENTITY_EXTRACTORS.customerVolume.patterns);
      return match ? match[0] : null;
    }
  },
  timeframe: {
    patterns: ['hoje', 'amanhã', 'semana', 'mês', 'ano', 'urgente', 'rápido'],
    extractor: (text: string) => {
      const lower = text.toLowerCase();
      for (const pattern of ENTITY_EXTRACTORS.timeframe.patterns) {
        if (lower.includes(pattern)) return pattern;
      }
      return null;
    }
  }
};

// Classe principal do detector
export class AIIntentionDetector {
  private tokenizer: any;
  private sentimentAnalyzer: any;
  private intentionFuse: Fuse<any>;
  
  constructor() {
    // Inicializa tokenizer
    this.tokenizer = new natural.WordTokenizer();
    
    // Inicializa analisador de sentimento
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('Portuguese', natural.PorterStemmerPt, 'afinn');
    
    // Prepara dados para fuzzy search
    const fuseData = Object.entries(INTENTION_PATTERNS).flatMap(([intention, data]) => [
      ...data.keywords.map(keyword => ({ intention, text: keyword, type: 'keyword', weight: data.weight })),
      ...data.phrases.map(phrase => ({ intention, text: phrase, type: 'phrase', weight: data.weight * 1.2 }))
    ]);
    
    this.intentionFuse = new Fuse(fuseData, {
      keys: ['text'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 3
    });
  }
  
  async detect(message: string): Promise<IntentionResult> {
    const lower = message.toLowerCase();
    const tokens = this.tokenizer.tokenize(lower);
    
    // Análise de sentimento
    const sentiment = this.analyzeSentiment(tokens);
    
    // Extração de entidades
    const entities = this.extractEntities(message);
    
    // Detecção de intenção com fuzzy matching
    const intentionScores = this.detectIntentions(lower, tokens);
    
    // Análise de contexto
    const context = this.analyzeContext(message, tokens);
    
    // Determina intenção principal
    const topIntention = this.selectTopIntention(intentionScores, context, entities);
    
    return {
      intention: topIntention.intention,
      confidence: topIntention.confidence,
      entities,
      sentiment,
      keywords: tokens,
      context
    };
  }
  
  private analyzeSentiment(tokens: string[]): 'positive' | 'negative' | 'neutral' {
    const score = this.sentimentAnalyzer.getSentiment(tokens);
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }
  
  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Email
    const emails = message.match(ENTITY_EXTRACTORS.email);
    if (emails) entities.email = emails[0];
    
    // Telefone
    const phones = message.match(ENTITY_EXTRACTORS.phone);
    if (phones) entities.phone = phones[0];
    
    // Valores monetários
    const money = message.match(ENTITY_EXTRACTORS.money);
    if (money) entities.money = money;
    
    // Porcentagens
    const percentages = message.match(ENTITY_EXTRACTORS.percentage);
    if (percentages) entities.percentages = percentages;
    
    // Tipo de negócio
    const businessType = ENTITY_EXTRACTORS.businessType.extractor(message);
    if (businessType) entities.businessType = businessType;
    
    // Volume de clientes
    const customerVolume = ENTITY_EXTRACTORS.customerVolume.extractor(message);
    if (customerVolume) entities.customerVolume = customerVolume;
    
    // Timeframe
    const timeframe = ENTITY_EXTRACTORS.timeframe.extractor(message);
    if (timeframe) entities.timeframe = timeframe;
    
    // Nome próprio (estimativa simples)
    const namePattern = /\b[A-Z][a-z]+\b/g;
    const possibleNames = message.match(namePattern);
    if (possibleNames && possibleNames.length > 0) {
      entities.possibleName = possibleNames[0];
    }
    
    return entities;
  }
  
  private detectIntentions(text: string, tokens: string[]): Map<string, number> {
    const scores = new Map<string, number>();
    
    // Busca fuzzy
    const results = this.intentionFuse.search(text);
    
    // Agrupa scores por intenção
    results.forEach(result => {
      const current = scores.get(result.item.intention) || 0;
      const score = (1 - (result.score || 0)) * result.item.weight;
      scores.set(result.item.intention, Math.max(current, score));
    });
    
    // Boost para matches exatos de frases
    Object.entries(INTENTION_PATTERNS).forEach(([intention, data]) => {
      data.phrases.forEach(phrase => {
        if (text.includes(phrase)) {
          const current = scores.get(intention) || 0;
          scores.set(intention, Math.max(current, 0.9 * data.weight));
        }
      });
    });
    
    return scores;
  }
  
  private analyzeContext(message: string, tokens: string[]): any {
    const questionWords = ['como', 'quando', 'onde', 'porque', 'qual', 'quanto', 'quem', 'que'];
    const urgencyWords = ['urgente', 'agora', 'hoje', 'rápido', 'pressa', 'já', 'imediato'];
    
    return {
      isQuestion: message.includes('?') || tokens.some(t => questionWords.includes(t)),
      hasUrgency: tokens.some(t => urgencyWords.includes(t)),
      emotionalTone: this.detectEmotionalTone(tokens),
      topicCategory: this.detectTopicCategory(tokens),
      messageLength: message.length,
      hasNumbers: /\d/.test(message),
      hasEmail: /@/.test(message),
      hasPhone: /\d{4,}/.test(message),
      isShortResponse: message.length < 10,
      isLongMessage: message.length > 100,
      hasNegation: tokens.some(t => ['não', 'nunca', 'jamais', 'nem'].includes(t)),
      hasAffirmation: tokens.some(t => ['sim', 'claro', 'certeza', 'concordo'].includes(t))
    };
  }
  
  private detectEmotionalTone(tokens: string[]): string {
    const emotions = {
      excited: ['ótimo', 'perfeito', 'maravilhoso', 'excelente', 'incrível', 'fantástico', 'show', 'demais'],
      frustrated: ['droga', 'problema', 'difícil', 'complicado', 'chato', 'irritante', 'péssimo'],
      curious: ['como', 'porque', 'entender', 'saber', 'conhecer', 'descobrir', 'aprender'],
      skeptical: ['duvido', 'será', 'mesmo', 'verdade', 'certeza', 'suspeito', 'desconfiado'],
      urgent: ['urgente', 'agora', 'já', 'rápido', 'hoje', 'imediato', 'pressa'],
      hesitant: ['talvez', 'não sei', 'dúvida', 'incerto', 'pensando', 'avaliando'],
      confident: ['certeza', 'claro', 'obviamente', 'com certeza', 'sem dúvida']
    };
    
    for (const [emotion, words] of Object.entries(emotions)) {
      if (tokens.some(t => words.includes(t))) return emotion;
    }
    
    return 'neutral';
  }
  
  private detectTopicCategory(tokens: string[]): string {
    const categories = {
      pricing: ['preço', 'valor', 'custo', 'pagar', 'dinheiro', 'caro', 'barato', 'investimento'],
      features: ['funciona', 'faz', 'pode', 'consegue', 'recurso', 'função', 'capacidade'],
      support: ['ajuda', 'suporte', 'problema', 'erro', 'dúvida', 'assistência'],
      business: ['empresa', 'negócio', 'cliente', 'venda', 'atendimento', 'trabalho'],
      integration: ['integra', 'conecta', 'API', 'sistema', 'plataforma', 'ferramenta'],
      results: ['resultado', 'ROI', 'lucro', 'vendas', 'conversão', 'performance'],
      competitor: ['concorrente', 'outro', 'diferente', 'melhor', 'pior', 'comparar']
    };
    
    for (const [category, words] of Object.entries(categories)) {
      if (tokens.some(t => words.includes(t))) return category;
    }
    
    return 'general';
  }
  
  private selectTopIntention(
    scores: Map<string, number>, 
    context: any, 
    entities: Record<string, any>
  ): { intention: string; confidence: number } {
    // Ajusta scores baseado em contexto e entidades
    const adjustedScores = new Map(scores);
    
    // Boost para payment se tem email, urgência ou engajamento positivo
    if (entities.email || context.hasUrgency || scores.has('positive_engagement')) {
      const paymentScore = adjustedScores.get('payment') || 0;
      adjustedScores.set('payment', paymentScore * 1.3);
    }
    
    // Boost para qualification se tem tipo de negócio
    if (entities.businessType) {
      const qualScore = adjustedScores.get('qualification') || 0;
      adjustedScores.set('qualification', qualScore * 1.4);
    }
    
    // Boost para demo_request se é pergunta sobre funcionalidade
    if (context.isQuestion && context.topicCategory === 'features') {
      const demoScore = adjustedScores.get('demo_request') || 0;
      adjustedScores.set('demo_request', demoScore * 1.2);
    }
    
    // Reduz score de objeções se tem engajamento positivo
    if (scores.has('positive_engagement')) {
      ['objection_price', 'objection_trust', 'objection_timing', 'objection_need'].forEach(objection => {
        const score = adjustedScores.get(objection);
        if (score) adjustedScores.set(objection, score * 0.7);
      });
    }
    
    // Boost para objeções se tem engajamento negativo
    if (scores.has('negative_engagement')) {
      ['objection_price', 'objection_trust', 'objection_timing', 'objection_need'].forEach(objection => {
        const score = adjustedScores.get(objection) || 0;
        adjustedScores.set(objection, score * 1.3);
      });
    }
    
    // Prioriza urgency se detectado
    if (context.hasUrgency && adjustedScores.has('urgency')) {
      const urgencyScore = adjustedScores.get('urgency') || 0;
      adjustedScores.set('urgency', urgencyScore * 1.5);
    }
    
    // Encontra melhor score
    let topIntention = 'general';
    let topScore = 0;
    
    adjustedScores.forEach((score, intention) => {
      if (score > topScore) {
        topScore = score;
        topIntention = intention;
      }
    });
    
    // Normaliza confidence considerando múltiplos fatores
    let confidence = Math.min(topScore, 1.0);
    
    // Boost de confidence para intenções claras
    if (['payment', 'demo_request', 'urgency'].includes(topIntention)) {
      confidence = Math.min(confidence * 1.2, 0.95);
    }
    
    // Penaliza confidence baixa para objeções
    if (topIntention.startsWith('objection_') && confidence < 0.6) {
      confidence *= 0.8;
    }
    
    // Fallback inteligente baseado no contexto
    if (confidence < 0.4) {
      if (context.isQuestion) {
        return { intention: 'curiosity', confidence: 0.6 };
      }
      if (context.hasUrgency) {
        return { intention: 'urgency', confidence: 0.7 };
      }
      if (entities.businessType) {
        return { intention: 'qualification', confidence: 0.5 };
      }
      return { intention: 'general', confidence: 0.4 };
    }
    
    return { intention: topIntention, confidence };
  }
}

// Singleton
let detector: AIIntentionDetector | null = null;

export function getAIIntentionDetector(): AIIntentionDetector {
  if (!detector) {
    detector = new AIIntentionDetector();
  }
  return detector;
}

// Função helper para manter compatibilidade
export async function detectIntention(message: string): Promise<IntentionResult> {
  const detector = getAIIntentionDetector();
  return detector.detect(message);
}
