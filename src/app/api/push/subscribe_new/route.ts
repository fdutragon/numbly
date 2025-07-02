import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, keys } = await req.json();
    
    if (!endpoint || !keys) {
      return NextResponse.json({
        success: false,
        error: 'Dados de subscription inválidos'
      }, { status: 400 });
    }

    // Extrair deviceId do endpoint ou gerar um único
    const deviceId = extractDeviceId(endpoint);
    
    // Salvar subscription no banco
    const subscription = await db.pushSubscription.upsert({
      where: { deviceId },
      update: {
        endpoint,
        subscription: JSON.stringify({ endpoint, keys }),
        isActive: true,
        userAgent: req.headers.get('user-agent') || '',
        platform: getPlatform(req.headers.get('user-agent') || ''),
      },
      create: {
        deviceId,
        endpoint,
        subscription: JSON.stringify({ endpoint, keys }),
        isActive: true,
        userAgent: req.headers.get('user-agent') || '',
        platform: getPlatform(req.headers.get('user-agent') || ''),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription salva com sucesso',
      deviceId: subscription.deviceId
    });

  } catch (error) {
    console.error('Erro ao salvar subscription:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

function extractDeviceId(endpoint: string): string {
  // Extrair um ID único do endpoint
  const match = endpoint.match(/[^\/]+$/);
  return match ? match[0] : Math.random().toString(36).substring(2, 15);
}

function getPlatform(userAgent: string): string {
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  return 'Unknown';
}
