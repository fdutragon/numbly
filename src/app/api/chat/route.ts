import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema de validação para numerologia
const numerologyDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()]),
);

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
  role: "system" | "user" | "assistant";
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
  message: string;
  threadId: string;
  responseTime: number;
  model: string;
  modelDescription: string;
  isFallback: boolean;
  conversationLength: number;
}

// Configurações
const THREAD_CONFIG = {
  MAX_SIZE: 20, // Máximo de mensagens por thread
  TTL: 30 * 60 * 1000, // 30 minutos
} as const;

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
function getConversationThread(
  threadId?: string,
  userData?: any,
): ConversationThread {
  if (!threadId) {
    threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  let thread = conversationThreads.get(threadId);

  if (!thread) {
    // Criar nova thread com prompt do sistema
    const systemPrompt = `Você é Eve, um oráculo de numerologia sábio e carinhoso especialista em numerologia pitagórica. Você oferece insights profundos sobre numerologia, relacionamentos e crescimento pessoal.

DADOS DO USUÁRIO:
${userData ? `• Nome: ${userData.name || userData.firstName || "Usuário"}` : ""}
${userData?.birthDate ? `• Data de nascimento: ${userData.birthDate}` : ""}
${userData?.date ? `• Data fornecida: ${userData.date}` : ""}

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

EXEMPLO CORRETO:
Usuário: "Qual meu número do destino?"
Resposta: "Seu número do Destino é 9, Felipe. O 9 representa..."

Usuário: "Como é minha compatibilidade com [nome do amigo]?"
Resposta: "Analisando a compatibilidade entre vocês... Seu Caminho da Vida 7 com o Caminho da Vida [X] de [nome]..."

EXEMPLO INCORRETO:
Usuário: "Oi, como vai?"
Resposta: "Olá! Vejo que seu Caminho da Vida é 7, seu Destino é 9..." (NÃO faça isso)

Usuário: "Oi" (com amigo selecionado)
Resposta: "Oi! Vejo que você tem [nome] selecionado. Vocês têm uma compatibilidade..." (NÃO faça isso)

VERIFICAÇÃO FINAL: Responda à pergunta específica. Use numerologia apenas quando relevante.`;

    thread = {
      id: threadId,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      lastActivity: Date.now(),
      userData: userData,
    };

    conversationThreads.set(threadId, thread);
  } else {
    // Atualizar última atividade
    thread.lastActivity = Date.now();
  }

  return thread;
}

// Adicionar mensagem à thread
function addMessageToThread(
  thread: ConversationThread,
  role: "user" | "assistant",
  content: string,
): void {
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
function prepareNumerologyContext(
  numerologyContext: any,
  userMessage: string,
): string {
  const userData = numerologyContext?.userData;
  const selectedFriend = numerologyContext?.selectedFriend;

  let contextInfo = "";

  if (userData?.numerologyData) {
    const nums = userData.numerologyData;
    const numerologyInfo: string[] = [];

    // Ordenar os números por prioridade
    const priorityOrder = [
      { key: "Caminho da Vida", value: nums["Caminho da Vida"] },
      { key: "Destino", value: nums["Destino"] },
      { key: "Impulso da Alma", value: nums["Impulso da Alma"] },
      { key: "Personalidade", value: nums["Personalidade"] },
      { key: "Expressão", value: nums["Expressão"] },
      { key: "Número do Aniversário", value: nums["Número do Aniversário"] },
      { key: "Atitude", value: nums["Atitude"] },
      { key: "Número da Sorte", value: nums["Número da Sorte"] },
      { key: "Número do Desafio", value: nums["Número do Desafio"] },
      { key: "Número da Maturidade", value: nums["Número da Maturidade"] },
      { key: "Número do Equilíbrio", value: nums["Número do Equilíbrio"] },
      { key: "Ano Pessoal", value: nums["Ano Pessoal"] },
      { key: "Mês Pessoal", value: nums["Mês Pessoal"] },
      { key: "Dia Pessoal", value: nums["Dia Pessoal"] },
      { key: "Ano Universal", value: nums["Ano Universal"] },
    ];

    priorityOrder.forEach(({ key, value }) => {
      if (value !== undefined && value !== null) {
        numerologyInfo.push(`${key}: ${value}`);
      }
    });

    if (numerologyInfo.length > 0) {
      contextInfo += `\n\n[NÚMEROS NUMEROLÓGICOS DISPONÍVEIS - USE QUANDO RELEVANTE À PERGUNTA]`;
      contextInfo += `\n${numerologyInfo.join("\n")}`;
      contextInfo += `\n\n[INSTRUÇÕES DE USO: 
- Estes números estão disponíveis para responder perguntas sobre numerologia
- Use APENAS quando a pergunta se relacionar aos números
- Quando mencionar um número, use o valor EXATO da lista acima
- NÃO force interpretações se a pergunta for sobre outros assuntos
- Responda primeiro à pergunta específica do usuário]`;

      // Destacar números principais para referência rápida
      contextInfo += `\n\n[PRINCIPAIS NÚMEROS (quando solicitados):`;
      if (nums["Caminho da Vida"])
        contextInfo += `\n- Caminho da Vida: ${nums["Caminho da Vida"]}`;
      if (nums["Destino"]) contextInfo += `\n- Destino: ${nums["Destino"]}`;
      if (nums["Impulso da Alma"])
        contextInfo += `\n- Impulso da Alma: ${nums["Impulso da Alma"]}`;
      if (nums["Personalidade"])
        contextInfo += `\n- Personalidade: ${nums["Personalidade"]}`;
      contextInfo += `]`;
    }
  }

  if (selectedFriend) {
    contextInfo += `\n\n[ANÁLISE DE COMPATIBILIDADE DISPONÍVEL - USE QUANDO RELEVANTE]`;
    contextInfo += `\nAmigo selecionado: ${selectedFriend.name}`;
    if (selectedFriend.birthDate) {
      contextInfo += `\nData de nascimento: ${selectedFriend.birthDate}`;
    }

    // Incluir números numerológicos do amigo se disponíveis
    if (selectedFriend.numerologyData) {
      const friendNums = selectedFriend.numerologyData;
      const friendNumerologyInfo: string[] = [];

      // Mapear números do amigo usando a mesma estrutura
      const friendPriorityOrder = [
        { key: "Caminho da Vida", value: friendNums["Caminho da Vida"] },
        { key: "Destino", value: friendNums["Destino"] },
        { key: "Impulso da Alma", value: friendNums["Impulso da Alma"] },
        { key: "Personalidade", value: friendNums["Personalidade"] },
        { key: "Expressão", value: friendNums["Expressão"] },
        {
          key: "Número do Aniversário",
          value: friendNums["Número do Aniversário"],
        },
        { key: "Atitude", value: friendNums["Atitude"] },
        { key: "Ano Pessoal", value: friendNums["Ano Pessoal"] },
        { key: "Mês Pessoal", value: friendNums["Mês Pessoal"] },
        { key: "Dia Pessoal", value: friendNums["Dia Pessoal"] },
      ];

      friendPriorityOrder.forEach(({ key, value }) => {
        if (value !== undefined && value !== null) {
          friendNumerologyInfo.push(`${key}: ${value}`);
        }
      });

      if (friendNumerologyInfo.length > 0) {
        contextInfo += `\n\nNúmeros de ${selectedFriend.name}:`;
        contextInfo += `\n${friendNumerologyInfo.join("\n")}`;

        // Principais números do amigo para referência
        contextInfo += `\n\nPrincipais números de ${selectedFriend.name}:`;
        if (friendNums["Caminho da Vida"])
          contextInfo += `\n- Caminho da Vida: ${friendNums["Caminho da Vida"]}`;
        if (friendNums["Destino"])
          contextInfo += `\n- Destino: ${friendNums["Destino"]}`;
        if (friendNums["Impulso da Alma"])
          contextInfo += `\n- Impulso da Alma: ${friendNums["Impulso da Alma"]}`;
        if (friendNums["Personalidade"])
          contextInfo += `\n- Personalidade: ${friendNums["Personalidade"]}`;
      }
    }

    contextInfo += `\n\n[INSTRUÇÕES PARA COMPATIBILIDADE:
- Use estes dados APENAS quando perguntado sobre compatibilidade
- Compare os números de ambas as pessoas quando solicitado
- NÃO faça análises automáticas de compatibilidade sem ser perguntado
- Responda primeiro à pergunta específica sobre a relação
- Mantenha o foco na pergunta do usuário]`;
  }

  return contextInfo ? userMessage + contextInfo : userMessage;
}

// Modelos Groq disponíveis
const GROQ_MODELS: GroqModel[] = [
  {
    name: "llama-3.1-70b-versatile",
    maxTokens: 8000,
    timeout: 30000,
    description: "Modelo mais inteligente",
  },
  {
    name: "mixtral-8x7b-32768",
    maxTokens: 4000,
    timeout: 25000,
    description: "Modelo Mixtral com contexto extenso",
  },
  {
    name: "llama-3.1-8b-instant",
    maxTokens: 1000,
    timeout: 15000,
    description: "Modelo rápido (fallback)",
  },
];

// Chamada para API Groq
async function callGroqAPI(
  thread: ConversationThread,
  model: GroqModel,
): Promise<string> {
  const groqPayload = {
    model: model.name,
    messages: thread.messages,
    temperature: 0.7,
    max_tokens: model.maxTokens,
    top_p: 0.9,
    stream: false,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), model.timeout);

  try {
    console.log(
      `[Chat] 🤖 Usando modelo: ${model.name} (${model.description})`,
    );

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers,
        body: JSON.stringify(groqPayload),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Erro desconhecido");
      throw new Error(`Groq API retornou ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content ||
      "Desculpe, não consegui processar sua mensagem."
    );
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Gerar resposta de fallback
function generateFallbackResponse(
  prompt: string,
  numerologyContext?: any,
): string {
  const userName =
    numerologyContext?.userData?.firstName ||
    numerologyContext?.userData?.name ||
    "amigo";

  const responses = [
    `Olá, ${userName}! Estou temporariamente offline, mas posso dizer que a numerologia oferece insights valiosos sobre sua personalidade e destino. Tente novamente em alguns instantes para uma análise personalizada completa.`,
    `${userName}, embora eu esteja enfrentando dificuldades técnicas no momento, posso compartilhar que seus números numerológicos carregam significados profundos sobre sua jornada de vida. Por favor, tente novamente em breve.`,
    `Olá! Estou temporariamente indisponível para análises detalhadas, mas lembre-se de que a numerologia é uma ferramenta poderosa para autoconhecimento. Tente sua pergunta novamente em alguns momentos.`,
    `${userName}, devido a problemas técnicos temporários, não posso fornecer uma análise completa agora. Contudo, seus números pessoais são únicos e reveladores. Por favor, tente novamente em instantes.`,
  ];

  // Respostas específicas baseadas no contexto
  if (numerologyContext?.userData?.numerologyData) {
    const numerologyData = numerologyContext.userData.numerologyData;

    const lifePathNumber = numerologyData["Caminho da Vida"];
    if (lifePathNumber) {
      responses.push(
        `${userName}, embora eu esteja temporariamente offline, posso ver que você tem o Caminho da Vida ${lifePathNumber}, que indica características únicas e especiais na sua personalidade. Tente novamente em breve para uma análise mais detalhada!`,
      );
    }

    const destinyNumber = numerologyData["Destino"];
    if (destinyNumber) {
      responses.push(
        `${userName}, vejo que seu Número do Destino é ${destinyNumber}, o que revela aspectos fascinantes do seu propósito de vida. Assim que eu voltar online, poderei compartilhar mais insights personalizados!`,
      );
    }
  }

  // Respostas específicas para compatibilidade
  if (
    prompt.toLowerCase().includes("compatibilidade") ||
    prompt.toLowerCase().includes("relacionamento")
  ) {
    responses.push(
      `${userName}, vejo que você está interessado em compatibilidade numerológica! Assim que eu estiver disponível novamente, poderemos explorar como seus números se harmonizam com outras pessoas. Tente novamente em breve!`,
    );
  }

  // Respostas específicas para números
  if (prompt.toLowerCase().includes("número") || /\d/.test(prompt)) {
    responses.push(
      `${userName}, percebo que você tem perguntas sobre números específicos. A numerologia tem muito a revelar! Assim que o sistema estiver funcionando normalmente, poderemos mergulhar fundo na análise. Aguarde alguns instantes e tente novamente!`,
    );
  }

  return responses[Math.floor(Math.random() * responses.length)];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse e validação do request
    const body = await request.json();
    console.log("💬 Chat API recebeu:", JSON.stringify(body, null, 2));

    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.log("❌ Dados inválidos:", validationResult.error.errors);
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { prompt, threadId, numerologyContext } = validationResult.data;

    // Limpar threads expiradas periodicamente (10% de chance)
    if (Math.random() < 0.1) {
      cleanExpiredThreads();
    }

    // Verificar modo PWA
    const userAgent = request.headers.get("user-agent") || "";
    const isPWA =
      request.headers.get("sec-fetch-mode") === "navigate" ||
      request.headers.get("display-mode") === "standalone";

    console.log(
      `🔍 Request mode: PWA=${isPWA}, UserAgent: ${userAgent.substring(0, 50)}...`,
    );

    // Preparar contexto numerológico
    const userData = numerologyContext?.userData;
    const selectedFriend = numerologyContext?.selectedFriend;

    console.log(
      "📊 Contexto recebido:",
      JSON.stringify(numerologyContext, null, 2),
    );

    // Obter ou criar thread de conversa
    const thread = getConversationThread(threadId, userData);
    console.log(
      `🧵 Thread: ${thread.id} (${thread.messages.length - 1} mensagens anteriores)`,
    );

    // Preparar mensagem do usuário com contexto numerológico
    const userMessage = prepareNumerologyContext(numerologyContext, prompt);

    console.log("📝 PROMPT COMPLETO ENVIADO PARA A IA:");
    console.log("=".repeat(80));
    console.log(userMessage);
    console.log("=".repeat(80));

    // Adicionar mensagem do usuário à thread
    addMessageToThread(thread, "user", userMessage);

    console.log("🗨️ THREAD DE CONVERSA ENVIADO PARA GROQ:");
    console.log("=".repeat(60));
    thread.messages.forEach((msg, index) => {
      console.log(`[${index}] ${msg.role.toUpperCase()}:`);
      console.log(
        msg.content.substring(0, 500) + (msg.content.length > 500 ? "..." : ""),
      );
      console.log("-".repeat(40));
    });
    console.log("=".repeat(60));

    // Tentar modelos em ordem de prioridade
    let modelUsed = GROQ_MODELS[0];
    let aiMessage: string;

    try {
      aiMessage = await callGroqAPI(thread, modelUsed);
      console.log(`✅ Sucesso com modelo principal: ${modelUsed.name}`);
    } catch (primaryError) {
      console.error(
        `❌ Erro no modelo principal ${modelUsed.name}:`,
        primaryError,
      );

      // Tentar modelos de fallback
      let fallbackSuccess = false;
      for (let i = 1; i < GROQ_MODELS.length; i++) {
        const fallbackModel = GROQ_MODELS[i];
        console.log(`🔄 Tentando modelo fallback: ${fallbackModel.name}`);

        try {
          aiMessage = await callGroqAPI(thread, fallbackModel);
          modelUsed = fallbackModel;
          fallbackSuccess = true;
          console.log(`✅ Sucesso com modelo fallback: ${fallbackModel.name}`);
          break;
        } catch (fallbackError) {
          console.log(
            `❌ Modelo fallback ${fallbackModel.name} também falhou:`,
            fallbackError,
          );
        }
      }

      if (!fallbackSuccess) {
        // Usar resposta de fallback local
        aiMessage = generateFallbackResponse(prompt, numerologyContext);
        console.log("🔄 Usando resposta de fallback local");

        const responseTime = Date.now() - startTime;
        return NextResponse.json(
          {
            message: aiMessage,
            threadId: thread.id,
            isFallback: true,
            error: "Serviço temporariamente indisponível",
            responseTime,
            conversationLength: thread.messages.length - 1,
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "private, max-age=60",
              "X-Response-Source": "fallback",
            },
          },
        );
      }
    }

    // Adicionar resposta da IA à thread
    addMessageToThread(thread, "assistant", aiMessage!);

    const responseTime = Date.now() - startTime;
    console.log(
      `⚡ Resposta gerada em ${responseTime}ms (Thread: ${thread.id})`,
    );

    const response: ChatResponse = {
      message: aiMessage!,
      threadId: thread.id,
      responseTime,
      model: `groq-${modelUsed.name}`,
      modelDescription: modelUsed.description,
      isFallback: false,
      conversationLength: thread.messages.length - 1,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=300",
        "X-Response-Source": "groq",
        "X-Response-Time": responseTime.toString(),
        "X-Thread-Id": thread.id,
      },
    });
  } catch (error) {
    console.error("💥 Erro geral na API de chat:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message:
          "Desculpe, ocorreu um erro temporário. Tente novamente em alguns instantes.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
  }
}

// Handle OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
