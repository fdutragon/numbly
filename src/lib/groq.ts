import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function createChatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
) {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: options?.stream ?? false,
    });

    return completion;
  } catch (error) {
    console.error('Error creating chat completion:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function createStreamingChatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) {
  try {
    const stream = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('Error creating streaming chat completion:', error);
    throw new Error('Failed to generate AI response');
  }
}
