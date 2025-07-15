import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// In-memory storage for conversation threads
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface SalesData {
  score: number;
  stage: 'discovery' | 'qualification' | 'presentation' | 'objection' | 'closing' | 'won' | 'lost';
  interests: string[];
  objections: string[];
  budget?: string;
  timeline?: string;
  company?: string;
  urgency: 'low' | 'medium' | 'high';
  lastScoreUpdate: number;
}

interface Thread {
  id: string;
  messages: Message[];
  lastActivity: number;
  salesData: SalesData;
}

const threads = new Map<string, Thread>();

// Clean up old threads (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  for (const [threadId, thread] of threads.entries()) {
    if (now - thread.lastActivity > twentyFourHours) {
      threads.delete(threadId);
    }
  }
}, 60 * 60 * 1000); // Check every hour

function getOrCreateThread(threadId: string): Thread {
  let thread = threads.get(threadId);
  if (!thread) {
    thread = {
      id: threadId,
      messages: [
        {
          role: 'system',
          content: `Você é Donna, especialista em automação WhatsApp da Numbly. Sua missão é vender automação para WhatsApp que ajuda empresários a faturar R$ 50k+/mês no automático.\n\nSISTEMA DE FUNIL DE VENDAS:\n\nANÁLISE DE SCORE:\n\nSempre responda com markdown formatado e use emojis. Mantenha o contexto da conversa.`,
          timestamp: Date.now()
        }
      ],
      lastActivity: Date.now(),
      salesData: {
        score: 0,
        stage: 'discovery',
        interests: [],
        objections: [],
        urgency: 'low',
        lastScoreUpdate: Date.now()
      }
    };
    threads.set(threadId, thread);
  } else {
    // Garante que só existe UMA mensagem system na posição 0
    const systemMessages = thread.messages.filter(m => m.role === 'system');
    const nonSystemMessages = thread.messages.filter(m => m.role !== 'system');
    if (systemMessages.length > 1) {
      thread.messages = [systemMessages[0], ...nonSystemMessages];
    } else if (systemMessages.length === 0) {
      // Se não houver, adiciona na posição 0
        thread.messages = [
          {
            role: 'system',
            content: `Você é Donna, especialista em automação WhatsApp da Numbly. Sua missão é vender automação para WhatsApp que ajuda empresários a faturar R$ 50k+/mês no automático.\n\nSISTEMA DE FUNIL DE VENDAS:\n\nANÁLISE DE SCORE:\n\nSempre responda com markdown formatado e use emojis. Mantenha o contexto da conversa.`,
            timestamp: Date.now()
          },
          ...nonSystemMessages
        ];
    }
  }
  return thread;
}

function addMessageToThread(threadId: string, message: Message): void {
  const thread = getOrCreateThread(threadId);
  thread.messages.push(message);
  thread.lastActivity = Date.now();
  
  // Keep only last 20 messages to avoid token limit
  if (thread.messages.length > 20) {
    // Keep system message and last 19 messages
    const systemMessage = thread.messages[0];
    const recentMessages = thread.messages.slice(-19);
    thread.messages = [systemMessage, ...recentMessages];
  }
}

