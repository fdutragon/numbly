export interface ClaraScriptStage {
  id: string;
  name: string;
  content: string;
  triggers?: string[];
  nextStage?: string;
  isClosing?: boolean;
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
  },
  
  pain_point: {
    id: 'pain_point',
    name: 'Pain + Cost of Inaction',
    content: `Você pode continuar respondendo tudo no braço.

Mas enquanto você atende 1 cliente, já perdeu outros 3.

A Clara resolve isso com mensagens inteligentes e automação em tempo real.
Por menos do que você gastaria com 1 pizza por semana.`,
    nextStage: 'main_offer',
  },
  
  main_offer: {
    id: 'main_offer',
    name: 'Main Offer',
    content: `R$247 por mês. Sem painel. Sem complicação.
Só resultado direto no seu WhatsApp.

Você ativa, eu assumo.
Vamos colocar a Clara pra trabalhar agora?`,
    nextStage: 'bump_offer',
    triggers: ['sim', 'yes', 'vamos', 'quero', 'aceito', 'ok'],
  },
  
  bump_offer: {
    id: 'bump_offer',
    name: 'Bump Offer',
    content: `[Aguardando 2 segundos...]

Agora... se você quiser transformar a Clara numa máquina de captar clientes:

💡 Eu posso ativar o **modo tráfego**.
Clara se conecta ao Google, analisa anúncios e ajusta tudo com inteligência.

É R$97 a mais.
Mas o que você perde por não aparecer no Google pode custar muito mais.

Quer ativar essa versão turbo agora?`,
    nextStage: 'closing',
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
    "Ainda está aí ou já foi automatizar a concorrência?",
    "O silêncio me diz muito. Quer que eu explique de outro jeito?",
    "⚠️ O sistema ainda não detectou sua ativação. Lembre-se: o tempo que você demora pra decidir, seu concorrente agradece."
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
  
  // Check for closing triggers
  if (stage.triggers && userInput) {
    const hasPositiveTrigger = stage.triggers.some(trigger => 
      userInput.toLowerCase().includes(trigger.toLowerCase())
    );
    if (hasPositiveTrigger && stage.nextStage) {
      return stage.nextStage;
    }
  }
  
  return stage.nextStage || currentStage;
}

export function detectUserSentiment(input: string): 'positive' | 'negative' | 'hesitant' | 'neutral' {
  const positive = ['sim', 'yes', 'quero', 'vamos', 'aceito', 'ok', 'interessado', 'legal'];
  const negative = ['não', 'no', 'nao', 'nunca', 'jamais', 'recuso'];
  const hesitant = ['talvez', 'não sei', 'preciso pensar', 'depois', 'mais tarde', 'dúvida'];
  
  const lowerInput = input.toLowerCase();
  
  if (positive.some(word => lowerInput.includes(word))) return 'positive';
  if (negative.some(word => lowerInput.includes(word))) return 'negative';
  if (hesitant.some(word => lowerInput.includes(word))) return 'hesitant';
  
  return 'neutral';
}

export function getContextResponse(
  sentiment: string, 
  hesitationCount: number, 
  noResponseCount: number
): string | null {
  if (sentiment === 'hesitant' || hesitationCount > 0) {
    return claraContextResponses.hesitation[
      Math.min(hesitationCount, claraContextResponses.hesitation.length - 1)
    ];
  }
  
  if (noResponseCount > 0) {
    return claraContextResponses.no_response[
      Math.min(noResponseCount, claraContextResponses.no_response.length - 1)
    ];
  }
  
  if (sentiment === 'positive') {
    return claraContextResponses.interest_signals[0];
  }
  
  return null;
}
