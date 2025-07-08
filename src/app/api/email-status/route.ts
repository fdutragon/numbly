import { NextRequest, NextResponse } from "next/server";

// Cache global para email IDs
declare global {
  var emailIdsCache: Map<string, {
    scheduledEmailIds: string[];
    timestamp: number;
    email: string;
  }> | undefined;
}

// Função para notificar que os IDs de email estão prontos
export function notifyEmailIdsReady(orderId: string, scheduledEmailIds: string[], email: string): boolean {
  try {
    // Verificar se existe um callback ou sistema de notificação
    // Por enquanto, apenas loggar
    console.log(`[EMAIL STATUS] IDs prontos para order ${orderId}:`, scheduledEmailIds);
    return true;
  } catch (error) {
    console.error('[EMAIL STATUS] Erro ao notificar IDs prontos:', error);
    return false;
  }
}

// Endpoint para verificar status dos emails
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 });
  }

  try {
    // Verificar se há dados de email em cache para este orderId
    if (global.emailIdsCache && global.emailIdsCache.has(orderId)) {
      const cachedData = global.emailIdsCache.get(orderId);
      global.emailIdsCache.delete(orderId);

      return NextResponse.json({
        success: true,
        scheduledEmailIds: cachedData?.scheduledEmailIds || [],
        timestamp: cachedData?.timestamp || Date.now(),
        email: cachedData?.email || ''
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "IDs ainda não disponíveis",
        scheduledEmailIds: []
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "Erro desconhecido",
      debug: error
    }, { status: 500 });
  }
}