function analyzeMessageAndUpdateScore(threadId: string, userMessage: string): void {
  const thread = getOrCreateThread(threadId);
  const message = userMessage.toLowerCase();
  let scoreIncrease = 0;
  const newInterests: string[] = [];
  
  // Log para debug
  console.log('🔍 Analyzing message:', message);
  console.log('📊 Current score:', thread.salesData.score);
  
  // Análise de interesse em automação
  if (message.includes('automação') || message.includes('automatizar') || message.includes('bot')) {
    if (!thread.salesData.interests.includes('automação')) {
      scoreIncrease += 15;
      newInterests.push('automação');
    }
  }
  
  // Análise de vendas/faturamento
  if (message.includes('vendas') || message.includes('faturamento') || message.includes('receita') || message.includes('lucro')) {
    if (!thread.salesData.interests.includes('vendas')) {
      scoreIncrease += 15;
      newInterests.push('vendas');
    }
  }
  
  // Análise de orçamento
  if (message.includes('quanto custa') || message.includes('preço') || message.includes('investimento') || message.includes('valor')) {
    if (!thread.salesData.interests.includes('orçamento')) {
      scoreIncrease += 25;
      newInterests.push('orçamento');
    }
  }
  
  // Análise de urgência
  if (message.includes('urgente') || message.includes('preciso agora') || message.includes('hoje') || message.includes('amanhã')) {
    if (thread.salesData.urgency !== 'high') {
      scoreIncrease += 20;
      thread.salesData.urgency = 'high';
    }
  } else if (message.includes('semana') || message.includes('mês')) {
    if (thread.salesData.urgency === 'low') {
      scoreIncrease += 10;
      thread.salesData.urgency = 'medium';
    }
  }
  
  // Análise de intenção de compra
  if (message.includes('quero comprar') || message.includes('vamos fechar') || message.includes('aceito') || message.includes('concordo')) {
    if (!thread.salesData.interests.includes('pronto_comprar')) {
      scoreIncrease += 30;
      newInterests.push('pronto_comprar');
    }
  }
  
  // Palavras que indicam interesse geral
  if (message.includes('quero') || message.includes('preciso') || message.includes('interessado') || message.includes('gostaria')) {
    if (!thread.salesData.interests.includes('interesse_geral')) {
      scoreIncrease += 8;
      newInterests.push('interesse_geral');
    }
  }
  
  // Aumenta score base para qualquer mensagem (engajamento) - reduzido para evitar score muito alto
  if (scoreIncrease === 0) {
    scoreIncrease = 3; // Score mínimo por engajamento (reduzido de 5 para 3)
  }
  
  // Atualiza score sempre, mas com limite mais controlado
  thread.salesData.score = Math.min(100, thread.salesData.score + scoreIncrease);
  thread.salesData.interests = [...new Set([...thread.salesData.interests, ...newInterests])];
  thread.salesData.lastScoreUpdate = Date.now();
  
  // Atualiza stage baseado no score
  updateSalesStage(threadId);
  
  console.log(`📈 Score updated: +${scoreIncrease} points. New score: ${thread.salesData.score}, Stage: ${thread.salesData.stage}`);
}

async function analyzeIntentionWithAI(message: string): Promise<{ score: number; interests: string[]; urgency: 'low' | 'medium' | 'high' }> {
  try {
    const intentionPrompt = `Analise esta mensagem e retorne APENAS um JSON válido com a intenção de compra:
Mensagem: "${message}"

Retorne no formato exato:
{
  "score": [número de 0 a 30 baseado na intenção de compra],
  "interests": ["lista", "de", "interesses", "identificados"],
  "urgency": "low|medium|high"
}

Critérios de score:
- 0-5: Mensagem neutra/casual
- 6-10: Interesse inicial
- 11-15: Interesse específico
- 16-20: Considerando compra
- 21-25: Pronto para comprar
- 26-30: Urgência alta para comprar

Interesses possíveis: automação, vendas, orçamento, whatsapp, lead, faturamento, roi, demo, suporte, garantia`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: intentionPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 200,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Intention API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(30, result.score || 3)),
        interests: Array.isArray(result.interests) ? result.interests : [],
        urgency: ['low', 'medium', 'high'].includes(result.urgency) ? result.urgency : 'low'
      };
    }
    
    throw new Error('Invalid JSON response');
  } catch (error) {
    console.error('🔍 Intention analysis failed:', error);
    // Fallback to simple analysis
    return {
      score: 3,
      interests: [],
      urgency: 'low'
    };
  }
}

