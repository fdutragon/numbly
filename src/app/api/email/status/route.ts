import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSecurityLog } from "@/lib/security";

// Schema de validação para consulta de status
const EmailStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID é obrigatório"),
  emailId: z.string().optional(),
});

// Cache global para notificações de email
declare global {
  var emailNotifications: Map<string, any> | undefined;
  var emailIdsCache: Map<string, any> | undefined;
}

if (!global.emailNotifications) {
  global.emailNotifications = new Map();
}

if (!global.emailIdsCache) {
  global.emailIdsCache = new Map();
}

// Interface para dados de email
interface EmailStatusData {
  type: "connected" | "email_ids_ready" | "status_update" | "error";
  orderId: string;
  scheduledEmailIds?: string[];
  timestamp?: number;
  email?: string;
  status?: string;
  error?: string;
}

// GET: Consultar status de email via SSE (Server-Sent Events)
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      addSecurityLog(
        "warn",
        {
          ip,
          userAgent,
          endpoint: "/api/email/status",
          method: "GET",
        },
        "Missing orderId parameter",
      );

      return NextResponse.json(
        {
          error: "orderId é obrigatório",
        },
        { status: 400 },
      );
    }

    // Log de acesso
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/email/status",
        method: "GET",
      },
      `Email status SSE connection started`,
      { orderId },
    );

    // Configurar SSE (Server-Sent Events)
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    const stream = new ReadableStream({
      start(controller) {
        // Função para enviar dados ao cliente
        const sendData = (data: EmailStatusData) => {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Enviar heartbeat inicial
        sendData({ type: "connected", orderId });

        // Verificar se já temos os dados
        if (global.emailIdsCache && global.emailIdsCache.has(orderId)) {
          const cachedData = global.emailIdsCache.get(orderId);
          sendData({
            type: "email_ids_ready",
            orderId,
            scheduledEmailIds: cachedData.scheduledEmailIds,
            timestamp: cachedData.timestamp,
            email: cachedData.email,
          });

          // Limpar cache e fechar conexão
          global.emailIdsCache.delete(orderId);
          controller.close();
          return;
        }

        // Timeout para evitar conexões infinitas
        const timeout = setTimeout(() => {
          sendData({
            type: "error",
            orderId,
            error: "Timeout - nenhum dado recebido",
          });
          controller.close();
        }, 30000); // 30 segundos

        // Limpar timeout quando a conexão for fechada
        const cleanup = () => {
          clearTimeout(timeout);
        };

        // Adicionar listener para cleanup
        controller.enqueue(new TextEncoder().encode(""));

        // Simular cleanup após timeout
        setTimeout(cleanup, 30000);
      },
    });

    return new Response(stream, { headers });
  } catch (error: any) {
    console.error("Erro no SSE de status de email:", error);

    addSecurityLog(
      "warn",
      {
        ip,
        userAgent,
        endpoint: "/api/email/status",
        method: "GET",
      },
      `Email status SSE error: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
      },
    );

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Falha ao iniciar stream de status",
      },
      { status: 500 },
    );
  }
}

// POST: Atualizar status de email ou armazenar dados
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json();

    // Validar dados básicos
    if (!body.orderId) {
      return NextResponse.json(
        {
          error: "orderId é obrigatório",
        },
        { status: 400 },
      );
    }

    const { orderId, scheduledEmailIds, email, status } = body;

    // Log de atualização
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/email/status",
        method: "POST",
      },
      `Email status update`,
      {
        orderId,
        hasScheduledIds: !!scheduledEmailIds,
        email,
        status,
      },
    );

    // Se estamos recebendo IDs de emails agendados, armazenar no cache
    if (scheduledEmailIds && Array.isArray(scheduledEmailIds)) {
      if (!global.emailIdsCache) {
        global.emailIdsCache = new Map();
      }

      global.emailIdsCache.set(orderId, {
        scheduledEmailIds,
        timestamp: Date.now(),
        email,
      });

      console.log(`✅ Email IDs armazenados para orderId ${orderId}:`, {
        count: scheduledEmailIds.length,
        email,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Email IDs armazenados com sucesso",
        orderId,
        count: scheduledEmailIds.length,
      });
    }

    // Se estamos recebendo uma atualização de status
    if (status) {
      if (!global.emailNotifications) {
        global.emailNotifications = new Map();
      }

      global.emailNotifications.set(orderId, {
        status,
        timestamp: Date.now(),
        email,
      });

      console.log(`✅ Status atualizado para orderId ${orderId}: ${status}`);

      return NextResponse.json({
        success: true,
        message: "Status atualizado com sucesso",
        orderId,
        status,
      });
    }

    return NextResponse.json(
      {
        error: "Nenhuma ação válida especificada",
      },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Erro ao processar atualização de status:", error);

    addSecurityLog(
      "warn",
      {
        ip,
        userAgent,
        endpoint: "/api/email/status",
        method: "POST",
      },
      `Email status update error: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
      },
    );

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Falha ao processar atualização de status",
      },
      { status: 500 },
    );
  }
}

// DELETE: Limpar cache de email
export async function DELETE(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        {
          error: "orderId é obrigatório",
        },
        { status: 400 },
      );
    }

    // Limpar caches
    let cleared = 0;

    if (global.emailIdsCache && global.emailIdsCache.has(orderId)) {
      global.emailIdsCache.delete(orderId);
      cleared++;
    }

    if (global.emailNotifications && global.emailNotifications.has(orderId)) {
      global.emailNotifications.delete(orderId);
      cleared++;
    }

    // Log de limpeza
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/email/status",
        method: "DELETE",
      },
      `Email cache cleared`,
      {
        orderId,
        itemsCleared: cleared,
      },
    );

    console.log(
      `✅ Cache limpo para orderId ${orderId}: ${cleared} itens removidos`,
    );

    return NextResponse.json({
      success: true,
      message: "Cache limpo com sucesso",
      orderId,
      itemsCleared: cleared,
    });
  } catch (error: any) {
    console.error("Erro ao limpar cache:", error);

    addSecurityLog(
      "warn",
      {
        ip,
        userAgent,
        endpoint: "/api/email/status",
        method: "DELETE",
      },
      `Email cache clear error: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
      },
    );

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Falha ao limpar cache",
      },
      { status: 500 },
    );
  }
}
