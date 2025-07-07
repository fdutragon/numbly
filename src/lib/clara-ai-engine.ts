import Groq from 'groq-sdk';
import { 
  detectIntention, 
  sendEmailViaResend, 
  generateEmailContent,
  validateEmail,
  intentionResponses,
  type IntentionResult
} from '@/lib/intention-detector';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ClaraResponse {
  content: string;
  shouldShowPaymentModal: boolean;
  emailSent: boolean;
  intention: string;
  confidence: number;
  nextAction?: 'wait' | 'advance' | 'checkout' | 'email' | 'objection';
  scriptStage: string;
  reasoning: string;
}

export interface ClaraState {
  currentStage: 'intro' | 'pain_point' | 'solution' | 'pricing' | 'closing' | 'objection_handling';
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userSentiment: 'positive' | 'negative' | 'hesitant' | 'neutral';
  objectionCount: number;
  engagementLevel: 'low' | 'medium' | 'high';
  lastInteraction: number;
}

// Scripts otimizados para automação WhatsApp
interface ScriptStage {
  content: string;
  triggers: string[];
  nextStage: string;
}

const claraSalesScript: Record<string, ScriptStage> = {
  intro: {
    content: `Oi! 👋 Sou a Clara, sua futura assistente de vendas 24/7.

Sabe aquele cliente que manda mensagem às 2h da manhã? Eu respondo.
Aquele lead que chega no fim de semana? Eu converto.

Quer parar de perder vendas por "não estar online"?`,
    triggers: ['sim', 'quero', 'interessado', 'como', 'funciona'],
    nextStage: 'pain_point'
  },
  
  pain_point: {
    content: `Vou ser direta: **enquanto você dorme, seus concorrentes vendem.**

❌ Você perde 60% dos leads por demora na resposta
❌ Atende 1 cliente enquanto 5 desistem
❌ Fim de semana = zero vendas

A Clara resolve isso. Trabalha 24/7, responde em segundos, converte leads quentes.

Quer ver como?`,
    triggers: ['sim', 'quero', 'ver', 'como', 'funciona', 'interessado'],
    nextStage: 'solution'
  },
  
  solution: {
    content: `🤖 **Clara = Seu vendedor que nunca tira férias**

✅ Responde INSTANTANEAMENTE qualquer horário
✅ Qualifica leads automaticamente  
✅ Agenda reuniões direto na sua agenda
✅ Envia propostas personalizadas
✅ Cobra pagamentos em atraso
✅ Faz follow-up inteligente

Tudo no SEU WhatsApp. Sem chatbot genérico.

Pronto para multiplicar suas vendas?`,
    triggers: ['sim', 'pronto', 'quero', 'quanto', 'preço', 'valor'],
    nextStage: 'pricing'
  },
  
  pricing: {
    content: `💰 **Investimento:** R$ 247/mês

Menos que R$ 8/dia. Menos que um lanche.

Mas Clara pode trazer R$ 10.000+ por mês em vendas novas.

ROI de 4.000%. Matemática simples.

**Quer ativar hoje?** Link do checkout vai na próxima mensagem.`,
    triggers: ['sim', 'ativar', 'quero', 'vamos', 'aceito'],
    nextStage: 'closing'
  },
  
  closing: {
    content: `🎉 **PERFEITO!** Checkout liberado!

✅ Clara Basic: R$ 247/mês
✅ Setup completo incluído
✅ 7 dias de garantia
✅ Suporte prioritário

Clique e ative agora. Em 24h você estará vendendo no automático!`,
    triggers: ['ativar', 'checkout', 'pagar'],
    nextStage: 'closing'
  }
};

const objectionHandling = {
  price: `R$ 247 é "caro"? 🤔

Uma única venda perdida por falta de resposta rápida vale mais que isso.

Clara se paga na primeira semana. Resto é LUCRO PURO.

Quer continuar perdendo vendas ou quer multiplicar?`,
  
  trust: `Entendo a desconfiança. Por isso:

✅ 7 dias de garantia total
✅ +500 clientes satisfeitos
✅ Suporte 24/7
✅ Pode cancelar quando quiser

Risco zero. Só resultado.`,
  
  time: `"Vou pensar" = seus concorrentes agradecem 🙏

Cada hora sem Clara = leads perdidos.
Cada dia sem automação = dinheiro que não volta.

Decide agora ou continua perdendo?`,
  
  need: `"Não preciso"? 

Seus concorrentes pensavam igual.
Hoje eles vendem 300% mais com automação.

Quer ficar para trás ou liderar?`
};

