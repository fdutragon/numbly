import { NextRequest, NextResponse } from 'next/server';
import { authGuard, logSecurityEvent, checkRateLimit } from './auth-guard';
import { verifyToken, validateSession } from './jwt';
import type { SecurityContext } from './auth-guard';
import type { JWTPayload, SessionData } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
  session?: SessionData;
  securityContext?: SecurityContext;
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  rateLimit?: {
    window: number;
    max: number;
  };
  allowedRoles?: string[];
  skipSecurityCheck?: boolean;
  customSecurityCheck?: (context: SecurityContext) => boolean;
}

/**
 * 🛡️ Middleware de autenticação e segurança para APIs
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async function(req: NextRequest) {
    let securityContext: SecurityContext | undefined;
    let user: JWTPayload | undefined;
    let session: SessionData | undefined;

    try {
      // 1. 🛡️ Verificações de segurança (se não puladas)
      if (!options.skipSecurityCheck) {
        securityContext = await authGuard(req);
        
        // Verificação customizada de segurança
        if (options.customSecurityCheck && !options.customSecurityCheck(securityContext)) {
          logSecurityEvent('SUSPICIOUS', securityContext, 'Custom security check failed');
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }

      // 2. 🚦 Rate limiting (se configurado)
      if (options.rateLimit && securityContext) {
        const rateLimitKey = `${req.nextUrl.pathname}_${securityContext.ip}`;
        if (!checkRateLimit(rateLimitKey, options.rateLimit.window, options.rateLimit.max, { allowLocalhost: true })) {
          logSecurityEvent('RATE_LIMITED', securityContext, 'API rate limit exceeded');
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      }

      // 3. 🔐 Verificação de autenticação (se requerida)
      if (options.requireAuth) {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          return NextResponse.json(
            { error: 'Token de autenticação requerido' },
            { status: 401 }
          );
        }

        const userResult = verifyToken(token);
        if (!userResult) {
          return NextResponse.json(
            { error: 'Token inválido ou expirado' },
            { status: 401 }
          );
        }
        user = userResult;

        // Validar sessão se tiver sessionId
        if (user.sessionId && securityContext) {
          const sessionResult = validateSession(user.sessionId, securityContext.ip);
          if (!sessionResult) {
            return NextResponse.json(
              { error: 'Sessão inválida ou expirada' },
              { status: 401 }
            );
          }
          session = sessionResult;
        }

        // Verificar roles (se especificadas)
        if (options.allowedRoles && options.allowedRoles.length > 0) {
          // Em um sistema real, você teria roles no user payload
          // Por enquanto, assumimos que todos os usuários autenticados têm acesso
        }
      }

      // 4. ✅ Executar handler com contexto enriquecido
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;
      authenticatedReq.session = session;
      authenticatedReq.securityContext = securityContext;

      const response = await handler(authenticatedReq);

      // 5. 📝 Log de sucesso
      if (securityContext) {
        logSecurityEvent('AUTH_SUCCESS', securityContext, 
          `API access granted${user ? ` for user ${user.userId}` : ''}`
        );
      }

      return response;

    } catch (error: any) {
      console.error('Auth middleware error:', error);
      
      if (securityContext) {
        logSecurityEvent('SUSPICIOUS', securityContext, `Auth middleware error: ${error.message}`);
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * 🚀 Utilitários para criação rápida de middlewares
 */
export const authMiddleware = {
  /**
   * 🔓 API pública com rate limiting básico
   */
  public: (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, {
      requireAuth: false,
      rateLimit: { window: 60000, max: 100 } // 100 req/min
    }),

  /**
   * 🔐 API protegida que requer autenticação
   */
  protected: (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, {
      requireAuth: true,
      rateLimit: { window: 60000, max: 60 } // 60 req/min
    }),

  /**
   * 🛡️ API de alta segurança (admin, pagamentos, etc)
   */
  secure: (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, {
      requireAuth: true,
      rateLimit: { window: 60000, max: 20 }, // 20 req/min
      customSecurityCheck: (context) => context.riskScore < 30
    }),

  /**
   * 📧 API de webhook (rate limiting especial)
   */
  webhook: (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, {
      requireAuth: false,
      skipSecurityCheck: true, // Webhooks podem vir de IPs variados
      rateLimit: { window: 60000, max: 200 } // 200 req/min
    })
};

/**
 * 👤 Extrair dados do usuário de uma requisição autenticada
 */
export function getAuthUser(req: AuthenticatedRequest): JWTPayload | null {
  return req.user || null;
}

/**
 * 🏠 Extrair dados da sessão de uma requisição autenticada
 */
export function getAuthSession(req: AuthenticatedRequest): SessionData | null {
  return req.session || null;
}

/**
 * 🛡️ Extrair contexto de segurança de uma requisição
 */
export function getSecurityContext(req: AuthenticatedRequest): SecurityContext | null {
  return req.securityContext || null;
}
