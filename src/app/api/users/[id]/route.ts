import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard, logSecurityEvent } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * 👤 GET - Buscar usuário por ID
 * GET /api/users/[id]
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. Validação de segurança
    securityContext = await authGuard(req);
    
    const { params } = context;
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    // 2. Buscar usuário no banco
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        birthDate: true,
        profileImage: true,
        bio: true,
        isPremium: true,
        credits: true,
        numerologyData: true,
        hasSeenIntro: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          where: { isActive: true },
          select: {
            plan: true,
            status: true,
            startDate: true,
            endDate: true
          },
          take: 1
        },
        _count: {
          select: {
            sentFriendRequests: true,
            receivedFriendRequests: true,
            compatibility: true,
            posts: true
          }
        }
      }
    });
    
    if (!user) {
      logSecurityEvent('SUSPICIOUS', securityContext, `User not found: ${id}`);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // 3. Formatar resposta
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      birthDate: user.birthDate?.toISOString().split('T')[0],
      profileImage: user.profileImage,
      bio: user.bio,
      isPremium: user.isPremium,
      credits: user.credits,
      numerologyData: user.numerologyData,
      hasSeenIntro: user.hasSeenIntro,
      subscription: user.subscriptions[0] || null,
      stats: {
        friendRequests: user._count.sentFriendRequests + user._count.receivedFriendRequests,
        compatibilityAnalyses: user._count.compatibility,
        posts: user._count.posts
      },
      memberSince: user.createdAt,
      lastUpdated: user.updatedAt
    };
    
    logSecurityEvent('AUTH_SUCCESS', securityContext, `User profile accessed: ${user.name} (${id})`);
    
    return NextResponse.json({
      success: true,
      user: userProfile
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Get user error: ${error.message}`);
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
