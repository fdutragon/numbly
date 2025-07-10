import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import {
  processUserMessage,
  updateDonnaState,
  createInitialDonnaState,
  type DonnaResponse,
} from '@/lib/donna-ai-engine';
import { type ClaraState } from '@/lib/chat-store';

// Simples storage em memória para contexto por threadId com TTL
interface ThreadContext {
  state: ClaraState;
  lastAccess: number;
  ttl: number;
}

const threadContextStore = new Map<string, ThreadContext>();

// Cleanup de contextos expirados a cada 30 minutos
setInterval(() => {
  const now = Date.now();
  for (const [threadId, context] of threadContextStore.entries()) {
    if (now - context.lastAccess > context.ttl) {
      threadContextStore.delete(threadId);
    }
  }
}, 30 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = z.object({
      message: z.string(), // só a mensagem do usuário
      threadId: z.string().optional(),
    });
    const { message, threadId } = schema.parse(body);

    let claraState: ClaraState;
    const now = Date.now();
    
    if (threadId && threadContextStore.has(threadId)) {
      const context = threadContextStore.get(threadId)!;
      claraState = context.state;
      // Atualizar último acesso
      context.lastAccess = now;
    } else {
      claraState = createInitialDonnaState();
    }

    // Atualiza o histórico com a nova mensagem, mantém apenas as últimas 20 para performance
    const updatedHistory = [
      ...claraState.conversationHistory.slice(-19),
      { role: 'user' as const, content: message, timestamp: now },
    ];
    const currentState: ClaraState = {
      ...claraState,
      conversationHistory: updatedHistory,
      lastInteraction: Date.now(),
    };

    // Processa a mensagem usando TODO o contexto com Donna
    const donnaResponse: DonnaResponse = await processUserMessage(message, currentState);

    // Atualiza o estado da Donna, mantendo o histórico
    const updatedState: ClaraState = {
      ...updateDonnaState(currentState, message, donnaResponse),
      conversationHistory: [
        ...updatedHistory,
        { role: 'assistant' as const, content: donnaResponse.content, timestamp: now },
      ],
      lastInteraction: now,
    };

    // Persiste o contexto atualizado com TTL de 2 horas
    if (threadId) {
      threadContextStore.set(threadId, {
        state: updatedState,
        lastAccess: now,
        ttl: 2 * 60 * 60 * 1000, // 2 horas
      });
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        const wordCount = donnaResponse.content.split(' ').length;
        const thinkingTime = Math.min(300 + wordCount * 15, 1500); // Mais rápida
        
        setTimeout(() => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                content: donnaResponse.content,
                shouldShowPaymentModal: donnaResponse.shouldShowPaymentModal,
                emailSent: donnaResponse.emailSent,
                intention: donnaResponse.intention,
                confidence: donnaResponse.confidence,
                nextAction: donnaResponse.nextAction,
                reasoning: donnaResponse.reasoning,
                userData: donnaResponse.userData,
                metrics: donnaResponse.metrics,
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
