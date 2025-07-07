import { NextRequest, NextResponse } from 'next/server';
import { 
  processUserMessage, 
  updateClaraState, 
  createInitialClaraState,
  type ClaraState 
} from '@/lib/clara-ai-engine';

export async function POST(request: NextRequest) {
  try {
    const { messages, claraState } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Get user input
    const lastUserMessage = messages[messages.length - 1];
    const userInput = lastUserMessage?.content || '';
    
    // Initialize or get Clara state
    const currentState: ClaraState = claraState || createInitialClaraState();
    
    // Process message with Clara AI Engine
    const claraResponse = await processUserMessage(userInput, currentState);
    
    // Update Clara state
    const updatedState = updateClaraState(currentState, userInput, claraResponse);

    // Create streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        // Simulate thinking time based on response complexity
        const wordCount = claraResponse.content.split(' ').length;
        const thinkingTime = Math.min(500 + (wordCount * 20), 2000); // 0.5s to 2s max
        
        setTimeout(() => {
          // Send complete response
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              done: true,
              content: claraResponse.content,
              shouldShowPaymentModal: claraResponse.shouldShowPaymentModal,
              emailSent: claraResponse.emailSent,
              intention: claraResponse.intention,
              confidence: claraResponse.confidence,
              nextAction: claraResponse.nextAction,
              reasoning: claraResponse.reasoning,
              claraState: updatedState,
            })}\n\n`)
          );
          controller.close();
        }, thinkingTime);
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Clara chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}