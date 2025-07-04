import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { logSecurityEvent } from "@/lib/security/auth-guard";
import { checkRateLimit } from "@/lib/security/auth-guard";

// Schemas de validação
const numerologyDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()]),
);

const createCompatibilitySchema = z.object({
  userId: z.string().min(1, "User ID é obrigatório"),
  target_name: z.string().min(1, "Nome do alvo é obrigatório"),
  target_date: z.string().min(1, "Data do alvo é obrigatória"),
  userName: z.string().optional(),
  userEmail: z.string().email().optional(),
  userBirthDate: z.string().optional(),
  compatibilityType: z
    .enum(["amoroso", "amizade", "profissional", "familiar"])
    .optional()
    .default("amoroso"),
});

const personalizedReportSchema = z.object({
  friendData: z.object({
    name: z.string(),
    birthDate: z.string(),
    numerologyData: numerologyDataSchema,
  }),
  userData: z.object({
    name: z.string(),
    birthDate: z.string(),
    numerologyData: numerologyDataSchema,
  }),
});

interface CompatibilityResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface NumerologyNumbers {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
}

// Rate limiting para compatibilidade
const COMPATIBILITY_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 10, // 10 análises por 5 minutos
};

// Inicialização do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Calcular compatibilidade dinâmica entre dois mapas numerológicos
 */
function calculateDynamicCompatibility(
  userNumbers: NumerologyNumbers,
  friendNumbers: NumerologyNumbers,
): number {
  let totalScore = 0;
  let weightedSum = 0;
  const weights = {
    lifePath: 0.35,
    destiny: 0.25,
    soulUrge: 0.2,
    personality: 0.2,
  };

  Object.entries(weights).forEach(([aspect, weight]) => {
    const userNum = userNumbers[aspect as keyof NumerologyNumbers];
    const friendNum = friendNumbers[aspect as keyof NumerologyNumbers];

    if (userNum && friendNum) {
      let compatibility = 0.5;

      if (userNum === friendNum) {
        compatibility = 1.0;
      } else if (userNum + friendNum === 9) {
        compatibility = 0.95;
      } else if (Math.abs(userNum - friendNum) === 1) {
        compatibility = 0.85;
      } else {
        const reduceToSingle = (num: number): number => {
          while (num > 9) {
            num = num
              .toString()
              .split("")
              .reduce((a, b) => parseInt(a.toString()) + parseInt(b), 0);
          }
          return num;
        };

        if (reduceToSingle(userNum) === reduceToSingle(friendNum)) {
          compatibility = 0.8;
        } else if (
          [3, 6, 9].includes(userNum) &&
          [3, 6, 9].includes(friendNum)
        ) {
          compatibility = 0.75;
        } else if ([4, 8].includes(userNum) && [4, 8].includes(friendNum)) {
          compatibility = 0.75;
        } else if ([1, 5].includes(userNum) && [1, 5].includes(friendNum)) {
          compatibility = 0.75;
        } else if ([2, 7].includes(userNum) && [2, 7].includes(friendNum)) {
          compatibility = 0.75;
        }
      }

      totalScore += compatibility * weight;
      weightedSum += weight;
    }
  });

  const finalScore = weightedSum > 0 ? totalScore / weightedSum : 0.5;
  return Math.max(0.5, Math.min(1.0, finalScore));
}

/**
 * Gerar análise de compatibilidade com Gemini
 */
