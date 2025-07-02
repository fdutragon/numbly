import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const createInviteSchema = z.object({
  invitedName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  relationshipType: z.enum(['FRIEND', 'FAMILY', 'ROMANTIC', 'BUSINESS', 'CRUSH', 'PET', 'OTHER']),
  customMessage: z.string().optional(),
  expiresInDays: z.number().min(0).max(365).optional().default(7)
});

// Função para gerar código único de convite
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST - Criar convite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createInviteSchema.parse(body);
    
    // TODO: Pegar userId do contexto de auth (temporariamente usando header)
    const userId = request.headers.get('x-user-id') || 'temp-user-id';

    // Gerar código único
    let code = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const existing = await prisma.invite.findUnique({
        where: { code }
      });

      if (!existing) {
        isUnique = true;
      } else {
        code = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao gerar código único'
      }, { status: 500 });
    }

    // Calcular data de expiração
    const expiresAt = validatedData.expiresInDays > 0 
      ? new Date(Date.now() + validatedData.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Criar convite
    const invite = await prisma.invite.create({
      data: {
        code,
        senderId: userId,
        invitedName: validatedData.invitedName,
        relationshipType: validatedData.relationshipType,
        customMessage: validatedData.customMessage,
        expiresAt,
        status: 'PENDING'
      }
    });

    // Criar mapa de compatibilidade (inicialmente vazio)
    await prisma.compatibilityMap.create({
      data: {
        inviteId: invite.id,
        initiatorId: userId,
        relationshipType: validatedData.relationshipType,
        status: 'WAITING',
        initiatorData: {} // Será preenchido com dados do usuário
      }
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/convite/${code}`;

    return NextResponse.json({
      success: true,
      data: {
        invite: {
          ...invite,
          inviteUrl,
          isRevealed: false
        }
      }
    });

  } catch (error) {
    console.error('Erro ao criar convite:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// GET - Listar convites do usuário
export async function GET(request: NextRequest) {
  try {
    // TODO: Pegar userId do contexto de auth (temporariamente usando header)
    const userId = request.headers.get('x-user-id') || 'temp-user-id';

    const invites = await prisma.invite.findMany({
      where: {
        senderId: userId
      },
      include: {
        compatibilityMap: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatar dados para o frontend
    const formattedInvites = invites.map(invite => ({
      id: invite.id,
      code: invite.code,
      invitedName: invite.invitedName,
      relationshipType: invite.relationshipType,
      status: invite.status,
      clicks: invite.clicks,
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt?.toISOString(),
      isRevealed: (invite as any).compatibilityMap?.status === 'REVEALED' || false,
      inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/convite/${invite.code}`,
      customMessage: invite.customMessage
    }));

    return NextResponse.json({
      success: true,
      data: {
        invites: formattedInvites
      }
    });

  } catch (error) {
    console.error('Erro ao listar convites:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
