import Groq from 'groq-sdk';
import { detectIntention } from '@/lib/ai-intention-detector';
import { type ClaraState } from '@/lib/chat-store';

// Initialize Groq
let groq: Groq | undefined;
if (typeof window === 'undefined') {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export interface DonnaResponse {
  content: string;
  shouldShowPaymentModal: boolean;
  emailSent: boolean;
  intention: string;
  confidence: number;
  nextAction?: string;
  scriptStage: string;
  reasoning: string;
  userData?: Record<string, any>;
  metrics?: {
    responseTime: number;
    conversionProbability: number;
    engagementScore: number;
  };
}

// Sistema de respostas estratégicas otimizadas
const STRATEGIC_RESPONSES = {
  // Respostas de alta conversão para diferentes estágios
  intro: [
    {
      trigger: 'default',
      response: `🚀 **Parou de perder vendas às 2h da manhã?**

Eu sou Donna. Atendo seus clientes 24/7 no WhatsApp.
Converto leads enquanto você dorme.

💰 Clientes nossos faturam +R$ 5mil/mês a mais.

Quer parar de perder dinheiro?`,
      weight: 1.0
    }
  ],
  
  objections: {
    price: [
      {
        response: `💡 Entenda a matemática:

❌ Sem Donna: Perde 10 vendas/mês = -R$ 1.000
✅ Com Donna: R$ 47/mês = +R$ 953 de lucro

É literalmente impossível perder dinheiro.

Prefere economizar R$ 47 ou faturar R$ 1.000?`,
        effectiveness: 0.85
      },
      {
        response: `🎯 Sabe quanto custa uma venda perdida?

Bem mais que R$ 47.

Donna se paga com UMA venda recuperada.
Depois é lucro puro. Todo mês.

Matemática simples. Quer começar a lucrar?`,
        effectiveness: 0.80
      }
    ],
    
    trust: [
      {
        response: `✅ Justo sua preocupação! Por isso:

• 7 dias GRÁTIS (cancela quando quiser)
• +500 empresas já usam
• Nota 4.9/5 no Google
• Suporte humano 24/7

Zero risco. Só benefício.

Que tal testar sem compromisso?`,
        effectiveness: 0.90
      }
    ],
    
    timing: [
      {
        response: `⏰ "Depois" seus concorrentes agradecem 🙏

Cada dia = 10 leads perdidos
Cada semana = 70 oportunidades jogadas fora

Enquanto você pensa, eles vendem.

Prefere pensar ou prefere vender?`,
        effectiveness: 0.75
      }
    ],
    
    need: [
      {
        response: `📊 Dados reais dos nossos clientes:

• João (Mecânica): +45% vendas em 30 dias
• Maria (Estética): 127 agendamentos automáticos/mês
• Pedro (Consultoria): R$ 12k em vendas no fim de semana

"Não preciso" = "não quero crescer"

E você, quer crescer ou estagnar?`,
        effectiveness: 0.82
      }
    ]
  },
  
  interest_builders: [
    {
      trigger: 'features',
      response: `🤖 Donna faz TUDO no seu WhatsApp:

✅ Responde em 3 segundos (24/7)
✅ Agenda reuniões na sua agenda
✅ Envia propostas personalizadas
✅ Cobra pagamentos automaticamente
✅ Qualifica leads sozinha
✅ Fecha vendas sem você

Tudo por R$ 1,57/dia. Quer ativar?`
    },
    {
      trigger: 'how_it_works',
      response: `⚡ Super simples:

1️⃣ Conecta no seu WhatsApp (5 min)
2️⃣ Treina com seu script (10 min)
3️⃣ Pronto! Donna já está vendendo

Setup completo em 15 minutos.
Suporte nosso faz tudo pra você.

Bora começar?`
    }
  ],
  
  urgency_creators: [
    `🔥 HOJE APENAS: Setup grátis (economia de R$ 197)

Normalmente cobramos pelo setup personalizado.
Mas só hoje está incluso!

[ATIVAR AGORA] 👈 Oferta expira em 2h`,
    
    `⚠️ Aviso: Enquanto você lê isso...

• 3 leads entraram no seu WhatsApp
• 2 desistiram por demora
• 1 comprou do concorrente

Cada minuto = dinheiro perdido.

Vai continuar perdendo?`
  ],
  
  closing_sequences: [
    {
      stage: 'soft_close',
      response: `💰 Vamos revisar:

✓ Donna trabalha 24/7: R$ 47/mês
✓ Uma venda recuperada: R$ 200+
✓ ROI no primeiro dia: 325%

Não é gasto. É o melhor investimento do seu negócio.

[QUERO DONNA AGORA] ← Clique aqui`
    },
    {
      stage: 'hard_close',
      response: `🎯 Última chance:

Donna por R$ 47/mês
+ Setup grátis (hoje)
+ 7 dias de garantia
+ Suporte vitalício

Total: R$ 47 (menos que uma pizza)

[ATIVAR DONNA] ou continuar perdendo vendas?`
    }
  ]
};

// Classe principal da engine
export class DonnaAIEngineV2 {
  private conversationState: Map<string, any> = new Map();
  
  async processMessage(
    message: string,
    currentState: ClaraState
  ): Promise<DonnaResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Análise inteligente da mensagem
      const analysis = await detectIntention(message);
      
      // 2. Determina estratégia baseada no contexto
      const strategy = this.determineStrategy(analysis, currentState);
      
      // 3. Gera resposta otimizada
      const response = await this.generateResponse(
        message,
        analysis,
        strategy,
        currentState
      );
      
      // 4. Calcula métricas
      const metrics = {
        responseTime: Date.now() - startTime,
        conversionProbability: this.calculateConversionProbability(analysis, currentState),
        engagementScore: this.calculateEngagementScore(analysis, message)
      };
      
      return {
        ...response,
        metrics
      };
      
    } catch (error) {
      console.error('DonnaAI Engine Error:', error);
      return this.getFallbackResponse(currentState);
    }
  }
  
  private determineStrategy(analysis: any, state: ClaraState): string {
    // Estratégias baseadas em múltiplos fatores
    const { intention, confidence, sentiment, context } = analysis;
    
    // Evita ficar preso no mesmo estágio
    const currentStage = state.currentStage;
    const touchPoints = state.salesMetrics?.touchPoints || 0;
    const lastResponses = state.conversationHistory
      .filter(msg => msg.role === 'assistant')
      .slice(-3)
      .map(msg => msg.content);
    
    // Se está repetindo muito no mesmo estágio, força mudança
    if (touchPoints > 6 && currentStage === 'qualifying') {
      return sentiment === 'positive' ? 'escalate_urgency' : 'build_interest';
    }
    
    if (touchPoints > 4 && currentStage === 'intro') {
      return 'offer_trial';
    }

    // Alta intenção de compra
    if (intention === 'payment' && confidence > 0.7) {
      return 'close_now';
    }
    
    // Objeção detectada - varia resposta baseada no histórico
    if (typeof intention === 'string' && intention.startsWith('objection_')) {
      const objectionType = intention.replace('objection_', '');
      const handledBefore = state.contextMemory?.concerns?.includes(objectionType);
      
      if (handledBefore && state.objectionCount > 2) {
        return 'offer_trial'; // Muda estratégia se já tratou a objeção
      }
      return `handle_${intention}`;
    }
    
    // Interesse crescente
    if (sentiment === 'positive' && state.engagementLevel === 'high') {
      return 'escalate_urgency';
    }
    
    // Qualificação necessária - mas não fica preso nisso
    if ((intention === 'qualification' || !state.userData?.company) && touchPoints < 4) {
      return 'qualify_lead';
    }
    
    // Demonstração solicitada
    if (intention === 'demo_request') {
      return 'offer_trial';
    }
    
    // Contexto de urgência
    if (context?.hasUrgency) {
      return 'fast_close';
    }
    
    // Progressão natural baseada no engajamento
    if (touchPoints > 3 && sentiment !== 'negative') {
      if (state.engagementLevel === 'high') {
        return Math.random() > 0.5 ? 'escalate_urgency' : 'offer_trial';
      }
      return 'escalate_urgency';
    }
    
    // Default: construir interesse
    return 'build_interest';
  }
  
  private async generateResponse(
    message: string,
    analysis: any,
    strategy: string,
    state: ClaraState
  ): Promise<DonnaResponse> {
    // Se necessário, implemente lógica de email aqui. (Função handleEmailRequest não existe)
    
    // Respostas específicas por estratégia
    switch (strategy) {
      case 'close_now':
        return this.generateClosingResponse(analysis, state);
        
      case 'handle_objection_price':
        return this.handlePriceObjection(analysis, state);
        
      case 'handle_objection_trust':
        return this.handleTrustObjection(analysis, state);
        
      case 'handle_objection_timing':
        return this.handleTimingObjection(analysis, state);
        
      case 'handle_objection_need':
        return this.handleNeedObjection(analysis, state);
        
      case 'escalate_urgency':
        return this.createUrgency(analysis, state);
        
      case 'qualify_lead':
        return this.qualifyLead(analysis, state);
        
      case 'offer_trial':
        return this.offerTrial(analysis, state);
        
      case 'fast_close':
        return this.fastClose(analysis, state);
        
      default:
        return this.buildInterest(analysis, state);
    }
  }
  
  private generateClosingResponse(analysis: any, state: ClaraState): DonnaResponse {
    const response = STRATEGIC_RESPONSES.closing_sequences[
      state.objectionCount > 2 ? 1 : 0
    ];
    
    return {
      content: response.response,
      shouldShowPaymentModal: true,
      emailSent: false,
      intention: 'payment',
      confidence: analysis.confidence,
      nextAction: 'checkout',
      scriptStage: 'closing',
      reasoning: 'Alta intenção de compra detectada'
    };
  }
  
  private handlePriceObjection(analysis: any, state: ClaraState): DonnaResponse {
    const responses = STRATEGIC_RESPONSES.objections.price;
    
    // Evita repetir a mesma resposta de objeção
    const lastAssistantMessages = state.conversationHistory
      .filter(msg => msg.role === 'assistant')
      .slice(-2)
      .map(msg => msg.content);
    
    const availableResponses = responses.filter(
      resp => !lastAssistantMessages.includes(resp.response)
    );
    
    const responsePool = availableResponses.length > 0 ? availableResponses : responses;
    const response = responsePool[state.objectionCount % responsePool.length];
    
    // Atualiza concerns no contextMemory
    const updatedContextMemory = {
      ...state.contextMemory,
      concerns: [...(state.contextMemory?.concerns || []), 'price'],
    };
    
    return {
      content: response.response,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'objection_price',
      confidence: analysis.confidence,
      nextAction: 'overcome_objection',
      scriptStage: 'objection_handling',
      reasoning: 'Objeção de preço identificada',
      userData: {
        _contextMemory: updatedContextMemory,
      },
    };
  }
  
  private handleTrustObjection(analysis: any, state: ClaraState): DonnaResponse {
    const response = STRATEGIC_RESPONSES.objections.trust[0];
    
    return {
      content: response.response,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'objection_trust',
      confidence: analysis.confidence,
      nextAction: 'build_trust',
      scriptStage: 'objection_handling',
      reasoning: 'Objeção de confiança identificada'
    };
  }
  
  private handleTimingObjection(analysis: any, state: ClaraState): DonnaResponse {
    const response = STRATEGIC_RESPONSES.objections.timing[0];
    
    return {
      content: response.response,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'objection_timing',
      confidence: analysis.confidence,
      nextAction: 'create_urgency',
      scriptStage: 'objection_handling',
      reasoning: 'Objeção de timing identificada'
    };
  }
  
  private handleNeedObjection(analysis: any, state: ClaraState): DonnaResponse {
    const response = STRATEGIC_RESPONSES.objections.need[0];
    
    return {
      content: response.response,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'objection_need',
      confidence: analysis.confidence,
      nextAction: 'demonstrate_value',
      scriptStage: 'objection_handling',
      reasoning: 'Objeção de necessidade identificada'
    };
  }
  
  private createUrgency(analysis: any, state: ClaraState): DonnaResponse {
    // Evita repetir a mesma mensagem de urgência
    const lastAssistantMessages = state.conversationHistory
      .filter(msg => msg.role === 'assistant')
      .slice(-2)
      .map(msg => msg.content);
    
    const availableMessages = STRATEGIC_RESPONSES.urgency_creators.filter(
      msg => !lastAssistantMessages.includes(msg)
    );
    
    const messages = availableMessages.length > 0 ? availableMessages : STRATEGIC_RESPONSES.urgency_creators;
    const urgencyMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      content: urgencyMessage,
      shouldShowPaymentModal: true,
      emailSent: false,
      intention: 'urgency',
      confidence: 0.9,
      nextAction: 'urgent_close',
      scriptStage: 'urgency',
      reasoning: 'Criando senso de urgência'
    };
  }
  
  private qualifyLead(analysis: any, state: ClaraState): DonnaResponse {
    const questions = [
      '📊 Me conta: que tipo de negócio você tem? Isso me ajuda a personalizar Donna perfeitamente pra você!',
      '🎯 Qual sua maior dor hoje no atendimento? Demora? Perder vendas? Donna resolve!',
      '📈 Quantos clientes você atende por mês? Donna escala conforme você cresce!'
    ];

    // Evita repetir a última pergunta
    const lastQuestion = state.contextMemory?.askedQuestions?.slice(-1)[0];
    let availableQuestions = questions.filter(q => q !== lastQuestion);
    if (availableQuestions.length === 0) availableQuestions = questions;
    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    // Atualiza contextMemory para rastrear perguntas feitas
    const updatedContextMemory = {
      ...state.contextMemory,
      askedQuestions: [...(state.contextMemory?.askedQuestions || []), question],
    };

    return {
      content: question,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'qualify',
      confidence: analysis.confidence,
      nextAction: 'collect_info',
      scriptStage: 'qualification',
      reasoning: 'Coletando informações para personalização',
      metrics: {
        ...(analysis.metrics || {}),
      },
      userData: {
        ...(analysis.entities || {}),
        _contextMemory: updatedContextMemory,
      },
    };
  }
  
  private offerTrial(analysis: any, state: ClaraState): DonnaResponse {
    return {
      content: `🎁 **TESTE GRÁTIS LIBERADO!**

✅ 7 dias 100% grátis
✅ Setup completo incluso
✅ Cancela quando quiser
✅ Sem pegar cartão

Bora testar Donna no SEU negócio?

[COMEÇAR TESTE GRÁTIS] 👈`,
      shouldShowPaymentModal: true,
      emailSent: false,
      intention: 'demo',
      confidence: 0.9,
      nextAction: 'trial_signup',
      scriptStage: 'demo',
      reasoning: 'Oferecendo teste gratuito'
    };
  }
  
  private fastClose(analysis: any, state: ClaraState): DonnaResponse {
    return {
      content: `⚡ Perfeito! Vamos direto ao ponto:

✅ Donna: R$ 47/mês
✅ Começa a funcionar em 15 min
✅ Garantia total de 7 dias

[ATIVAR DONNA AGORA] ← Clique e comece a vender!`,
      shouldShowPaymentModal: true,
      emailSent: false,
      intention: 'fast_close',
      confidence: 0.95,
      nextAction: 'immediate_checkout',
      scriptStage: 'closing',
      reasoning: 'Fechamento rápido para lead urgente'
    };
  }
  
  private buildInterest(analysis: any, state: ClaraState): DonnaResponse {
    // Evita repetir a mesma resposta
    const lastAssistantMessages = state.conversationHistory
      .filter(msg => msg.role === 'assistant')
      .slice(-2)
      .map(msg => msg.content);
    
    const availableBuilders = STRATEGIC_RESPONSES.interest_builders.filter(
      builder => !lastAssistantMessages.includes(builder.response)
    );
    
    const builders = availableBuilders.length > 0 ? availableBuilders : STRATEGIC_RESPONSES.interest_builders;
    const interestBuilder = builders[
      Math.floor(Math.random() * builders.length)
    ];
    
    return {
      content: interestBuilder.response,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: analysis.intention,
      confidence: analysis.confidence,
      nextAction: 'engage',
      scriptStage: 'interest_building',
      reasoning: 'Construindo interesse e valor'
    };
  }
  
  private calculateConversionProbability(analysis: any, state: ClaraState): number {
    let probability = 0.3; // Base
    
    // Fatores positivos
    if (analysis.sentiment === 'positive') probability += 0.2;
    if (analysis.intention === 'payment') probability += 0.3;
    if (state.engagementLevel === 'high') probability += 0.1;
    if (analysis.context?.hasUrgency) probability += 0.1;
    
    // Fatores negativos
    probability -= state.objectionCount * 0.05;
    if (analysis.sentiment === 'negative') probability -= 0.2;
    
    return Math.max(0, Math.min(1, probability));
  }
  
  private calculateEngagementScore(analysis: any, message: string): number {
    let score = 0.5; // Base
    
    // Comprimento da mensagem
    if (message.length > 50) score += 0.1;
    if (message.length > 100) score += 0.1;
    
    // Perguntas
    if (analysis.context?.isQuestion) score += 0.15;
    
    // Sentimento positivo
    if (analysis.sentiment === 'positive') score += 0.2;
    
    // Menções específicas
    if (analysis.entities?.businessType) score += 0.1;
    
    return Math.min(1, score);
  }
  
  private getFallbackResponse(state: ClaraState): DonnaResponse {
    return {
      content: STRATEGIC_RESPONSES.intro[0].response,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'general',
      confidence: 0.5,
      nextAction: 'wait',
      scriptStage: state.currentStage,
      reasoning: 'Resposta fallback'
    };
  }
}

