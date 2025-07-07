export interface ClaraScriptStage {
  id: string;
  name: string;
  content: string;
  triggers?: string[];
  nextStage?: string;
  isClosing?: boolean;
  autoAdvance?: boolean; // Avança automaticamente após um tempo
  autoAdvanceDelay?: number; // Tempo em ms para avançar automaticamente
}

export interface ClaraScriptFlow {
  currentStage: string;
  userResponses: string[];
  hesitationCount: number;
  noResponseCount: number;
  lastInteraction: number;
}

// Main Clara sales script stages
export const claraScript: Record<string, ClaraScriptStage> = {
  greeting: {
    id: 'greeting',
    name: 'Impact Approach',
    content: `Olá! Você é rápido. Por isso chegou até mim.

Sou a Clara, a IA que responde clientes, gera leads e **nunca tira férias.**

Quer que eu trabalhe por você enquanto você foca no que importa?`,
    nextStage: 'pain_point',
    autoAdvance: true,
    autoAdvanceDelay: 8000, // 8 segundos
  },
  
  pain_point: {
    id: 'pain_point',
    name: 'Pain + Cost of Inaction',
    content: `Você pode continuar respondendo tudo no braço.

Mas enquanto você atende 1 cliente, já perdeu outros 3.

A Clara resolve isso com mensagens inteligentes e automação em tempo real.
Por menos do que você gastaria com 1 pizza por semana.

Quer ver como funciona?`,
    nextStage: 'main_offer',
    triggers: ['sim', 'yes', 'quero', 'como', 'funciona', 'interessado', 'legal', 'ok', 'vamos', 'show', 'demonstrar'],
    autoAdvance: true,
    autoAdvanceDelay: 10000, // 10 segundos
  },
  
  main_offer: {
    id: 'main_offer',
    name: 'Main Offer',
    content: `R$247 por mês. Sem painel. Sem complicação.
Só resultado direto no seu WhatsApp.

Você ativa, eu assumo.
Vamos colocar a Clara pra trabalhar agora?`,
    nextStage: 'bump_offer',
    triggers: ['sim', 'yes', 'vamos', 'quero', 'aceito', 'ok', 'ativar', 'começar', 'contratar'],
    autoAdvance: true,
    autoAdvanceDelay: 12000, // 12 segundos
  },
  
  bump_offer: {
    id: 'bump_offer',
    name: 'Bump Offer',
    content: `Perfeito! Você está quase lá...

Agora... se você quiser transformar a Clara numa máquina de captar clientes:

💡 Eu posso ativar o **modo tráfego**.
Clara se conecta ao Google, analisa anúncios e ajusta tudo com inteligência.

É R$97 a mais.
Mas o que você perde por não aparecer no Google pode custar muito mais.

Quer ativar essa versão turbo agora?`,
    nextStage: 'closing',
    triggers: ['sim', 'yes', 'quero', 'ativar', 'turbo', 'completo', 'tudo'],
    autoAdvance: true,
    autoAdvanceDelay: 15000, // 15 segundos
  },
  
  closing: {
    id: 'closing',
    name: 'Closing',
    content: `Você escolhe:
✅ Ativar só a Clara por R$247
ou
🚀 Clara + Tráfego turbo por R$344.

Me diga que versão você quer. O link vai com tudo pronto.`,
    isClosing: true,
  },
};

// Context-triggered responses
export const claraContextResponses = {
  hesitation: [
    "Você pode adiar isso. Mas e se perder o próximo cliente agora?",
    "Entendo a hesitação. Mas cada minuto sem automação é dinheiro que não volta.",
    "Posso te fazer uma pergunta? Quantos clientes você perdeu essa semana por não responder rápido?"
  ],
  
  no_response: [
    "Ainda está aí? Vou continuar então...",
    "Sei que está pensando. Deixe-me te mostrar mais...",
    "O silêncio fala muito. Que tal ver como isso funciona na prática?"
  ],
  
  pain_point_follow: [
    "Vou ser direta: enquanto você hesita, seus concorrentes estão automatizando.",
    "Cada cliente que você perde por demora na resposta vale quanto?",
    "A Clara trabalha 24/7. Você consegue fazer isso?"
  ],
  
  objection_price: [
    "Entendo. R$247 parece muito? Quanto você perde por mês sem automação?",
    "Uma pergunta: quanto custa perder 1 cliente por semana? A Clara paga a si mesma.",
    "R$247 é menos que R$8 por dia. Quanto vale sua paz de espírito?"
  ],
  
  objection_trust: [
    "Desconfiança é normal. Quer ver a Clara funcionando primeiro? Posso mostrar.",
    "Entendo. Por isso ofereço garantia total. Se não funcionar, você não paga.",
    "Confiar em IA é o futuro. Confiar em humanos para tudo é o passado."
  ],
  
  interest_signals: [
    "Vejo que você está interessado. Que parte mais chamou atenção?",
    "Ótimo! Você quer começar com qual versão? Básica ou com tráfego?",
    "Perfeito. Vou preparar seu acesso. Qual seu WhatsApp principal?"
  ],
};

