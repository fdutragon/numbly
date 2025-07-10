import { NextRequest, NextResponse } from 'next/server';

// Cache global para email IDs
interface EmailCacheData {
  scheduledEmailIds: string[];
  timestamp: number;
  email: string;
}

declare global {
  var emailIdsCache: Map<string, EmailCacheData> | undefined;
}

// Endpoint para verificar status dos emails
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { error: 'orderId é obrigatório' },
      { status: 400 }
    );
  }

  try {
    // Verificar se há dados de email em cache para este orderId
    const emailCache = global.emailIdsCache;
    if (emailCache && emailCache.has(orderId)) {
      const cachedData = emailCache.get(orderId);
      emailCache.delete(orderId);

      if (cachedData) {
        return NextResponse.json({
          success: true,
          scheduledEmailIds: cachedData.scheduledEmailIds,
          timestamp: cachedData.timestamp,
          email: cachedData.email,
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'IDs ainda não disponíveis',
      scheduledEmailIds: [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        debug: error,
      },
      { status: 500 }
    );
  }
}