export async function processUserMessage(
  message: string,
  currentState: ClaraState
): Promise<ClaraResponse> {
  try {
    // 1. Detectar intenção com IA
    const intentionResult = await detectIntention(message);
    
    // 2. Processar intenções especiais primeiro
    if (intentionResult.intention === 'payment' && intentionResult.confidence > 0.7) {
      return {
        content: intentionResponses.payment.general,
        shouldShowPaymentModal: true,
        emailSent: false,
        intention: 'payment',
        confidence: intentionResult.confidence,
        nextAction: 'checkout',
        scriptStage: 'closing',
        reasoning: 'Usuário demonstrou intenção clara de pagamento'
      };
    }
    
    if (intentionResult.intention === 'email' && intentionResult.confidence > 0.7) {
      const emailRecipient = intentionResult.extractedData?.emailRecipient;
      
      if (emailRecipient && validateEmail(emailRecipient)) {
        try {
          const emailContent = generateEmailContent();
          const emailResult = await sendEmailViaResend(
            emailRecipient,
            'Clara IA - Automação WhatsApp Profissional',
            emailContent
          );
          
          return {
            content: emailResult.success ? intentionResponses.email.success : intentionResponses.email.error,
            shouldShowPaymentModal: false,
            emailSent: emailResult.success,
            intention: 'email',
            confidence: intentionResult.confidence,
            nextAction: 'wait',
            scriptStage: currentState.currentStage,
            reasoning: `Email ${emailResult.success ? 'enviado com sucesso' : 'falhou'} para ${emailRecipient}`
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
            reasoning: 'Erro ao enviar email'
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
          reasoning: 'Email inválido ou não fornecido'
        };
      }
    }
    
    // 3. Detectar objeções
    if (intentionResult.intention === 'objection' && intentionResult.confidence > 0.6) {
      const objectionType = intentionResult.extractedData?.objectionType || 'price';
      const objectionResponse = objectionHandling[objectionType as keyof typeof objectionHandling];
      
      return {
        content: objectionResponse,
        shouldShowPaymentModal: false,
        emailSent: false,
        intention: 'objection',
        confidence: intentionResult.confidence,
        nextAction: 'objection',
        scriptStage: 'objection_handling',
        reasoning: `Objeção detectada: ${objectionType}`
      };
    }
    
    // 4. Processar com IA contextual avançada
    const contextualResponse = await generateContextualResponse(message, currentState, intentionResult);
    
    return contextualResponse;
    
  } catch (error) {
    console.error('Clara AI Engine error:', error);
    
    // Fallback para script padrão
    const fallbackContent = currentState.currentStage !== 'objection_handling' 
      ? claraSalesScript[currentState.currentStage]?.content || claraSalesScript.intro.content
      : objectionHandling.price;
      
    return {
      content: fallbackContent,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: 'general',
      confidence: 0.5,
      nextAction: 'wait',
      scriptStage: currentState.currentStage,
      reasoning: 'Fallback devido a erro'
    };
  }
}

async function generateContextualResponse(
  message: string,
  currentState: ClaraState,
  intentionResult: IntentionResult
): Promise<ClaraResponse> {
  // Evitar objection_handling no script principal
  if (currentState.currentStage === 'objection_handling') {
    return {
      content: objectionHandling.price,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: intentionResult.intention,
      confidence: intentionResult.confidence,
      nextAction: 'wait',
      scriptStage: 'objection_handling',
      reasoning: 'Lidando com objeção'
    };
  }

  const currentScript = claraSalesScript[currentState.currentStage];
  
  // Detectar triggers para avançar no script
  const hasPositiveTrigger = currentScript.triggers.some((trigger: string) => 
    message.toLowerCase().includes(trigger.toLowerCase())
  );
  
  if (hasPositiveTrigger) {
    const nextStage = currentScript.nextStage;
    const nextScript = claraSalesScript[nextStage];
    
    return {
      content: nextScript.content,
      shouldShowPaymentModal: nextStage === 'closing',
      emailSent: false,
      intention: 'positive',
      confidence: 0.9,
      nextAction: 'advance',
      scriptStage: nextStage,
      reasoning: `Trigger positivo detectado, avançando para ${nextStage}`
    };
  }
  
  // Usar IA para resposta contextual personalizada
  const prompt = `
Você é Clara, IA de vendas especializada em AUTOMAÇÃO WHATSAPP.

CONTEXTO:
- Estágio atual: ${currentState.currentStage}
- Mensagem do usuário: "${message}"
- Intenção detectada: ${intentionResult.intention} (${intentionResult.confidence * 100}%)
- Sentimento: ${currentState.userSentiment}

PRODUTO: Clara IA - Automação WhatsApp 24/7
PREÇO: R$ 247/mês
FOCO: Mostrar como Clara resolve o problema de perder vendas por não estar online

REGRAS:
1. Máximo 3 linhas
2. Use urgência e escassez sutilmente
3. Sempre redirecione para o valor da automação
4. Linguagem coloquial brasileira
5. Use emojis estrategicamente
6. Se fugir do assunto, traga de volta educadamente

OBJETIVO: Conduzir naturalmente para o próximo estágio do script ou lidar com objeções.

Responda como Clara:
`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || currentScript.content;
    
    return {
      content: aiResponse,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: intentionResult.intention,
      confidence: intentionResult.confidence,
      nextAction: 'wait',
      scriptStage: currentState.currentStage,
      reasoning: 'Resposta contextual gerada por IA'
    };
    
  } catch (error) {
    console.error('Groq API error:', error);
    
    return {
      content: currentScript.content,
      shouldShowPaymentModal: false,
      emailSent: false,
      intention: intentionResult.intention,
      confidence: intentionResult.confidence,
      nextAction: 'wait',
      scriptStage: currentState.currentStage,
      reasoning: 'Fallback para script padrão'
    };
  }
}

