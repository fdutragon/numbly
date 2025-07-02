import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário não fornecido' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Simular salvamento - em produção, usar Prisma
    console.log('Dados do perfil recebidos:', {
      userId,
      ...data
    });

    // Simular verificação se nome/data mudaram
    const { nome, dataNascimento } = data;
    const mapaRecalculado = nome || dataNascimento; // Simular mudança

    return NextResponse.json({
      success: true,
      data: {
        user: data,
        mapaRecalculado
      },
      message: mapaRecalculado 
        ? '✨ Perfil atualizado e mapa numerológico recalculado!' 
        : 'Perfil atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
