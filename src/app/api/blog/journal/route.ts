import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const journalEntrySchema = z.object({
  userId: z.string(),
  content: z.string(),
  mood: z.enum(['PEACEFUL', 'ANXIOUS', 'GRATEFUL', 'REFLECTIVE', 'ENERGETIC', 'MELANCHOLIC', 'INSPIRED', 'CONFUSED', 'BALANCED']).optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = journalEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    // TODO: Implementar sistema de diário quando modelo JournalEntry estiver disponível
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sistema de diário ainda não implementado',
        message: 'Modelo JournalEntry não encontrado no Prisma schema'
      },
      { status: 501 }
    );

  } catch (error: unknown) {
    console.error('Erro ao criar entrada do diário:', error);
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

    // TODO: Implementar busca de entradas do diário quando modelo estiver disponível
    return NextResponse.json({
      entries: [],
      totalEntries: 0,
      streak: 0,
      insights: ['Sistema de diário em desenvolvimento']
    });

  } catch (error: unknown) {
    console.error('Erro ao buscar entradas do diário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
