import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logSecurityEvent } from '@/lib/security/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * 🧹 DELETE - Limpar usuários de teste
 * DELETE /api/admin/cleanup-test-users
 */
export async function DELETE(req: NextRequest) {
  try {
    // Log da tentativa de limpeza
    console.log('[Admin] Tentativa de limpeza de usuários de teste');
    
    // Deletar usuários com emails de teste
    const result = await db.user.deleteMany({
      where: {
        OR: [
          { email: { contains: '@example.com' } },
          { email: { contains: '.teste.' } },
          { email: { contains: 'test-' } },
          { name: { contains: 'Teste' } },
          { name: { contains: 'Test' } }
        ]
      }
    });
    
    console.log(`[Admin] ${result.count} usuários de teste removidos`);
    
    return NextResponse.json({
      success: true,
      message: `${result.count} usuários de teste removidos`,
      count: result.count
    });
    
  } catch (error: any) {
    console.error('[Admin] Erro ao limpar usuários de teste:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao limpar usuários de teste',
      message: error.message
    }, { status: 500 });
  }
}
