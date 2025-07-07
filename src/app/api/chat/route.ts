import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {
  claraScript,
  getNextStage,
  detectUserSentiment,
  getContextResponse,
  claraContextResponses,
} from '@/lib/clara-script';
import { 
  detectIntention, 
  sendEmailViaResend, 
  generateEmailContent,
  validateEmail,
  intentionResponses,
  type IntentionResult
} from '@/lib/intention-detector';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, claraFlow } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Get user input
    const lastUserMessage = messages[messages.length - 1];
    const userInput = lastUserMessage?.content || '';
    
    // Current Clara flow state 
    const currentStage = claraFlow?.currentStage || 'greeting';
    const hesitationCount = claraFlow?.hesitationCount || 0;
    const noResponseCount = claraFlow?.noResponseCount || 0;
    
    // Detect user intention first
    let intentionResult: IntentionResult | null = null;
    let responseContent = '';
    let nextStage = currentStage;
    let newHesitationCount = hesitationCount;
    let newNoResponseCount = noResponseCount;
    let shouldShowPaymentModal = false;
    let emailSent = false;

    if (userInput.trim() === '') {
      newNoResponseCount++;
      const contextResponse = getContextResponse('neutral', 0, newNoResponseCount);
      responseContent = contextResponse || claraScript[currentStage].content;
    } else {
      newNoResponseCount = 0;
      
      // Detect intention using AI
      intentionResult = await detectIntention(userInput);
      
      // Handle based on intention
      if (intentionResult.intention === 'payment' && intentionResult.confidence > 0.6) {
        shouldShowPaymentModal = true;
        responseContent = intentionResponses.payment.success;
        nextStage = 'closing';
      } else if (intentionResult.intention === 'email' && intentionResult.confidence > 0.7) {
        const emailRecipient = intentionResult.extractedData?.emailRecipient;
        
        if (emailRecipient && validateEmail(emailRecipient)) {
          try {
            const emailContent = generateEmailContent();
            const emailResult = await sendEmailViaResend({
              to: emailRecipient,
              subject: intentionResult.extractedData?.emailSubject || 'Informações sobre Clara IA',
              content: emailContent,
            });
            
            if (emailResult.success) {
              responseContent = intentionResponses.email.success;
              emailSent = true;
            } else {
              responseContent = intentionResponses.email.error;
            }
          } catch (error) {
            console.error('Error sending email:', error);
            responseContent = intentionResponses.email.error;
          }
        } else {
          responseContent = intentionResponses.email.noRecipient;
        }
      } else if (intentionResult.intention === 'objection' && intentionResult.confidence > 0.6) {
        const objectionType = intentionResult.extractedData?.objectionType || 'price';
        responseContent = intentionResponses.objection[objectionType];
        newHesitationCount++;
      } else {
        // Handle with existing logic
        const sentiment = detectUserSentiment(userInput);
        
        // Check for objections
        if (userInput.toLowerCase().includes('preço') || userInput.toLowerCase().includes('caro') || userInput.toLowerCase().includes('dinheiro')) {
          responseContent = claraContextResponses.objection_price[0];
          newHesitationCount++;
        } else if (userInput.toLowerCase().includes('confi') || userInput.toLowerCase().includes('dúvida') || userInput.toLowerCase().includes('segur')) {
          responseContent = claraContextResponses.objection_trust[0];
          newHesitationCount++;
        } else if (sentiment === 'hesitant') {
          newHesitationCount++;
          const contextResponse = getContextResponse('hesitant', newHesitationCount, 0);
          responseContent = contextResponse || claraScript[currentStage].content;
        } else if (sentiment === 'positive') {
          nextStage = getNextStage(currentStage, userInput);
          responseContent = claraScript[nextStage]?.content || 'Perfeito! Vou preparar tudo para você.';
        } else {
          // Use Groq for contextual response
          const systemPrompt = `Você é Clara, uma IA de vendas especializada em automação.

Contexto atual: Estamos na etapa "${claraScript[currentStage].name}".
Próximo objetivo: ${claraScript[nextStage]?.content || 'Fechar a venda'}.

Regras:
1. Seja direta, persuasiva e use linguagem coloquial brasileira
2. Sempre redirecione para a proposta principal (R$247/mês para automação)
3. Use escassez e urgência sutilmente
4. Se a pessoa fugir do assunto, traga de volta educadamente
5. Máximo 3 linhas de resposta
6. Use emojis estrategicamente

Responda de forma a conduzir naturalmente para a próxima etapa do script.`;

          try {
            const completion = await groq.chat.completions.create({
              model: 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userInput },
              ],
              temperature: 0.7,
              max_tokens: 200,
            });
            responseContent = completion.choices[0]?.message?.content || claraScript[currentStage].content;
          } catch (groqError) {
            console.error('Groq API error:', groqError);
            responseContent = claraScript[currentStage].content;
          }
        }
      }
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        // Shorter delay for better UX
        const baseTime = 200; // Minimum 200ms
        const wordCount = responseContent.split(' ').length;
        const thinkingTime = Math.min(baseTime + (wordCount * 15), 1000); // Max 1 second
        
        setTimeout(() => {
          // Send complete response
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              done: true,
              content: responseContent,
              shouldShowPaymentModal,
              emailSent,
              intention: intentionResult?.intention || 'general',
              claraFlow: {
                currentStage: nextStage,
                hesitationCount: newHesitationCount,
                noResponseCount: newNoResponseCount,
                lastInteraction: Date.now(),
              },
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