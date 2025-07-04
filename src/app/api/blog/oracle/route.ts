import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const oracleSchema = z.object({
  userId: z.string(),
  question: z.string().optional(),
  mood: z
    .enum([
      "PEACEFUL",
      "ANXIOUS",
      "GRATEFUL",
      "REFLECTIVE",
      "ENERGETIC",
      "MELANCHOLIC",
      "INSPIRED",
      "CONFUSED",
      "BALANCED",
    ])
    .optional(),
  type: z.enum(["CONTEXTUAL", "DAILY", "FUTURE_LETTER"]).default("CONTEXTUAL"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = oracleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { userId, question, mood, type } = validation.data;

    // Buscar contexto do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        birthDate: true,
        numerologyData: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Calcular contexto espiritual
    const today = new Date();
    const birthDate = new Date(user.birthDate);
    const personalDay = calculatePersonalDay(birthDate, today);
    const lunarPhase = getCurrentLunarPhase();
    const cosmicAlignment = getCurrentCosmicAlignment();

    // Gerar mensagem do oráculo
    const message = await generateOracleMessage({
      question,
      mood,
      personalDay,
      lunarPhase,
      cosmicAlignment,
      type,
      numerologyData: user.numerologyData,
    });

    // Salvar mensagem
    const oracleMessage = await prisma.oracleMessage.create({
      data: {
        userId,
        question,
        message,
        personalDay,
        mood,
        lunarPhase,
        cosmicAlignment,
        type,
      },
    });

    return NextResponse.json(oracleMessage, { status: 201 });
  } catch (error) {
    console.error("Erro ao consultar oráculo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 },
      );
    }

    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const messages = await prisma.oracleMessage.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Erro ao buscar mensagens do oráculo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Funções auxiliares
function calculatePersonalDay(birthDate: Date, currentDate: Date): number {
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const birthDay = birthDate.getDate();
  const birthMonth = birthDate.getMonth() + 1;

  const sum = day + month + birthDay + birthMonth;
  return reduceToSingleDigit(sum);
}

function reduceToSingleDigit(num: number): number {
  while (num > 9) {
    num = num
      .toString()
      .split("")
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return num;
}

function getCurrentLunarPhase(): string {
  // Cálculo simplificado da fase lunar
  const today = new Date();
  const lunarCycle = 29.53; // dias
  const knownNewMoon = new Date("2024-01-11"); // Data conhecida de lua nova

  const daysSinceKnown = Math.floor(
    (today.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24),
  );
  const cyclePosition = (daysSinceKnown % lunarCycle) / lunarCycle;

  if (cyclePosition < 0.125) return "Nova";
  if (cyclePosition < 0.375) return "Crescente";
  if (cyclePosition < 0.625) return "Cheia";
  if (cyclePosition < 0.875) return "Minguante";
  return "Nova";
}

function getCurrentCosmicAlignment(): string {
  const alignments = [
    "Mercúrio retrógrado intensifica a reflexão",
    "Vênus favorece relacionamentos e amor próprio",
    "Marte energiza ação e coragem",
    "Júpiter expande oportunidades",
    "Saturno ensina disciplina e paciência",
    "Portal 11:11 ativo para manifestação",
    "Energia de eclipse traz transformações",
    "Lua em Escorpião intensifica emoções",
    "Sol em conjunção com Plutão",
    "Equinócio equilibra energias",
  ];

  const today = new Date();
  const index = today.getDate() % alignments.length;
  return alignments[index];
}

async function generateOracleMessage(context: {
  question?: string;
  mood?: string;
  personalDay: number;
  lunarPhase: string;
  cosmicAlignment: string;
  type: string;
  numerologyData: any;
}): Promise<string> {
  const { question, mood, personalDay, lunarPhase, cosmicAlignment, type } =
    context;

  // Templates baseados no tipo
  if (type === "DAILY") {
    return generateDailyMessage(personalDay, lunarPhase);
  }

  if (type === "FUTURE_LETTER") {
    return generateFutureLetter(personalDay, cosmicAlignment);
  }

  // Mensagem contextual
  const baseMessages = [
    `🔮 O véu entre os mundos se abre... ${cosmicAlignment}. No seu dia pessoal ${personalDay}, sob a lua ${lunarPhase.toLowerCase()}, os espíritos sussurram: `,

    `✨ As estrelas dançam em seu favor. Sua energia do dia ${personalDay} ressoa com a lua ${lunarPhase.toLowerCase()}. O cosmos revela: `,

    `🌙 No silêncio sagrado da noite, ${cosmicAlignment}. Seu caminho pessoal ${personalDay} se ilumina sob a lua ${lunarPhase.toLowerCase()}. A sabedoria ancestral fala: `,

    `💫 Os números cantam sua melodia cósmica. Dia ${personalDay}, lua ${lunarPhase.toLowerCase()}, e ${cosmicAlignment.toLowerCase()}. O oráculo revela: `,
  ];

  const baseMessage =
    baseMessages[Math.floor(Math.random() * baseMessages.length)];

  // Resposta específica baseada na pergunta e humor
  let response = "";

  if (question) {
    if (mood === "ANXIOUS") {
      response = `sua ansiedade sobre "${question.toLowerCase()}" é um convite da alma para encontrar paz interior. Respire fundo - você é mais forte do que imagina, e este momento de turbulência é apenas uma oportunidade de crescimento espiritual.`;
    } else if (mood === "GRATEFUL") {
      response = `sua gratidão em relação a "${question.toLowerCase()}" ilumina todo o universo. Continue cultivando essa energia radiante - ela é um farol de esperança que guia não apenas seus passos, mas também inspira todos ao seu redor.`;
    } else if (mood === "CONFUSED") {
      response = `sua confusão sobre "${question.toLowerCase()}" é o prelúdio da clareza. Na névoa da incerteza, confie em sua intuição - ela é o fio dourado que conecta seu coração à sabedoria universal.`;
    } else {
      response = `"${question.toLowerCase()}" ecoa nas câmaras etéreas. Confie no fluxo divino da vida - cada experiência é uma pérola de sabedoria no colar da sua evolução espiritual.`;
    }
  } else {
    // Mensagem geral baseada no humor
    if (mood === "PEACEFUL") {
      response =
        "sua paz interior é um presente para o mundo. Mantenha essa serenidade - ela é a base de toda sabedoria.";
    } else if (mood === "ENERGETIC") {
      response =
        "sua energia vibrante é um portal de manifestação. Use essa força para materializar seus sonhos mais elevados.";
    } else {
      response =
        "este momento é sagrado. Permita-se sentir profundamente - cada emoção é um professor disfarçado.";
    }
  }

  return baseMessage + response;
}

function generateDailyMessage(personalDay: number, lunarPhase: string): string {
  const dailyWisdom = {
    1: "Hoje é dia de plantar sementes de novos começos. Sua liderança natural brilha.",
    2: "A cooperação e sensibilidade guiam seus passos hoje. Ouça sua intuição.",
    3: "Criatividade e expressão estão em alta. Deixe sua alma artística florescer.",
    4: "Organização e trabalho duro trazem resultados sólidos hoje.",
    5: "Aventura e mudanças positivas chegam. Abrace o novo com coragem.",
    6: "Amor e responsabilidade familiar estão em foco. Nutra seus relacionamentos.",
    7: "Introspecção e busca espiritual dominam o dia. Medite e reflita.",
    8: "Ambições materiais e conquistas profissionais estão favorecidas.",
    9: "Conclusões e sabedoria universal. Compartilhe seus dons com o mundo.",
  };

  return `🌅 Mensagem do Amanhecer: ${dailyWisdom[personalDay as keyof typeof dailyWisdom]} A lua ${lunarPhase.toLowerCase()} amplifica essa energia. Que este dia seja abençoado! ✨`;
}

function generateFutureLetter(
  personalDay: number,
  cosmicAlignment: string,
): string {
  const futurePhrases = [
    `Querida alma em evolução, do futuro eu te escrevo com amor infinito. ${cosmicAlignment}, e tua jornada no dia ${personalDay} foi fundamental para quem te tornaste.`,

    `Das dimensões superiores, eu te envio esta carta cósmica. Lembra do dia ${personalDay} quando ${cosmicAlignment.toLowerCase()}? Aquele momento plantou sementes que floresceram magnificamente.`,

    `Através do tecido do tempo, tua versão futura te abraça. O universo conspirou através do ${cosmicAlignment.toLowerCase()} no teu dia ${personalDay} para te guiar até aqui.`,
  ];

  const futures = [
    "Teus sonhos se materializam de formas ainda mais belas do que imaginavas. A paciência que cultivas hoje se transforma em sabedoria amanhã.",

    "As sementes de amor próprio que plantas neste momento criam um jardim de abundância em tua vida futura. Continue nutrindo tua alma.",

    "Cada desafio que enfrentas hoje é um degrau na escada dourada do teu destino. Tu és mais corajosa do que acreditas.",
  ];

  const phrase =
    futurePhrases[Math.floor(Math.random() * futurePhrases.length)];
  const future = futures[Math.floor(Math.random() * futures.length)];

  return `💌 ${phrase} ${future} Com amor eterno, Tua Futura Versão ✨`;
}
