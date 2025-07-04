import { NextRequest, NextResponse } from "next/server";
import {
  addSecurityLog,
  getSecurityLogs,
  getSecurityStats,
  createSession,
  generateToken,
  verifyToken,
  authGuard,
  logSecurityEvent,
} from "@/lib/security";

/**
 * 🧪 Endpoint de teste para o sistema de segurança
 * GET /api/test/security - Relatório de segurança
 * POST /api/test/security - Teste de criação de sessão
 */

async function handleGET(req: NextRequest) {
  try {
    const stats = getSecurityStats();
    const logs = getSecurityLogs();

    addSecurityLog(
      "info",
      { endpoint: "/api/test/security" },
      "Security report requested",
    );

    return NextResponse.json({
      success: true,
      stats,
      logs: logs.slice(0, 20), // Últimos 20 logs
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    addSecurityLog(
      "error",
      { endpoint: "/api/test/security" },
      "Error generating security report",
    );
    return NextResponse.json(
      { error: "Erro ao gerar relatório de segurança" },
      { status: 500 },
    );
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const { userId, email, nome } = await req.json();

    if (!userId || !email || !nome) {
      return NextResponse.json(
        { error: "userId, email e nome são obrigatórios" },
        { status: 400 },
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "test-ip";
    const userAgent = req.headers.get("user-agent") || "test-agent";

    // Criar sessão
    const session = createSession(userId, email, nome, ip, userAgent);

    // Testar verificação do token
    const verification = verifyToken(session.token);

    addSecurityLog(
      "info",
      { endpoint: "/api/test/security", userId, email },
      "Test session created",
    );

    return NextResponse.json({
      success: true,
      message: "Sessão de teste criada com sucesso",
      session: {
        sessionId: session.sessionId,
        tokenValid: !!verification,
        user: verification,
      },
    });
  } catch (error: any) {
    addSecurityLog(
      "error",
      { endpoint: "/api/test/security" },
      "Error creating test session",
    );
    return NextResponse.json(
      { error: "Erro ao criar sessão de teste" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleGET(req);
}

export async function POST(req: NextRequest) {
  return handlePOST(req);
}
