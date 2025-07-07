import Groq from 'groq-sdk';

export interface IntentionResult {
  intention: 'payment' | 'email' | 'general' | 'objection';
  confidence: number;
  extractedData?: {
    plan?: 'basic' | 'pro';
    emailRecipient?: string;
    emailSubject?: string;
    emailContent?: string;
    objectionType?: 'price' | 'trust' | 'time' | 'need';
  };
  suggestedResponse?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  content: string;
  from?: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Detecta a intenção do usuário baseado na mensagem usando sistema híbrido
 */
export async function detectIntention(message: string): Promise<IntentionResult> {
  // Palavras-chave para detecção rápida e alta confiança
  const paymentKeywords = [
    'pagar', 'pagamento', 'comprar', 'assinar', 'plano', 'contratar', 
    'checkout', 'cartão', 'pix', 'valor', 'preço', 'quanto custa',
    'quero o plano', 'me manda o link', 'vou pagar', 'fechar negócio',
    'quero contratar', 'vou assinar', 'aceito', 'fechado'
  ];

  const emailKeywords = [
    'enviar email', 'mandar email', 'envie para', 'mande para',
    'email para', 'e-mail para', 'disparar email', 'enviar para',
    'clara envie', 'clara mande', 'pode enviar', 'pode mandar',
    'dispare um email', 'mande um e-mail', 'envie informações'
  ];

  const objectionKeywords = [
    'caro', 'muito caro', 'não tenho dinheiro', 'não posso pagar',
    'não confio', 'dúvida', 'não sei', 'preciso pensar',
    'vou pensar', 'depois', 'mais tarde', 'não preciso',
    'muito valor', 'não tenho certeza', 'hesitando'
  ];

  const messageLower = message.toLowerCase();

  // Detecção rápida baseada em keywords (alta confiança)
  let quickResult: { intention: IntentionResult['intention']; confidence: number } | null = null;

  if (paymentKeywords.some(keyword => messageLower.includes(keyword))) {
    quickResult = { intention: 'payment', confidence: 0.9 };
  } else if (emailKeywords.some(keyword => messageLower.includes(keyword))) {
    quickResult = { intention: 'email', confidence: 0.95 };
  } else if (objectionKeywords.some(keyword => messageLower.includes(keyword))) {
    quickResult = { intention: 'objection', confidence: 0.8 };
  }

  // Se temos alta confiança, usar resultado rápido
  if (quickResult && quickResult.confidence >= 0.85) {
    const extractedData = await extractIntentionData(message, quickResult.intention);
    return {
      intention: quickResult.intention,
      confidence: quickResult.confidence,
      extractedData,
      suggestedResponse: getSuggestedResponse(quickResult.intention, extractedData)
    };
  }

  // Caso contrário, usar IA para análise mais profunda
  try {
    const aiResult = await detectIntentionWithAI(message);
    
    // Combinar resultado da IA com detecção rápida se houver
    let finalIntention = aiResult.intention;
    let finalConfidence = aiResult.confidence;
    
    if (quickResult && quickResult.confidence > 0.6) {
      // Se temos um match parcial de keyword, dar peso extra se a IA confirmar
      if (quickResult.intention === aiResult.intention) {
        finalConfidence = Math.min(0.95, aiResult.confidence + 0.2);
      } else {
        // Conflito entre keyword e IA - usar o de maior confiança
        if (quickResult.confidence > aiResult.confidence) {
          finalIntention = quickResult.intention;
          finalConfidence = quickResult.confidence;
        }
      }
    }

    const extractedData = await extractIntentionData(message, finalIntention);
    
    return {
      intention: finalIntention,
      confidence: finalConfidence,
      extractedData,
      suggestedResponse: getSuggestedResponse(finalIntention, extractedData)
    };
  } catch (error) {
    console.error('AI intention detection failed:', error);
    
    // Fallback para resultado rápido se IA falhar
    if (quickResult) {
      const extractedData = await extractIntentionData(message, quickResult.intention);
      return {
        intention: quickResult.intention,
        confidence: quickResult.confidence * 0.8, // Reduzir confiança por falha da IA
        extractedData,
        suggestedResponse: getSuggestedResponse(quickResult.intention, extractedData)
      };
    }
    
    // Último recurso - assumir conversa geral
    return {
      intention: 'general',
      confidence: 0.5,
      extractedData: {},
      suggestedResponse: getSuggestedResponse('general', {})
    };
  }
}

/**
 * Usa IA avançada para detectar intenção com mais precisão
 */
async function detectIntentionWithAI(message: string): Promise<IntentionResult> {
  const prompt = `
Você é Clara IA, especialista em análise de intenções de vendas. Analise a mensagem do usuário e identifique a intenção EXATA.

MENSAGEM DO USUÁRIO: "${message}"

INTENÇÕES ESPECÍFICAS:
1. "payment" - Usuário quer PAGAR, COMPRAR, ASSINAR um plano
   - Exemplos: "quero pagar", "vou assinar", "me manda o checkout", "aceito o plano"
   
2. "email" - Usuário quer ENVIAR EMAIL para alguém
   - Exemplos: "envie para joao@email.com", "mande informações por email", "dispare um email"
   
3. "objection" - Usuário tem OBJEÇÕES ou HESITAÇÕES
   - Exemplos: "muito caro", "não tenho certeza", "preciso pensar", "não confio"
   
4. "general" - Conversa geral, perguntas sobre produto/serviço
   - Exemplos: "como funciona?", "o que é a Clara?", "quais funcionalidades?"

ANÁLISE DETALHADA:
- Analise o CONTEXTO e SUBTEXTO da mensagem
- Identifique verbos de ação (pagar, enviar, comprar, etc.)
- Detecte sinais de hesitação ou objeção
- Considere o tom emocional da mensagem

COMANDOS ESPECÍFICOS:
- Se detectar intenção de pagamento: retorne "payment" com alta confiança
- Se detectar email com destinatário: retorne "email" com alta confiança  
- Se detectar objeção/hesitação: retorne "objection" com tipo específico
- Se for pergunta geral: retorne "general"

RESPONDA APENAS COM JSON VÁLIDO:
{
  "intention": "payment|email|objection|general",
  "confidence": 0.0-1.0,
  "reasoning": "explicação da análise",
  "actionType": "buy|send|hesitate|ask",
  "emotionalTone": "positive|negative|neutral|hesitant"
}
`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant', // Modelo atualizado e suportado
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 200,
    top_p: 0.9,
  });

  const response = completion.choices[0]?.message?.content;
  
  try {
    const result = JSON.parse(response || '{}');
    return {
      intention: result.intention || 'general',
      confidence: Math.max(0.1, Math.min(1.0, result.confidence || 0.5)) // Garantir range válido
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return { intention: 'general', confidence: 0.5 };
  }
}

