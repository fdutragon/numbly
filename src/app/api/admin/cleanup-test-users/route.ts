import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 🧹 DELETE - Limpar usuários de teste
 * DELETE /api/admin/cleanup-test-users
 */
export async function DELETE(req: NextRequest) {
  try {
    // Log da tentativa de limpeza
    console.log("[Admin] Tentativa de limpeza de usuários de teste");

    // Deletar usuários com emails de teste
    const result = await db.user.deleteMany({
      where: {
        OR: [
          { email: { contains: "@example.com" } },
          { email: { contains: ".teste." } },
          { email: { contains: "test-" } },
          { name: { contains: "Teste" } },
          { name: { contains: "Test" } },
        ],
      },
    });

    console.log(`[Admin] ${result.count} usuários de teste removidos`);

    return NextResponse.json({
      success: true,
      message: `${result.count} usuários de teste removidos`,
      count: result.count,
    });
  } catch (error) {
    console.error("[Admin] Erro ao limpar usuários de teste:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao limpar usuários de teste",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Remove parâmetro não utilizado 'req' do handler
export async function POST() {
  return new Response(
    JSON.stringify({ error: "Not implemented." }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
}
