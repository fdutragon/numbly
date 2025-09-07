import { OpenAI } from 'openai';
import { db } from '@/data/db';

const client = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });

export async function suggestForClause(clauseId: string) {
  const idx = await db.clause_index.where('clause_id').equals(clauseId).first();
  const clause = await db.clauses.get(clauseId);
  const prompt = [
    'Você é um assistente jurídico. Melhore a cláusula abaixo, mantendo escopo e linguagem formal. Responda apenas com o texto da cláusula.',
    `TÍTULO: ${clause?.title}`,
    `TRECHO: ${clause?.body}`,
    idx?.summary ? `RESUMO: ${idx.summary}` : '',
  ].join('\n');

  const { choices } = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  return choices[0]?.message?.content ?? '';
}
