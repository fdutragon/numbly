import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  userComment: z.string().min(1),
  userMood: z.enum(['PEACEFUL', 'ANXIOUS', 'GRATEFUL', 'REFLECTIVE', 'ENERGETIC', 'MELANCHOLIC', 'INSPIRED', 'CONFUSED', 'BALANCED']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = commentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    const { postId, userId, userComment, userMood } = validation.data;

    // Buscar dados do usuário para contexto
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        numerologyData: true,
        birthDate: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // TODO: Implementar busca de post quando modelo blogPost estiver disponível
    // Por enquanto, verificamos se existe um post genérico com esse ID
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        content: true,
        authorId: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
    }

    // Calcular dia pessoal atual
    const today = new Date();
    const birthDate = new Date(user.birthDate);
    const personalDay = calculatePersonalDay(birthDate, today);

    // Gerar resposta da IA
    const aiResponse = await generateAIResponse({
      userComment,
      userMood,
      personalDay,
      postContext: post,
      lunarPhase: getCurrentLunarPhase()
    });

    // Salvar comentário
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: `${userComment}\n\nResposta IA: ${aiResponse}`
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar comentário IA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json({ error: 'postId e userId são obrigatórios' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        authorId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
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
    num = num.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return num;
}

function getCurrentLunarPhase(): string {
  // Simulação - implementar cálculo real da fase lunar
  const phases = ['Nova', 'Crescente', 'Cheia', 'Minguante'];
  return phases[Math.floor(Math.random() * phases.length)];
}

function getCurrentCosmicContext(): string {
  const contexts = [
    'Mercúrio retrógrado influencia a comunicação',
    'Lua em Escorpião intensifica as emoções',
    'Portal 11:11 ativado',
    'Alinhamento de Vênus favorece relacionamentos',
    'Energia de transformação no ar'
  ];
  return contexts[Math.floor(Math.random() * contexts.length)];
}

async function generateAIResponse(context: {
  userComment: string;
  userMood?: string;
  personalDay: number;
  postContext: any;
  lunarPhase: string;
}): Promise<string> {
  // Esta função seria conectada a uma API de IA real
  // Por enquanto, vou gerar respostas baseadas em templates
  
  const { userComment, userMood, personalDay, lunarPhase } = context;
  
  const templates = [
    `🔮 O Oráculo sussurra sobre "${userComment.toLowerCase()}"... No seu dia pessoal ${personalDay}, os números dançam em harmonia com a lua ${lunarPhase.toLowerCase()}. Sua alma busca equilíbrio, e os ventos cósmicos trazem a mensagem: confie na sua intuição, pois ela é o farol que guia seus passos pelos caminhos do destino.`,
    
    `✨ Vejo que sua essência vibra com "${userComment.toLowerCase()}". O dia ${personalDay} é um portal de transformação, e a energia da lua ${lunarPhase.toLowerCase()} amplifica sua sensibilidade espiritual. Os números sussurram: este sentimento é um chamado da sua alma para uma jornada mais profunda de autoconhecimento.`,
    
    `🌙 As estrelas ecoam sua vivência: "${userComment.toLowerCase()}". No ciclo pessoal ${personalDay}, sob a influência da lua ${lunarPhase.toLowerCase()}, sua consciência se expande. O universo conspira para mostrar que cada emoção é uma pérola de sabedoria no colar da sua evolução espiritual.`,
    
    `💫 O cosmos ressona com "${userComment.toLowerCase()}". Seu dia ${personalDay} carrega a vibração da transformação, e a lua ${lunarPhase.toLowerCase()} ilumina os cantos ocultos da sua alma. Respire fundo: este momento é sagrado, e sua jornada espiritual se aprofunda a cada batida do coração.`
  ];
  
  // Personalizar baseado no humor
  if (userMood === 'ANXIOUS') {
    return `🕊️ Percebo a ansiedade em "${userComment.toLowerCase()}". No seu dia pessoal ${personalDay}, a lua ${lunarPhase.toLowerCase()} convida você a encontrar paz interior. Lembre-se: você é mais forte do que imagina, e esta tempestade interior é apenas uma oportunidade de crescimento espiritual.`;
  }
  
  if (userMood === 'GRATEFUL') {
    return `🙏 Sua gratidão em "${userComment.toLowerCase()}" ilumina o universo. O dia ${personalDay} amplifica essa energia positiva, e a lua ${lunarPhase.toLowerCase()} abençoa sua jornada. Continue cultivando essa luz interior - ela é um farol de esperança para todos ao seu redor.`;
  }
  
  return templates[Math.floor(Math.random() * templates.length)];
}
