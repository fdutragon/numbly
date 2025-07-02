import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const challengeParticipationSchema = z.object({
  userId: z.string(),
  challengeId: z.string(),
  day: z.number().min(1).max(7)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Buscar desafios ativos
    const now = new Date();
    const challenges = await prisma.weeklyChallenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        participants: userId ? {
          where: { userId }
        } : false,
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('Erro ao buscar desafios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'join') {
      return handleJoinChallenge(body);
    } else if (action === 'complete_day') {
      return handleCompleteDayChallenge(body);
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na API de desafios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function handleJoinChallenge(body: any) {
  const schema = z.object({
    userId: z.string(),
    challengeId: z.string()
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { userId, challengeId } = validation.data;

  // Verificar se o usuário já está participando
  const existing = await prisma.userChallenge.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId
      }
    }
  });

  if (existing) {
    return NextResponse.json({ error: 'Usuário já está participando deste desafio' }, { status: 400 });
  }

  // Criar participação
  const participation = await prisma.userChallenge.create({
    data: {
      userId,
      challengeId,
      dailyProgress: {}
    },
    include: {
      challenge: true
    }
  });

  return NextResponse.json(participation, { status: 201 });
}

async function handleCompleteDayChallenge(body: any) {
  const validation = challengeParticipationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { userId, challengeId, day } = validation.data;

  // Buscar participação
  const participation = await prisma.userChallenge.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId
      }
    },
    include: {
      challenge: true
    }
  });

  if (!participation) {
    return NextResponse.json({ error: 'Participação não encontrada' }, { status: 404 });
  }

  // Atualizar progresso
  const currentProgress = participation.dailyProgress as Record<string, boolean>;
  currentProgress[`day${day}`] = true;

  const completedDays = Object.values(currentProgress).filter(Boolean).length;
  const isCompleted = completedDays >= 7;

  // Atualizar no banco
  const updatedParticipation = await prisma.userChallenge.update({
    where: {
      userId_challengeId: {
        userId,
        challengeId
      }
    },
    data: {
      dailyProgress: currentProgress,
      progress: completedDays,
      isCompleted,
      completedAt: isCompleted ? new Date() : null
    }
  });

  // Se completou o desafio, dar recompensas
  if (isCompleted && !participation.badgeEarned) {
    await giveRewards(userId, participation.challenge);
    
    await prisma.userChallenge.update({
      where: {
        userId_challengeId: {
          userId,
          challengeId
        }
      },
      data: {
        badgeEarned: true,
        creditsEarned: participation.challenge.creditsReward
      }
    });
  }

  return NextResponse.json(updatedParticipation);
}

async function giveRewards(userId: string, challenge: any) {
  // Dar badge se houver
  if (challenge.badgeReward) {
    await prisma.userBadge.create({
      data: {
        userId,
        badge: challenge.badgeReward,
        earnedFor: `Desafio: ${challenge.title}`,
        challenge: challenge.title
      }
    });
  }

  // Dar créditos se houver
  if (challenge.creditsReward > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: challenge.creditsReward
        }
      }
    });
  }
}
