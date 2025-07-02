import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';

// Schema para busca de usuários
const SearchUserSchema = z.object({
  q: z.string().min(1, 'Query é obrigatória').max(100),
  limit: z.coerce.number().min(1).max(50).optional().default(10)
});

// Schema para busca por ID
const GetUserByIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório')
});

// Rate limiting para busca
const USER_SEARCH_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 20 // 20 buscas por minuto
};

export const dynamic = 'force-dynamic';

/**
 * 🔍 GET - Buscar usuários
 * GET /api/users?q=nome&limit=10
 * GET /api/users/[id] - Buscar por ID
 */
export async function GET(req: NextRequest) {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. Validação de segurança
    securityContext = await authGuard(req);
    
    // 2. Rate limiting
    const searchKey = `user_search_${securityContext.ip}`;
    if (!checkRateLimit(searchKey, USER_SEARCH_RATE_LIMIT.window, USER_SEARCH_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'User search rate limit exceeded');
      return NextResponse.json(
        { error: 'Muitas buscas. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }
    
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    
    // Busca por query string
    if (searchParams.q) {
      const { q, limit } = SearchUserSchema.parse(searchParams);
      
      const users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          bio: true,
          isPremium: true,
          createdAt: true
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      logSecurityEvent('AUTH_SUCCESS', securityContext, `User search: "${q}" - ${users.length} results`);
      
      return NextResponse.json({
        success: true,
        users,
        total: users.length,
        query: q
      });
    }
    
    // Listar todos os usuários (limitado)
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        isPremium: true,
        createdAt: true
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });
    
  } catch (error: any) {
    console.error('Erro na busca de usuários:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `User search error: ${error.message}`);
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
