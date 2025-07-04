import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import {
  authGuard,
  logSecurityEvent,
  checkRateLimit,
} from "@/lib/security/auth-guard";
import type { SecurityContext } from "@/lib/security/auth-guard";
import { z } from "zod";
import { createToken } from "@/lib/auth";

// 🔒 Schema de validação unificado para login
const UnifiedLoginSchema = z.union([
  // Login tradicional (email + data nascimento)
  z.object({
    type: z.literal("email").optional(),
    email: z.string().email("Email inválido"),
    birthDate: z
      .string()
      .regex(
        /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})$/,
        "Formato de data inválido",
      ),
    deviceId: z.string().optional(),
  }),
  // Login via device
  z.object({
    type: z.literal("device"),
    deviceId: z.string().min(1, "DeviceId é obrigatório"),
    deviceName: z.string().optional(),
    platform: z.string().optional(),
  }),
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

export const dynamic = "force-dynamic";

// Rate limiting específico para login (mais restritivo)
const LOGIN_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 5, // 5 tentativas por 5 minutos
} as const;

/**
 * 🛡️ Normaliza data de nascimento para formato Date
 */
function normalizeBirthDate(
  dateInput: string | Date | null | undefined,
): Date | null {
  if (!dateInput) return null;

  const dateStr = dateInput.toString().trim();

  // Formato ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00.000Z");
  }

  // Formato brasileiro (DD/MM/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/");
    return new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`,
    );
  }

  return null;
}

/**
 * 🔍 Login por email e data de nascimento
 */
async function loginByEmail(
  email: string,
  birthDate: string,
  securityContext: SecurityContext,
): Promise<AuthUser | null> {
  // Normalizar data para comparação
  const normalizedInputDate = normalizeBirthDate(birthDate);
  if (!normalizedInputDate) {
    logSecurityEvent(
      "SUSPICIOUS",
      securityContext,
      "Invalid birth date format",
    );
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
    },
  });

  if (!user) {
    logSecurityEvent(
      "AUTH_FAILURE",
      securityContext,
      `User not found: ${email}`,
    );
    return null;
  }

  // Verificar data de nascimento
  const userBirthDate = new Date(user.birthDate);
  const inputBirthDate = normalizedInputDate;

  if (userBirthDate.getTime() !== inputBirthDate.getTime()) {
    logSecurityEvent(
      "AUTH_FAILURE",
      securityContext,
      `Wrong birth date for user: ${user.id}`,
    );
    return null;
  }

  return user;
}

// Corrige loginByDevice: busca deve ser findFirst (não findUnique) e garantir include: { user }
async function loginByDevice(
  deviceId: string,
  deviceName?: string,
  platform?: string,
  userAgent?: string,
  securityContext?: SecurityContext,
): Promise<AuthUser | null> {
  // Buscar dispositivo e usuário associado
  const userDevice = await db.userDevice.findFirst({
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
          createdAt: true,
        },
      },
    },
  });

  if (!userDevice || !userDevice.isActive || !userDevice.user) {
    if (securityContext) {
      logSecurityEvent(
        "SUSPICIOUS",
        securityContext,
        `Invalid device login attempt: ${deviceId}`,
      );
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
      userAgent: userAgent || userDevice.userAgent,
    },
  });

  return userDevice.user;
}

/**
 * 🔐 Endpoint de Login Unificado - Suporta email e device
 * POST /api/auth/login
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<LoginResponse>> {
  let securityContext: SecurityContext | undefined;
  try {
    console.log("[LOGIN] Início do handler");
    // 1. 🛡️ Validação de segurança inicial
    try {
      securityContext = await authGuard(req, { allowLocalhost: true });
      console.log("[LOGIN] Segurança OK", securityContext);
    } catch (error: any) {
      console.error("[LOGIN] Falha na segurança:", error);
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: "Acesso negado",
          message: "Falha na validação de segurança",
        },
        { status: 403 },
      );
    }

    // 2. 🚦 Rate limiting específico para login (flexível para localhost)
    const loginKey = `login_${securityContext.ip}`;
    if (
      !checkRateLimit(loginKey, LOGIN_RATE_LIMIT.window, LOGIN_RATE_LIMIT.max, {
        allowLocalhost: true,
      })
    ) {
      logSecurityEvent(
        "RATE_LIMITED",
        securityContext,
        "Login attempts exceeded",
      );
      console.warn("[LOGIN] Rate limit atingido");
      return NextResponse.json(
        {
          success: false,
          error: "Muitas tentativas de login",
          message: "Tente novamente em 5 minutos",
        },
        { status: 429 },
      );
    }

    // 3. 📝 Validação e sanitização dos dados de entrada
    const body = await req.json().catch(() => ({}));
    console.log("[LOGIN] Body recebido:", body);
    let validatedData;
    try {
      validatedData = UnifiedLoginSchema.parse(body);
      console.log("[LOGIN] Dados validados:", validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logSecurityEvent(
          "SUSPICIOUS",
          securityContext,
          `Invalid login data: ${error.errors[0]?.message}`,
        );
        console.error("[LOGIN] Dados inválidos:", error.errors);
        return NextResponse.json(
          {
            success: false,
            error: "Dados inválidos",
            message: error.errors[0]?.message || "Dados de entrada inválidos",
          },
          { status: 400 },
        );
      }
      throw error;
    }

    // Adicionar logs detalhados na validação de credenciais
    console.log("[LOGIN] Validando credenciais...");

    // 4. 🔍 Executar login baseado no tipo
    let user: AuthUser | null = null;
    if ("type" in validatedData && validatedData.type === "device") {
      const { deviceId, deviceName, platform } = validatedData;
      user = await loginByDevice(
        deviceId,
        deviceName,
        platform,
        securityContext.userAgent,
        securityContext,
      );
      console.log("[LOGIN] Resultado login device:", user);

      if (!user) {
        // Device não encontrado, tentar criar um usuário demo/temporário
        console.log("[LOGIN] Device não encontrado, criando usuário demo...");
        try {
          // Buscar ou criar usuário demo
          let demoUser = await db.user.findFirst({
            where: {
              email: "demo@numbly.life",
            },
          });

          if (!demoUser) {
            // Criar usuário demo se não existir
            demoUser = await db.user.create({
              data: {
                name: "Usuário Demo",
                email: "demo@numbly.life",
                birthDate: new Date("1990-01-01"),
                isPremium: false,
                numerologyData: {
                  numeroDestino: 1,
                  numeroAlma: 2,
                  numeroExpressao: 3,
                  numeroPersonalidadeExterna: 4,
                },
              },
            });
          }

          // Criar ou atualizar device para este usuário
          const safeDeviceName = deviceName || "Unknown Device";
          const safeUserAgent = securityContext.userAgent || "Unknown";
          const safePlatform = platform || "web";
          const existingDevice = await db.userDevice.findFirst({
            where: { deviceId },
          });
          if (existingDevice) {
            await db.userDevice.update({
              where: { id: existingDevice.id },
              data: {
                userId: demoUser.id,
                lastSeen: new Date(),
                isActive: true,
                deviceName: safeDeviceName,
                userAgent: safeUserAgent,
                platform: safePlatform,
              },
            });
          } else {
            await db.userDevice.create({
              data: {
                userId: demoUser.id,
                deviceId,
                deviceName: safeDeviceName,
                userAgent: safeUserAgent,
                platform: safePlatform,
                isActive: true,
              },
            });
          }

          user = {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            birthDate: demoUser.birthDate,
            isPremium: demoUser.isPremium,
            numerologyData: demoUser.numerologyData,
            createdAt: demoUser.createdAt,
          };

          console.log("[LOGIN] Usuário demo criado/associado com sucesso");
        } catch (error) {
          console.error("[LOGIN] Erro ao criar usuário demo:", error);
        }
      }

      if (user) {
        logSecurityEvent(
          "AUTH_SUCCESS",
          securityContext,
          `Device login successful: ${deviceId}`,
        );
      }
    } else {
      const { email, birthDate, deviceId } = validatedData;
      user = await loginByEmail(email, birthDate, securityContext);
      console.log("[LOGIN] Resultado login email:", user);
      if (user) {
        logSecurityEvent(
          "AUTH_SUCCESS",
          securityContext,
          `Email login successful: ${email}`,
        );
        if (deviceId) {
          try {
            // Garantir valores seguros para deviceName, userAgent e platform
            const safeDeviceName =
              securityContext.userAgent || "Unknown Device";
            const safeUserAgent = securityContext.userAgent || "Unknown";
            const safePlatform = "web";
            // Buscar device pelo deviceId (findFirst, pois deviceId pode não ser unique)
            const existingDevice = await db.userDevice.findFirst({
              where: { deviceId },
            });
            if (existingDevice) {
              await db.userDevice.update({
                where: { id: existingDevice.id },
                data: {
                  userId: user.id,
                  lastSeen: new Date(),
                  isActive: true,
                  deviceName: safeDeviceName,
                  userAgent: safeUserAgent,
                  platform: safePlatform,
                },
              });
            } else {
              await db.userDevice.create({
                data: {
                  userId: user.id,
                  deviceId,
                  deviceName: safeDeviceName,
                  userAgent: safeUserAgent,
                  platform: safePlatform,
                  isActive: true,
                },
              });
            }
            console.log("[LOGIN] Device upsert OK");
          } catch (deviceError) {
            console.log("[LOGIN] Erro no upsert de device:", deviceError);
          }
        }
      }
    }

    // Log detalhado do resultado da busca do usuário
    console.log("[LOGIN] Resultado da busca no banco de dados:", user);

    if (!user) {
      console.warn("[LOGIN] Usuário não autenticado");
      // Log detalhado da falha de autenticação
      console.log("[LOGIN] Credenciais rejeitadas, retornando erro 401");
      return NextResponse.json(
        {
          success: false,
          error: "Credenciais inválidas",
          message: "Email, data de nascimento ou dispositivo incorretos",
        },
        { status: 401 },
      );
    }

    // Resolução robusta do deviceId para o token JWT
    let resolvedDeviceId = "";
    if ("type" in validatedData && validatedData.type === "device") {
      resolvedDeviceId = validatedData.deviceId;
    } else if ("deviceId" in validatedData && validatedData.deviceId) {
      resolvedDeviceId = validatedData.deviceId;
    }
    console.log("[LOGIN] DeviceId para token:", resolvedDeviceId);

    // 5. 🎫 Gerar token JWT seguro
    const token = await createToken({
      userId: user.id,
      deviceId: resolvedDeviceId,
      nome: user.name || "",
    });
    console.log("[LOGIN] Token gerado:", token);

    // 6. 🍪 Resposta com cookie seguro
    const redirectTo = "/dashboard"; // ou '/profile', conforme desejado
    const response = NextResponse.json<LoginResponse & { redirectTo: string }>({
      success: true,
      message: "Login realizado com sucesso!",
      data: {
        user: {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          isPremium: user.isPremium,
          numerologyData: user.numerologyData,
        },
        token,
      },
      redirectTo,
    });

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
    });
    console.log("[LOGIN] Cookie setado e resposta enviada");
    return response;
  } catch (error: any) {
    console.error("[LOGIN] Erro inesperado:", error);
    if (securityContext) {
      logSecurityEvent(
        "SUSPICIOUS",
        securityContext,
        `Login error: ${error.message}`,
      );
    }
    return NextResponse.json<LoginResponse>(
      {
        success: false,
        error: "Erro interno do servidor",
        message: "Falha no processo de login",
      },
      { status: 500 },
    );
  }
}
