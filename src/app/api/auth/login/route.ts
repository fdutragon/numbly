import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authGuard, handleSecurityError, logSecurityEvent, checkRateLimit } from "@/lib/security/auth-guard";
import type { SecurityContext } from "@/lib/security/auth-guard";
import { z } from "zod";
import jwt from "jsonwebtoken";

// 🔒 Schema de validação unificado para login
const UnifiedLoginSchema = z.union([
  // Login tradicional (email + data nascimento)
  z.object({
    type: z.literal('email').optional(),
    email: z.string().email('Email inválido'),
    birthDate: z.string().regex(
      /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})$/,
      'Formato de data inválido'
    ),
    deviceId: z.string().optional()
  }),
  // Login via device
  z.object({
    type: z.literal('device'),
    deviceId: z.string().min(1, 'DeviceId é obrigatório'),
    deviceName: z.string().optional(),
    platform: z.string().optional()
  })
]);

// 🔒 Interfaces TypeScript para type safety
interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  birthDate: Date;
  isPremium: boolean;
  numerologyData: any;
  createdAt: Date;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      isPremium: boolean;
      numerologyData?: any;
    };
    token: string;
  };
}

export const dynamic = 'force-dynamic';

// Rate limiting específico para login (mais restritivo)
const LOGIN_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 5 // 5 tentativas por 5 minutos
} as const;

/**
 * 🛡️ Normaliza data de nascimento para formato Date
 */
function normalizeBirthDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  
  const dateStr = dateInput.toString().trim();
  
  // Formato ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00.000Z');
  }
  
  // Formato brasileiro (DD/MM/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
  }
  
  return null;
}

/**
 * 🔍 Login por email e data de nascimento
 */
async function loginByEmail(email: string, birthDate: string, securityContext: SecurityContext): Promise<AuthUser | null> {
  // Normalizar data para comparação
  const normalizedInputDate = normalizeBirthDate(birthDate);
  if (!normalizedInputDate) {
    logSecurityEvent('SUSPICIOUS', securityContext, 'Invalid birth date format');
    return null;
  }

  // Buscar usuário por email
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      isPremium: true,
      numerologyData: true,
      createdAt: true,
    }
  });

  if (!user) {
    logSecurityEvent('AUTH_FAILURE', securityContext, `User not found: ${email}`);
    return null;
  }

  // Verificar data de nascimento
  const userBirthDate = new Date(user.birthDate);
  const inputBirthDate = normalizedInputDate;
  
  if (userBirthDate.getTime() !== inputBirthDate.getTime()) {
    logSecurityEvent('AUTH_FAILURE', securityContext, `Wrong birth date for user: ${user.id}`);
    return null;
  }

  return user;
}

/**
 * 🔍 Login por device ID
 */
