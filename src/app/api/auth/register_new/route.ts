import { NextRequest, NextResponse } from 'next/server';
import { gerarMapaNumerologico } from '@/lib/numerologia';

export async function POST(request: NextRequest) {
  try {
    const { nome, dataNascimento, numeroDestino, pushEnabled } = await request.json();

    // Validações básicas
    if (!nome || !dataNascimento || !numeroDestino) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Simular criação de usuário
    const user = {
      id: Date.now().toString(),
      nome,
      dataNascimento,
      numeroDestino,
      pushEnabled: pushEnabled || false,
      plano: 'gratuito' as const,
      created: new Date().toISOString()
    };

    // Gerar mapa numerológico
    const mapa = gerarMapaNumerologico(nome, dataNascimento);

    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      user,
      mapa,
      message: 'Usuário registrado com sucesso'
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
