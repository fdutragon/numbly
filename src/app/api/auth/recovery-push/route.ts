import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { nome, dataNascimento } = await req.json();
    
    if (!nome || !dataNascimento) {
      return NextResponse.json({
        success: false,
        error: 'Nome e data de nascimento são obrigatórios'
      }, { status: 400 });
    }

    // Converter data
    const birthDate = new Date(dataNascimento);
    
    // Buscar usuário pelos dados fornecidos
    const user = await db.user.findFirst({
      where: {
        name: nome,
        birthDate: birthDate
      }
    });

    if (!user) {
      // Por segurança, não revelamos se o usuário existe ou não
      return NextResponse.json({
        success: true,
        message: 'Se os dados estiverem corretos, você receberá uma notificação'
      });
    }

    // Gerar token de recuperação
    const recoveryToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);

    // Salvar token temporário no banco (expira em 15 minutos)
    await db.user.update({
      where: { id: user.id },
      data: {
        // Aqui você pode adicionar um campo recoveryToken se necessário
        updatedAt: new Date()
      }
    });

    // Buscar dispositivos do usuário (se tiver relação)
    const pushSubscriptions = await db.pushSubscription.findMany({
      where: {
        isActive: true
        // Aqui você adicionaria: userId: user.id se tivesse a relação
      },
      take: 5 // Limitar para evitar spam
    });

    if (pushSubscriptions.length > 0) {
      // Enviar notificação de recuperação
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'AUTH_RECOVERY',
          title: '🔑 Recuperação de Acesso',
          body: `Olá ${nome}! Toque aqui para recuperar o acesso à sua conta Numbly Life.`,
          data: {
            recoveryToken: recoveryToken,
            userId: user.id,
            userName: nome,
            timestamp: Date.now()
          },
          requireInteraction: true,
          actions: [
            { action: 'recover', title: '🚪 Acessar Conta' }
          ]
        })
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Se os dados estiverem corretos, você receberá uma notificação'
    });

  } catch (error) {
    console.error('Erro na recuperação via push:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