async function loginByDevice(deviceId: string, deviceName?: string, platform?: string, userAgent?: string, securityContext?: SecurityContext): Promise<AuthUser | null> {
  // Buscar dispositivo e usuário associado
  const userDevice = await db.userDevice.findUnique({
    where: { deviceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          birthDate: true,
          isPremium: true,
          numerologyData: true,
          createdAt: true
        }
      }
    }
  });

  if (!userDevice || !userDevice.isActive) {
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Invalid device login attempt: ${deviceId}`);
    }
    return null;
  }

  // Atualizar última visualização do dispositivo
  await db.userDevice.update({
    where: { id: userDevice.id },
    data: {
      lastSeen: new Date(),
      deviceName: deviceName || userDevice.deviceName,
      platform: platform || userDevice.platform,
      userAgent: userAgent || userDevice.userAgent
    }
  });

  return userDevice.user;
}

/**
 * 🔐 Endpoint de Login Unificado - Suporta email e device
 * POST /api/auth/login
 */
export async function POST(req: NextRequest): Promise<NextResponse<LoginResponse>> {
  let securityContext: SecurityContext | undefined;
  
  try {
    // 1. 🛡️ Validação de segurança inicial
    try {
      securityContext = await authGuard(req, { allowLocalhost: true });
    } catch (error: any) {
      return NextResponse.json<LoginResponse>({
        success: false,
        error: 'Acesso negado',
        message: 'Falha na validação de segurança'
      }, { status: 403 });
    }

    // 2. 🚦 Rate limiting específico para login (flexível para localhost)
    const loginKey = `login_${securityContext.ip}`;
    if (!checkRateLimit(loginKey, LOGIN_RATE_LIMIT.window, LOGIN_RATE_LIMIT.max, { allowLocalhost: true })) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Login attempts exceeded');
      return NextResponse.json({
        success: false,
        error: 'Muitas tentativas de login',
        message: 'Tente novamente em 5 minutos'
      }, { status: 429 });
    }

    // 3. 📝 Validação e sanitização dos dados de entrada
    const body = await req.json().catch(() => ({}));
    
    let validatedData;
    try {
      validatedData = UnifiedLoginSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logSecurityEvent('SUSPICIOUS', securityContext, `Invalid login data: ${error.errors[0]?.message}`);
        return NextResponse.json({
          success: false,
          error: 'Dados inválidos',
          message: error.errors[0]?.message || 'Dados de entrada inválidos'
        }, { status: 400 });
      }
      throw error;
    }

    // 4. 🔍 Executar login baseado no tipo
    let user: AuthUser | null = null;
    
    if ('type' in validatedData && validatedData.type === 'device') {
      // Login via device
      const { deviceId, deviceName, platform } = validatedData;
      user = await loginByDevice(deviceId, deviceName, platform, securityContext.userAgent, securityContext);

      // Se não encontrou o device, criar automaticamente em dev
      if (!user && process.env.NODE_ENV === 'development' && deviceId.startsWith('device_')) {
        // Buscar usuário de teste padrão (ajuste conforme necessário)
        const testUser = await db.user.findFirst();
        if (testUser) {
          await db.userDevice.create({
            data: {
              userId: testUser.id,
              deviceId,
              deviceName: deviceName || 'Dev Device',
              userAgent: securityContext.userAgent,
              platform: platform || 'dev',
              isActive: true,
              lastSeen: new Date()
            }
          });
          user = await loginByDevice(deviceId, deviceName, platform, securityContext.userAgent, securityContext);
          logSecurityEvent('SUSPICIOUS', securityContext, `Device auto-criado em dev: ${deviceId}`);
        }
      }

      if (user) {
        logSecurityEvent('AUTH_SUCCESS', securityContext, `Device login successful: ${deviceId}`);
      }
    } else {
      // Login via email e data nascimento
      const { email, birthDate, deviceId } = validatedData;
      user = await loginByEmail(email, birthDate, securityContext);
      
      if (user) {
        logSecurityEvent('AUTH_SUCCESS', securityContext, `Email login successful: ${email}`);
        
        // Se deviceId fornecido, criar/atualizar relação
        if (deviceId) {
          try {
            await db.userDevice.upsert({
              where: { deviceId },
              update: {
                userId: user.id,
                lastSeen: new Date(),
                isActive: true
              },
              create: {
                userId: user.id,
                deviceId,
                deviceName: securityContext.userAgent || 'Unknown Device',
                userAgent: securityContext.userAgent,
                platform: 'web'
              }
            });
          } catch (deviceError) {
            console.log('Warning: Could not create/update device relation:', deviceError);
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais inválidas',
        message: 'Email, data de nascimento ou dispositivo incorretos'
      }, { status: 401 });
    }

    // 5. 🎫 Gerar token JWT seguro
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logSecurityEvent('SUSPICIOUS', securityContext, 'JWT_SECRET not configured');
      return NextResponse.json({
        success: false,
        error: 'Configuração inválida',
        message: 'Erro de configuração do servidor'
      }, { status: 500 });
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: 'USER'
      },
      jwtSecret,
      { 
        expiresIn: '7d',
        issuer: 'numbly.life',
        audience: 'numbly-users'
      }
    );

    // 6. 🍪 Resposta com cookie seguro
    const response = NextResponse.json<LoginResponse>({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        user: {
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          isPremium: user.isPremium,
          numerologyData: user.numerologyData
        },
        token
      }
    });

    // Cookie seguro
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    
    if (securityContext) {
      logSecurityEvent('SUSPICIOUS', securityContext, `Login error: ${error.message}`);
    }
    
    return NextResponse.json<LoginResponse>({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha no processo de login'
    }, { status: 500 });
  }
}
