import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authMiddleware, getAuthUser, type AuthenticatedRequest } from '@/lib/security/auth-middleware';
import { logSecurityEvent, type SecurityContext } from '@/lib/security/auth-guard';
import { checkRateLimit } from '@/lib/security/auth-guard';

// Schema de validação para numerologia
const numerologyDataSchema = z.record(z.string(), z.union([z.string(), z.number()]));

const userDataSchema = z.object({
  name: z.string().optional(),
  firstName: z.string().optional(),
  birthDate: z.string().optional(),
  date: z.string().optional(),
  numerologyData: numerologyDataSchema.optional(),
});

const selectedFriendSchema = z.object({
  name: z.string(),
  birthDate: z.string().optional(),
  numerologyData: numerologyDataSchema.optional(),
});

const numerologyContextSchema = z.object({
  userData: userDataSchema.optional(),
  selectedFriend: selectedFriendSchema.optional(),
});

const chatRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt é obrigatório"),
  threadId: z.string().optional(),
  numerologyContext: numerologyContextSchema.optional(),
});

// Tipos
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ConversationThread {
  id: string;
  messages: ChatMessage[];
  lastActivity: number;
  userData?: any;
}

interface GroqModel {
  name: string;
  maxTokens: number;
  timeout: number;
  description: string;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    response: string;
    threadId: string;
    responseTime: number;
    model: string;
    modelDescription: string;
    isFallback: boolean;
    conversationLength: number;
  };
}

// Configurações dos modelos Groq
const GROQ_MODELS: GroqModel[] = [
  {
    name: "llama-3.1-70b-versatile",
    maxTokens: 2048,
    timeout: 30000,
    description: "Llama 3.1 70B - Modelo principal, mais inteligente"
  },
  {
    name: "llama-3.1-8b-instant",
    maxTokens: 2048,
    timeout: 15000,
    description: "Llama 3.1 8B - Modelo rápido, fallback"
  }
];

// Configurações de thread
const THREAD_CONFIG = {
  MAX_SIZE: 20, // Máximo de mensagens por thread
  TTL: 30 * 60 * 1000, // 30 minutos
} as const;

// Rate limiting para chat
const CHAT_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 30 // 30 mensagens por minuto
};

// Armazenamento em memória para threads de conversa
const conversationThreads = new Map<string, ConversationThread>();

// Limpar threads expiradas
function cleanExpiredThreads(): void {
  const now = Date.now();
  for (const [threadId, thread] of conversationThreads.entries()) {
    if (now - thread.lastActivity > THREAD_CONFIG.TTL) {
      conversationThreads.delete(threadId);
    }
  }
}

