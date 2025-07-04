import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { db } from '../../../src/lib/db';
import { verifyToken } from '../../../src/lib/security/jwt';
import { authGuard, logSecurityEvent } from '../../../src/lib/security/auth-guard';
import type { SecurityContext } from '../../../src/lib/security/auth-guard';

// Schema de validação
const LoginJwtSchema = z.object({
  jwt: z.string().min(1, 'JWT é obrigatório')
});

/**
 * POST /api/auth/login-jwt
 * Autentica usuário via JWT recebido no push notification
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let securityContext: SecurityContext | undefined;

  try {
    // Converter NextApiRequest para formato esperado pelo authGuard
    const mockRequest = {
      headers: {
        get: (key: string) => {
          const k = key.toLowerCase();
          const value = req.headers[k];
          if (Array.isArray(value)) return value[0];
          return value;
        }
      },
      json: async () => req.body,
      url: req.url || '',
      method: req.method || 'POST',
      nextUrl: { pathname: req.url || '' }
    } as any;

    // Validação de segurança
    securityContext = await authGuard(mockRequest);
    
    // Validar dados de entrada
    const { jwt } = LoginJwtSchema.parse(req.body);

    // Verificar e decodificar JWT
    const decoded = verifyToken(jwt);
    if (!decoded || !decoded.userId) {
      logSecurityEvent('SUSPICIOUS', securityContext, 'Invalid JWT provided for login');
      return res.status(401).json({ 
        success: false, 
        error: 'Token JWT inválido ou expirado' 
      });
    }

    // Buscar usuário no banco
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
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
        numerologyData: true
      }
    });

    if (!user) {
      logSecurityEvent('SUSPICIOUS', securityContext, `JWT login attempt for non-existent user: ${decoded.userId}`);
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    // Atualizar timestamp de acesso (usando updatedAt como proxy para lastLogin)
    await db.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    // Buscar dados numerológicos do próprio campo numerologyData
    let mapa: typeof user.numerologyData = null;
    if (user.numerologyData && typeof user.numerologyData === 'object') {
      mapa = user.numerologyData;
    }

    // Definir cookie de sessão
    const sessionCookie = `numbly_session=${user.id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`; // 30 dias
    res.setHeader('Set-Cookie', sessionCookie);

    // Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, `JWT login successful for user: ${user.id}`);

    // Retornar dados do usuário
    return res.json({
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
        updatedAt: user.updatedAt
      },
      mapa: mapa || undefined
    });

  } catch (error: any) {
    console.error('Erro no login JWT:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `JWT login error: ${error.message}`);
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors[0]?.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
