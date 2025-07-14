import { NextResponse } from 'next/server';
import { processMessage } from '@/lib/donna-ai-engine';

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  
  try {
    const body = await req.json();
    
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      );
    }

    // Extrai threadId e contexto do corpo da requisição
    const { message, threadId, claraState } = body;
    
    console.log('🚀 Chat API received:', { 
      message: message.substring(0, 50) + '...', 
      threadId,
      hasContext: !!claraState 
    });

    // Create a TransformStream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process message with context
    processMessage(message, threadId, claraState).then(async (response) => {
      console.log('🤖 Engine response:', {
        contentPreview: response.content.substring(0, 100),
        funnelStage: response.funnelStage,
        shouldShowPaymentModal: response.shouldShowPaymentModal
      });
      
      // Send the content chunk
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ content: response.content })}\n\n`)
      );
      
      // Send final chunk with done flag and all response data
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ 
          done: true,
          shouldShowPaymentModal: response.shouldShowPaymentModal,
          funnelStage: response.funnelStage,
          nextAction: response.nextAction,
          leadData: response.leadData,
          claraState: {
            currentStage: response.funnelStage,
            leadData: response.leadData,
            lastUpdate: Date.now()
          }
        })}\n\n`)
      );
      
      await writer.close();
    }).catch(async (error) => {
      console.error('[Chat API Error]:', error);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ 
          content: 'Erro ao processar mensagem. Tente novamente.',
          done: true 
        })}\n\n`)
      );
      await writer.close();
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
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
