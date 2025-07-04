import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar badges do usuário (temporariamente retornando array vazio até o modelo ser criado)
    const userBadges: never[] = []; // TODO: Implementar modelo UserBadge no Prisma
    // const userBadges = await prisma.userBadge.findMany({
    //   where: { userId },
    //   orderBy: { earnedAt: 'desc' }
    // });

    // Definir todas as badges disponíveis
    const allBadges = [
      {
        id: 'GUARDIAN_CONSTANCY',
        name: 'Guardião da Constância',
        description: '7 meditações seguidas',
        icon: '🛡️',
        color: 'from-purple-500 to-violet-600',
        rarity: 'comum'
      },
      {
        id: 'SOUL_SCRIBE',
        name: 'Escriba da Alma',
        description: '5 registros no Diário',
        icon: '📜',
        color: 'from-blue-500 to-indigo-600',
        rarity: 'comum'
      },
      {
        id: 'SILENCE_DISCIPLE',
        name: 'Discípulo do Silêncio',
        description: 'Uso do modo ritual',
        icon: '🤫',
        color: 'from-indigo-500 to-purple-600',
        rarity: 'raro'
      },
      {
        id: 'ORACLE_SEEKER',
        name: 'Buscador do Oráculo',
        description: '10 consultas ao oráculo',
        icon: '🔮',
        color: 'from-yellow-500 to-amber-600',
        rarity: 'comum'
      },
      {
        id: 'RITUAL_MASTER',
        name: 'Mestre dos Rituais',
        description: '3 rituais completos',
        icon: '🕯️',
        color: 'from-red-500 to-pink-600',
        rarity: 'épico'
      },
      {
        id: 'CYCLE_READER',
        name: 'Leitor de Ciclos',
        description: 'Entendimento dos padrões emocionais',
        icon: '🌙',
        color: 'from-gray-500 to-slate-600',
        rarity: 'raro'
      },
      {
        id: 'FUTURE_KEEPER',
        name: 'Guardião do Futuro',
        description: 'Recebeu uma Carta do Futuro',
        icon: '💌',
        color: 'from-green-500 to-emerald-600',
        rarity: 'lendário'
      }
    ];

    // Marcar badges conquistadas
    const badgesWithStatus = allBadges.map(badge => {
      const earned = userBadges.find(ub => ub.badge === badge.id);
      return {
        ...badge,
        earned: !!earned,
        earnedAt: earned?.earnedAt,
        earnedFor: earned?.earnedFor
      };
    });

    // Verificar e conceder novas badges
    await checkAndGrantBadges(userId);

    return NextResponse.json({
      badges: badgesWithStatus,
      totalEarned: userBadges.length,
      totalAvailable: allBadges.length
    });
  } catch (error) {
    console.error('Erro ao buscar badges:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const schema = z.object({
      userId: z.string(),
      badge: z.enum(['GUARDIAN_CONSTANCY', 'SOUL_SCRIBE', 'SILENCE_DISCIPLE', 'ORACLE_SEEKER', 'RITUAL_MASTER', 'CYCLE_READER', 'FUTURE_KEEPER']),
      earnedFor: z.string().optional()
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { userId, badge, earnedFor } = validation.data;

    // Verificar se já possui a badge
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badge: {
          userId,
          badge
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Badge já conquistada' }, { status: 400 });
    }

    // Criar badge
    const newBadge = await prisma.userBadge.create({
      data: {
        userId,
        badge,
        earnedFor
      }
    });

    return NextResponse.json(newBadge, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar badge:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function checkAndGrantBadges(userId: string) {
  try {
    // Contar atividades do usuário
    const [
      journalCount,
      oracleCount,
      challengeCount,
      emotionalCycleCount,
      futureLetterCount
    ] = await Promise.all([
      prisma.journalEntry.count({ where: { userId } }),
      prisma.oracleMessage.count({ where: { userId } }),
      prisma.userChallenge.count({ where: { userId, isCompleted: true } }),
      prisma.emotionalCycle.count({ where: { userId } }),
      prisma.futureLetter.count({ where: { userId } })
    ]);

    const badgesToGrant = [];

    // Escriba da Alma (5 registros no diário)
    if (journalCount >= 5) {
      badgesToGrant.push({
        badge: 'SOUL_SCRIBE',
        earnedFor: `${journalCount} registros no Diário da Alma`
      });
    }

    // Buscador do Oráculo (10 consultas)
    if (oracleCount >= 10) {
      badgesToGrant.push({
        badge: 'ORACLE_SEEKER',
        earnedFor: `${oracleCount} consultas ao oráculo`
      });
    }

    // Leitor de Ciclos (análise de padrões)
    if (emotionalCycleCount >= 7) {
      badgesToGrant.push({
        badge: 'CYCLE_READER',
        earnedFor: 'Mapeamento de ciclos emocionais'
      });
    }

    // Guardião do Futuro (recebeu carta)
    if (futureLetterCount >= 1) {
      badgesToGrant.push({
        badge: 'FUTURE_KEEPER',
        earnedFor: 'Recebeu uma Carta do Futuro'
      });
    }

    // Conceder badges que ainda não possui
    for (const badgeData of badgesToGrant) {
      const existing = await prisma.userBadge.findUnique({
        where: {
          userId_badge: {
            userId,
            badge: badgeData.badge as any
          }
        }
      });

      if (!existing) {
        await prisma.userBadge.create({
          data: {
            userId,
            badge: badgeData.badge as any,
            earnedFor: badgeData.earnedFor
          }
        });
      }
    }
  } catch (error) {
    console.error('Erro ao verificar badges:', error);
  }
}
