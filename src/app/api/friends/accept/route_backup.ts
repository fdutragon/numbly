import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  return new Response(
    JSON.stringify({ error: 'Not implemented: friends/accept' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Código do convite é obrigatório' }, { status: 400 });
    }

    // TODO: Implementar busca de convites quando modelo estiver disponível
    return NextResponse.json({
      success: false,
      message: 'Sistema de convites ainda não implementado',
      code
    }, { status: 501 });

  } catch (error: unknown) {
    console.error('Erro ao buscar convite:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
