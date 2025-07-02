import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const journalSchema = z.object({
  userId: z.string(),
  content: z.string().min(1),
  mood: z.enum(['PEACEFUL', 'ANXIOUS', 'GRATEFUL', 'REFLECTIVE', 'ENERGETIC', 'MELANCHOLIC', 'INSPIRED', 'CONFUSED', 'BALANCED']).optional(),
  blogPostId: z.string().optional(),
  isPrivate: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = journalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    const { userId, content, mood, blogPostId, isPrivate } = validation.data;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, birthDate: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Calcular dia pessoal
    const today = new Date();
    const birthDate = new Date(user.birthDate);
    const personalDay = calculatePersonalDay(birthDate, today);

    // Criar entrada do diário
    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId,
        content,
        mood,
        blogPostId,
        personalDay,
        isPrivate
      }
    });

    // Gerar insights da IA após alguns segundos (async)
    setTimeout(async () => {
      try {
        const aiInsights = await generateAIInsights(content, mood, personalDay);
        await prisma.journalEntry.update({
          where: { id: journalEntry.id },
          data: { aiInsights }
        });
      } catch (error) {
        console.error('Erro ao gerar insights IA:', error);
      }
    }, 3000);

    return NextResponse.json(journalEntry, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar entrada do diário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const personalDay = searchParams.get('personalDay');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const where: any = {
      userId,
      isPrivate: true // Só mostrar entradas privadas para o próprio usuário
    };

    if (personalDay) {
      where.personalDay = parseInt(personalDay);
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        blogPost: {
          select: {
            title: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Erro ao buscar entradas do diário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para calcular dia pessoal
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
    num = num.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return num;
}

// Função para gerar insights da IA
async function generateAIInsights(content: string, mood?: string, personalDay?: number): Promise<string> {
  // Análise de padrões baseada no conteúdo e contexto
  const insights = [];
  
  // Análise de sentimentos
  const positiveWords = ['grato', 'feliz', 'amor', 'paz', 'alegria', 'esperança', 'luz'];
  const negativeWords = ['triste', 'ansioso', 'medo', 'raiva', 'frustrado', 'preocupado'];
  
  const contentLower = content.toLowerCase();
  const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
  
  if (positiveCount > negativeCount) {
    insights.push('Sua energia está em alta vibração ✨');
  } else if (negativeCount > positiveCount) {
    insights.push('Momento de acolher e transformar emoções densas 🌱');
  }
  
  // Análise do dia pessoal
  if (personalDay) {
    const dayInsights = {
      1: 'Dia de novos começos e liderança',
      2: 'Foco na cooperação e sensibilidade',
      3: 'Criatividade e expressão em destaque',
      4: 'Organização e trabalho duro',
      5: 'Aventura e mudanças',
      6: 'Amor e responsabilidade familiar',
      7: 'Introspecção e busca espiritual',
      8: 'Ambição e conquistas materiais',
      9: 'Conclusões e sabedoria universal'
    };
    
    insights.push(`Seu dia pessoal ${personalDay}: ${dayInsights[personalDay as keyof typeof dayInsights]}`);
  }
  
  // Análise do humor
  if (mood) {
    const moodInsights = {
      PEACEFUL: 'Sua paz interior é um farol para outros',
      ANXIOUS: 'A ansiedade é um chamado para se conectar com o presente',
      GRATEFUL: 'Gratidão é o portal para abundância',
      REFLECTIVE: 'A reflexão é o caminho da sabedoria',
      ENERGETIC: 'Use essa energia para manifestar seus sonhos',
      MELANCHOLIC: 'A melancolia é parte da jornada da alma',
      INSPIRED: 'Inspiração é o sussurro divino',
      CONFUSED: 'Confusão precede a clareza',
      BALANCED: 'Equilíbrio é a chave da maestria'
    };
    
    insights.push(moodInsights[mood as keyof typeof moodInsights]);
  }
  
  return insights.join(' • ');
}
