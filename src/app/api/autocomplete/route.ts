import { OpenAI } from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please add your API key to .env.local file.',
          fallback: true
        }, 
        { status: 400 }
      )
    }

    const { text, context } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const prompt = `Complete the following legal text in Portuguese (Brazilian legal context):

Context: ${context || 'Legal document'}
Text to complete: "${text}"

Provide a natural continuation that:
- Follows Brazilian legal writing standards
- Is contextually appropriate
- Is concise (max 50 words)
- Maintains formal legal tone

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

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate autocomplete suggestion' },
      { status: 500 }
    )
  }
}