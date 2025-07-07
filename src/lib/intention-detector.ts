export interface IntentionResult {
  intention: 'payment' | 'email' | 'question' | 'greeting' | 'objection' | 'other';
  confidence: number;
  extractedData?: {
    email?: string;
    planType?: 'basic' | 'pro';
    objectionType?: 'price' | 'trust' | 'timing';
    [key: string]: string | undefined;
  };
}

export const intentionResponses = {
  payment: {
    basic: 'Perfeito! O plano Básico é ideal para começar. Vou te direcionar para o checkout.',
    pro: 'Excelente escolha! O plano Pro tem todos os recursos avançados. Vou te direcionar para o checkout.',
    general: 'Temos dois planos disponíveis: Básico (R$ 49/mês) e Pro (R$ 99/mês). Qual você gostaria de conhecer?'
  },
  email: {
    success: 'Perfeito! Acabei de enviar todas as informações para o seu email. Verifique sua caixa de entrada em alguns minutos.',
    error: 'Ops! Não consegui enviar o email. Pode me informar novamente seu endereço de email?',
    request: 'Claro! Posso enviar todas as informações detalhadas para o seu email. Qual é o seu endereço de email?'
  },
  objection: {
    price: 'Entendo sua preocupação com o preço. Vamos ver: quanto você gasta por mês tentando fazer tudo manualmente? A Clara se paga sozinha!',
    trust: 'Sua confiança é importante para nós. Temos uma garantia de 30 dias - se não ficar satisfeito, devolvemos 100% do seu dinheiro.',
    timing: 'Entendo que o timing pode não parecer ideal. Mas pense assim: cada dia que passa sem automação é receita perdida. Que tal começar com o plano Básico?'
  }
};

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateEmailContent(planType?: 'basic' | 'pro'): string {
  const baseContent = `
    Olá! Aqui estão as informações sobre a Clara:

    🤖 FUNCIONALIDADES PRINCIPAIS:
    • Atendimento automático 24/7 no WhatsApp
    • Agendamento inteligente
    • Relatórios detalhados
    • Integração com campanhas de marketing
    • Suporte humano quando necessário

    📊 PLANOS DISPONÍVEIS:
    • Básico (R$ 49/mês): Até 1000 atendimentos/mês
    • Pro (R$ 99/mês): Atendimentos ilimitados + recursos avançados

    🎯 BENEFÍCIOS:
    • Aumente suas vendas em até 300%
    • Reduza custos operacionais
    • Melhore a experiência do cliente
    • Tenha insights valiosos sobre seu negócio

    Para contratar ou saber mais, acesse: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://clara.ai'}
  `;

  if (planType === 'pro') {
    return baseContent + `\n\n✨ VOCÊ DEMONSTROU INTERESSE NO PLANO PRO!\nRecursos exclusivos: IA avançada, integrações ilimitadas, suporte prioritário.`;
  }

  return baseContent;
}

export async function sendEmailViaResend(to: string, subject: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        content
      })
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
  
  // Detecta objeções
  if (lowerMessage.includes('caro') || lowerMessage.includes('preço') || 
      lowerMessage.includes('não tenho') || lowerMessage.includes('não posso') ||
      lowerMessage.includes('muito dinheiro') || lowerMessage.includes('barato')) {
    return {
      intention: 'objection',
      confidence: 0.8,
      extractedData: { objectionType: 'price' }
    };
  }
  
  if (lowerMessage.includes('não confio') || lowerMessage.includes('suspeito') || 
      lowerMessage.includes('golpe') || lowerMessage.includes('confiável')) {
    return {
      intention: 'objection',
      confidence: 0.9,
      extractedData: { objectionType: 'trust' }
    };
  }
  
  // Detecta intenção de pagamento
  if (lowerMessage.includes('contratar') || lowerMessage.includes('assinar') || 
      lowerMessage.includes('plano') || lowerMessage.includes('comprar')) {
    const isProPlan = lowerMessage.includes('pro') || lowerMessage.includes('premium');
    return {
      intention: 'payment',
      confidence: 0.9,
      extractedData: {
        planType: isProPlan ? 'pro' : 'basic'
      }
    };
  }
  
  // Detecta intenção de email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (emailRegex.test(message) || lowerMessage.includes('enviar') || 
      lowerMessage.includes('email') || lowerMessage.includes('informação')) {
    const emailMatch = message.match(emailRegex);
    return {
      intention: 'email',
      confidence: 0.8,
      extractedData: {
        email: emailMatch ? emailMatch[0] : undefined
      }
    };
  }
  
  // Detecta saudação
  if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || 
      lowerMessage.includes('boa') || lowerMessage.includes('tchau')) {
    return {
      intention: 'greeting',
      confidence: 0.7
    };
  }
  
  // Detecta pergunta
  if (lowerMessage.includes('?') || lowerMessage.includes('como') || 
      lowerMessage.includes('quando') || lowerMessage.includes('onde') ||
      lowerMessage.includes('por que') || lowerMessage.includes('qual')) {
    return {
      intention: 'question',
      confidence: 0.6
    };
  }
  
  return {
    intention: 'other',
    confidence: 0.3
  };
}
