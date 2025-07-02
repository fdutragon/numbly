import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard, addSecurityLog } from '@/lib/security/auth-guard';
import { z } from 'zod';

const validateSchema = z.object({
  deviceId: z.string().min(1, 'Device ID é obrigatório')
});

export async function POST(req: NextRequest) {
  try {
    const securityContext = await authGuard(req);
    
    const body = await req.json();
    const validatedData = validateSchema.parse(body);

    addSecurityLog('info', {
      ip: securityContext.ip,
      userAgent: securityContext.userAgent,
      endpoint: '/api/push/validate',
      method: 'POST'
    }, `Validating device: ${validatedData.deviceId}`);

    // Buscar subscription por deviceId
    const subscription = await db.pushSubscription.findUnique({
      where: {
        deviceId: validatedData.deviceId
      },
      select: {
        id: true,
        deviceId: true,
        isActive: true,
        hasPurchased: true,
        installedAt: true,
        platform: true
      }
    });

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'Device não encontrado',
        isValid: false
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isValid: subscription.isActive,
      data: {
        deviceId: subscription.deviceId,
        isActive: subscription.isActive,
        hasPurchased: subscription.hasPurchased,
        installedAt: subscription.installedAt,
        platform: subscription.platform
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao validar device:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
