import { db } from '@/lib/db';
import { authGuard, logSecurityEvent } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  let securityContext: SecurityContext | undefined;

  try {
    // Validação de segurança
    securityContext = await authGuard(request);

    // Verificar se há cookie de sessão
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/numbly_session=([^;]+)/);
    if (!sessionMatch) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Não autenticado'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const userId = sessionMatch[1];

    // Buscar usuário no banco
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        isPremium: true,
        credits: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        numerologyData: true
      }
    });

    if (!user) {
      // Limpar cookie inválido
      return new Response(JSON.stringify({
        success: false,
        error: 'Sessão inválida'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'numbly_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
        }
      });
    }

    // Extrair dados numerológicos
    let mapa = null;
    if (user.numerologyData && typeof user.numerologyData === 'object') {
      mapa = user.numerologyData;
    }

    // Log de acesso bem-sucedido
    logSecurityEvent('AUTH_SUCCESS', securityContext, `Session validation successful for user: ${user.id}`);

    // Retornar dados do usuário
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        birthDate: user.birthDate,
        isPremium: user.isPremium,
        credits: user.credits,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      mapa: mapa || undefined
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Erro no endpoint /me:', error);
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Session validation error: ${error.message}`);
    }
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
