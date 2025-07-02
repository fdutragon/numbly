import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { gerarMapaNumerologicoCompleto } from '@/lib/numerologia';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import { createToken } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SecurityContext } from '@/lib/security/auth-guard';
import { randomUUID } from 'crypto';

// Schema de validação para registro
const RegisterSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  dataNascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  numeroDestino: z.number()
    .min(1, 'Número do destino deve ser entre 1 e 9')
    .max(9, 'Número do destino deve ser entre 1 e 9'),
  deviceId: z.string().uuid('Device ID deve ser um UUID válido'),
  userAgent: z.string().optional(),
  platform: z.string().optional()
});

// Rate limiting para registro
const REGISTER_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 3 // 3 registros por minuto por IP
};

// GET - Retorna informações da API de registro
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/register',
    method: 'POST',
    description: 'Endpoint para registro de novos usuários',
    requiredFields: ['nome', 'dataNascimento', 'numeroDestino'],
    optionalFields: ['pushEnabled'],
    rateLimit: '3 registros por minuto por IP'
  });
}

export async function POST(request: NextRequest) {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. Validação de segurança
    securityContext = await authGuard(request);
    
    // 2. Rate limiting
    const registerKey = `register_${securityContext.ip}`;
    if (!checkRateLimit(registerKey, REGISTER_RATE_LIMIT.window, REGISTER_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Register rate limit exceeded');
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }
    
    // 3. Validar dados de entrada
    const body = await request.json();
    let validatedData: z.infer<typeof RegisterSchema>;
    
    try {
      validatedData = RegisterSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid register data: ${errorMessages}`);
        
        return NextResponse.json({
          error: 'Dados inválidos',
          details: error.errors[0]?.message || 'Dados de entrada inválidos'
        }, { status: 400 });
      }
      throw error;
    }
    
    // 4. Validar se device já existe
    const existingDevice = await db.userDevice.findUnique({
      where: { deviceId: validatedData.deviceId },
      include: { user: true }
    });

    if (existingDevice) {
      return NextResponse.json({
        error: 'Device já registrado',
        userId: existingDevice.userId
      }, { status: 409 });
    }

    // 5. Validar data de nascimento
    const birthDate = new Date(validatedData.dataNascimento);
    const now = new Date();
    
    if (birthDate > now) {
      return NextResponse.json(
        { error: 'Data de nascimento não pode ser futura' },
        { status: 400 }
      );
    }
    
    if (now.getFullYear() - birthDate.getFullYear() > 120) {
      return NextResponse.json(
        { error: 'Data de nascimento inválida' },
        { status: 400 }
      );
    }
    
    // 6. Gerar mapa numerológico
    const numerologyData = gerarMapaNumerologicoCompleto(validatedData.nome.trim(), validatedData.dataNascimento);
    
    // 7. Criar usuário no banco
    const user = await db.user.create({
      data: {
        name: validatedData.nome.trim(),
        birthDate: new Date(validatedData.dataNascimento),
        numerologyData: numerologyData as any,
        isPremium: false,
        credits: 5, // Créditos iniciais
        hasSeenIntro: false
      }
    });

    // 8. Criar device associado ao usuário
    const userDevice = await db.userDevice.create({
      data: {
        userId: user.id,
        deviceId: validatedData.deviceId,
        deviceName: validatedData.platform || 'Dispositivo desconhecido',
        platform: validatedData.platform,
        userAgent: validatedData.userAgent,
        isActive: true,
        lastSeen: new Date()
      }
    });
    
    // 9. Criar assinatura gratuita inicial
    await db.userSubscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE'
      }
    });

    // 10. Gerar JWT token
    const token = await createToken({
      userId: user.id,
      deviceId: validatedData.deviceId,
      nome: user.name || ''
    });

    // 11. Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, `User registered via push: ${user.name} (${user.id})`);
    
    // 12. Criar response com cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : null,
        numerologyData: user.numerologyData,
        isPremium: user.isPremium,
        credits: user.credits
      },
      token,
      deviceId: userDevice.deviceId,
      message: 'Usuário registrado com sucesso!'
    });

    // 13. Setar cookie do token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      path: '/'
    });

    return response;
    
  } catch (error: any) {
    console.error('Erro no registro:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Register error: ${error.message}`);
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
