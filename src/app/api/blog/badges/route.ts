import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // TODO: Implementar sistema de badges quando os modelos estiverem prontos
    // Por enquanto, retornamos as badges disponíveis mas nenhuma conquistada
    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      earned: false,
      earnedAt: null,
      earnedFor: null
    }));

    return NextResponse.json({
      badges: badgesWithStatus,
      totalEarned: 0,
      totalAvailable: allBadges.length
    });

  } catch (error: unknown) {
    console.error('Erro ao buscar badges:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Implementar validação com zod quando necessário
    // TODO: Implementar criação de badges quando modelos estiverem prontos
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sistema de badges ainda não implementado' 
      },
      { status: 501 }
    );

  } catch (error: unknown) {
    console.error('Erro ao criar badge:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
