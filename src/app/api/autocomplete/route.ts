import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please add your API key to .env.local file.',
          suggestion: null,
          fallback: true
        }, 
        { status: 200 }
      )
    }

    const { text, context, userId, guestId, documentId, clauseId } = await request.json()
    
    // Verificar permissões de IA (paywall)
    const userIdentifier = userId || guestId
    if (userIdentifier) {
      const { data: paywallStatus } = await supabase
        .from('user_paywall_status')
        .select('ai_edits_used, ai_edits_limit, has_premium')
        .eq('user_id', userIdentifier)
        .single()

      const hasAIAccess = paywallStatus?.has_premium || 
                         (paywallStatus?.ai_edits_used || 0) < (paywallStatus?.ai_edits_limit || 1)

      if (!hasAIAccess) {
        return NextResponse.json(
          { 
            error: 'AI limit reached',
            needsUpgrade: true,
            message: 'Você atingiu o limite de edições gratuitas de IA. Faça upgrade para continuar.',
            suggestion: null,
            fallback: true
          },
          { status: 402 }
        )
      }
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Buscar contexto adicional do documento se fornecido
    let documentContext = ''
    if (documentId) {
      const { data: document } = await supabase
        .from('documents')
        .select('title, type, metadata')
        .eq('id', documentId)
        .single()
      
      if (document) {
        documentContext = `Documento: ${document.title} (${document.type || 'Contrato'})`
      }
    }

    // Buscar contexto da cláusula se fornecida
    let clauseContext = ''
    if (clauseId) {
      const { data: clause } = await supabase
        .from('clauses')
        .select('title, body')
        .eq('id', clauseId)
        .single()
      
      if (clause) {
        clauseContext = `Cláusula: ${clause.title}`
      }
    }

    const enhancedContext = [documentContext, clauseContext, context].filter(Boolean).join(' | ')

    const prompt = `Complete the following legal text in Portuguese (Brazilian legal context):

Context: ${enhancedContext || 'Legal document'}
Text to complete: "${text}"

Provide a natural continuation that:
- Follows Brazilian legal writing standards
- Is contextually appropriate
- Is concise (max 50 words)
- Maintains formal legal tone
- Uses proper legal terminology

Completion:`

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a Brazilian legal writing assistant. Provide natural, contextually appropriate completions for legal documents in Portuguese.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    // Incrementar contador de uso de IA para usuários não premium
    if (userIdentifier) {
      const { data: paywallStatus } = await supabase
        .from('user_paywall_status')
        .select('ai_edits_used, ai_edits_limit, has_premium')
        .eq('user_id', userIdentifier)
        .single()

      if (!paywallStatus?.has_premium) {
        await supabase
          .from('user_paywall_status')
          .upsert({
            user_id: userIdentifier,
            ai_edits_used: (paywallStatus?.ai_edits_used || 0) + 1,
            ai_edits_limit: paywallStatus?.ai_edits_limit || 1,
            last_ai_use: new Date().toISOString()
          })
      }
    }

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    
    // Check if it's an API key error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key. Please check your configuration.',
          suggestion: null,
          fallback: true
        },
        { status: 200 }
      )
    }
    
    // For other errors, return a graceful fallback
    return NextResponse.json(
      { 
        error: 'Autocomplete temporarily unavailable',
        suggestion: null,
        fallback: true
      },
      { status: 200 }
    )
  }
}