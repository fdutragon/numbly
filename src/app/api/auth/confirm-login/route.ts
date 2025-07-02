import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, deviceId } = await request.json();

    if (!token || !deviceId) {
      return NextResponse.json({ error: 'Token e deviceId são obrigatórios' }, { status: 400 });
    }

    // Verificar se é um token de recuperação válido
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    if (payload.type !== 'recovery') {
      return NextResponse.json({ error: 'Tipo de token inválido' }, { status: 401 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        birthDate: true,
        numerologyData: true,
        isPremium: true,
        credits: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Gerar novo token de autenticação
    const authToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        type: 'auth'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Registrar o dispositivo se não existir
    await prisma.userDevice.upsert({
      where: { deviceId },
      update: { 
        lastSeen: new Date(),
        isActive: true
      },
      create: {
        userId: user.id,
        deviceId,
        deviceName: `Dispositivo de Recuperação`,
        platform: 'web',
        lastSeen: new Date(),
        isActive: true
      }
    });

    // Configurar cookie de autenticação
    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        birthDate: user.birthDate,
        numerologyData: user.numerologyData,
        isPremium: user.isPremium,
        credits: user.credits
      }
    });

    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    return response;

  } catch (error) {
    console.error('Erro na confirmação de login:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