/**
 * Extrai dados específicos baseado na intenção usando IA quando necessário
 */
async function extractIntentionData(message: string, intention: IntentionResult['intention']): Promise<IntentionResult['extractedData']> {
  const messageLower = message.toLowerCase();

  switch (intention) {
    case 'payment':
      // Usar IA para detectar preferência de plano
      let plan: 'basic' | 'pro' = 'basic';
      
      if (messageLower.includes('pro') || messageLower.includes('premium') || messageLower.includes('avançado')) {
        plan = 'pro';
      } else if (messageLower.includes('basic') || messageLower.includes('básico')) {
        plan = 'basic';
      } else {
        // Usar IA para detectar preferência sutil
        try {
          const planAnalysis = await analyzePlanPreference(message);
          plan = planAnalysis.preferredPlan;
        } catch (error) {
          console.error('Plan analysis failed:', error);
        }
      }
      
      return { plan };

    case 'email':
      // Regex melhorado para extrair emails
      const emailRegex = /(?:para|to|envie?\s*(?:para|to)?)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
      const emailMatches = Array.from(message.matchAll(emailRegex));
      const emailRecipient = emailMatches[0] ? emailMatches[0][1] : '';
      
      // Extrair assunto se mencionado
      const subjectMatch = message.match(/(?:assunto|subject)[:]\s*(.+)/i);
      const emailSubject = subjectMatch ? subjectMatch[1] : 'Informações sobre Clara IA';
      
      // Se não encontrou email, usar IA para análise mais profunda
      if (!emailRecipient) {
        try {
          const emailAnalysis = await analyzeEmailIntent(message);
          return {
            emailRecipient: emailAnalysis.recipient,
            emailSubject,
            emailContent: 'Informações sobre Clara IA conforme solicitado'
          };
        } catch (error) {
          console.error('Email analysis failed:', error);
        }
      }
      
      return {
        emailRecipient,
        emailSubject,
        emailContent: 'Informações sobre Clara IA conforme solicitado'
      };

    case 'objection':
      // Análise mais detalhada de objeções
      let objectionType: 'price' | 'trust' | 'time' | 'need' = 'price';
      
      if (messageLower.includes('caro') || messageLower.includes('preço') || messageLower.includes('dinheiro') || messageLower.includes('valor')) {
        objectionType = 'price';
      } else if (messageLower.includes('confi') || messageLower.includes('segur') || messageLower.includes('dúvida') || messageLower.includes('risco')) {
        objectionType = 'trust';
      } else if (messageLower.includes('tempo') || messageLower.includes('depois') || messageLower.includes('pensar') || messageLower.includes('pressa')) {
        objectionType = 'time';
      } else if (messageLower.includes('preciso') || messageLower.includes('necessário') || messageLower.includes('vale a pena')) {
        objectionType = 'need';
      } else {
        // Usar IA para detectar tipo de objeção sutil
        try {
          const objectionAnalysis = await analyzeObjectionType(message);
          objectionType = objectionAnalysis.type;
        } catch (error) {
          console.error('Objection analysis failed:', error);
        }
      }
      
      return { objectionType };

    default:
      return {};
  }
}

