import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import {
  processUserMessage,
  updateClaraState,
  createInitialClaraState,
} from '@/lib/clara-ai-engine';
import { aiTools } from '@/lib/ai-tools';
import { type ClaraState } from '@/lib/chat-store';

// Simples storage em memória para contexto por threadId
const threadContextStore = new Map<string, ClaraState>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = z.object({
      message: z.string(), // só a mensagem do usuário
      threadId: z.string().optional(),
    });
    const { message, threadId } = schema.parse(body);

    let claraState: ClaraState;
    if (threadId && threadContextStore.has(threadId)) {
      claraState = threadContextStore.get(threadId)!;
    } else {
      claraState = createInitialClaraState();
    }

    // Atualiza o histórico com a nova mensagem
    const updatedHistory = [
      ...(claraState.conversationHistory || []),
      { role: 'user' as const, content: message, timestamp: Date.now() },
    ];
    const currentState: ClaraState = {
      ...claraState,
      conversationHistory: updatedHistory,
      lastInteraction: Date.now(),
    };

    // Processa a mensagem usando TODO o contexto
    const claraResponse = await processUserMessage(message, currentState);

    // Atualiza o estado da Clara, mantendo o histórico
    const updatedState: ClaraState = {
      ...updateClaraState(currentState, message, claraResponse),
      conversationHistory: [
        ...updatedHistory,
        { role: 'assistant' as const, content: claraResponse.content, timestamp: Date.now() },
      ],
      lastInteraction: Date.now(),
    };

    // Persiste o contexto atualizado
    if (threadId) {
      threadContextStore.set(threadId, updatedState);
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        const wordCount = claraResponse.content.split(' ').length;
        const thinkingTime = Math.min(500 + wordCount * 20, 2000);
        setTimeout(() => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                content: claraResponse.content,
                shouldShowPaymentModal: claraResponse.shouldShowPaymentModal,
                emailSent: claraResponse.emailSent,
                intention: claraResponse.intention,
                confidence: claraResponse.confidence,
                nextAction: claraResponse.nextAction,
                reasoning: claraResponse.reasoning,
                claraState: updatedState,
                threadId,
              })}\n\n`
            )
          );
          controller.close();
        }, thinkingTime);
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Clara chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
