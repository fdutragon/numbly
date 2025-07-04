import { NextRequest, NextResponse } from "next/server";
import { authGuard, logSecurityEvent } from "@/lib/security/auth-guard";
import type { SecurityContext } from "@/lib/security/auth-guard";
import { verifyToken } from "@/lib/auth";

interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const dynamic = "force-dynamic";

/**
 * 🚪 Endpoint de Logout - Seguro e rápido
 * POST /api/auth/logout
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<LogoutResponse>> {
  // 1. 🛡️ Inicializar contexto de segurança
  let securityContext: SecurityContext;

  try {
    securityContext = await authGuard(req);
  } catch {
    // Logout deve funcionar mesmo sem contexto válido
    securityContext = {
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      userAgent: req.headers.get("user-agent") || "",
      riskScore: 0,
      timestamp: Date.now(),
      endpoint: req.nextUrl.pathname,
      method: req.method,
    };
  }

  try {
    // 2. 🍪 Obter token do cookie
    const token = req.cookies.get("auth-token")?.value;

    if (token) {
      try {
        // 3. 🔍 Verificar token para log de auditoria
        const payload = await verifyToken(token);
        if (payload?.userId) {
          logSecurityEvent(
            "AUTH_SUCCESS",
            securityContext,
            `User logged out: ${payload.userId}`,
          );
        }
      } catch {
        // Token inválido, mas vamos continuar o logout mesmo assim
        logSecurityEvent(
          "SUSPICIOUS",
          securityContext,
          "Invalid token on logout",
        );
      }
    }

    // 4. 📤 Resposta de sucesso
    const response = NextResponse.json<LogoutResponse>({
      success: true,
      message: "Logout realizado com sucesso",
    });

    // 5. 🧹 Limpar cookie de autenticação
    response.cookies.set({
      name: "auth-token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0, // Expira imediatamente
    });

    return response;
  } catch (error: unknown) {
    console.error("🚨 Erro no logout:", error);

    if (securityContext) {
      logSecurityEvent(
        "SUSPICIOUS",
        securityContext,
        `Logout error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Mesmo com erro, devemos limpar os cookies
    const response = NextResponse.json<LogoutResponse>(
      {
        success: true, // True porque o logout deve sempre "funcionar" do ponto de vista do usuário
        message: "Logout realizado com sucesso",
      },
      { status: 200 },
    );

    response.cookies.set({
      name: "auth-token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}

// GET - Informações da API de logout
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/auth/logout",
    method: "POST",
    description: "Endpoint para logout de usuários autenticados",
    authentication: "Bearer token required",
    response: "Limpa cookies e invalida sessão",
  });
}
