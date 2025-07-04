import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const oracleQuerySchema = z.object({
  userId: z.string(),
  question: z.string().min(1),
  context: z.object({
    personalDay: z.number().optional(),
    lunarPhase: z.string().optional(),
    mood: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = oracleQuerySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    // TODO: Implementar sistema de oráculo quando modelo OracleMessage estiver disponível
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sistema de oráculo ainda não implementado',
        message: 'Modelo OracleMessage não encontrado no Prisma schema'
      },
      { status: 501 }
    );

  } catch (error: unknown) {
    console.error('Erro ao consultar oráculo:', error);
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

    // TODO: Implementar busca de mensagens do oráculo quando modelo estiver disponível
    return NextResponse.json({
      messages: [],
      totalConsultations: 0,
      lastConsultation: null,
      insights: ['Sistema de oráculo em desenvolvimento']
    });

  } catch (error: unknown) {
    console.error('Erro ao buscar mensagens do oráculo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