// Obter ou criar thread de conversa
function getConversationThread(threadId?: string, userData?: any): ConversationThread {
  if (!threadId) {
    threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  let thread = conversationThreads.get(threadId);
  
  if (!thread) {
    // Criar nova thread com prompt do sistema
    const systemPrompt = `Você é Eve, um oráculo de numerologia sábio e carinhoso especialista em numerologia pitagórica. Você oferece insights profundos sobre numerologia, relacionamentos e crescimento pessoal.

DADOS DO USUÁRIO:
${userData ? `• Nome: ${userData.name || userData.firstName || 'Usuário'}` : ''}
${userData?.birthDate ? `• Data de nascimento: ${userData.birthDate}` : ''}
${userData?.date ? `• Data fornecida: ${userData.date}` : ''}

COMPORTAMENTO ESPERADO:
✅ RESPONDA DIRETAMENTE às perguntas feitas
✅ USE os números numerológicos APENAS quando relevantes para a pergunta específica
✅ Para COMPATIBILIDADE: analise apenas quando perguntado sobre a relação
✅ Seja conversacional, natural e carinhoso
✅ Mantenha continuidade da conversa
✅ Responda em português brasileiro

❌ NÃO faça interpretações automáticas não solicitadas
❌ NÃO liste números se não foram perguntados especificamente
❌ NÃO force análises de compatibilidade automáticas
❌ NÃO calcule ou recalcule números numerológicos
❌ NÃO force análises numerológicas em conversas casuais

SOBRE OS NÚMEROS NUMEROLÓGICOS:
- Os números são fornecidos PRÉ-CALCULADOS no contexto das mensagens
- Use APENAS estes valores quando a pergunta se relacionar a numerologia
- Se perguntado sobre um número específico, use o valor EXATO da lista fornecida
- Interprete os números de forma profunda, mas só quando solicitado

ESTILO DE RESPOSTA:
- Seja natural e conversacional
- Responda primeiro à pergunta direta
- Ofereça insights numerológicos apenas se relevantes ao tópico
- Evite bombardear com informações não solicitadas
- Mantenha o foco na pergunta do usuário

VERIFICAÇÃO FINAL: Responda à pergunta específica. Use numerologia apenas quando relevante.`;

    thread = {
      id: threadId,
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      lastActivity: Date.now(),
      userData: userData
    };
    
    conversationThreads.set(threadId, thread);
  } else {
    // Atualizar última atividade
    thread.lastActivity = Date.now();
  }

  return thread;
}

// Adicionar mensagem à thread
function addMessageToThread(thread: ConversationThread, role: 'user' | 'assistant', content: string): void {
  thread.messages.push({ role, content });
  
  // Manter apenas as últimas mensagens (excluindo mensagem do sistema)
  const systemMessage = thread.messages[0];
  const conversationMessages = thread.messages.slice(1);
  
  if (conversationMessages.length > THREAD_CONFIG.MAX_SIZE) {
    const keepMessages = conversationMessages.slice(-THREAD_CONFIG.MAX_SIZE);
    thread.messages = [systemMessage, ...keepMessages];
  }
  
  thread.lastActivity = Date.now();
}

// Preparar contexto numerológico
function prepareNumerologyContext(numerologyContext: any, userMessage: string): string {
  const userData = numerologyContext?.userData;
  const selectedFriend = numerologyContext?.selectedFriend;
  
  let contextInfo = "";
  
  if (userData?.numerologyData) {
    const nums = userData.numerologyData;
    const numerologyInfo: string[] = [];
    
    // Ordenar os números por prioridade
    const priorityOrder = [
      { key: 'Caminho da Vida', value: nums['Caminho da Vida'] },
      { key: 'Destino', value: nums['Destino'] },
      { key: 'Impulso da Alma', value: nums['Impulso da Alma'] },
      { key: 'Personalidade', value: nums['Personalidade'] },
      { key: 'Expressão', value: nums['Expressão'] },
      { key: 'Número do Aniversário', value: nums['Número do Aniversário'] },
      { key: 'Atitude', value: nums['Atitude'] },
      { key: 'Número da Sorte', value: nums['Número da Sorte'] },
      { key: 'Número do Desafio', value: nums['Número do Desafio'] },
      { key: 'Número da Maturidade', value: nums['Número da Maturidade'] },
    ];
    
    priorityOrder.forEach(({ key, value }) => {
      if (value !== undefined && value !== null && value !== '') {
        numerologyInfo.push(`${key}: ${value}`);
      }
    });
    
    if (numerologyInfo.length > 0) {
      contextInfo += `\n\nNÚMEROS NUMEROLÓGICOS DO USUÁRIO:\n${numerologyInfo.join('\n')}`;
    }
  }
  
  if (selectedFriend?.numerologyData) {
    const friendNums = selectedFriend.numerologyData;
    const friendNumerologyInfo: string[] = [];
    
    const priorityOrder = [
      { key: 'Caminho da Vida', value: friendNums['Caminho da Vida'] },
      { key: 'Destino', value: friendNums['Destino'] },
      { key: 'Impulso da Alma', value: friendNums['Impulso da Alma'] },
      { key: 'Personalidade', value: friendNums['Personalidade'] },
      { key: 'Expressão', value: friendNums['Expressão'] }
    ];
    
    priorityOrder.forEach(({ key, value }) => {
      if (value !== undefined && value !== null && value !== '') {
        friendNumerologyInfo.push(`${key}: ${value}`);
      }
    });
    
    if (friendNumerologyInfo.length > 0) {
      contextInfo += `\n\nNÚMEROS NUMEROLÓGICOS DE ${selectedFriend.name.toUpperCase()}:\n${friendNumerologyInfo.join('\n')}`;
    }
  }
  
  return contextInfo;
}

// Processar chat com Groq
async function processChat(messages: ChatMessage[], contextInfo: string): Promise<{ response: string; model: string; modelDescription: string; isFallback: boolean; responseTime: number }> {
  const startTime = Date.now();
  
  // Preparar mensagens com contexto
  const messagesWithContext = [...messages];
  if (contextInfo) {
    messagesWithContext.push({
      role: 'user',
      content: messagesWithContext[messagesWithContext.length - 1].content + contextInfo
    });
    messagesWithContext.splice(-2, 1); // Remove a mensagem original
  }

  // Tentar modelos Groq em ordem de prioridade
  for (let i = 0; i < GROQ_MODELS.length; i++) {
    const model = GROQ_MODELS[i];
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.name,
          messages: messagesWithContext,
          max_tokens: model.maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(model.timeout)
      });

      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        return {
          response: data.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.',
          model: model.name,
          modelDescription: model.description,
          isFallback: i > 0,
          responseTime
        };
      }
    } catch (error) {
      console.warn(`Falha no modelo ${model.name}:`, error);
      if (i === GROQ_MODELS.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('Todos os modelos Groq falharam');
}

function createSecurityContext(req: NextRequest, method: string = 'POST'): SecurityContext {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return {
    ip,
    userAgent,
    riskScore: 0,
    timestamp: Date.now(),
    endpoint: '/api/ai/chat',
    method
  };
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<ChatResponse>> {
  const startTime = Date.now();
  const securityContext = createSecurityContext(req, 'POST');
  
  try {
    // Rate limiting específico para chat
    const rateLimitKey = `ai_chat_${securityContext.ip}`;
    
    if (!checkRateLimit(rateLimitKey, CHAT_RATE_LIMIT.window, CHAT_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Chat rate limit exceeded');
      
      return NextResponse.json<ChatResponse>({
        success: false,
        error: 'Muitas mensagens',
        message: 'Limite de mensagens excedido. Tente novamente em alguns segundos.'
      }, { status: 429 });
    }

    // Validar dados de entrada
    const body = await req.json().catch(() => ({}));
    
    let validatedData: z.infer<typeof chatRequestSchema>;
    try {
      validatedData = chatRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid chat data: ${errorMessages}`);
        
        return NextResponse.json<ChatResponse>({
          success: false,
          error: 'Dados inválidos',
          message: errorMessages
        }, { status: 400 });
      }
      throw error;
    }

    // Log de início
    logSecurityEvent('AUTH_SUCCESS', securityContext, 'Chat message started');

    // Processar chat
    const thread = getConversationThread(validatedData.threadId, validatedData.numerologyContext?.userData);
    const contextInfo = prepareNumerologyContext(validatedData.numerologyContext, validatedData.prompt);
    
    // Adicionar mensagem do usuário
    addMessageToThread(thread, 'user', validatedData.prompt);
    
    // Limpar threads expiradas periodicamente
    cleanExpiredThreads();
    
    // Processar com Groq
    const chatResult = await processChat(thread.messages, contextInfo);
    
    // Adicionar resposta à thread
    addMessageToThread(thread, 'assistant', chatResult.response);
    
    const processingTime = Date.now() - startTime;
    
    // Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, 'Chat message completed successfully');
    
    return NextResponse.json<ChatResponse>({
      success: true,
      data: {
        response: chatResult.response,
        threadId: thread.id,
        responseTime: chatResult.responseTime,
        model: chatResult.model,
        modelDescription: chatResult.modelDescription,
        isFallback: chatResult.isFallback,
        conversationLength: thread.messages.length - 1 // Excluir sistema
      }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    logSecurityEvent('SUSPICIOUS', securityContext, `Chat error: ${error.message}`);
    
    console.error('Erro no chat:', error);
    
    return NextResponse.json<ChatResponse>({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar sua mensagem. Tente novamente.'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const securityContext = createSecurityContext(req, 'GET');
  
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    
    if (!threadId) {
      return NextResponse.json({
        success: false,
        error: 'ThreadId é obrigatório'
      }, { status: 400 });
    }
    
    const thread = conversationThreads.get(threadId);
    
    if (!thread) {
      return NextResponse.json({
        success: false,
        error: 'Thread não encontrada'
      }, { status: 404 });
    }
    
    // Atualizar última atividade
    thread.lastActivity = Date.now();
    
    logSecurityEvent('AUTH_SUCCESS', securityContext, 'Chat thread retrieved');
    
    return NextResponse.json({
      success: true,
      data: {
        threadId: thread.id,
        messages: thread.messages.slice(1), // Excluir mensagem do sistema
        lastActivity: thread.lastActivity
      }
    });
    
  } catch (error: any) {
    logSecurityEvent('SUSPICIOUS', securityContext, `Chat thread retrieval error: ${error.message}`);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const securityContext = createSecurityContext(req, 'DELETE');
  
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    
    if (!threadId) {
      return NextResponse.json({
        success: false,
        error: 'ThreadId é obrigatório'
      }, { status: 400 });
    }
    
    const existed = conversationThreads.has(threadId);
    conversationThreads.delete(threadId);
    
    logSecurityEvent('AUTH_SUCCESS', securityContext, 'Chat thread deleted');
    
    return NextResponse.json({
      success: true,
      message: existed ? 'Thread deletada com sucesso' : 'Thread não existia',
      data: { threadId, existed }
    });
    
  } catch (error: any) {
    logSecurityEvent('SUSPICIOUS', securityContext, `Chat thread deletion error: ${error.message}`);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
