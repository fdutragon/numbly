// Respostas diretas de vendas
const SALES_RESPONSES = {
  intro: `🚀 Oi! Sou a Donna, sua vendedora digital.

Multiplico suas vendas 24/7 no WhatsApp.
Atendo seus clientes enquanto você dorme.

💰 Clientes faturam +R$ 5mil/mês comigo.
⚡ Setup em 5 minutos
✨ 7 dias grátis

Quer vender mais?`,

  features: `🤖 Vendo por você 24/7:

✅ Respondo em 3 segundos
✅ Agendo reuniões direto na sua agenda
✅ Envio propostas personalizadas
✅ Faço cobranças automáticas
✅ Qualifico leads sozinha

R$ 47/mês. Quer começar agora?`,

  closing: `💰 Vamos lá:

✓ Setup grátis hoje (economia de R$ 197)
✓ 7 dias para testar sem pagar nada
✓ Cancela quando quiser

[COMEÇAR AGORA] ← Clique aqui`,

  objection: `📊 Fatos rápidos:

• Setup em 5 minutos
• Suporte 24/7
• +500 empresas usando
• ROI garantido ou dinheiro de volta

Quer testar 7 dias grátis?`
};

// Palavras-chave de vendas
const SALES_TRIGGERS = {
  buy: ['quero', 'bora', 'sim', 'ok', 'começar', 'comprar', 'contratar', 'ativar'],
  info: ['como', 'funciona', 'explica', 'quanto', 'preço', 'valor'],
  doubt: ['não', 'caro', 'depois', 'pensar', 'dúvida', 'mas']
};

export interface DonnaResponse {
  content: string;
  shouldShowPaymentModal: boolean;
}

// Detecta intenção de compra
function detectSalesIntent(message: string): string {
  const text = message.toLowerCase();
  
  if (SALES_TRIGGERS.buy.some(word => text.includes(word))) {
    return 'buy';
  }
  
  if (SALES_TRIGGERS.info.some(word => text.includes(word))) {
    return 'info';
  }
  
  if (SALES_TRIGGERS.doubt.some(word => text.includes(word))) {
    return 'doubt';
  }
  
  return 'unknown';
}

// Processa mensagem e retorna resposta de vendas
export async function processMessage(message: string): Promise<DonnaResponse> {
  const intent = detectSalesIntent(message);
  
  switch (intent) {
    case 'buy':
      return {
        content: SALES_RESPONSES.closing,
        shouldShowPaymentModal: true
      };
      
    case 'info':
      return {
        content: SALES_RESPONSES.features,
        shouldShowPaymentModal: false
      };
      
    case 'doubt':
      return {
        content: SALES_RESPONSES.objection,
        shouldShowPaymentModal: false
      };
      
    default:
      return {
        content: SALES_RESPONSES.features,
        shouldShowPaymentModal: false
      };
  }
}

// Mensagem inicial
export function getInitialMessage(): string {
  return SALES_RESPONSES.intro;
}
