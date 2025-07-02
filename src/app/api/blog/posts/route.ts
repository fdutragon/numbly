import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const blogPostSchema = z.object({
  type: z.enum(['DAILY_MEDITATION', 'ARTICLE', 'ORACLE_MESSAGE', 'RITUAL_GUIDE', 'NUMEROLOGY_INSIGHT']).optional(),
  personalDay: z.number().min(1).max(9).optional(),
  limit: z.number().min(1).max(50).default(20)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      type: searchParams.get('type'),
      personalDay: searchParams.get('personalDay') ? parseInt(searchParams.get('personalDay')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    };

    const validation = blogPostSchema.safeParse(query);
    if (!validation.success) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const { type, personalDay, limit } = validation.data;

    const where: any = {
      isPublished: true
    };

    if (type) {
      where.type = type;
    }

    if (personalDay) {
      where.personalDay = personalDay;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit,
      include: {
        _count: {
          select: {
            aiComments: true,
            journalEntries: true
          }
        }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const postSchema = z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      excerpt: z.string().optional(),
      type: z.enum(['DAILY_MEDITATION', 'ARTICLE', 'ORACLE_MESSAGE', 'RITUAL_GUIDE', 'NUMEROLOGY_INSIGHT']),
      personalDay: z.number().min(1).max(9).optional(),
      lunarPhase: z.string().optional(),
      numerologyFocus: z.string().optional(),
      cosmicEvent: z.string().optional(),
      meditationAudio: z.string().optional(),
      meditationDuration: z.number().optional(),
      meditationScript: z.string().optional(),
      tags: z.array(z.string()).default([]),
      category: z.string().optional(),
      isPublished: z.boolean().default(true)
    });

    const validation = postSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: validation.data
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
