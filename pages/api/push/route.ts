import { db } from '@/lib/db'
import groq from '@/lib/groq'
import { sendPush } from '@/lib/push'
import { NextResponse } from 'next/server'

const BATCH_SIZE = 3
const MAX_ATTEMPTS = 3
const CHAR_LIMIT = 240

export const dynamic = 'force-dynamic'
export const revalidate = 60 * 15 // 15 min

export async function POST() {
  const cron = await db.oraculoCronExecution.create({ data: {} })

  try {
    const { processed, failed } = await gerarMensagens()
    const { sent, skipped } = await enviarMensagens()

    await db.oraculoCronExecution.update({
      where: { id: cron.id },
      data: {
        finishedAt: new Date(),
        processed,
        sent,
        failed,
        skipped,
      },
    })

    return NextResponse.json({
      success: true,
      processed,
      sent,
      failed,
      skipped,
      cronId: cron.id,
    })

  } catch (err) {
    console.error('Erro geral no cron do oráculo:', err)
    return NextResponse.json(
      { error: 'Erro no cron do oráculo' },
      { status: 500 }
    )
  }
}

async function gerarMensagens() {
  const pendentes = await db.oraculoAIGenerationQueue.findMany({
    where: {
      status: 'PENDING',
      attempts: { lt: MAX_ATTEMPTS },
    },
    take: BATCH_SIZE,
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  })

  let processed = 0
  let failed = 0

  for (const item of pendentes) {
    try {
      const prompt = `Gere uma mensagem espiritual e impactante sobre o número ${item.numero}. Máximo de ${CHAR_LIMIT} caracteres. Foque em transformação, intuição e insight.`

      const resposta = await groq.generate({
        prompt,
        model: 'llama3-8b-8192',
        max_tokens: 300,
      })

      const texto = resposta.text.trim()
      const charCount = texto.length

      if (charCount > CHAR_LIMIT) throw new Error('Texto ultrapassou o limite')

      await db.oraculoAIGenerationQueue.update({
        where: { id: item.id },
        data: {
          generated: texto,
          charCount,
          status: 'GENERATED',
          generatedAt: new Date(),
          attempts: { increment: 1 },
        },
      })

      processed++
    } catch (err: any) {
      console.error(`Erro ao gerar mensagem p/ ${item.user?.name || item.userId}:`, err.message)
      await db.oraculoAIGenerationQueue.update({
        where: { id: item.id },
        data: {
          status: 'FAILED',
          error: err.message,
          attempts: { increment: 1 },
        },
      })
      failed++
    }
  }

  return { processed, failed }
}

async function enviarMensagens() {
  const mensagens = await db.oraculoAIGenerationQueue.findMany({
    where: {
      status: 'GENERATED',
      sent: false,
    },
    orderBy: { generatedAt: 'asc' },
    take: BATCH_SIZE,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          // Ajuste para o nome correto do relacionamento de push no seu schema
          subscriptions: {
            where: { isActive: true },
            select: {
              id: true,
              isActive: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  })

  let sent = 0
  let skipped = 0

  for (const msg of mensagens) {
    try {
      const user = (msg as any).user
      const subs = user?.subscriptions ?? []

      if (!subs.length) {
        skipped++
        continue
      }

      for (const sub of subs) {
        await sendPush({
          subscription: sub, // passa o objeto inteiro
          title: 'Seu número falou...',
          body: msg.generated!,
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/oraculo?numero=${msg.numero}`,
        })
      }

      await db.oraculoAIGenerationQueue.update({
        where: { id: msg.id },
        data: {
          sent: true,
          sentAt: new Date(),
        },
      })

      sent++
    } catch (err) {
      console.error('Erro ao enviar push:', err)
    }
  }

  return { sent, skipped }
}
