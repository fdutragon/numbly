import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';
import { z } from 'zod';
import jwt from "jsonwebtoken";

// 🔒 Schemas de validação
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

const aiPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt é obrigatório"),
  type: z.enum(['chat', 'report'], { required_error: "Tipo de prompt é obrigatório" }),
  threadId: z.string().optional(),
  numerologyContext: numerologyContextSchema.optional(),
  reportType: z.string().optional(), // Para relatórios específicos
  reportNumber: z.number().optional(), // Para relatórios numerológicos
});

// 🔒 Interfaces TypeScript
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

interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    response?: string;
    threadId?: string;
    responseTime?: number;
    model?: string;
    modelDescription?: string;
    isFallback?: boolean;
    conversationLength?: number;
    cached?: boolean;
    generatedAt?: Date;
  };
}

export const dynamic = 'force-dynamic';

// 🚦 Rate limiting diferenciado por tipo
const RATE_LIMITS = {
  chat: {
    window: 60000, // 1 minuto
    max: 30 // 30 mensagens por minuto
  },
  report: {
    window: 300000, // 5 minutos
    max: 5 // 5 relatórios por 5 minutos
  }
} as const;

// 🧠 Configurações dos modelos
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

// Configurações para threads de conversa
const THREAD_CONFIG = {
  MAX_SIZE: 20, // Máximo de mensagens por thread
  TTL: 30 * 60 * 1000, // 30 minutos
} as const;

// Armazenamento em memória para threads de conversa
const conversationThreads = new Map<string, ConversationThread>();

// Inicialização do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * 🔐 Obter userId do token JWT
 */
function getUserIdFromToken(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value || 
               req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    return decoded.userId || null;
  } catch {
    return null;
  }
}

/**
 * 🧹 Limpar threads expiradas
 */
function cleanExpiredThreads(): void {
  const now = Date.now();
  for (const [threadId, thread] of conversationThreads.entries()) {
    if (now - thread.lastActivity > THREAD_CONFIG.TTL) {
      conversationThreads.delete(threadId);
    }
  }
}

/**
 * 🗣️ Obter ou criar thread de conversa
 */
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

/**
 * 💬 Adicionar mensagem à thread
 */
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

/**
 * 📊 Preparar contexto numerológico
 */
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

/**
 * 🤖 Processar chat com Groq
 */
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

/**
 * 📋 Gerar relatório com Gemini
 */
