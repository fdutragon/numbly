import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';

// Schema para atualização de perfil
const UpdateProfileSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras')
    .optional(),
  pushEnabled: z.boolean().optional()
});

// Rate limiting para atualizações
const UPDATE_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 10 // 10 atualizações por minuto
};

// Simular "sessão" do usuário (em produção seria JWT/session)
const mockUser = {
  id: '1',
  nome: 'Usuário Teste',
  dataNascimento: '1990-01-01',
  numeroDestino: 1,
  pushEnabled: false,
  plano: 'gratuito' as const,
  created: new Date().toISOString()
};

export async function GET(request: NextRequest) {
  try {
    const securityContext = await authGuard(request);
    
    logSecurityEvent('AUTH_SUCCESS', securityContext, 'Profile accessed');
    
    return NextResponse.json({
      success: true,
      user: mockUser
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. Validação de segurança
    securityContext = await authGuard(request);
    
    // 2. Rate limiting
    const updateKey = `update_profile_${securityContext.ip}`;
    if (!checkRateLimit(updateKey, UPDATE_RATE_LIMIT.window, UPDATE_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Profile update rate limit exceeded');
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }
    
    // 3. Validar dados
    const body = await request.json();
    let validatedData: z.infer<typeof UpdateProfileSchema>;
    
    try {
      validatedData = UpdateProfileSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid profile update data: ${errorMessages}`);
        
        return NextResponse.json({
          error: 'Dados inválidos',
          details: error.errors[0]?.message || 'Dados de entrada inválidos'
        }, { status: 400 });
      }
      throw error;
    }
    
    // 4. Atualizar usuário (mock)
    if (validatedData.nome) {
      mockUser.nome = validatedData.nome.trim();
    }
    
    if (validatedData.pushEnabled !== undefined) {
      mockUser.pushEnabled = validatedData.pushEnabled;
    }
    
    // 5. Log de sucesso
    logSecurityEvent('AUTH_SUCCESS', securityContext, `Profile updated for user: ${mockUser.id}`);
    
    return NextResponse.json({
      success: true,
      user: mockUser,
      message: 'Perfil atualizado com sucesso!'
    });
    
  } catch (error: any) {
    console.error('Erro na atualização do perfil:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Profile update error: ${error.message}`);
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
