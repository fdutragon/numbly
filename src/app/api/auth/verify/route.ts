import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { authGuard, logSecurityEvent } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';

// Schema de validação para verificação de token
const VerifyTokenSchema = z.object({
  token: z.string().uuid('Token deve ser um UUID válido')
});

/**
 * GET /api/auth/verify?token=xxx
 * Verifica magic token e cria sessão
 */
export async function GET(request: NextRequest) {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. Validação de segurança básica
    securityContext = await authGuard(request);
    
    // 2. Extrair token da query string
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }
    
    // 3. Validar formato do token
    const { token: validToken } = VerifyTokenSchema.parse({ token });
    
    // 4. Buscar magic token no banco
    const magicToken = await db.magicToken.findUnique({
      where: { token: validToken }
    });

    if (!magicToken) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Invalid magic token: ${validToken}`);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // 5. Verificar se token não está expirado
    if (!magicToken.expiresAt || magicToken.expiresAt < new Date()) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Expired magic token: ${validToken}`);
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      );
    }

    // 6. Verificar se token já foi usado
    if (magicToken.used) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Already used magic token: ${validToken}`);
      return NextResponse.json(
        { error: 'Token já utilizado' },
        { status: 401 }
      );
    }

    // 7. Buscar dispositivo baseado no email do token
    const deviceId = magicToken.email.replace('device_', '').replace('@numbly.local', '');
    
    const userDevice = await db.userDevice.findUnique({
      where: { deviceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            numerologyData: true,
            isPremium: true,
            credits: true
          }
        }
      }
    });

    if (!userDevice || !userDevice.user) {
      return NextResponse.json(
        { error: 'Dispositivo ou usuário não encontrado' },
        { status: 404 }
      );
    }

    // 8. Marcar token como usado
    await db.magicToken.update({
      where: { token: validToken },
      data: { used: true }
    });

    // 9. Atualizar lastSeen do dispositivo
    await db.userDevice.update({
      where: { deviceId },
      data: { lastSeen: new Date() }
    });

    // 10. Gerar JWT token para sessão
    const jwtToken = await createToken({
      userId: userDevice.user.id,
      deviceId,
      nome: userDevice.user.name || ''
    });

    // 11. Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, `Magic link verified for user: ${userDevice.user.id}`);
    
    // 12. Redirecionar para dashboard com cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      path: '/'
    });

    return response;
    
  } catch (error: any) {
    console.error('Erro na verificação do magic token:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Magic token verify error: ${error.message}`);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Token inválido',
        details: error.errors[0]?.message
      }, { status: 400 });
    }
    
    // Redirecionar para página de erro
    return NextResponse.redirect(new URL('/?error=token_invalid', request.url));
  }
}

/**
 * POST /api/auth/verify
 * Verifica magic token via POST (alternativa)
 */
export async function POST(request: NextRequest) {
  let securityContext: SecurityContext | undefined;
  
  try {
    securityContext = await authGuard(request);
    
    const body = await request.json();
    const { token } = VerifyTokenSchema.parse(body);
    
    // Reutilizar lógica do GET
    const url = new URL(request.url);
    url.searchParams.set('token', token);
    
    const newRequest = new NextRequest(url, {
      method: 'GET',
      headers: request.headers
    });
    
    return GET(newRequest);
    
  } catch (error: any) {
    console.error('Erro na verificação POST do magic token:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Token inválido',
        details: error.errors[0]?.message
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
