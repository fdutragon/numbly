import { NextRequest, NextResponse } from "next/server";
import { authGuard, logSecurityEvent } from "@/lib/security/auth-guard";
import type { SecurityContext } from "@/lib/security/auth-guard";
import jwt from "jsonwebtoken";

interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const dynamic = 'force-dynamic';

/**
 * 🚪 Endpoint de Logout - Seguro e rápido
 * POST /api/auth/logout
 */
export async function POST(req: NextRequest): Promise<NextResponse<LogoutResponse>> {
  // 1. 🛡️ Inicializar contexto de segurança
  let securityContext: SecurityContext;
  
  try {
    securityContext = await authGuard(req);
  } catch (error: any) {
    // Logout deve funcionar mesmo sem contexto válido
    securityContext = {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || '',
      riskScore: 0,
      timestamp: Date.now(),
      endpoint: req.nextUrl.pathname,
      method: req.method
    };
  }
  
  try {

    // 2. 🍪 Obter token do cookie ou header
    const token = req.cookies.get('token')?.value || 
                 req.headers.get('authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        // 3. 🔍 Decodificar token para log de auditoria
        const decoded = jwt.decode(token) as any;
        if (decoded?.userId) {
          logSecurityEvent('AUTH_SUCCESS', securityContext, `User logged out: ${decoded.userId}`);
        }
      } catch (error) {
        // Token inválido, mas vamos continuar o logout mesmo assim
        logSecurityEvent('SUSPICIOUS', securityContext, 'Invalid token on logout');
      }
    }

    // 4. 📤 Resposta de sucesso
    const response = NextResponse.json<LogoutResponse>({
      success: true,
      message: "Logout realizado com sucesso"
    });

    // 5. 🧹 Limpar cookies de autenticação
    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expira imediatamente
    });

    // Limpar outros cookies de sessão se existirem
    response.cookies.set({
      name: "session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;

  } catch (error: any) {
    console.error("🚨 Erro no logout:", error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Logout error: ${error.message}`);
    }
    
    // Mesmo com erro, devemos limpar os cookies
    const response = NextResponse.json<LogoutResponse>(
      { 
        success: true, // True porque o logout deve sempre "funcionar" do ponto de vista do usuário
        message: "Logout realizado com sucesso" 
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
