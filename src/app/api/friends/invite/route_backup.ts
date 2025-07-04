import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createInviteSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  message: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = createInviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // TODO: Implementar sistema de convites quando modelo adequado estiver disponível
    return NextResponse.json({
      success: false,
      message: 'Sistema de convites ainda não implementado. Modelo Invite não encontrado no Prisma schema.',
      suggestedAlternative: 'Use o modelo Friendship para relações entre usuários'
    }, { status: 501 });

  } catch (error: unknown) {
    console.error('Erro ao criar convite:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // TODO: Implementar busca de convites quando modelo estiver disponível
    return NextResponse.json({
      invites: [],
      pendingInvites: 0,
      sentInvites: 0
    });

  } catch (error: unknown) {
    console.error('Erro ao buscar convites:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
