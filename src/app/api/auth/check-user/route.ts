import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        exists: false,
        hasPush: false 
      });
    }

    // Verificar se tem subscription push ativa
    const pushSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: user.id,
        isActive: true
      }
    });

    return NextResponse.json({
      exists: true,
      hasPush: !!pushSubscription,
      userName: user.name
    });

  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