// Follow-up scripts for re-engagement
export const claraFollowUp = [
  "Quer saber o real motivo da sua agenda estar vazia? Não é o tráfego. É a ausência de Clara.",
  "Sua concorrência já automatizou enquanto você pensava. Ainda dá tempo de recuperar.",
  "3 clientes tentaram te contactar hoje. A Clara teria convertido todos. E agora?"
];

// Utility functions for script management
export function getNextStage(currentStage: string, userInput?: string): string {
  const stage = claraScript[currentStage];
  if (!stage) return 'greeting';
  
  // Se não tem input do usuário, retorna o próximo estágio automaticamente após um tempo
  if (!userInput && stage.nextStage) {
    return stage.nextStage;
  }
  
  // Check for closing triggers
  if (stage.triggers && userInput) {
    const hasPositiveTrigger = stage.triggers.some(trigger => 
      userInput.toLowerCase().includes(trigger.toLowerCase())
    );
    if (hasPositiveTrigger && stage.nextStage) {
      return stage.nextStage;
    }
  }
  
  // Se tem input mas não matchou triggers, ainda avança se não for closing
  if (userInput && stage.nextStage && !stage.isClosing) {
    return stage.nextStage;
  }
  
  return stage.nextStage || currentStage;
}

export function shouldAutoAdvance(stage: ClaraScriptStage, timeSinceLastMessage: number): boolean {
  return !!(stage.autoAdvance && 
           stage.autoAdvanceDelay && 
           timeSinceLastMessage >= stage.autoAdvanceDelay);
}

export function getAutoAdvanceDelay(stageId: string): number {
  const stage = claraScript[stageId];
  return stage?.autoAdvanceDelay || 0;
}

export function detectUserSentiment(input: string): 'positive' | 'negative' | 'hesitant' | 'neutral' {
  const positive = ['sim', 'yes', 'quero', 'vamos', 'aceito', 'ok', 'interessado', 'legal', 'como', 'funciona', 'show', 'demonstrar', 'ativar', 'começar'];
  const negative = ['não', 'no', 'nao', 'nunca', 'jamais', 'recuso', 'pare', 'chega', 'cancelar'];
  const hesitant = ['talvez', 'não sei', 'preciso pensar', 'depois', 'mais tarde', 'dúvida', 'hmm', 'ah'];
  
  const lowerInput = input.toLowerCase();
  
  if (positive.some(word => lowerInput.includes(word))) return 'positive';
  if (negative.some(word => lowerInput.includes(word))) return 'negative';
  if (hesitant.some(word => lowerInput.includes(word))) return 'hesitant';
  
  return 'neutral';
}

export function getContextResponse(
  sentiment: string, 
  hesitationCount: number, 
  noResponseCount: number,
  currentStage?: string
): string | null {
  // Respostas específicas para pain_point quando não há resposta
  if (currentStage === 'pain_point' && noResponseCount > 0) {
    return claraContextResponses.pain_point_follow[
      Math.min(noResponseCount - 1, claraContextResponses.pain_point_follow.length - 1)
    ];
  }
  
  if (sentiment === 'hesitant' || hesitationCount > 0) {
    return claraContextResponses.hesitation[
      Math.min(hesitationCount, claraContextResponses.hesitation.length - 1)
    ];
  }
  
  if (noResponseCount > 0) {
    return claraContextResponses.no_response[
      Math.min(noResponseCount - 1, claraContextResponses.no_response.length - 1)
    ];
  }
  
  if (sentiment === 'positive') {
    return claraContextResponses.interest_signals[0];
  }
  
  return null;
}

export function manageScriptFlow(
  currentStageId: string,
  userInput: string | null,
  flow: ClaraScriptFlow
): { nextStage: string; response: string; shouldWait: boolean } {
  const currentStage = claraScript[currentStageId];
  if (!currentStage) {
    return { nextStage: 'greeting', response: claraScript.greeting.content, shouldWait: false };
  }

  // Se o usuário respondeu
  if (userInput) {
    const sentiment = detectUserSentiment(userInput);
    
    // Respostas positivas avançam no script
    if (sentiment === 'positive') {
      const nextStage = getNextStage(currentStageId, userInput);
      const nextStageObj = claraScript[nextStage];
      return { 
        nextStage, 
        response: nextStageObj?.content || currentStage.content, 
        shouldWait: false 
      };
    }
    
    // Respostas negativas ou hesitantes geram contexto
    if (sentiment === 'negative' || sentiment === 'hesitant') {
      const contextResponse = getContextResponse(sentiment, flow.hesitationCount, flow.noResponseCount, currentStageId);
      if (contextResponse) {
        return { 
          nextStage: currentStageId, 
          response: contextResponse, 
          shouldWait: true 
        };
      }
    }
  }

  // Auto-advance se configurado
  if (currentStage.autoAdvance && currentStage.autoAdvanceDelay) {
    const timeSinceLastMessage = Date.now() - flow.lastInteraction;
    if (timeSinceLastMessage >= currentStage.autoAdvanceDelay) {
      const nextStage = getNextStage(currentStageId);
      const nextStageObj = claraScript[nextStage];
      return { 
        nextStage, 
        response: nextStageObj?.content || currentStage.content, 
        shouldWait: false 
      };
    }
  }

  // Padrão: manter estágio atual
  return { 
    nextStage: currentStageId, 
    response: currentStage.content, 
    shouldWait: true 
  };
}
