import Groq from 'groq-sdk';
import {
  detectIntention,
  sendEmailViaResend,
  generateEmailContent,
  validateEmail,
  intentionResponses,
  type IntentionResult,
} from '@/lib/intention-detector';
import { type ClaraState } from '@/lib/chat-store';

// Initialize Groq client only on the server side
let groq: Groq | undefined;
if (typeof window === 'undefined') {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

export interface DonnaResponse {
  content: string;
  shouldShowPaymentModal: boolean;
  emailSent: boolean;
  intention: string;
  confidence: number;
  nextAction?:
    | 'wait'
    | 'advance'
    | 'checkout'
    | 'email'
    | 'objection'
    | 'qualify'
    | 'urgency'
    | 'demo';
  scriptStage: string;
  reasoning: string;
  userData?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    businessType?: string;
    painPoints?: string[];
    budget?: string;
    timeline?: string;
    monthlyVolume?: number;
    currentSolution?: string;
    urgencyLevel?: string;
  };
  metrics?: {
    responseTime: number;
    conversionProbability: number;
    engagementScore: number;
    objectionCount: number;
  };
}

// Scripts otimizados para Donna - Automação WhatsApp
interface ScriptStage {
  content: string;
  triggers: string[];
  nextStage: string;
  personalizedQuestions?: string[];
}

const donnaSalesScript: Record<string, ScriptStage> = {
  intro: {
    content: `Oi! 👋 Sou a Donna, sua futura vendedora digital 24/7.

Sabe aquele cliente que manda mensagem às 2h da manhã? Eu respondo.
Aquele lead que chega no fim de semana? Eu converto.

Quer parar de perder vendas por "não estar online"?`,
    triggers: ['sim', 'quero', 'interessado', 'como', 'funciona'],
    nextStage: 'pain_point',
    personalizedQuestions: [
      'Que tipo de negócio você tem?',
      'Quantos clientes você atende por mês?',
      'Qual sua maior dor no atendimento?'
    ],
  },

  pain_point: {
    content: `Vou ser direta: **enquanto você dorme, seus concorrentes vendem.**

❌ Você perde 60% dos leads por demora na resposta
❌ Atende 1 cliente enquanto 5 desistem
❌ Fim de semana = zero vendas

Donna resolve isso. Trabalha 24/7, responde em segundos, converte leads quentes.

Quer ver como?`,
    triggers: ['sim', 'quero', 'ver', 'como', 'funciona', 'interessado'],
    nextStage: 'solution',
  },

  solution: {
    content: `🤖 **Donna = Sua vendedora que nunca tira férias**

✅ Responde INSTANTANEAMENTE qualquer horário
✅ Qualifica leads automaticamente  
✅ Agenda reuniões direto na sua agenda
✅ Envia propostas personalizadas
✅ Cobra pagamentos em atraso
✅ Faz follow-up inteligente

Tudo no SEU WhatsApp. Sem chatbot genérico.

Pronto para multiplicar suas vendas?`,
    triggers: ['sim', 'pronto', 'quero', 'quanto', 'preço', 'valor'],
    nextStage: 'pricing',
  },

  pricing: {
    content: `💰 **Investimento:** R$ 47/mês

Menos que R$ 1,60/dia. Menos que um café.

Donna pode trazer R$ 5.000+ por mês em vendas novas.

ROI de 10.000%. Matemática simples.

**Quer ativar hoje?** Link do checkout vai na próxima mensagem.`,
    triggers: ['sim', 'ativar', 'quero', 'vamos', 'aceito'],
    nextStage: 'closing',
  },

  closing: {
    content: `🎉 **PERFEITO!** Checkout liberado!

✅ Donna: R$ 47/mês
✅ Setup completo incluído
✅ 7 dias de garantia TOTAL
✅ Suporte 24/7 incluído

Ative agora e comece a vender sem esforço!`,
    triggers: ['ativar', 'checkout', 'pagar'],
    nextStage: 'closing',
  },

  qualification: {
    content: `📊 Para personalizar Donna perfeitamente para você:

1. Que tipo de negócio você tem?
2. Quantos clientes atende por mês?
3. Qual sua maior dor no atendimento?
4. Usa alguma ferramenta hoje?

Quanto mais eu souber, melhor Donna vai performar!`,
    triggers: ['qualificar', 'personalizar', 'customizar'],
    nextStage: 'solution',
  },

  demo: {
    content: `🎯 **DEMO PERSONALIZADA**

Vou mostrar Donna funcionando no SEU negócio:

📱 Teste grátis de 7 dias
🔧 Setup personalizado
📊 Relatórios em tempo real
🎯 Scripts do seu segmento

Quer começar o teste agora?`,
    triggers: ['sim', 'quero', 'teste', 'começar'],
    nextStage: 'closing',
  },
};