async function generateCompatibilityAnalysis(
  user: { name: string; birthDate: string; numbers: NumerologyNumbers },
  friend: { name: string; birthDate: string; numbers: NumerologyNumbers },
  compatibilityType: string,
  compatibility: number,
): Promise<string> {
  try {
    const genAIModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-8b",
    });

    const analysisPrompt = `Como especialista em numerologia, escreva uma análise de compatibilidade do tipo "${compatibilityType}" entre ${user.name} e ${friend.name} com base nos seguintes números numerológicos principais de cada um:

${user.name}: Caminho de Vida ${user.numbers?.lifePath}, Destino ${user.numbers?.destiny}, Alma ${user.numbers?.soulUrge}, Personalidade ${user.numbers?.personality}
${friend.name}: Caminho de Vida ${friend.numbers?.lifePath}, Destino ${friend.numbers?.destiny}, Alma ${friend.numbers?.soulUrge}, Personalidade ${friend.numbers?.personality}

**INSTRUÇÕES DE FORMATAÇÃO:**
- Responda apenas em markdown puro.
- Comece com um título de segundo nível: ## Compatibilidade Numerológica
- Use 2 a 4 subtítulos (###) para tópicos como "Visão Geral", "Pontos de Harmonia", "Desafios", "Potencial do Relacionamento".
- Para cada subtítulo, escreva exatamente 2 parágrafos claros, sem listas, sem HTML, sem emojis, sem repetições.
- Não use listas, blocos de código, blockquotes, ou qualquer tag HTML.
- Não inclua nada além do markdown.

Use linguagem inspiradora, mas objetiva.`;

    const analysisResult = await genAIModel.generateContent(analysisPrompt);
    const analysisText = (await analysisResult.response)
      .text()
      .trim()
      .replace(/```[a-z]*\s*/gi, "")
      .replace(/```\s*$/, "");

    return analysisText;
  } catch (error: any) {
    console.error("❌ Erro no Gemini:", error);
    return `## Compatibilidade Numerológica

### Análise Temporariamente Indisponível

No momento, nossa análise detalhada está temporariamente indisponível. Os dados numerológicos foram calculados corretamente e o relacionamento pode ser analisado com base nos números principais.

Por favor, tente novamente em alguns minutos para obter a análise completa personalizada.`;
  }
}

export const dynamic = "force-dynamic";

