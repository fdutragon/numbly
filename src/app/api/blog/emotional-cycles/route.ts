import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emotionalCycleSchema = z.object({
  userId: z.string(),
  mood: z.enum([
    "PEACEFUL",
    "ANXIOUS",
    "GRATEFUL",
    "REFLECTIVE",
    "ENERGETIC",
    "MELANCHOLIC",
    "INSPIRED",
    "CONFUSED",
    "BALANCED",
  ]),
  energy: z.number().min(1).max(10),
  activity: z.string().optional(),
  blogPostRead: z.string().optional(),
  meditationDone: z.boolean().default(false),
  journalWritten: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = emotionalCycleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.issues },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Buscar usuário para calcular dia pessoal
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { birthDate: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Calcular dia pessoal
    const today = new Date();
    const birthDate = new Date(user.birthDate);
    const personalDay = calculatePersonalDay(birthDate, today);

    // Criar registro do ciclo emocional
    const emotionalCycle = await prisma.emotionalCycle.create({
      data: {
        ...data,
        personalDay,
      },
    });

    // Gerar insights da IA após criar o registro
    setTimeout(async () => {
      try {
        const insights = await generateEmotionalInsights(
          data.userId,
          personalDay,
        );
        if (insights) {
          await prisma.emotionalCycle.update({
            where: { id: emotionalCycle.id },
            data: {
              aiPattern: insights.pattern,
              aiRecommendation: insights.recommendation,
            },
          });
        }
      } catch (error) {
        console.error("Erro ao gerar insights emocionais:", error);
      }
    }, 2000);

    return NextResponse.json(emotionalCycle, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar ciclo emocional:", error);
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
    const days = parseInt(searchParams.get("days") || "30");
    const personalDay = searchParams.get("personalDay");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 },
      );
    }

    const where: any = { userId };

    // Filtrar por dia pessoal se especificado
    if (personalDay) {
      where.personalDay = parseInt(personalDay);
    }

    // Filtrar por período
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    where.recordedAt = { gte: dateLimit };

    const cycles = await prisma.emotionalCycle.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      take: 100, // Limite para performance
    });

    // Analisar padrões
    const patterns = analyzeEmotionalPatterns(cycles);

    return NextResponse.json({
      cycles,
      patterns,
      totalRecords: cycles.length,
    });
  } catch (error) {
    console.error("Erro ao buscar ciclos emocionais:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

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

function analyzeEmotionalPatterns(cycles: any[]) {
  if (cycles.length === 0) return null;

  // Análise por dia pessoal
  const moodsByPersonalDay: Record<number, string[]> = {};
  const energyByPersonalDay: Record<number, number[]> = {};

  cycles.forEach((cycle) => {
    const day = cycle.personalDay;
    if (!moodsByPersonalDay[day]) {
      moodsByPersonalDay[day] = [];
      energyByPersonalDay[day] = [];
    }
    moodsByPersonalDay[day].push(cycle.mood);
    energyByPersonalDay[day].push(cycle.energy);
  });

  // Encontrar padrões dominantes
  const personalDayPatterns: any[] = [];

  Object.entries(moodsByPersonalDay).forEach(([day, moods]) => {
    const moodCount: Record<string, number> = {};
    moods.forEach((mood) => {
      moodCount[mood] = (moodCount[mood] || 0) + 1;
    });

    const dominantMood = Object.entries(moodCount).sort(
      ([, a], [, b]) => b - a,
    )[0];

    const averageEnergy =
      energyByPersonalDay[parseInt(day)].reduce((a, b) => a + b, 0) /
      energyByPersonalDay[parseInt(day)].length;

    personalDayPatterns.push({
      personalDay: parseInt(day),
      dominantMood: dominantMood[0],
      moodFrequency: dominantMood[1],
      averageEnergy: Math.round(averageEnergy * 10) / 10,
      totalRecords: moods.length,
    });
  });

  // Análise de tendências semanais
  const weeklyTrends = analyzeWeeklyTrends(cycles);

  // Análise de atividades mais correlacionadas com bem-estar
  const activityAnalysis = analyzeActivityCorrelation(cycles);

  return {
    personalDayPatterns: personalDayPatterns.sort(
      (a, b) => a.personalDay - b.personalDay,
    ),
    weeklyTrends,
    activityAnalysis,
    insights: generatePatternInsights(personalDayPatterns),
  };
}

function analyzeWeeklyTrends(cycles: any[]) {
  const weeklyData: Record<string, { mood: string[]; energy: number[] }> = {};

  cycles.forEach((cycle) => {
    const date = new Date(cycle.recordedAt);
    const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { mood: [], energy: [] };
    }

    weeklyData[weekKey].mood.push(cycle.mood);
    weeklyData[weekKey].energy.push(cycle.energy);
  });

  return Object.entries(weeklyData)
    .map(([week, data]) => ({
      week,
      averageEnergy:
        data.energy.reduce((a, b) => a + b, 0) / data.energy.length,
      predominantMood: getMostFrequent(data.mood),
      recordCount: data.mood.length,
    }))
    .slice(-4); // Últimas 4 semanas
}

function analyzeActivityCorrelation(cycles: any[]) {
  const withMeditation = cycles.filter((c) => c.meditationDone);
  const withJournal = cycles.filter((c) => c.journalWritten);
  const withBoth = cycles.filter((c) => c.meditationDone && c.journalWritten);

  const avgEnergyGeneral =
    cycles.reduce((sum, c) => sum + c.energy, 0) / cycles.length;
  const avgEnergyMeditation =
    withMeditation.length > 0
      ? withMeditation.reduce((sum, c) => sum + c.energy, 0) /
        withMeditation.length
      : 0;
  const avgEnergyJournal =
    withJournal.length > 0
      ? withJournal.reduce((sum, c) => sum + c.energy, 0) / withJournal.length
      : 0;
  const avgEnergyBoth =
    withBoth.length > 0
      ? withBoth.reduce((sum, c) => sum + c.energy, 0) / withBoth.length
      : 0;

  return {
    general: Math.round(avgEnergyGeneral * 10) / 10,
    withMeditation: Math.round(avgEnergyMeditation * 10) / 10,
    withJournal: Math.round(avgEnergyJournal * 10) / 10,
    withBoth: Math.round(avgEnergyBoth * 10) / 10,
    meditationBoost:
      Math.round((avgEnergyMeditation - avgEnergyGeneral) * 10) / 10,
    journalBoost: Math.round((avgEnergyJournal - avgEnergyGeneral) * 10) / 10,
    combinedBoost: Math.round((avgEnergyBoth - avgEnergyGeneral) * 10) / 10,
  };
}

function getMostFrequent<T>(arr: T[]): T {
  const frequency: Record<string, number> = {};
  arr.forEach((item) => {
    const key = String(item);
    frequency[key] = (frequency[key] || 0) + 1;
  });

  return Object.entries(frequency).sort(([, a], [, b]) => b - a)[0][0] as T;
}

function generatePatternInsights(patterns: any[]): string[] {
  const insights: string[] = [];

  patterns.forEach((pattern) => {
    const { personalDay, dominantMood, averageEnergy } = pattern;

    if (averageEnergy >= 8) {
      insights.push(
        `Seus dias pessoais ${personalDay} são especialmente energéticos (${averageEnergy}/10)`,
      );
    }

    if (averageEnergy <= 4) {
      insights.push(
        `Dias pessoais ${personalDay} tendem a ser mais introspectivos (energia ${averageEnergy}/10)`,
      );
    }

    if (dominantMood === "PEACEFUL") {
      insights.push(
        `Você encontra mais paz nos seus dias pessoais ${personalDay}`,
      );
    }

    if (dominantMood === "ANXIOUS") {
      insights.push(
        `Dias pessoais ${personalDay} podem trazer mais ansiedade - pratique autocuidado`,
      );
    }

    if (dominantMood === "REFLECTIVE") {
      insights.push(
        `Seus dias ${personalDay} são naturalmente reflexivos - aproveite para meditação`,
      );
    }
  });

  return insights.slice(0, 3); // Top 3 insights
}

async function generateEmotionalInsights(userId: string, personalDay: number) {
  try {
    // Buscar histórico recente do usuário
    const recentCycles = await prisma.emotionalCycle.findMany({
      where: {
        userId,
        personalDay,
        recordedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
        },
      },
      orderBy: { recordedAt: "desc" },
      take: 10,
    });

    if (recentCycles.length < 3) return null;

    // Analisar padrões
    const moods = recentCycles.map((c) => c.mood);
    const energies = recentCycles.map((c) => c.energy);
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;

    const moodFrequency: Record<string, number> = {};
    moods.forEach((mood) => {
      moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
    });

    const dominantMood = Object.entries(moodFrequency).sort(
      ([, a], [, b]) => b - a,
    )[0][0];

    // Gerar padrão e recomendação
    const pattern = `Nos seus dias pessoais ${personalDay}, você tende a se sentir ${translateMood(dominantMood)} com energia média de ${avgEnergy.toFixed(1)}/10`;

    const recommendations = {
      ANXIOUS:
        "Pratique respiração profunda e meditação nos dias " + personalDay,
      PEACEFUL:
        "Aproveite a serenidade dos dias " +
        personalDay +
        " para práticas espirituais",
      ENERGETIC:
        "Use a alta energia dos dias " + personalDay + " para manifestação",
      REFLECTIVE: "Dedique tempo extra para journaling nos dias " + personalDay,
      MELANCHOLIC:
        "Seja gentil consigo mesmo nos dias " +
        personalDay +
        " - é natural sentir-se introspectivo",
      GRATEFUL:
        "Continue cultivando gratidão nos seus dias " +
        personalDay +
        " - isso amplifica sua vibração",
      INSPIRED:
        "Capture suas inspirações nos dias " +
        personalDay +
        " - elas são mensagens da alma",
      CONFUSED:
        "Confusão nos dias " +
        personalDay +
        " é normal - confie que a clareza virá",
      BALANCED:
        "Mantenha o equilíbrio dos dias " +
        personalDay +
        " como âncora para outros dias",
    };

    return {
      pattern,
      recommendation:
        recommendations[dominantMood as keyof typeof recommendations] ||
        "Continue observando seus padrões com compaixão",
    };
  } catch (error) {
    console.error("Erro ao gerar insights emocionais:", error);
    return null;
  }
}

function translateMood(mood: string): string {
  const translations = {
    PEACEFUL: "em paz",
    ANXIOUS: "ansioso(a)",
    GRATEFUL: "grato(a)",
    REFLECTIVE: "reflexivo(a)",
    ENERGETIC: "energético(a)",
    MELANCHOLIC: "melancólico(a)",
    INSPIRED: "inspirado(a)",
    CONFUSED: "confuso(a)",
    BALANCED: "equilibrado(a)",
  };
  return translations[mood as keyof typeof translations] || mood.toLowerCase();
}
