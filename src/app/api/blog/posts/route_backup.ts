import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const blogPostSchema = z.object({
  userId: z.string(),
  type: z.enum(['ORACLE', 'JOURNAL', 'MEDITATION', 'REFLECTION']),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = blogPostSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    // TODO: Implementar sistema de posts quando modelo BlogPost estiver disponível
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sistema de posts ainda não implementado',
        message: 'Modelo BlogPost não encontrado no Prisma schema'
      },
      { status: 501 }
    );

  } catch (error: unknown) {
    console.error('Erro ao criar post:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // TODO: Implementar busca de posts quando modelo estiver disponível
    return NextResponse.json({
      posts: [],
      totalPosts: 0,
      types: ['ORACLE', 'JOURNAL', 'MEDITATION', 'REFLECTION'],
      insights: ['Sistema de posts em desenvolvimento']
    });

  } catch (error: unknown) {
    console.error('Erro ao buscar posts:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
