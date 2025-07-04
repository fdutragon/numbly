import { db } from "@/lib/db";
import { authGuard, logSecurityEvent } from "@/lib/security/auth-guard";
import type { SecurityContext } from "@/lib/security/auth-guard";
import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let securityContext: SecurityContext | undefined;

  try {
    console.log("[ME] 1. Iniciando validação do endpoint /me");

    // Validação de segurança
    console.log("[ME] 2. Executando authGuard...");
    securityContext = await authGuard(request);
    console.log("[ME] 2.1. Security Context:", securityContext);

    // Verificar se há token JWT
    const token = request.cookies.get("auth-token")?.value;
    console.log("[ME] 3. Token encontrado:", token ? "Sim" : "Não");

    if (!token) {
      console.log(
        "[ME] 3.1. Erro: Token não encontrado, retornando JSON para redirecionamento",
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token não encontrado",
          redirect: "/",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validar token JWT
    console.log("[ME] 4. Validando token JWT...");
    const payload = await verifyToken(token);
    console.log(
      "[ME] 4.1. Resultado da validação:",
      payload ? "Válido" : "Inválido",
    );

    if (!payload) {
      console.log("[ME] 4.2. Erro: Token inválido ou expirado");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token inválido ou expirado",
          redirect: "/",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie":
              "auth-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
          },
        },
      );
    }

    // Buscar usuário no banco usando o ID do token
    console.log("[ME] 5. Buscando usuário com ID:", payload.userId);
    const user = await db.user.findUnique({
      where: { id: payload.userId },
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
        numerologyData: true,
      },
    });
    console.log("[ME] 5.1. Usuário encontrado:", user ? "Sim" : "Não");

    if (!user) {
      console.log("[ME] 5.2. Erro: Usuário não encontrado no banco");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Usuário não encontrado",
          redirect: "/",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie":
              "auth-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
          },
        },
      );
    }

    // Extrair dados numerológicos
    let mapa = null;
    if (user.numerologyData && typeof user.numerologyData === "object") {
      mapa = user.numerologyData;
    }
    console.log("[ME] 6. Dados numerológicos extraídos:", mapa ? "Sim" : "Não");

    // Log de acesso bem-sucedido
    console.log("[ME] 7. Autenticação bem-sucedida para usuário:", user.id);
    logSecurityEvent(
      "AUTH_SUCCESS",
      securityContext,
      `JWT validation successful for user: ${user.id}`,
    );

    // Retornar dados do usuário
    console.log("[ME] 8. Retornando resposta com sucesso");
    return new Response(
      JSON.stringify({
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
          updatedAt: user.updatedAt,
        },
        mapa: mapa || undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("[ME] ❌ Erro no endpoint /me:", error);
    if (securityContext) {
      logSecurityEvent(
        "SUSPICIOUS",
        securityContext,
        `JWT validation error: ${error instanceof Error ? error.message : error}`,
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