async function analyzeMessageAndUpdateScoreWithAI(threadId: string, userMessage: string): Promise<void> {
  const thread = getOrCreateThread(threadId);
  
  console.log('🔍 Analyzing message with AI:', userMessage);
  console.log('📊 Current score:', thread.salesData.score);
  
  try {
    const analysis = await analyzeIntentionWithAI(userMessage);
    
    // Update score
    thread.salesData.score = Math.min(100, thread.salesData.score + analysis.score);
    
    // Update interests (only add new ones)
    const newInterests = analysis.interests.filter(interest => 
      !thread.salesData.interests.includes(interest)
    );
    thread.salesData.interests = [...thread.salesData.interests, ...newInterests];
    
    // Update urgency (only if higher)
    const urgencyLevels = { low: 0, medium: 1, high: 2 };
    const currentUrgencyLevel = urgencyLevels[thread.salesData.urgency];
    const newUrgencyLevel = urgencyLevels[analysis.urgency];
    
    if (newUrgencyLevel > currentUrgencyLevel) {
      thread.salesData.urgency = analysis.urgency;
    }
    
    thread.salesData.lastScoreUpdate = Date.now();
    
    // Update stage based on score
    updateSalesStage(threadId);
    
    console.log(`📈 AI Score updated: +${analysis.score} points. New score: ${thread.salesData.score}, Stage: ${thread.salesData.stage}`);
    console.log(`🎯 Interests: ${analysis.interests.join(', ')}, Urgency: ${analysis.urgency}`);
    
  } catch (error) {
    console.error('🚨 AI analysis failed, using fallback:', error);
    // Fallback to old method
    analyzeMessageAndUpdateScore(threadId, userMessage);
  }
}

function updateSalesStage(threadId: string): void {
  const thread = getOrCreateThread(threadId);
  const score = thread.salesData.score;
  
  if (score >= 81) {
    thread.salesData.stage = 'closing';
  } else if (score >= 61) {
    thread.salesData.stage = 'objection';
  } else if (score >= 41) {
    thread.salesData.stage = 'presentation';
  } else if (score >= 21) {
    thread.salesData.stage = 'qualification';
  } else {
    thread.salesData.stage = 'discovery';
  }
}

function getContextualSystemMessage(thread: Thread): string {
  const { score, stage, interests, urgency } = thread.salesData;
  
  let contextMessage = `Você é Donna, especialista em automação WhatsApp da Numbly. 

INSTRUÇÃO: Responda sempre de forma breve, objetiva e com no máximo 3 parágrafos curtos. Evite repetições, rodeios ou explicações longas. Seja direto ao ponto.

CONTEXTO ATUAL DO LEAD:
- Score: ${score}/100
- Stage: ${stage}
- Interesses: ${interests.join(', ')}
- Urgência: ${urgency}

`;
  
  switch (stage) {
    case 'discovery':
      contextMessage += `FOCO: Descobrir necessidades e dor do cliente. Pergunte sobre:
- Problemas atuais com vendas
- Volume de leads
- Processos manuais
- Objetivos de faturamento

Use markdown e emojis. Seja consultiva e empática.`;
      break;
      
    case 'qualification':
      contextMessage += `FOCO: Qualificar orçamento e urgência. Pergunte sobre:
- Orçamento disponível
- Timeline para implementação
- Tomada de decisão
- Equipe atual

Apresente alguns benefícios específicos. Use markdown e emojis.`;
      break;
      
    case 'presentation':
      contextMessage += `FOCO: Apresentar solução específica. Mostre:
- Como a automação resolve os problemas dele
- Casos de sucesso similares
- ROI esperado
- Demonstração prática

Seja específica e use dados. Use markdown e emojis.`;
      break;
      
    case 'objection':
      contextMessage += `FOCO: Tratar objeções. Aborde:
- Preço vs valor
- Garantias e suporte
- Facilidade de implementação
- Resultados comprovados

Reforce benefícios e crie urgência. Use markdown e emojis.`;
      break;
      
    case 'closing':
      contextMessage += `FOCO: Fechar venda. Ofereça:
- Condições especiais
- Bônus por decisão rápida
- Garantia de resultados
- Próximos passos claros

Crie urgência e facilite a compra. Use markdown e emojis.`;
      break;
  }
  
  return contextMessage;
}