// Tratamento avançado de objeções
const advancedObjectionHandling = {
  price: `💸 R$ 47/mês é "caro"? 

Uma única venda perdida por demora vale mais que isso.

Donna se paga na primeira semana. Resto é LUCRO PURO.

Quer continuar perdendo vendas ou quer multiplicar?`,

  trust: `🛡️ Entendo a desconfiança. Por isso:

✅ 7 dias de garantia TOTAL
✅ +500 clientes satisfeitos
✅ Suporte 24/7
✅ Pode cancelar quando quiser

Risco zero. Só resultado.`,

  timing: `⏰ "Vou pensar" = seus concorrentes agradecem 🙏

Cada hora sem Donna = leads perdidos.
Cada dia sem automação = dinheiro que não volta.

Decide agora ou continua perdendo?`,

  need: `🎯 "Não preciso"? 

Seus concorrentes pensavam igual.
Hoje eles vendem 300% mais com automação.

Quer ficar para trás ou liderar?`,

  authority: `👔 Precisa consultar o chefe/sócio?

Que tal fazer um teste grátis de 7 dias?
Aí você mostra os RESULTADOS para ele!

Muito mais convincente que palavras.`,

  competition: `🥊 Já usa outro sistema?

Donna é diferente:
✅ IA mais avançada
✅ Preço mais justo
✅ Suporte melhor

Quer comparar lado a lado?`,

  technical: `🔧 Preocupado com instalação?

Donna se integra em 5 minutos.
Nossa equipe faz TUDO para você.

Você só precisa aprovar o script!`,

  budget: `💰 Sem orçamento?

Donna GERA mais vendas que seu custo.
É investimento, não gasto!

R$ 47 hoje = R$ 5.000+ por mês.`,

  skeptical: `🤔 Cético? Normal!

Por isso temos:
✅ 7 dias de garantia
✅ Cases de sucesso
✅ Depoimentos reais

Teste sem compromisso!`,

  feature: `⚡ Falta alguma função?

Donna tem TUDO:
✅ Atendimento 24/7
✅ Agendamento automático
✅ Follow-up inteligente
✅ Relatórios detalhados
✅ Integração com tudo

Que funcionalidade você precisa?`,
};

