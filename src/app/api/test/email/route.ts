import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { authGuard, addSecurityLog } from "@/lib/security/auth-guard";

/**
 * 🧪 Endpoint de teste para envio de emails
 * POST /api/test/email
 */
export async function POST(req: NextRequest) {
  try {
    const securityContext = await authGuard(req);

    addSecurityLog(
      "info",
      {
        ip: securityContext.ip,
        userAgent: securityContext.userAgent,
        endpoint: "/api/test/email",
        method: "POST",
      },
      "Email test requested",
    );

    const { email, nome } = await req.json();

    if (!email || !nome) {
      return NextResponse.json(
        { error: "Email e nome são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await sendWelcomeEmail(email, nome);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? "Email enviado com sucesso!"
        : "Falha no envio do email",
      data: result.data,
      error: result.error,
    });
  } catch (error: any) {
    console.error("Erro no teste de email:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
