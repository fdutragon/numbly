import { NextResponse } from 'next/server';
import { processMessage } from '@/lib/donna-ai-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      );
    }

    const response = await processMessage(body.message);
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    console.error('[Chat API Error]:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar mensagem. Tente novamente.' },
      { status: 500 }
    );
  }
}
