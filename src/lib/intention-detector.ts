export interface IntentionResult {
  intention:
    | 'payment'
    | 'email'
    | 'question'
    | 'greeting'
    | 'objection'
    | 'qualify'
    | 'urgency'
    | 'contact'
    | 'competitor'
    | 'technical'
    | 'budget_inquiry'
    | 'demo_request'
    | 'pain_point'
    | 'business_info'
    | 'skeptical'
    | 'interested'
    | 'other';
  confidence: number;
  extractedData?: {
    email?: string;
    planType?: 'basic' | 'pro';
    objectionType?: 'price' | 'trust' | 'timing' | 'need' | 'authority' | 'competition' | 'technical' | 'budget' | 'skeptical' | 'feature';
    businessType?: string;
    painPoints?: string[];
    name?: string;
    phone?: string;
    company?: string;
    currentSolution?: string;
    budget?: string;
    timeline?: string;
    decisionMaker?: boolean;
    teamSize?: number;
    monthlyVolume?: number;
    urgencyLevel?: 'low' | 'medium' | 'high';
    competitorMentioned?: string;
    technicalConcerns?: string[];
    [key: string]: unknown;
  };
}

export const intentionResponses = {
  payment: {
    basic: '🎉 Perfeito! Donna por R$ 47/mês vai revolucionar seu WhatsApp. Vou te direcionar para o checkout agora!',
    general: '💰 Donna custa apenas R$ 47/mês - menos que R$ 1,60 por dia. Quer ativar agora?',
  },
  email: {
    success: '✅ Perfeito! Acabei de enviar o material completo da Donna para seu email. Chegará em alguns minutos!',
    error: '❌ Ops! Não consegui enviar. Pode me informar seu email novamente?',
    request: '📧 Claro! Vou enviar tudo sobre a Donna para seu email. Qual é?',
  },
  objection: {
    price: '💸 R$ 47/mês é "caro"? Uma única venda perdida por demora vale mais que isso. Donna se paga na primeira semana!',
    trust: '🛡️ Entendo! Por isso temos 7 dias de garantia TOTAL. Não funcionou? Devolvemos 100%. Risco zero!',
    timing: '⏰ "Vou pensar" = concorrentes agradecem. Cada hora sem Donna = leads perdidos. Decide agora ou continua perdendo?',
    need: '🎯 "Não preciso"? Seus concorrentes pensavam igual. Hoje vendem 300% mais. Quer ficar para trás?',
    authority: '👔 Precisa consultar? Que tal fazer um teste grátis de 7 dias? Aí você mostra os resultados para ele!',
    competition: '🥊 Já usa outro sistema? Donna é 10x mais inteligente. Quer comparar lado a lado?',
    technical: '🔧 Preocupado com a técnica? Donna se integra em 5 minutos. Nossa equipe faz tudo para você!',
    budget: '💰 Sem orçamento? Donna gera mais vendas que seu custo. É investimento, não gasto!',
    skeptical: '🤔 Cético? Normal! Por isso temos garantia de 7 dias. Teste sem compromisso!',
    feature: '⚡ Falta alguma função? Donna tem tudo: atendimento 24/7, agendamento, follow-up, relatórios...'
  },
  qualify: {
    business_type: '🏢 Que tipo de negócio você tem? Isso me ajuda a personalizar Donna para você!',
    pain_points: '😰 Qual sua maior dor no atendimento? Perder leads? Demora nas respostas? Donna resolve!',
    volume: '📊 Quantos clientes você atende por mês? Donna escala conforme cresce!',
    current_solution: '🔄 Como faz atendimento hoje? Manual? Donna vai automatizar tudo!',
    timeline: '⏱️ Precisa resolver isso quando? Donna ativa em 24h!',
    budget_inquiry: '💵 Qual seu orçamento para automação? R$ 47/mês cabe no seu bolso?',
    decision_maker: '🤝 Você que decide sobre ferramentas? Perfeito! Vamos ativar Donna?'
  },
  competitor: {
    general: '🏆 Já usa outro bot? Donna é diferente - ela VENDE, não só responde!',
    specific: '⚔️ Comparando com outros? Donna tem IA mais avançada e custa menos!'
  },
  technical: {
    integration: '🔗 Integração? Donna conecta com tudo: CRM, agenda, email, pagamento...',
    setup: '⚙️ Instalação? 5 minutos! Nossa equipe faz para você!',
    support: '🆘 Suporte? 24/7! Donna nunca te deixa na mão!'
  }
};

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateEmailContent(businessType?: string): string {
  const baseContent = `
    🤖 DONNA - SUA VENDEDORA DIGITAL 24/7
    
    Olá! Aqui está tudo sobre a Donna:

    ✨ O QUE DONNA FAZ:
    • Atende clientes 24/7 no seu WhatsApp
    • Qualifica leads automaticamente
    • Agenda reuniões na sua agenda
    • Envia propostas personalizadas
    • Cobra pagamentos em atraso
    • Faz follow-up inteligente
    • Relatórios de vendas detalhados

    💰 INVESTIMENTO:
    • Apenas R$ 47/mês (menos que R$ 1,60/dia)
    • Setup completo incluído
    • 7 dias de garantia total
    • Suporte 24/7 incluso

    🎯 RESULTADOS REAIS:
    • +300% em vendas (média dos clientes)
    • Resposta em 3 segundos (24/7)
    • 90% de satisfação dos leads
    • ROI médio de 800% no primeiro mês

    🚀 ATIVAÇÃO:
    • Instalação em 5 minutos
    • Treinamento personalizado
    • Suporte durante toda implementação
    
    Para ativar: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://donna.ai'}
  `;

  if (businessType) {
    return (
      baseContent +
      `\n\n🎯 PERSONALIZAÇÃO PARA ${businessType.toUpperCase()}:\nDonna será treinada especificamente para o seu segmento, com scripts otimizados para sua área!`
    );
  }

  return baseContent;
}

