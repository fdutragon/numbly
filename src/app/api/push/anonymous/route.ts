import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import webpush, { PushSubscription } from "web-push";
import { db } from "@/lib/db";
import { addSecurityLog } from "@/lib/security";

// Schema de validação
const AnonymousPushSchema = z.object({
  message: z.string().min(1, "Mensagem é obrigatória"),
  title: z.string().min(1, "Título é obrigatório"),
  url: z.string().url().optional(),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  testMode: z.boolean().optional().default(false),
});

// Configurar VAPID keys
webpush.setVapidDetails(
  "mailto:contato@numbly.life",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM-LZJptK7S0_ZOKMo0oXGvGJrZEEBiE4r1AiOQeQkHG7jn8QaVF9k",
  process.env.VAPID_PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE",
);

interface PushResult {
  sent: number;
  failed: number;
  errors: string[];
}

// Função para enviar push notification
async function sendPushNotification(
  subscription: PushSubscription,
  payload: string,
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error: any) {
    console.error("Erro ao enviar push:", error.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    // Validação da requisição
    const body = await req.json();
    const validatedData = AnonymousPushSchema.parse(body);

    const { message, title, url, icon, badge, testMode } = validatedData;

    // Log de início
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/push/anonymous",
        method: "POST",
      },
      `Anonymous push notification started`,
      {
        title: title.substring(0, 50),
        testMode,
      },
    );

    console.log(
      `🎯 Iniciando envio de push para usuários anônimos (título: ${title})`,
    );

    // Buscar apenas usuários que instalaram o app mas não fizeram compra
    const anonymousUsers = await db.pushSubscription.findMany({
      where: {
        isActive: true,
        hasPurchased: false, // Não compraram ainda
        pushSent: false, // Não receberam push ainda
        // Usuários que instalaram há mais de 1 hora (para não ser muito invasivo)
        installedAt: {
          lte: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
        },
      },
      orderBy: {
        installedAt: "asc", // Enviar primeiro para quem instalou há mais tempo
      },
    });

    console.log(
      `🎯 Encontrados ${anonymousUsers.length} usuários anônimos elegíveis`,
    );

    if (anonymousUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum usuário anônimo elegível encontrado",
        results: { sent: 0, failed: 0, errors: [] },
      });
    }

    const results: PushResult = {
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Preparar payload da notificação
    const notificationPayload = JSON.stringify({
      title,
      body: message,
      icon: icon || "/icon-192x192.svg",
      badge: badge || "/icon-72x72.svg",
      data: {
        url: url || "/",
        timestamp: new Date().toISOString(),
        type: "anonymous",
      },
      actions: [
        {
          action: "open",
          title: "✨ Ver agora",
          icon: "/icon-72x72.svg",
        },
      ],
    });

    // Processar em lotes para evitar sobrecarga
    const batchSize = testMode ? 5 : 50;
    const totalBatches = Math.ceil(anonymousUsers.length / batchSize);

    console.log(
      `📦 Processando ${anonymousUsers.length} notificações em ${totalBatches} lotes de ${batchSize}`,
    );

    for (let i = 0; i < anonymousUsers.length; i += batchSize) {
      const batch = anonymousUsers.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(
        `📤 Processando lote ${batchNumber}/${totalBatches} (${batch.length} notificações)`,
      );

      // Processar lote em paralelo
      const batchPromises = batch.map(async (user) => {
        try {
          // Parse the JSON subscription
          let subscriptionData;
          try {
            subscriptionData = JSON.parse(user.subscription);
          } catch (parseError) {
            console.error("❌ Erro ao parsear subscription JSON:", parseError);
            results.failed++;
            results.errors.push(
              `Parse error for user ${user.id}: ${parseError}`,
            );
            return;
          }

          // Validate required fields
          if (
            !user.endpoint ||
            !subscriptionData.keys?.p256dh ||
            !subscriptionData.keys?.auth
          ) {
            console.error("❌ Subscription incompleta para usuário:", user.id);
            results.failed++;
            results.errors.push(`Incomplete subscription for user ${user.id}`);
            return;
          }

          const subscription: PushSubscription = {
            endpoint: user.endpoint,
            keys: {
              p256dh: subscriptionData.keys.p256dh,
              auth: subscriptionData.keys.auth,
            },
          };

          const success = await sendPushNotification(
            subscription,
            notificationPayload,
          );

          if (success) {
            // Marcar como enviado
            await db.pushSubscription.update({
              where: { id: user.id },
              data: { pushSent: true },
            });
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`Falha para usuário ${user.id}`);
          }
        } catch (error: any) {
          console.error(`Erro ao processar usuário ${user.id}:`, error);
          results.failed++;
          results.errors.push(`Erro para usuário ${user.id}: ${error.message}`);
        }
      });

      await Promise.allSettled(batchPromises);

      // Pequena pausa entre lotes para não sobrecarregar
      if (i + batchSize < anonymousUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const processingTime = Date.now() - startTime;

    // Log de resultado
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/push/anonymous",
        method: "POST",
      },
      "Anonymous push notifications completed",
      {
        totalUsers: anonymousUsers.length,
        sent: results.sent,
        failed: results.failed,
        processingTime,
        testMode,
      },
    );

    console.log(`✅ Push para usuários anônimos concluído:`, {
      total: anonymousUsers.length,
      sent: results.sent,
      failed: results.failed,
      processingTime: `${processingTime}ms`,
    });

    return NextResponse.json({
      success: true,
      message: `Push notifications enviadas para usuários anônimos`,
      results: {
        total: anonymousUsers.length,
        sent: results.sent,
        failed: results.failed,
        errors: testMode ? results.errors : [], // Mostrar erros apenas em teste
      },
      processingTime,
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error("Erro ao enviar push para usuários anônimos:", error);

    addSecurityLog(
      "warn",
      {
        ip,
        userAgent,
        endpoint: "/api/push/anonymous",
        method: "POST",
      },
      `Anonymous push error: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
        processingTime,
      },
    );

    // Tratamento específico para erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos fornecidos",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Falha ao enviar push notifications para usuários anônimos",
      },
      { status: 500 },
    );
  }
}

// GET: Buscar estatísticas de usuários anônimos
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    // Buscar estatísticas
    const stats = await db.pushSubscription.groupBy({
      by: ["hasPurchased", "pushSent", "isActive"],
      _count: {
        id: true,
      },
      where: {
        hasPurchased: false, // Apenas usuários anônimos
      },
    });

    // Usuários elegíveis (não compraram, não receberam push, instalaram há mais de 1h)
    const eligibleCount = await db.pushSubscription.count({
      where: {
        isActive: true,
        hasPurchased: false,
        pushSent: false,
        installedAt: {
          lte: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      },
    });

    // Log de consulta
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/push/anonymous",
        method: "GET",
      },
      "Anonymous push stats retrieved",
      {
        eligibleCount,
        totalStats: stats.length,
      },
    );

    return NextResponse.json({
      success: true,
      stats: {
        eligible: eligibleCount,
        breakdown: stats,
        description: "Estatísticas de usuários anônimos (não compraram)",
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas:", error);

    addSecurityLog(
      "warn",
      {
        ip,
        userAgent,
        endpoint: "/api/push/anonymous",
        method: "GET",
      },
      `Anonymous push stats error: ${error.message}`,
    );

    return NextResponse.json(
      {
        error: "Erro ao buscar estatísticas",
      },
      { status: 500 },
    );
  }
}