/**
 * Gera resposta sugerida baseada na intenção usando IA contextual
 */
function getSuggestedResponse(intention: IntentionResult['intention'], extractedData?: IntentionResult['extractedData']): string {
  switch (intention) {
    case 'payment':
      const plan = extractedData?.plan || 'basic';
      const planInfo = plan === 'basic' 
        ? 'Clara Basic (R$ 97/mês) - Perfeito para começar!' 
        : 'Clara Pro (R$ 197/mês) - A escolha dos profissionais!';
      
      return `🚀 Excelente escolha! Vou abrir o checkout para o ${planInfo}\n\nVocê está a poucos cliques de automatizar suas vendas 24/7. O sistema já está preparando tudo para você! �✨`;

    case 'email':
      const recipient = extractedData?.emailRecipient;
      if (recipient && validateEmail(recipient)) {
        return `📧 Perfeito! Disparando as informações da Clara IA para ${recipient}...\n\nO email será enviado em instantes com todos os detalhes dos planos, funcionalidades e como começar. A pessoa vai ficar impressionada! ✅`;
      }
      return `📧 Claro! Para enviar as informações, preciso do email do destinatário.\n\nPor exemplo: "Clara, envie para joao@empresa.com"\n\nAssim consigo disparar um email completo com todos os detalhes! 😊`;

    case 'objection':
      const objectionType = extractedData?.objectionType || 'price';
      
      const objectionResponses = {
        price: `💰 Entendo sua preocupação com o investimento!\n\nMas veja assim: R$ 97/mês são apenas R$ 3,23 por dia. Menos que um café! ☕\n\nQuantos leads você perde por não ter automação? A Clara se paga no PRIMEIRO cliente convertido! �`,
        
        trust: `🛡️ Sua cautela é totalmente compreensível!\n\nA Clara já automatizou mais de 1.000 negócios com 98% de satisfação. E temos garantia TOTAL de 7 dias.\n\nSe não funcionar, devolvemos 100% do seu dinheiro. Zero riscos para você! ✅`,
        
        time: `⏰ Entendo que quer pensar com calma...\n\nMas cada dia sem automação são oportunidades perdidas! Enquanto você decide, seus concorrentes já estão automatizando.\n\nA Clara pode estar funcionando AMANHÃ mesmo. Que tal garantir já? �`,
        
        need: `🤖 Imagino que ainda não veja a necessidade total...\n\nMas pense: enquanto você DORME, a Clara trabalha! Responde leads, agenda reuniões, converte vendas.\n\nAutomação não é luxo - é SOBREVIVÊNCIA no mercado atual! 💪`
      };
      
      return objectionResponses[objectionType];

    default:
      return `😊 Oi! Sou a Clara, sua futura assistente de vendas 24/7!\n\nPosso ajudar você a:\n🤖 Automatizar WhatsApp\n📈 Aumentar conversões\n💰 Vender mais gastando menos\n\nO que te interessa mais? Nossos planos ou como funciona?`;
  }
}