function getNextAction(salesData: SalesData): string | null {
  switch (salesData.stage) {
    case 'discovery':
      return 'ask_pain_points';
    case 'qualification':
      return 'qualify_budget';
    case 'presentation':
      return 'show_demo';
    case 'objection':
      return 'handle_objections';
    case 'closing':
      return 'open_checkout';
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const { message, threadId = 'default' } = body;
    
    console.log('🚀 Chat API received:', { 
      message: message.substring(0, 50) + '...', 
      threadId
    });

    // Get or create thread and add user message
    const thread = getOrCreateThread(threadId);
    
    // Analyze message and update score with AI
    await analyzeMessageAndUpdateScoreWithAI(threadId, message);
    
    addMessageToThread(threadId, {
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Update system message with current context
    const updatedThread = getOrCreateThread(threadId);
    const contextualSystemMessage = getContextualSystemMessage(updatedThread);
    
    // Garante que a mensagem system está na posição 0 e é única
    if (updatedThread.messages.length === 0 || updatedThread.messages[0].role !== 'system') {
      updatedThread.messages.unshift({
        role: 'system',
        content: contextualSystemMessage,
        timestamp: Date.now()
      });
    } else {
      updatedThread.messages[0] = {
        ...updatedThread.messages[0],
        content: contextualSystemMessage
      };
    }

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        messages: updatedThread.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });

    if (!groqResponse.ok) {
      // Se for erro 429 (rate limit), espera um pouco e tenta novamente
      if (groqResponse.status === 429) {
        console.log('🔄 Rate limit atingido, aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Tenta novamente
        const retryResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            messages: updatedThread.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 500,
            stream: false
          })
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Groq API error after retry: ${retryResponse.status}`);
        }
        
        const retryData = await retryResponse.json();
        const content = retryData.choices[0].message.content;
        
        // Add assistant response to thread
        if (content.trim()) {
          addMessageToThread(threadId, {
            role: 'assistant',
            content: content,
            timestamp: Date.now()
          });
        }
        
        const currentThread = getOrCreateThread(threadId);
        
        return NextResponse.json({
          content: content,
          shouldShowPaymentModal: currentThread.salesData.stage === 'closing',
          funnelStage: currentThread.salesData.stage,
          nextAction: getNextAction(currentThread.salesData),
          leadData: currentThread.salesData,
          salesData: currentThread.salesData,
          claraState: {
            currentStage: currentThread.salesData.stage,
            leadData: currentThread.salesData,
            lastUpdate: Date.now()
          }
        });
      }
      
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const responseData = await groqResponse.json();
    const content = responseData.choices[0].message.content;

    // Add assistant response to thread
    if (content.trim()) {
      addMessageToThread(threadId, {
        role: 'assistant',
        content: content,
        timestamp: Date.now()
      });
    }

    // Get current thread data
    const currentThread = getOrCreateThread(threadId);

    // Return response with all necessary data
    return NextResponse.json({
      content: content,
      shouldShowPaymentModal: currentThread.salesData.stage === 'closing',
      funnelStage: currentThread.salesData.stage,
      nextAction: getNextAction(currentThread.salesData),
      leadData: currentThread.salesData,
      salesData: currentThread.salesData, // Adiciona salesData para compatibilidade
      claraState: {
        currentStage: currentThread.salesData.stage,
        leadData: currentThread.salesData,
        lastUpdate: Date.now()
      }
    });
    
  } catch (error) {
    console.error('[Chat API Error]:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar mensagem. Tente novamente.' },
      { status: 500 }
    );
  }
}