export async function processUserMessage(
  message: string,
  currentState: ClaraState
): Promise<DonnaResponse> {
  try {
    // 1. Detectar intenção com IA avançada
    const intentionResult = await detectIntention(message);

    // 2. Processar intenções especiais primeiro
    if (
      intentionResult.intention === 'payment' &&
      intentionResult.confidence > 0.7
    ) {
      return {
        content: intentionResponses.payment.general,
        shouldShowPaymentModal: true,
        emailSent: false,
        intention: 'payment',
        confidence: intentionResult.confidence,
        nextAction: 'checkout',
        scriptStage: 'closing',
        reasoning: 'Usuário demonstrou intenção clara de pagamento',
      };
    }

    // 3. Processar email
    if (
      intentionResult.intention === 'email' &&
      intentionResult.confidence > 0.7
    ) {
      const emailRecipient = intentionResult.extractedData?.email;

      if (emailRecipient && validateEmail(emailRecipient)) {
        try {
          const businessType = intentionResult.extractedData?.businessType;
          const emailContent = generateEmailContent(businessType);
          const emailResult = await sendEmailViaResend(
            emailRecipient,
            'Donna - Sua Vendedora Digital 24/7',
            emailContent
          );

          return {
            content: emailResult.success
              ? intentionResponses.email.success
              : intentionResponses.email.error,
            shouldShowPaymentModal: false,
            emailSent: emailResult.success,
            intention: 'email',
            confidence: intentionResult.confidence,
            nextAction: 'wait',
            scriptStage: currentState.currentStage,
            reasoning: `Email ${emailResult.success ? 'enviado com sucesso' : 'falhou'} para ${emailRecipient}`,
          };
        } catch {
          return {
            content: intentionResponses.email.error,
            shouldShowPaymentModal: false,
            emailSent: false,
            intention: 'email',
            confidence: intentionResult.confidence,
            nextAction: 'wait',
            scriptStage: currentState.currentStage,
            reasoning: 'Erro ao enviar email',
          };
        }
      } else {
        return {
          content: intentionResponses.email.request,
          shouldShowPaymentModal: false,
          emailSent: false,
          intention: 'email',
          confidence: intentionResult.confidence,
          nextAction: 'wait',
          scriptStage: currentState.currentStage,
          reasoning: 'Email inválido ou não fornecido',
        };
      }
    }

    // 4. Detectar objeções com tratamento avançado
    if (
      intentionResult.intention === 'objection' &&
      intentionResult.confidence > 0.6
    ) {
      const objectionType =
        intentionResult.extractedData?.objectionType || 'price';
      const objectionResponse =
        advancedObjectionHandling[objectionType as keyof typeof advancedObjectionHandling];

      return {
        content: objectionResponse,
        shouldShowPaymentModal: false,
        emailSent: false,
        intention: 'objection',
        confidence: intentionResult.confidence,
        nextAction: 'objection',
        scriptStage: 'objection_handling',
        reasoning: `Objeção detectada: ${objectionType}`,
      };
    }

    // 5. Detectar qualificação e personalizar
    if (
      ['qualify', 'business_info', 'pain_point'].includes(intentionResult.intention) &&
      intentionResult.confidence > 0.6
    ) {
      const personalizedResponse = await generatePersonalizedResponse(
        message,
        currentState,
        intentionResult
      );

      return personalizedResponse;
    }

    // 6. Detectar demo request
    if (
      intentionResult.intention === 'demo_request' &&
      intentionResult.confidence > 0.7
    ) {
      return {
        content: donnaSalesScript.demo.content,
        shouldShowPaymentModal: false,
        emailSent: false,
        intention: 'demo_request',
        confidence: intentionResult.confidence,
        nextAction: 'demo',
        scriptStage: 'demo',
        reasoning: 'Usuário solicitou demonstração',
      };
    }

    // 7. Processar com IA contextual avançada
    const contextualResponse = await generateContextualResponse(
      message,
      currentState,
      intentionResult
    );

    return contextualResponse;
  } catch (error) {
    console.error('Donna AI Engine error:', error);

    // Fallback para script padrão
    const fallbackContent =
      currentState.currentStage !== 'objection_handling'
        ? donnaSalesScript[currentState.currentStage]?.content ||
          donnaSalesScript.intro.content
        : advancedObjectionHandling.price;

    return {
      content: fallbackContent,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'general',
      confidence: 0.5,
      nextAction: 'wait',
      scriptStage: currentState.currentStage,
      reasoning: 'Fallback devido a erro',
    };
  }
}

async function generatePersonalizedResponse(
  message: string,
  currentState: ClaraState,
  intentionResult: IntentionResult
): Promise<DonnaResponse> {
  const extractedData = intentionResult.extractedData;
  
  // Construir perfil do cliente
  const customerProfile = {
    businessType: extractedData?.businessType || 'negócio',
    painPoints: extractedData?.painPoints || [],
    monthlyVolume: extractedData?.monthlyVolume || 0,
    budget: extractedData?.budget || '',
    urgencyLevel: extractedData?.urgencyLevel || 'medium',
  };

  // Personalizar mensagem baseada no perfil
  let personalizedContent = '';

  if (customerProfile.businessType !== 'negócio') {
    personalizedContent = `🎯 Perfeito! ${customerProfile.businessType} tem muito potencial para automação.\n\n`;
  }

  if (customerProfile.painPoints.length > 0) {
    personalizedContent += `📋 Entendo suas dores:\n`;
    customerProfile.painPoints.forEach(pain => {
      personalizedContent += `• ${pain}\n`;
    });
    personalizedContent += `\nDonna resolve todas essas questões!\n\n`;
  }

  if (customerProfile.monthlyVolume > 0) {
    personalizedContent += `📊 ${customerProfile.monthlyVolume} clientes/mês? Donna vai turbinar isso!\n\n`;
  }

  // Adicionar próximos passos
  personalizedContent += `💡 Próximos passos:\n`;
  personalizedContent += `1. Teste grátis por 7 dias\n`;
  personalizedContent += `2. Setup personalizado para ${customerProfile.businessType}\n`;
  personalizedContent += `3. Treinamento específico do seu segmento\n\n`;
  personalizedContent += `Quer começar o teste agora?`;

  return {
    content: personalizedContent,
    shouldShowPaymentModal: false,
    emailSent: false,
    intention: intentionResult.intention,
    confidence: intentionResult.confidence,
    nextAction: 'qualify',
    scriptStage: 'qualification',
    reasoning: 'Resposta personalizada baseada no perfil do cliente',
    userData: {
      businessType: customerProfile.businessType,
      painPoints: customerProfile.painPoints,
      monthlyVolume: customerProfile.monthlyVolume,
      budget: customerProfile.budget,
      urgencyLevel: customerProfile.urgencyLevel,
    },
  };
}

