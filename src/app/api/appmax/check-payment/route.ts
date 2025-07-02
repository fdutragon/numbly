import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from "@/lib/db";
import { addSecurityLog } from '@/lib/security';

// Schema de validação simplificado
const CheckPaymentSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido é obrigatório'),
  userEmail: z.string().email('Email do usuário é obrigatório')
});

interface AppMaxResponse {
  data?: {
    status: string;
    total: number;
  };
  status?: string;
  total?: number;
}

// Função helper para logs com timestamp
const logWithTransaction = (transactionId: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [TXN:${transactionId}] ${message}`, data || '');
};

export async function POST(req: NextRequest) {
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Validação da requisição
    const body = await req.json();
    const validatedData = CheckPaymentSchema.parse(body);
    const { orderId, userEmail } = validatedData;

    // Log de início
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/appmax/check-payment',
      method: 'POST'
    }, `Payment check started for order: ${orderId}`, { 
      transactionId,
      userEmail 
    });

    logWithTransaction(transactionId, `[CHECK-PAYMENT] ${orderId} - Verificando pagamento`);

    let data: AppMaxResponse;
    let status: string;

    // Verificação especial para email de desenvolvimento - simula resposta AppMax aprovada
    if (userEmail.toLowerCase() === 'felipedutra@outlook.com') {
      logWithTransaction(transactionId, 'Modo desenvolvimento detectado - simulando pagamento aprovado');
      
      data = {
        data: {
          status: 'aprovado',
          total: 17.00
        }
      };
      
      status = 'aprovado';
      logWithTransaction(transactionId, 'Simulação: Status definido como aprovado');
    } else {
      // Fluxo normal - verificar com AppMax
      const accessToken = process.env.APPMAX_API_KEY;
      if (!accessToken) {
        addSecurityLog('warn', {
          ip,
          userAgent,
          endpoint: '/api/appmax/check-payment',
          method: 'POST'
        }, 'APPMAX_API_KEY não configurada', { transactionId });
        
        return NextResponse.json({ 
          error: 'Configuração AppMax ausente',
          transactionId 
        }, { status: 500 });
      }
      
      // Verificar conexão com AppMax com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        const appmaxResponse = await fetch(`https://admin.appmax.com.br/api/v3/order/${orderId}`, {
          headers: {
            'Content-Type': 'application/json',
            'access-token': accessToken,
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!appmaxResponse.ok) {
          logWithTransaction(transactionId, `AppMax API erro: ${appmaxResponse.status} ${appmaxResponse.statusText}`);
          
          addSecurityLog('warn', {
            ip,
            userAgent,
            endpoint: '/api/appmax/check-payment',
            method: 'POST'
          }, `AppMax API Error: ${appmaxResponse.status}`, {
            orderId,
            status: appmaxResponse.status,
            statusText: appmaxResponse.statusText,
            transactionId
          });
          
          return NextResponse.json({ 
            paid: false, 
            error: 'Falha ao verificar status no AppMax', 
            transactionId 
          }, { status: 502 });
        }
        
        data = await appmaxResponse.json();
        logWithTransaction(transactionId, 'Resposta AppMax recebida', { status: data.data?.status || data.status });
        
        status = data.data?.status || data.status || 'unknown';
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          logWithTransaction(transactionId, 'Timeout na consulta AppMax');
          
          addSecurityLog('warn', {
            ip,
            userAgent,
            endpoint: '/api/appmax/check-payment',
            method: 'POST'
          }, 'AppMax API Timeout', { orderId, transactionId });
          
          return NextResponse.json({ 
            paid: false, 
            error: 'Timeout ao verificar pagamento', 
            transactionId 
          }, { status: 408 });
        }
        throw fetchError;
      }
    }
    
    // Processamento unificado do status
    const statusStr = String(status).toLowerCase();
    const paidStatuses = ['aprovado', 'pago', 'confirmado', '1', 'paid', 'approved'];
    const cancelledStatuses = ['cancelado', 'cancelled', 'canceled', 'expirado', 'expired', 'rejeitado', 'rejected'];
    const isPaid = paidStatuses.includes(statusStr) || status === '1';
    const isCancelled = cancelledStatuses.includes(statusStr);
      
    if (isCancelled) {
      logWithTransaction(transactionId, 'Pagamento cancelado/expirado detectado', { status });
      
      addSecurityLog('info', {
        ip,
        userAgent,
        endpoint: '/api/appmax/check-payment',
        method: 'POST'
      }, 'Payment cancelled/expired', {
        orderId,
        status,
        userEmail,
        transactionId
      });
      
      return NextResponse.json({
        paid: false,
        cancelled: true,
        status: status,
        amount: data.data?.total || data.total,
        transactionId
      });
    }
      
    if (!isPaid) {
      logWithTransaction(transactionId, 'Pagamento não aprovado', { status });
      
      return NextResponse.json({
        paid: false,
        status: status,
        amount: data.data?.total || data.total,
        transactionId
      });
    }
      
    // Pagamento aprovado - apenas atualizar usuário para premium
    logWithTransaction(transactionId, 'Pagamento confirmado, atualizando usuário para premium');
    
    // Buscar usuário pelo email
    const user = await db.user.findUnique({ 
      where: { email: userEmail.toLowerCase() } 
    });
    
    if (!user) {
      logWithTransaction(transactionId, 'Usuário não encontrado', { userEmail });
      
      return NextResponse.json({ 
        paid: true,
        error: 'Usuário não encontrado. Faça o cadastro primeiro.',
        status: status,
        amount: data.data?.total || data.total,
        transactionId 
      }, { status: 404 });
    }
    
    // Atualizar para premium se ainda não for
    if (!user.isPremium) {
      await db.user.update({ 
        where: { email: userEmail.toLowerCase() }, 
        data: { isPremium: true } 
      });
      
      logWithTransaction(transactionId, 'Usuário atualizado para premium', { userId: user.id });
    } else {
      logWithTransaction(transactionId, 'Usuário já é premium', { userId: user.id });
    }
    
    // Log de sucesso
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/appmax/check-payment',
      method: 'POST'
    }, 'Payment processed successfully', {
      orderId,
      userId: user.id,
      userEmail: user.email,
      amount: data.data?.total || data.total,
      transactionId,
      processingTime: Date.now() - startTime
    });
    
    logWithTransaction(transactionId, 'Processamento concluído com sucesso', {
      userId: user.id,
      isPremium: true,
      processingTime: Date.now() - startTime
    });
    
    return NextResponse.json({
      paid: true,
      status: status,
      amount: data.data?.total || data.total,
      user: { id: user.id, email: user.email, isPremium: true },
      transactionId,
      message: 'Usuário atualizado para premium com sucesso'
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    logWithTransaction(transactionId, 'ERRO na verificação de pagamento', { 
      error: error.message, 
      stack: error.stack,
      processingTime
    });
    
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/appmax/check-payment',
      method: 'POST'
    }, 'Payment verification error', {
      error: error.message,
      stack: error.stack,
      transactionId,
      processingTime
    });
    
    // Tratamento específico para erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        paid: false,
        error: 'Dados inválidos fornecidos',
        details: error.errors,
        transactionId 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      paid: false,
      error: 'Falha ao verificar status do pagamento',
      transactionId 
    }, { status: 500 });
  }
}
