import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface GenerateOptions {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export async function generate({ 
  prompt, 
  model = 'mixtral-8x7b-32768', 
  max_tokens = 300,
  temperature = 0.7 
}: GenerateOptions) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Você é um conselheiro espiritual especializado em numerologia. Suas mensagens são concisas, profundas e impactantes.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model,
    temperature,
    max_tokens,
    stop: ['\n', '.', '!', '?'] // Garante mensagens mais curtas
  });

  return {
    text: completion.choices[0]?.message?.content || '',
    usage: completion.usage
  };
}

const groqService = {
  generate
};

export default groqService;
