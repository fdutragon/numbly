import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { authMiddleware, getAuthUser, type AuthenticatedRequest } from '@/lib/security/auth-middleware';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Se userId foi fornecido, use-o diretamente (para compatibilidade)
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          birthDate: true,
          numerologyData: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user,
      });
    }

    // Obter usuário autenticado via token JWT
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        birthDate: true,
        numerologyData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error('Erro na rota /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handlePut(request: AuthenticatedRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, birthDate } = body;

    // Validar dados
    if (!name || !birthDate) {
      return NextResponse.json(
        { error: 'Nome e data de nascimento são obrigatórios' },
        { status: 400 }
      );
    }

    // Atualizar usuário
    const updatedUser = await db.user.update({
      where: { id: authUser.userId },
      data: {
        name: name.trim(),
        birthDate: new Date(birthDate).toISOString(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        birthDate: true,
        numerologyData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Perfil atualizado com sucesso',
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar handlers com middleware
export const GET = authMiddleware.protected(handleGet);
export const PUT = authMiddleware.protected(handlePut);
