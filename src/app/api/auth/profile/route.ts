import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Função para verificar JWT
function verifyJWT(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
  } catch {
    return null;
  }
}

// GET - Obter perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação necessário' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        birthDate: true,
        email: true,
        bio: true,
        profileImage: true,
        numerologyData: true,
        isPremium: true,
        credits: true,
        createdAt: true,
        hasSeenIntro: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação necessário' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { name, birthDate, bio, profileImage } = body;

    // Validações
    if (name && name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 });
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      updateData.name = name?.trim() || null;
    }

    if (birthDate !== undefined) {
      updateData.birthDate = new Date(birthDate);
    }

    if (bio !== undefined) {
      updateData.bio = bio?.trim() || null;
    }

    if (profileImage !== undefined) {
      updateData.profileImage = profileImage?.trim() || null;
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        birthDate: true,
        email: true,
        bio: true,
        profileImage: true,
        numerologyData: true,
        isPremium: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
        hasSeenIntro: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
