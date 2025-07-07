import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação simplificado
const CheckPaymentSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido é obrigatório'),
  userEmail: z.string().email('Email do usuário é obrigatório').optional()
});

// Removed unused interface

// Simulate payment status for Clara
const claraPaymentStatuses = new Map<string, string>();

// Função helper para logs com timestamp
const logWithTransaction = (transactionId: string, message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [TXN:${transactionId}] ${message}`, data || '');
};

/**
 * GET - Check Clara payment status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Log the check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log(`Clara payment check for: ${paymentId} from IP: ${ip}`);

    // Simulate payment processing time
    const currentStatus = claraPaymentStatuses.get(paymentId);
    
    if (!currentStatus) {
      // First check - set to processing
      claraPaymentStatuses.set(paymentId, 'processing');
      return NextResponse.json({ status: 'processing' });
    }

    // For demo purposes, simulate payment completion after 15 seconds for Clara
    if (paymentId.startsWith('clara_')) {
      const timestamp = parseInt(paymentId.split('_')[1]);
      const timeSinceCreation = Date.now() - timestamp;
      
      if (timeSinceCreation > 15000) { // 15 seconds for demo
        claraPaymentStatuses.set(paymentId, 'paid');
        
        console.log(`Clara payment confirmed: ${paymentId}`);
        
        return NextResponse.json({ 
          status: 'paid',
          message: 'Pagamento confirmado com sucesso'
        });
      }
    }

    return NextResponse.json({ 
      status: 'processing',
      message: 'Aguardando confirmação do pagamento'
    });

  } catch (error) {
    console.error('Error checking Clara payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Check legacy payment status
 */
export async function POST(req: NextRequest) {
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Validação da requisição
    const body = await req.json();
    const validatedData = CheckPaymentSchema.parse(body);
    const { orderId } = validatedData;

    console.log(`Payment check started for order: ${orderId} from IP: ${ip}`);
    logWithTransaction(transactionId, `[CHECK-PAYMENT] ${orderId} - Verificando pagamento`);

    // Mock response for demo - in production integrate with real AppMax API
    const mockResponse = {
      status: 'paid',
      total: 97.00
    };

    return NextResponse.json({
      success: true,
      data: mockResponse,
      transactionId
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Payment check error: ${errorMessage}`);
    logWithTransaction(transactionId, `[ERROR] ${errorMessage}`);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        transactionId 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