/**
 * Envia email via Resend API
 */
export async function sendEmailViaResend(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Erro ao enviar email' };
    }
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Erro interno ao enviar email' };
  }
}

/**
 * Gera conteúdo personalizado para email sobre Clara IA
 */
export function generateEmailContent(recipientName?: string): string {
  const name = recipientName || 'você';
  
  return `
Olá ${name}!

Aqui estão as informações sobre a Clara IA que você solicitou:

🤖 **O que é a Clara IA?**
Clara é uma assistente de IA especializada em automação de vendas e marketing. Ela trabalha 24/7 para converter seus leads em clientes.

💰 **Planos disponíveis:**

**Clara Basic - R$ 97/mês**
✅ Automação WhatsApp
✅ Campanhas básicas
✅ Suporte via chat
✅ Dashboard simples

**Clara Pro - R$ 197/mês**
✅ Automação WhatsApp avançada
✅ Campanhas ilimitadas
✅ Suporte prioritário
✅ Dashboard completo
✅ Relatórios avançados
✅ Integração com CRM

🎯 **Por que escolher a Clara?**
- Automação completa de vendas
- Trabalha 24 horas por dia
- Aumenta conversões em até 300%
- ROI comprovado em 30 dias
- Suporte especializado

🚀 **Garantia de 7 dias**
Teste sem riscos! Se não funcionar, devolvemos 100% do seu investimento.

Quer começar agora? Entre em contato conosco!

Att,
Equipe Clara IA
`;
}

/**
 * Valida se um email é válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Respostas contextuais inteligentes para diferentes intenções
 */
export const intentionResponses = {
  payment: {
    success: `🎉 INCRÍVEL! Checkout aberto com sucesso!\n\nVocê está a 1 clique de revolucionar suas vendas. O formulário já está carregado - é só preencher e PRONTO! 🛒✨`,
    error: `😔 Ops! Algo deu errado no checkout...\n\nMas não desista! Seus concorrentes agradecem cada segundo de atraso. Vamos tentar novamente? �`
  },
  email: {
    success: `📧💫 EMAIL ENVIADO! Missão cumprida!\n\nA pessoa vai receber TUDO sobre a Clara IA: planos, funcionalidades, cases de sucesso e como começar hoje mesmo! �`,
    error: `📧❌ Hmm... Email não foi enviado.\n\nVerifique se o destinatário está correto. A Clara quer muito compartilhar o conhecimento, mas precisa do endereço certo! �`,
    noRecipient: `📧❓ Para disparar o email, preciso do destinatário!\n\nExemplo: "Clara, envie para joao@empresa.com"\n\nAssim consigo enviar um material COMPLETO! 🎯`
  },
  objection: {
    price: `💡 R$ 97/mês = R$ 3,23/dia!\n\nMenos que um café. Quantos clientes você perde SEM automação? A Clara se paga no primeiro lead convertido! ☕💰`,
    trust: `🏆 +1.000 clientes satisfeitos + Garantia de 7 dias!\n\nSe não funcionar, dinheiro de volta. Mas spoiler: vai funcionar MUITO bem! 😉🛡️`,
    time: `⚡ Cada dia sem automação = oportunidades perdidas!\n\nSeus concorrentes já estão automatizando. A Clara pode estar rodando AMANHÃ! ⏰🚀`,
    need: `🔥 "Não preciso" é o que todo mundo falava sobre WhatsApp em 2009...\n\nHoje quem não tem automação, não tem futuro! A Clara é seu upgrade obrigatório! 🤖💪`
  }
};