// GET: Buscar compatibilidades do usuário
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "UserId é obrigatório",
        },
        { status: 400 },
      );
    }

    // Log de consulta
    logSecurityEvent(
      "AUTH_SUCCESS",
      {
        ip,
        userAgent,
        endpoint: "/api/ai/compatibility",
        method: "GET",
        riskScore: 0,
        timestamp: Date.now(),
      },
      "GET /api/ai/compatibility",
    );

    const compatibilities = await db.compatibility.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        userId: true,
        target_email: true,
        target_name: true,
        target_date: true,
        numerologyData: true,
        score: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            numerologyData: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse numerologyData para cada compatibilidade
    const parsedCompatibilities = compatibilities.map((comp) => {
      let parsedNumerologyData: unknown;
      try {
        // Tenta fazer o parse se for string
        parsedNumerologyData =
          typeof comp.numerologyData === "string"
            ? JSON.parse(comp.numerologyData)
            : comp.numerologyData;

        // Garante que os números estão no formato correto
        const formatNumber = (numberData: any) => {
          if (!numberData) return null;
          if (typeof numberData === "object") return numberData;
          return {
            number: numberData,
            meaning: "",
          };
        };

        // Formata os números principais
        // Faz type narrowing para garantir acesso seguro a propriedades de parsedNumerologyData
        if (typeof parsedNumerologyData === 'object' && parsedNumerologyData !== null) {
          for (const key in parsedNumerologyData) {
            if (Object.prototype.hasOwnProperty.call(parsedNumerologyData, key)) {
              // @ts-expect-error: pode ser necessário ajustar o tipo de parsedNumerologyData
              parsedNumerologyData[key] = formatNumber((parsedNumerologyData as Record<string, unknown>)[key]);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao fazer parse dos dados numerológicos:", error);
        parsedNumerologyData = comp.numerologyData;
      }

      return {
        ...comp,
        numerologyData: parsedNumerologyData,
      };
    });

    return NextResponse.json(parsedCompatibilities);
  } catch (error: any) {
    console.error("Erro ao buscar compatibilidades:", error);

    logSecurityEvent(
      "SUSPICIOUS",
      {
        ip,
        userAgent,
        endpoint: "/api/ai/compatibility",
        method: "GET",
        riskScore: 5,
        timestamp: Date.now(),
      },
      `Compatibility retrieval error: ${error.message}`,
    );

    return NextResponse.json(
      {
        error: "Erro ao buscar compatibilidades",
      },
      { status: 500 },
    );
  }
}

// POST: Criar nova análise de compatibilidade
export async function POST(
  req: NextRequest,
): Promise<NextResponse<CompatibilityResponse>> {
  const startTime = Date.now();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    // Rate limiting
    const rateLimitKey = `ai_compatibility_${ip}`;

    if (
      !checkRateLimit(
        rateLimitKey,
        COMPATIBILITY_RATE_LIMIT.window,
        COMPATIBILITY_RATE_LIMIT.max,
        { allowLocalhost: true },
      )
    ) {
      logSecurityEvent(
        "RATE_LIMITED",
        {
          ip,
          userAgent,
          endpoint: "/api/ai/compatibility",
          method: "POST",
          riskScore: 3,
          timestamp: Date.now(),
        },
        `Compatibility rate limit exceeded`,
      );

      return NextResponse.json<CompatibilityResponse>(
        {
          success: false,
          error: "Muitas análises de compatibilidade",
          message:
            "Limite de análises excedido. Tente novamente em alguns minutos.",
        },
        { status: 429 },
      );
    }

    // Validar dados de entrada
    const body = await req.json().catch(() => ({}));

    let validatedData: z.infer<typeof createCompatibilitySchema>;
    try {
      validatedData = createCompatibilitySchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => e.message).join(", ");

        logSecurityEvent(
          "SUSPICIOUS",
          {
            ip,
            userAgent,
            endpoint: "/api/ai/compatibility",
            method: "POST",
            riskScore: 5,
            timestamp: Date.now(),
          },
          `Invalid compatibility data: ${errorMessages}`,
        );

        return NextResponse.json<CompatibilityResponse>(
          {
            success: false,
            error: "Dados inválidos",
            message: error.errors[0]?.message || "Dados de entrada inválidos",
          },
          { status: 400 },
        );
      }
      throw error;
    }

    const {
      userId,
      target_name,
      target_date,
      userName,
      userEmail,
      userBirthDate,
      compatibilityType,
    } = validatedData;

    // Log de início
    logSecurityEvent(
      "AUTH_SUCCESS",
      {
        ip,
        userAgent,
        endpoint: "/api/ai/compatibility",
        method: "POST",
        riskScore: 0,
        timestamp: Date.now(),
      },
      "POST /api/ai/compatibility",
    );

    // Formatação da data do amigo/pessoa analisada
    let formattedTargetDate = target_date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
      const [year, month, day] = target_date.split("-");
      formattedTargetDate = `${day}/${month}/${year}`;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(target_date)) {
      formattedTargetDate = target_date.replace(/-/g, "/");
    }

    // Calcular dados numerológicos usando a API /api/numberpath
    const [day, month, year] = formattedTargetDate.split("/");
    const isoDate = `${year}-${month}-${day}`;

    // Fazer requisição para a API numberpath para o amigo
    const baseUrl = new URL(req.url).origin;

    const friendNumerologyResponse = await fetch(`${baseUrl}/api/numberpath`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: target_name, date: isoDate }),
    });

    if (!friendNumerologyResponse.ok) {
      const errorText = await friendNumerologyResponse.text();
      console.error(
        "❌ Erro na API numberpath para amigo:",
        friendNumerologyResponse.status,
        errorText,
      );
      throw new Error(
        `Erro ao calcular numerologia do amigo: ${friendNumerologyResponse.status} - ${errorText}`,
      );
    }

    const friendNumerologyData = await friendNumerologyResponse.json();

    const formattedNumerologyData: NumerologyNumbers = {
      lifePath: friendNumerologyData.numerologyData?.lifePath?.number || 0,
      destiny: friendNumerologyData.numerologyData?.destiny?.number || 0,
      soulUrge: friendNumerologyData.numerologyData?.soulUrge?.number || 0,
      personality:
        friendNumerologyData.numerologyData?.personality?.number || 0,
    };

    // Buscar dados numerológicos do usuário logado do banco
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { numerologyData: true },
    });

    if (!user) {
      return NextResponse.json<CompatibilityResponse>(
        {
          success: false,
          error: "Usuário não encontrado",
        },
        { status: 404 },
      );
    }

    // Corrigido cast seguro para UserNumerologyData
    const userNumerologyData: UserNumerologyData = (user.numerologyData ?? {}) as UserNumerologyData;
    const formattedUserNumerologyData: NumerologyNumbers = {
      lifePath: userNumerologyData?.lifePath || 0,
      destiny: userNumerologyData?.destiny || 0,
      soulUrge: userNumerologyData?.soulUrge || 0,
      personality: userNumerologyData?.personality || 0,
    };

    console.log(
      "🔢 [DEBUG] - Dados numerológicos do usuário:",
      formattedUserNumerologyData,
    );
    console.log(
      "🔢 [DEBUG] - Dados numerológicos do amigo:",
      formattedNumerologyData,
    );

    // Calcular compatibilidade
    const dynamicCompatibility = calculateDynamicCompatibility(
      formattedUserNumerologyData,
      formattedNumerologyData,
    );

    // Gerar análise com Gemini
    const analysisText = await generateCompatibilityAnalysis(
      {
        name: userName || "Usuário Desconhecido",
        birthDate: userBirthDate || "Data Desconhecida",
        numbers: formattedUserNumerologyData,
      },
      {
        name: target_name,
        birthDate: formattedTargetDate,
        numbers: formattedNumerologyData,
      },
      compatibilityType,
      dynamicCompatibility,
    );

    // Salvar no banco
    try {
      const numerologyDataToSave = {
        ...formattedNumerologyData,
        gemini: { analysis: analysisText },
        user: { name: userName, email: userEmail, birthDate: userBirthDate },
        compatibilityType,
      };

      const compatibilityRecord = await db.compatibility.create({
        data: {
          userId,
          target_name,
          target_date: formattedTargetDate,
          target_email: `${target_name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          numerologyData: numerologyDataToSave,
          score: dynamicCompatibility,
        },
      });

      // Log de sucesso
      logSecurityEvent(
        "AUTH_SUCCESS",
        {
          ip,
          userAgent,
          endpoint: "/api/ai/compatibility",
          method: "POST",
          riskScore: 0,
          timestamp: Date.now(),
        },
        "POST /api/ai/compatibility",
      );

      return NextResponse.json<CompatibilityResponse>({
        success: true,
        data: { ...compatibilityRecord, analysis: analysisText },
      });
    } catch (dbError: any) {
      console.error("❌ Erro ao salvar no banco de dados:", dbError.message);

      return NextResponse.json<CompatibilityResponse>(
        {
          success: false,
          error: "Erro ao criar compatibilidade",
          message: dbError.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Erro ao criar compatibilidade:", error);

    logSecurityEvent(
      "SUSPICIOUS",
      {
        ip,
        userAgent,
        endpoint: "/api/ai/compatibility",
        method: "POST",
        riskScore: 5,
        timestamp: Date.now(),
      },
      `Compatibility creation error: ${error.message}`,
    );

    return NextResponse.json<CompatibilityResponse>(
      {
        success: false,
        error: "Erro ao criar compatibilidade",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// PUT: Gerar relatório personalizado de compatibilidade
export async function PUT(req: NextRequest) {
  const startTime = Date.now();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const { searchParams } = new URL(req.url);
    const compatibilityId = searchParams.get("id");

    if (!compatibilityId) {
      return NextResponse.json(
        {
          error: "ID da compatibilidade é obrigatório",
        },
        { status: 400 },
      );
    }

    // Validar dados de entrada
    const body = await req.json().catch(() => ({}));
    const validatedData = personalizedReportSchema.parse(body);
    const { friendData, userData } = validatedData;

    if (process.env.NODE_ENV === "development") {
      console.log(
        "PUT /api/ai/compatibility - Processando relatório personalizado:",
        compatibilityId,
      );
    }

    // Log de início
    logSecurityEvent(
      "AUTH_SUCCESS",
      {
        ip,
        userAgent,
        endpoint: "/api/ai/compatibility",
        method: "PUT",
        riskScore: 0,
        timestamp: Date.now(),
      },
      "PUT /api/ai/compatibility",
    );

    // Buscar a compatibilidade existente
    const existingCompatibility = await db.compatibility.findUnique({
      where: { id: compatibilityId },
      select: { numerologyData: true },
    });

    if (!existingCompatibility) {
      return NextResponse.json(
        {
          error: "Compatibilidade não encontrada",
        },
        { status: 404 },
      );
    }

    let compatibilityType = "amoroso"; // padrão
    const existingNumerologyData = existingCompatibility?.numerologyData as any;
    if (existingNumerologyData?.compatibilityType) {
      compatibilityType = existingNumerologyData.compatibilityType;
    }

    // Verificar se já existe um relatório personalizado salvo
    const savedPersonalizedReport = existingNumerologyData?.personalizedReport;

    if (savedPersonalizedReport && savedPersonalizedReport.analysis) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ Relatório personalizado encontrado no banco, retornando salvo",
        );
      }

      return NextResponse.json({
        success: true,
        analysis: savedPersonalizedReport.analysis,
        metadata: {
          friendName: friendData.name,
          userName: userData.name,
          generatedAt: savedPersonalizedReport.generatedAt,
          type: "personalized_compatibility_report",
          source: "cached",
        },
      });
    }

    // Gerar novo relatório personalizado
    const prompt = `
Você é um especialista em numerologia e relacionamentos. Crie um relatório detalhado de compatibilidade **${compatibilityType.toUpperCase()}** entre duas pessoas usando seus mapas numerológicos completos.

**ANO ATUAL: 2025**
**TIPO DE COMPATIBILIDADE: ${compatibilityType}**

**PESSOA 1 - ${userData.name}:**
- Data de Nascimento: ${userData.birthDate}
- Dados Numerológicos: ${JSON.stringify(userData.numerologyData, null, 2)}

**PESSOA 2 - ${friendData.name}:**
- Data de Nascimento: ${friendData.birthDate}
- Dados Numerológicos: ${JSON.stringify(friendData.numerologyData, null, 2)}

**INSTRUÇÕES PARA O RELATÓRIO:**

Crie um relatório de compatibilidade **${compatibilityType}** detalhado e personalizado começando diretamente com as seções de análise:

### Análise dos números principais
- Compare os Caminhos de Vida de ambos
- Analise como os números de Destino se complementam
- Examine a compatibilidade de Expressão e Personalidade
- Avalie a harmonia entre os Impulsos da Alma

### Dinâmica do relacionamento
- Como vocês se conectam emocionalmente (no contexto ${compatibilityType})
- Pontos fortes da relação
- Desafios potenciais e como superá-los
- Conselhos específicos para fortalecer o vínculo

### Momento atual
- Como os números pessoais atuais influenciam a relação
- Oportunidades no momento presente
- Períodos favoráveis para decisões importantes

### Conselhos práticos
- 3-5 dicas específicas para melhorar a compatibilidade ${compatibilityType}
- Como aproveitar as forças de cada um
- Estratégias para lidar com diferenças

**FORMATO:**
- Use Markdown para formatação
- NÃO inclua título principal (##) - comece direto com subtítulos (###)
- Use subtítulos em formato normal
- NÃO inclua score ou porcentagem de compatibilidade
- Seja caloroso, otimista e construtivo
- Use os nomes das pessoas (${userData.name} e ${friendData.name})
- Inclua insights profundos mas práticos
- Evite clichês, seja específico aos números calculados
- Mantenha um tom profissional mas acessível
- Adapte a linguagem ao tipo de relacionamento ${compatibilityType}

**IMPORTANTE:**
- Base suas análises nos números reais calculados
- Seja específico sobre como os números interagem
- Forneça orientações práticas específicas para relacionamento ${compatibilityType}
- Mantenha esperança e positividade
- Escreva 2-3 parágrafos por seção
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    // Salvar o relatório personalizado no banco de dados
    try {
      const personalizedReport = {
        analysis,
        generatedAt: new Date().toISOString(),
        type: "personalized_compatibility_report",
      };

      const updatedNumerologyData = {
        ...(existingCompatibility.numerologyData as any),
        personalizedReport,
      };

      await db.compatibility.update({
        where: { id: compatibilityId },
        data: {
          numerologyData: updatedNumerologyData,
        },
      });

      if (process.env.NODE_ENV === "development") {
        console.log("💾 Relatório personalizado salvo no banco de dados");
      }
    } catch (saveError) {
      console.error(
        "❌ Erro ao salvar relatório personalizado no banco:",
        saveError,
      );
    }

    // Log de sucesso
    logSecurityEvent(
      "AUTH_SUCCESS",
      {
        ip,
        userAgent,
        endpoint: "/api/ai/compatibility",
        method: "PUT",
        riskScore: 0,
        timestamp: Date.now(),
      },
      "PUT /api/ai/compatibility",
    );

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        friendName: friendData.name,
        userName: userData.name,
        generatedAt: new Date().toISOString(),
        type: "personalized_compatibility_report",
        source: "generated",
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar relatório personalizado:", error);

    logSecurityEvent(
      "SUSPICIOUS",
      {
        ip,
        userAgent,
        endpoint: "/api/ai/compatibility",
        method: "PUT",
        riskScore: 5,
        timestamp: Date.now(),
      },
      `Personalized report error: ${error.message}`,
    );

    // Tratamento específico para erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos fornecidos",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno ao gerar relatório personalizado",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// Corrigido tipo de userNumerologyData para garantir propriedades corretas
interface UserNumerologyData {
  lifePath?: number;
  destiny?: number;
  soulUrge?: number;
  personality?: number;
}