export function updateClaraState(
  currentState: ClaraState,
  userMessage: string,
  claraResponse: ClaraResponse
): ClaraState {
  return {
    ...currentState,
    currentStage: claraResponse.scriptStage as ClaraState['currentStage'],
    conversationHistory: [
      ...currentState.conversationHistory,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: claraResponse.content }
    ],
    userSentiment: detectSentiment(userMessage),
    objectionCount: claraResponse.intention === 'objection' ? currentState.objectionCount + 1 : currentState.objectionCount,
    engagementLevel: calculateEngagementLevel(userMessage, claraResponse.confidence),
    lastInteraction: Date.now()
  };
}

function detectSentiment(message: string): 'positive' | 'negative' | 'hesitant' | 'neutral' {
  const positive = ['sim', 'yes', 'quero', 'vamos', 'aceito', 'ok', 'interessado', 'legal', 'ótimo', 'perfeito'];
  const negative = ['não', 'no', 'nao', 'nunca', 'jamais', 'recuso', 'pare', 'chega', 'cancelar'];
  const hesitant = ['talvez', 'não sei', 'preciso pensar', 'depois', 'mais tarde', 'dúvida', 'hmm', 'ah'];
  
  const lowerMessage = message.toLowerCase();
  
  if (positive.some(word => lowerMessage.includes(word))) return 'positive';
  if (negative.some(word => lowerMessage.includes(word))) return 'negative';
  if (hesitant.some(word => lowerMessage.includes(word))) return 'hesitant';
  
  return 'neutral';
}

function calculateEngagementLevel(message: string, confidence: number): 'low' | 'medium' | 'high' {
  const wordCount = message.split(' ').length;
  const hasQuestions = message.includes('?');
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(message);
  
  let score = 0;
  if (wordCount > 5) score += 1;
  if (hasQuestions) score += 1;
  if (hasEmojis) score += 1;
  if (confidence > 0.7) score += 1;
  
  if (score >= 3) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export function createInitialClaraState(): ClaraState {
  return {
    currentStage: 'intro',
    conversationHistory: [],
    userSentiment: 'neutral',
    objectionCount: 0,
    engagementLevel: 'medium',
    lastInteraction: Date.now()
  };
}