// Função helper para manter compatibilidade
export async function processUserMessage(
  message: string,
  currentState: ClaraState
): Promise<DonnaResponse> {
  const engine = new DonnaAIEngineV2();
  return engine.processMessage(message, currentState);
}

// Função para atualizar estado
export function updateDonnaState(
  currentState: ClaraState,
  userMessage: string,
  donnaResponse: DonnaResponse
): ClaraState {
  const now = Date.now();
  
  return {
    ...currentState,
    currentStage: donnaResponse.scriptStage as ClaraState['currentStage'],
    conversationHistory: [
      ...currentState.conversationHistory,
      { role: 'user' as const, content: userMessage, timestamp: now },
      { role: 'assistant' as const, content: donnaResponse.content, timestamp: now },
    ],
    userSentiment: (donnaResponse.metrics?.engagementScore ?? 0) > 0.7
      ? 'positive'
      : (donnaResponse.metrics?.engagementScore ?? 0) < 0.3
      ? 'negative'
      : 'neutral',
    objectionCount: (typeof donnaResponse.intention === 'string' && donnaResponse.intention.startsWith('objection_'))
      ? currentState.objectionCount + 1
      : currentState.objectionCount,
    engagementLevel: (donnaResponse.metrics?.engagementScore ?? 0) > 0.7
      ? 'high'
      : (donnaResponse.metrics?.engagementScore ?? 0) > 0.4
      ? 'medium'
      : 'low',
    lastInteraction: now,
    userData: {
      ...currentState.userData,
      ...donnaResponse.userData,
    },
    // Atualiza contextMemory se vier no userData
    contextMemory: donnaResponse.userData?._contextMemory || currentState.contextMemory,
    salesMetrics: {
      ...currentState.salesMetrics,
      conversionProbability: donnaResponse.metrics?.conversionProbability || 0,
      touchPoints: currentState.salesMetrics.touchPoints + 1,
      lastActiveTime: now
    }
  };
}

export function createInitialDonnaState(): ClaraState {
  return {
    currentStage: 'intro',
    conversationHistory: [],
    userSentiment: 'neutral',
    objectionCount: 0,
    engagementLevel: 'medium',
    lastInteraction: Date.now(),
    userData: {},
    salesMetrics: {
      stageProgress: 0,
      conversionProbability: 0,
      objectionTypes: [],
      touchPoints: 0,
      lastActiveTime: Date.now(),
    },
    contextMemory: {
      mentionedFeatures: [],
      askedQuestions: [],
      shownInterest: [],
      concerns: [],
    },
  };
}