export async function sendEmailViaResend(
  to: string,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        content,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Erro ao enviar email' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de rede ao enviar email' };
  }
}

export function detectIntention(message: string): IntentionResult {
  const lowerMessage = message.toLowerCase();

  // OBJEÇÕES - Cobertura 100%
  
  // Objeções de PREÇO
  const priceObjections = [
    'caro', 'preço', 'valor', 'não tenho', 'não posso', 'muito dinheiro', 'barato',
    'sem dinheiro', 'sem grana', 'sem orçamento', 'custoso', 'dispendioso', 'salgado',
    'não cabe', 'não tenho como', 'está caro', 'muito caro', 'caro demais',
    'não vale', 'não compensa', 'não tenho condições', 'apertado', 'duro'
  ];
  
  if (priceObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.85,
      extractedData: { objectionType: 'price' },
    };
  }

  // Objeções de CONFIANÇA
  const trustObjections = [
    'não confio', 'suspeito', 'golpe', 'confiável', 'seguro', 'fraudulento',
    'enganação', 'pirâmide', 'esquema', 'duvidoso', 'não acredito', 'mentira',
    'fake', 'falso', 'enganar', 'roubo', 'garantia', 'prova', 'demonstração',
    'evidência', 'testemunho', 'referência', 'não é real', 'muito bom'
  ];
  
  if (trustObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.9,
      extractedData: { objectionType: 'trust' },
    };
  }

  // Objeções de TIMING
  const timingObjections = [
    'não é hora', 'mais tarde', 'depois', 'semana que vem', 'mês que vem',
    'ano que vem', 'vou pensar', 'preciso pensar', 'deixa eu ver',
    'não agora', 'momento ruim', 'timing errado', 'não tenho tempo',
    'ocupado', 'corrido', 'vou avaliar', 'conversar com', 'consultar'
  ];
  
  if (timingObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.8,
      extractedData: { objectionType: 'timing' },
    };
  }

  // Objeções de NECESSIDADE
  const needObjections = [
    'não preciso', 'não uso', 'não tenho necessidade', 'não me serve',
    'não é para mim', 'não funciona', 'não vai dar certo', 'não resolve',
    'já tenho', 'já uso', 'tenho outro', 'não encaixa', 'não combina',
    'desnecessário', 'não faz sentido', 'não vejo necessidade'
  ];
  
  if (needObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.8,
      extractedData: { objectionType: 'need' },
    };
  }

  // Objeções de AUTORIDADE
  const authorityObjections = [
    'não decido', 'não sou eu', 'tenho que perguntar', 'preciso consultar',
    'meu chefe', 'minha esposa', 'meu sócio', 'minha equipe', 'diretor',
    'gerente', 'dono', 'responsável', 'autorização', 'aprovação',
    'não posso decidir', 'não tenho autonomia', 'preciso de permissão'
  ];
  
  if (authorityObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.85,
      extractedData: { objectionType: 'authority' },
    };
  }

  // Objeções de COMPETIÇÃO
  const competitionObjections = [
    'já uso outro', 'tenho outro', 'uso o', 'chatbot', 'bot', 'sistema',
    'ferramenta', 'solução', 'concorrente', 'similar', 'parecido',
    'comparando', 'alternativa', 'opção', 'escolha', 'decisão'
  ];
  
  if (competitionObjections.some(word => lowerMessage.includes(word))) {
    const competitors = ['chatguru', 'botmaker', 'zendesk', 'intercom', 'manychat', 'typebot'];
    const mentionedCompetitor = competitors.find(comp => lowerMessage.includes(comp));
    return {
      intention: 'objection',
      confidence: 0.8,
      extractedData: { 
        objectionType: 'competition',
        competitorMentioned: mentionedCompetitor
      },
    };
  }

  // Objeções TÉCNICAS
  const technicalObjections = [
    'não sei usar', 'complicado', 'difícil', 'complexo', 'técnico',
    'não entendo', 'como funciona', 'instalação', 'configuração',
    'integração', 'compatível', 'funciona com', 'suporte técnico',
    'problema técnico', 'não sei mexer', 'sou leigo'
  ];
  
  if (technicalObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.8,
      extractedData: { objectionType: 'technical' },
    };
  }

  // Objeções de ORÇAMENTO
  const budgetObjections = [
    'sem orçamento', 'orçamento apertado', 'não tenho verba', 'sem verba',
    'gastei já', 'já gastei', 'investimento alto', 'muito investimento',
    'não posso investir', 'investir agora não', 'sem recursos'
  ];
  
  if (budgetObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.85,
      extractedData: { objectionType: 'budget' },
    };
  }

  // Objeções CÉTICAS
  const skepticalObjections = [
    'não acredito', 'cético', 'desconfiado', 'suspeito', 'duvidoso',
    'será que funciona', 'funciona mesmo', 'é verdade', 'muito bom para ser verdade',
    'promessa', 'garantia', 'prova', 'evidência', 'mostrar'
  ];
  
  if (skepticalObjections.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'objection',
      confidence: 0.8,
      extractedData: { objectionType: 'skeptical' },
    };
  }

  // QUALIFICAÇÃO DE LEADS - Perguntas estratégicas
  
  // Tipo de negócio
  const businessTypes = [
    'loja', 'e-commerce', 'consultoria', 'clínica', 'escritório', 'agência',
    'restaurante', 'salão', 'oficina', 'construtora', 'imobiliária',
    'advocacia', 'contabilidade', 'médico', 'dentista', 'veterinário',
    'escola', 'curso', 'treinamento', 'coaching', 'terapia'
  ];
  
  const businessType = businessTypes.find(type => lowerMessage.includes(type));
  if (businessType) {
    return {
      intention: 'business_info',
      confidence: 0.9,
      extractedData: { businessType },
    };
  }

  // Dores e problemas
  const painPoints = [
    'perco cliente', 'perco venda', 'demora para responder', 'não consigo atender',
    'muita demanda', 'sobregregado', 'não dou conta', 'trabalho muito',
    'fim de semana', 'madrugada', 'horário comercial', 'fora do horário',
    'cliente reclama', 'insatisfeito', 'demora', 'lento', 'manual'
  ];
  
  const detectedPains = painPoints.filter(pain => lowerMessage.includes(pain));
  if (detectedPains.length > 0) {
    return {
      intention: 'pain_point',
      confidence: 0.85,
      extractedData: { painPoints: detectedPains },
    };
  }

  // Volume de atendimento
  const volumeRegex = /(\d+)\s*(cliente|atendimento|mensagem|chat|conversa)/;
  const volumeMatch = lowerMessage.match(volumeRegex);
  if (volumeMatch) {
    return {
      intention: 'qualify',
      confidence: 0.8,
      extractedData: { monthlyVolume: parseInt(volumeMatch[1]) },
    };
  }

  // Orçamento mencionado
  const budgetRegex = /r\$\s*(\d+)/;
  const budgetMatch = lowerMessage.match(budgetRegex);
  if (budgetMatch) {
    return {
      intention: 'budget_inquiry',
      confidence: 0.8,
      extractedData: { budget: budgetMatch[0] },
    };
  }

  // INTENÇÃO DE PAGAMENTO
  const paymentIntentions = [
    'contratar', 'assinar', 'comprar', 'ativar', 'começar', 'iniciar',
    'quero', 'vamos', 'aceito', 'topo', 'fechado', 'bora', 'vou pegar',
    'quanto custa', 'preço', 'valor', 'investimento', 'checkout', 'pagar'
  ];
  
  if (paymentIntentions.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'payment',
      confidence: 0.9,
      extractedData: { planType: 'basic' },
    };
  }

  // INTENÇÃO DE EMAIL
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailIntentions = ['enviar', 'email', 'informação', 'material', 'documento'];
  
  if (emailRegex.test(message) || emailIntentions.some(word => lowerMessage.includes(word))) {
    const emailMatch = message.match(emailRegex);
    return {
      intention: 'email',
      confidence: 0.85,
      extractedData: { email: emailMatch ? emailMatch[0] : undefined },
    };
  }

  // URGÊNCIA
  const urgencyKeywords = [
    'urgente', 'imediato', 'agora', 'hoje', 'rápido', 'rapidamente',
    'já', 'logo', 'quanto antes', 'emergência', 'pressa', 'correndo'
  ];
  
  if (urgencyKeywords.some(word => lowerMessage.includes(word))) {
    const urgencyLevel = lowerMessage.includes('urgente') || lowerMessage.includes('emergência') ? 'high' : 'medium';
    return {
      intention: 'urgency',
      confidence: 0.9,
      extractedData: { urgencyLevel },
    };
  }

  // DEMONSTRAÇÃO/TESTE
  const demoKeywords = [
    'demo', 'demonstração', 'teste', 'testar', 'experimentar', 'provar',
    'mostrar', 'ver funcionando', 'exemplo', 'trial', 'período teste'
  ];
  
  if (demoKeywords.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'demo_request',
      confidence: 0.8,
    };
  }

  // SAUDAÇÃO
  const greetings = [
    'oi', 'olá', 'boa tarde', 'boa noite', 'bom dia', 'e aí', 'opa',
    'tchau', 'até logo', 'falou', 'bye', 'hello', 'hi'
  ];
  
  if (greetings.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'greeting',
      confidence: 0.7,
    };
  }

  // PERGUNTA
  const questionWords = ['como', 'quando', 'onde', 'por que', 'porque', 'qual', 'quem', 'quanto'];
  
  if (lowerMessage.includes('?') || questionWords.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'question',
      confidence: 0.7,
    };
  }

  // INTERESSE POSITIVO
  const positiveKeywords = [
    'interessante', 'legal', 'bacana', 'show', 'ótimo', 'perfeito',
    'gostei', 'curti', 'interessado', 'quero saber mais', 'me interessa'
  ];
  
  if (positiveKeywords.some(word => lowerMessage.includes(word))) {
    return {
      intention: 'interested',
      confidence: 0.8,
    };
  }

  // INFORMAÇÕES PESSOAIS/EMPRESA
  const personalInfo = {
    name: /meu nome é|me chamo|sou o|sou a|nome: /,
    phone: /meu telefone|meu número|tel:|telefone:|whats:|zap:/,
    company: /minha empresa|meu negócio|trabalho na|sou da|empresa: /
  };
  
  for (const [key, regex] of Object.entries(personalInfo)) {
    if (regex.test(lowerMessage)) {
      const match = lowerMessage.match(regex);
      return {
        intention: 'qualify',
        confidence: 0.8,
        extractedData: { [key]: match ? match[0] : undefined },
      };
    }
  }

  return {
    intention: 'other',
    confidence: 0.3,
  };
}
