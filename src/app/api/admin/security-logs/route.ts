import { NextRequest, NextResponse } from "next/server";
import { authGuard, logSecurityEvent, getSecurityStats } from "@/lib/security";
import type { SecurityContext } from "@/lib/security";

interface SecurityLogsResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    stats: {
      totalIPs: number;
      rateLimitEntries: number;
      recentEvents: unknown[];
    };
    timestamp: string;
  };
}

export const dynamic = "force-dynamic";

/**
 * 🔐 Verificar se usuário é administrador
 */
function isAdmin(req: NextRequest): boolean {
  const adminKey = req.headers.get("x-admin-key");
  const adminSecret = process.env.ADMIN_SECRET_KEY || "dev-admin-key";

  return adminKey === adminSecret;
}

/**
 * 📊 GET - Obter logs de segurança
 * GET /api/admin/security-logs
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<SecurityLogsResponse>> {
  let securityContext: SecurityContext | undefined;

  try {
    // 1. 🛡️ Validação de segurança
    securityContext = await authGuard(req);

    // 2. 🔧 Verificar se é admin
    if (!isAdmin(req)) {
      logSecurityEvent(
        "SUSPICIOUS",
        securityContext,
        "Tentativa de acesso não autorizado aos logs de segurança",
      );
      return NextResponse.json<SecurityLogsResponse>(
        {
          success: false,
          error: "Acesso negado",
        },
        { status: 403 },
      );
    }

    // 3. 📊 Obter estatísticas de segurança
    const stats = getSecurityStats();

    // 4. ✅ Log de acesso admin
    logSecurityEvent(
      "AUTH_SUCCESS",
      securityContext,
      "Visualização de logs de segurança admin",
    );

    return NextResponse.json<SecurityLogsResponse>({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("🚨 Erro ao buscar logs de segurança:", error);

    if (securityContext) {
      logSecurityEvent(
        "SUSPICIOUS",
        securityContext,
        `Admin security logs error: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    return NextResponse.json<SecurityLogsResponse>(
      {
        success: false,
        error: "Erro interno",
      },
      { status: 500 },
    );
  }
}