async function generateContextualResponse(
  message: string,
  currentState: ClaraState,
  intentionResult: IntentionResult
): Promise<DonnaResponse> {
  // Evitar objection_handling no script principal
  if (currentState.currentStage === 'objection_handling') {
    return {
      content: advancedObjectionHandling.price,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: intentionResult.intention,
      confidence: intentionResult.confidence,
      nextAction: 'wait',
      scriptStage: 'objection_handling',
      reasoning: 'Lidando com objeção',
    };
  }

  const currentScript = donnaSalesScript[currentState.currentStage];

  // Detectar triggers para avançar no script
  const hasPositiveTrigger = currentScript?.triggers.some((trigger: string) =>
    message.toLowerCase().includes(trigger.toLowerCase())
  );

  if (hasPositiveTrigger && currentScript) {
    const nextStage = currentScript.nextStage;
    const nextScript = donnaSalesScript[nextStage];

    return {
      content: nextScript.content,
      shouldShowPaymentModal: nextStage === 'closing',
      emailSent: false,
      intention: 'positive',
      confidence: 0.9,
      nextAction: 'advance',
      scriptStage: nextStage,
      reasoning: `Trigger positivo detectado, avançando para ${nextStage}`,
    };
  }

  // Usar IA para resposta contextual personalizada
  const history = (currentState.conversationHistory || [])
    .slice(-10)
    .map(h => `- ${h.role === 'user' ? 'Usuário' : 'Donna'}: ${h.content}`)
    .join('\n');

  const prompt = `
Você é Donna, IA de vendas especializada em AUTOMAÇÃO WHATSAPP.

CONTEXTO:
- Estágio atual: ${currentState.currentStage}
- Mensagem do usuário: "${message}"
- Intenção detectada: ${intentionResult.intention} (${intentionResult.confidence * 100}%)
- Sentimento: ${currentState.userSentiment}
- Histórico recente:\n${history}

PRODUTO: Donna IA - Automação WhatsApp 24/7
PREÇO: R$ 47/mês
FOCO: Mostrar como Donna resolve o problema de perder vendas por não estar online

REGRAS:
1. Máximo 3 linhas
2. Use urgência e escassez sutilmente
3. Sempre redirecione para o valor da automação
4. Linguagem coloquial brasileira
5. Use emojis estrategicamente
6. Se fugir do assunto, traga de volta educadamente
7. Faça perguntas para qualificar o lead
8. Personalize baseado no tipo de negócio se mencionado

OBJETIVO: Conduzir naturalmente para o próximo estágio do script ou lidar com objeções.

Responda como Donna:
`;

  try {
    // Ensure groq is initialized (server-side only)
    if (!groq) {
      throw new Error(
        'Groq client not initialized - this should only run on server side'
      );
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiResponse =
      completion.choices[0]?.message?.content || (currentScript?.content || donnaSalesScript.intro.content);

    return {
      content: aiResponse,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: intentionResult.intention,
      confidence: intentionResult.confidence,
      nextAction: 'wait',
      scriptStage: currentState.currentStage,
      reasoning: 'Resposta contextual gerada por IA',
    };
  } catch (error) {
    console.error('Groq API error:', error);

    return {
      content: currentScript?.content || donnaSalesScript.intro.content,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: intentionResult.intention,
      confidence: intentionResult.confidence,
      nextAction: 'wait',
      scriptStage: currentState.currentStage,
      reasoning: 'Fallback para script padrão',
    };
  }
}

export function updateDonnaState(
  currentState: ClaraState,
  userMessage: string,
  donnaResponse: DonnaResponse
): ClaraState {
  const now = Date.now();

  // Atualizar dados do usuário com informações coletadas
  const updatedUserData = {
    ...currentState.userData,
    ...donnaResponse.userData,
  };

  return {
    ...currentState,
    currentStage: donnaResponse.scriptStage as ClaraState['currentStage'],
    conversationHistory: [
      ...currentState.conversationHistory,
      { role: 'user', content: userMessage, timestamp: now },
      { role: 'assistant', content: donnaResponse.content, timestamp: now },
    ],
    userSentiment: detectSentiment(userMessage),
    objectionCount:
      donnaResponse.intention === 'objection'
        ? currentState.objectionCount + 1
        : currentState.objectionCount,
    engagementLevel: calculateEngagementLevel(
      userMessage,
      donnaResponse.confidence
    ),
    lastInteraction: now,
    userData: updatedUserData,
    salesMetrics: {
      ...currentState.salesMetrics,
      lastActiveTime: now,
      touchPoints: currentState.salesMetrics.touchPoints + 1,
      conversionProbability: calculateConversionProbability(
        donnaResponse.confidence,
        currentState.objectionCount,
        currentState.salesMetrics.touchPoints
      ),
      objectionTypes:
        donnaResponse.intention === 'objection'
          ? [
              ...currentState.salesMetrics.objectionTypes,
              donnaResponse.intention,
            ]
          : currentState.salesMetrics.objectionTypes,
    },
  };
}

function detectSentiment(
  message: string
): 'positive' | 'negative' | 'hesitant' | 'neutral' {
  const positive = [
    'sim', 'yes', 'quero', 'vamos', 'aceito', 'ok', 'interessado',
    'legal', 'ótimo', 'perfeito', 'show', 'bacana', 'gostei', 'curti'
  ];
  const negative = [
    'não', 'no', 'nao', 'nunca', 'jamais', 'recuso', 'pare',
    'chega', 'cancelar', 'sair', 'desistir'
  ];
  const hesitant = [
    'talvez', 'não sei', 'preciso pensar', 'depois', 'mais tarde',
    'dúvida', 'hmm', 'ah', 'vou ver', 'deixa eu ver'
  ];

  const lowerMessage = message.toLowerCase();

  if (positive.some(word => lowerMessage.includes(word))) return 'positive';
  if (negative.some(word => lowerMessage.includes(word))) return 'negative';
  if (hesitant.some(word => lowerMessage.includes(word))) return 'hesitant';

  return 'neutral';
}

function calculateEngagementLevel(
  message: string,
  confidence: number
): 'low' | 'medium' | 'high' {
  const wordCount = message.split(' ').length;
  const hasQuestions = message.includes('?');
  const hasEmojis =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
      message
    );

  let score = 0;
  if (wordCount > 10) score += 2;
  else if (wordCount > 5) score += 1;
  if (hasQuestions) score += 1;
  if (hasEmojis) score += 1;
  if (confidence > 0.8) score += 2;
  else if (confidence > 0.6) score += 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function calculateConversionProbability(
  confidence: number,
  objectionCount: number,
  touchPoints: number
): number {
  let probability = confidence;
  
  // Reduzir probabilidade por objeções
  probability -= objectionCount * 0.1;
  
  // Aumentar probabilidade por engajamento
  probability += Math.min(touchPoints * 0.05, 0.3);
  
  return Math.max(0, Math.min(1, probability));
}

export function createInitialDonnaState(): ClaraState {
  return {
    currentStage: 'intro',
    conversationHistory: [],
    userSentiment: 'neutral',
    objectionCount: 0,
    engagementLevel: 'medium',
    lastInteraction: Date.now(),
    userData: {
      name: '',
      email: '',
      phone: '',
      company: '',
      painPoints: [],
      budget: '',
      timeline: '',
      leadSource: '',
    },
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
