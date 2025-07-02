import { NextRequest, NextResponse } from 'next/server';
import { 
  SecurityUtils, 
  SECURITY_DEFAULTS, 
  SecurityLogger,
  createSession,
  generateToken,
  verifyToken
} from '@/lib/security';

/**
 * 🧪 Endpoint de teste para o sistema de segurança
 * GET /api/test/security - Relatório de segurança
 * POST /api/test/security - Teste de criação de sessão
 */

async function handleGET(req: NextRequest) {
  try {
    const report = SecurityUtils.getFullSecurityReport();
    
    SecurityLogger.info('Security report requested');
    
    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    SecurityLogger.error('Error generating security report', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório de segurança' },
      { status: 500 }
    );
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const { userId, email, nome } = await req.json();
    
    if (!userId || !email || !nome) {
      return NextResponse.json(
        { error: 'userId, email e nome são obrigatórios' },
        { status: 400 }
      );
    }
    
    const ip = req.headers.get('x-forwarded-for') || 'test-ip';
    const userAgent = req.headers.get('user-agent') || 'test-agent';
    
    // Criar sessão
    const session = createSession(userId, email, nome, ip, userAgent);
    
    // Testar verificação do token
    const verification = verifyToken(session.token);
    
    SecurityLogger.info('Test session created', { userId, email });
    
    return NextResponse.json({
      success: true,
      message: 'Sessão de teste criada com sucesso',
      session: {
        sessionId: session.sessionId,
        tokenValid: !!verification,
        user: verification
      },
      securityDefaults: SECURITY_DEFAULTS
    });
    
  } catch (error: any) {
    SecurityLogger.error('Error creating test session', error);
    return NextResponse.json(
      { error: 'Erro ao criar sessão de teste' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleGET(req);
}

export async function POST(req: NextRequest) {
  return handlePOST(req);
}