async function generateReport(userData: any, type: string, number?: number): Promise<{ report: string; cached: boolean; generatedAt: Date }> {
  // Verificar cache primeiro (se usuário estiver logado)
  const userId = userData?.userId;
  if (userId) {
    const existingReport = await db.report.findFirst({
      where: {
        userId: userId,
        type: type,
        ...(number && { number: number.toString() })
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingReport) {
      return {
        report: existingReport.content,
        cached: true,
        generatedAt: existingReport.createdAt
      };
    }
  }

  // Gerar novo relatório
  const prompt = `Você é Eve, uma especialista em numerologia pitagórica. Crie um relatório numerológico detalhado e personalizado.

DADOS DO USUÁRIO:
- Nome: ${userData.name || 'Usuário'}
- Data de nascimento: ${userData.birthDate || 'Não informada'}
- Tipo de relatório: ${type}
${number ? `- Número específico: ${number}` : ''}

${userData.numerologyData ? `NÚMEROS NUMEROLÓGICOS:
${Object.entries(userData.numerologyData).map(([key, value]) => `${key}: ${value}`).join('\n')}` : ''}

INSTRUÇÕES:
1. Crie um relatório completo e personalizado
2. Use linguagem acessível e inspiradora
3. Inclua insights práticos para a vida cotidiana
4. Mantenha um tom carinhoso e empoderador
5. Estruture o conteúdo de forma organizada
6. Responda em português brasileiro

Gere um relatório numerológico completo baseado nos dados fornecidos.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const report = response.text();

    // Salvar no cache se usuário estiver logado
    if (userId) {
      await db.report.create({
        data: {
          userId: userId,
          type: type,
          content: report,
          number: number ? number.toString() : '0'
        }
      });
    }

    return {
      report,
      cached: false,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    throw new Error('Falha ao gerar relatório');
  }
}

/**
 * 🚀 POST - Endpoint unificado para prompts de IA
 * POST /api/ai/prompt
 */
export async function POST(req: NextRequest): Promise<NextResponse<AIResponse>> {
  // 1. 🛡️ Inicializar contexto de segurança
  let securityContext: SecurityContext;
  
  try {
    securityContext = await authGuard(req);
  } catch (error: any) {
    // Para IA, permitir acesso mais permissivo
    securityContext = {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || '',
      riskScore: 0,
      timestamp: Date.now(),
      endpoint: req.nextUrl.pathname,
      method: req.method
    };
  }
  
  try {

    // 2. 📝 Validar dados de entrada
    const body = await req.json().catch(() => ({}));
    
    let validatedData: z.infer<typeof aiPromptSchema>;
    try {
      validatedData = aiPromptSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid AI prompt data: ${errorMessages}`);
        
        return NextResponse.json<AIResponse>({
          success: false,
          error: 'Dados inválidos',
          message: error.errors[0]?.message || 'Dados de entrada inválidos'
        }, { status: 400 });
      }
      throw error;
    }

    // 3. 🚦 Rate limiting por tipo
    const rateLimit = RATE_LIMITS[validatedData.type];
    const rateLimitKey = `ai_${validatedData.type}_${securityContext.ip}`;
    
    if (!checkRateLimit(rateLimitKey, rateLimit.window, rateLimit.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, `AI ${validatedData.type} rate limit exceeded`);
      return NextResponse.json<AIResponse>({
        success: false,
        error: 'Muitas requisições',
        message: `Limite de ${validatedData.type === 'chat' ? 'mensagens' : 'relatórios'} excedido. Tente novamente em alguns minutos.`
      }, { status: 429 });
    }

    // 4. 🔀 Processar por tipo
    if (validatedData.type === 'chat') {
      // 💬 Processar chat
      cleanExpiredThreads();
      
      const thread = getConversationThread(validatedData.threadId, validatedData.numerologyContext?.userData);
      const contextInfo = prepareNumerologyContext(validatedData.numerologyContext, validatedData.prompt);
      
      addMessageToThread(thread, 'user', validatedData.prompt);
      
      const chatResult = await processChat(thread.messages, contextInfo);
      
      addMessageToThread(thread, 'assistant', chatResult.response);
      
      return NextResponse.json<AIResponse>({
        success: true,
        data: {
          response: chatResult.response,
          threadId: thread.id,
          responseTime: chatResult.responseTime,
          model: chatResult.model,
          modelDescription: chatResult.modelDescription,
          isFallback: chatResult.isFallback,
          conversationLength: thread.messages.length - 1 // Excluir mensagem do sistema
        }
      });
      
    } else if (validatedData.type === 'report') {
      // 📋 Gerar relatório
      const userId = getUserIdFromToken(req);
      const userData = {
        ...validatedData.numerologyContext?.userData,
        userId
      };
      
      const reportResult = await generateReport(
        userData,
        validatedData.reportType || 'geral',
        validatedData.reportNumber
      );
      
      return NextResponse.json<AIResponse>({
        success: true,
        data: {
          response: reportResult.report,
          cached: reportResult.cached,
          generatedAt: reportResult.generatedAt
        }
      });
    }

    return NextResponse.json<AIResponse>({
      success: false,
      error: 'Tipo inválido',
      message: 'Tipo de prompt não suportado'
    }, { status: 400 });

  } catch (error: any) {
    console.error("🚨 Erro no endpoint de IA:", error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `AI prompt error: ${error.message}`);
    }
    
    return NextResponse.json<AIResponse>(
      { 
        success: false, 
        error: 'Erro interno',
        message: 'Falha ao processar prompt de IA' 
      },
      { status: 500 }
    );
  }
}