/**
 * Analisa preferência de plano usando IA
 */
async function analyzePlanPreference(message: string): Promise<{ preferredPlan: 'basic' | 'pro' }> {
  const prompt = `
Analise a mensagem e determine qual plano o usuário prefere:

MENSAGEM: "${message}"

PLANOS DISPONÍVEIS:
- Clara Basic (R$ 97/mês): Automação básica, campanhas simples, suporte chat
- Clara Pro (R$ 197/mês): Automação avançada, campanhas ilimitadas, relatórios, CRM

CRITÉRIOS:
- Se mencionar "completo", "avançado", "tudo", "premium" = Pro
- Se mencionar "simples", "básico", "barato" = Basic
- Se falar de relatórios, CRM, análises = Pro
- Se falar apenas de automação básica = Basic

Responda APENAS com JSON:
{
  "preferredPlan": "basic|pro",
  "confidence": 0.0-1.0
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content;
    const result = JSON.parse(response || '{}');
    
    return {
      preferredPlan: result.preferredPlan || 'basic'
    };
  } catch (error) {
    console.error('Plan preference analysis failed:', error);
    return { preferredPlan: 'basic' };
  }
}

/**
 * Analisa intenção de email para extrair destinatário
 */
async function analyzeEmailIntent(message: string): Promise<{ recipient: string }> {
  const prompt = `
Analise a mensagem e extraia o destinatário do email:

MENSAGEM: "${message}"

PROCURE POR:
- Endereços de email diretos (nome@dominio.com)
- Referências como "meu cliente", "meu chefe", "para ele"
- Nomes próprios seguidos de contexto de email

Se não encontrar email específico, retorne string vazia.

Responda APENAS com JSON:
{
  "recipient": "email@exemplo.com ou vazio",
  "hasEmailContext": true/false
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content;
    const result = JSON.parse(response || '{}');
    
    return {
      recipient: result.recipient || ''
    };
  } catch (error) {
    console.error('Email intent analysis failed:', error);
    return { recipient: '' };
  }
}

/**
 * Analisa tipo de objeção usando IA
 */
async function analyzeObjectionType(message: string): Promise<{ type: 'price' | 'trust' | 'time' | 'need' }> {
  const prompt = `
Analise a objeção do usuário e classifique o tipo:

MENSAGEM: "${message}"

TIPOS DE OBJEÇÃO:
1. "price" - Preocupação com PREÇO, CUSTO, DINHEIRO
   - Exemplos: "caro", "não tenho dinheiro", "muito valor"
   
2. "trust" - Falta de CONFIANÇA, SEGURANÇA, DÚVIDAS
   - Exemplos: "não confio", "dúvida", "será que funciona"
   
3. "time" - Questão de TEMPO, URGÊNCIA, PRIORIDADE
   - Exemplos: "depois", "preciso pensar", "sem pressa"
   
4. "need" - Questionamento da NECESSIDADE, UTILIDADE
   - Exemplos: "não preciso", "vale a pena?", "é necessário?"

Responda APENAS com JSON:
{
  "type": "price|trust|time|need",
  "intensity": "low|medium|high"
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content;
    const result = JSON.parse(response || '{}');
    
    return {
      type: result.type || 'price'
    };
  } catch (error) {
    console.error('Objection type analysis failed:', error);
    return { type: 'price' };
  }
}
