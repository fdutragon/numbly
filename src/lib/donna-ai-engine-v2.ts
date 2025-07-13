import { detectIntention } from '@/lib/ai-intention-detector';

export interface DonnaResponse {
  content: string;
  shouldShowPaymentModal?: boolean;
  nextAction?: string;
  scriptStage?: string;
}

// Funil de vendas simplificado
const SALES_FUNNEL = [
  'qualification', // Pergunta sobre o negócio do cliente
  'presentation',  // Apresenta a solução
  'pricing',       // Fala de preço
  'closing'        // Chama para ação
];

// Respostas padrão para cada etapa
const FUNNEL_RESPONSES: Record<string, string> = {
  qualification: '📊 Me conta: que tipo de negócio você tem? Isso me ajuda a personalizar Donna perfeitamente pra você!',
  presentation: 'Donna automatiza vendas, responde clientes e recupera carrinhos 24/7. Quer ver como funciona?',
  pricing: 'Donna custa R$ 47/mês, sem taxas extras. Quer ativar o teste grátis?',
  closing: 'Posso liberar seu teste grátis agora mesmo! Me confirma seu e-mail?'
};

// Detecta se a pergunta é sobre preço
function isPriceQuestion(message: string) {
  return /preço|valor|custa|mensalidade|quanto/i.test(message);
}

// Engine principal
export async function donnaEngineV2(userMessage: string, funnelStage: string = 'qualification'): Promise<DonnaResponse> {
  // 1. Detecta intenção
  const intention = detectIntention(userMessage);

  // 2. Se for pergunta de preço, responde e volta ao funil
  if (isPriceQuestion(userMessage)) {
    return {
      content: 'Donna custa R$ 47/mês, sem taxas extras. Agora, pra te ajudar melhor: ' + FUNNEL_RESPONSES['qualification'],
      scriptStage: 'pricing',
      nextAction: 'ask_business_type'
    };
  }

  // 3. Se intenção for dúvida genérica, responde e volta ao funil
  if (intention.intention === 'question') {
    return {
      content: 'Ótima pergunta! Donna resolve dúvidas, automatiza vendas e recupera clientes. ' + FUNNEL_RESPONSES[funnelStage],
      scriptStage: funnelStage,
      nextAction: 'continue_funnel'
    };
  }

  // 4. Se intenção não for reconhecida, segue o funil normalmente
  return {
    content: FUNNEL_RESPONSES[funnelStage] || FUNNEL_RESPONSES['qualification'],
    scriptStage: funnelStage,
    nextAction: 'continue_funnel'
  };
}
