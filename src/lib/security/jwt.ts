import crypto from "crypto";

export interface JWTPayload {
  userId: string;
  email: string;
  nome: string;
  iat?: number;
  exp?: number;
  deviceId?: string;
  sessionId?: string;
}

export interface SessionData {
  userId: string;
  email: string;
  nome: string;
  deviceId: string;
  createdAt: number;
  lastActivity: number;
  ip: string;
}

// Store de sessões em memória (em produção usar Redis)
const sessionStore = new Map<string, SessionData>();

/**
 * 🔐 Gerar token simples (sem JWT por enquanto)
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  const data = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
  };

  const token = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET || "numbly_fallback_secret")
    .update(token)
    .digest("hex");

  return `${token}.${signature}`;
}

/**
 * 🔍 Verificar e decodificar token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    // Verificar assinatura
    const expectedSignature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "numbly_fallback_secret")
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Token signature verification failed");
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());

    // Verificar expiração
    if (decoded.exp && Date.now() > decoded.exp) {
      console.error("Token expired");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * 🆔 Gerar session ID único
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * 📱 Gerar device ID baseado em características do dispositivo
 */
export function generateDeviceId(userAgent: string, ip: string): string {
  const deviceFingerprint = `${userAgent}:${ip}`;
  return crypto
    .createHash("sha256")
    .update(deviceFingerprint)
    .digest("hex")
    .substring(0, 16);
}

/**
 * 💾 Criar sessão de usuário
 */
export function createSession(
  userId: string,
  email: string,
  nome: string,
  ip: string,
  userAgent: string,
): { sessionId: string; token: string } {
  const sessionId = generateSessionId();
  const deviceId = generateDeviceId(userAgent, ip);

  const sessionData: SessionData = {
    userId,
    email,
    nome,
    deviceId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ip,
  };

  sessionStore.set(sessionId, sessionData);

  const token = generateToken({
    userId,
    email,
    nome,
    deviceId,
    sessionId,
  });

  return { sessionId, token };
}

/**
 * ✅ Validar sessão existente
 */
export function validateSession(
  sessionId: string,
  ip: string,
): SessionData | null {
  const session = sessionStore.get(sessionId);

  if (!session) {
    return null;
  }

  // Verificar se a sessão expirou (7 dias)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (session.createdAt < sevenDaysAgo) {
    sessionStore.delete(sessionId);
    return null;
  }

  // Verificar se houve atividade recente (1 dia)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (session.lastActivity < oneDayAgo) {
    sessionStore.delete(sessionId);
    return null;
  }

  // Verificar se o IP mudou (medida de segurança)
  if (session.ip !== ip) {
    console.warn(
      `IP mismatch for session ${sessionId}: ${session.ip} vs ${ip}`,
    );
    // Em produção, pode querer invalidar a sessão ou solicitar reautenticação
  }

  // Atualizar última atividade
  session.lastActivity = Date.now();
  sessionStore.set(sessionId, session);

  return session;
}

/**
 * 🗑️ Invalidar sessão
 */
export function invalidateSession(sessionId: string): boolean {
  return sessionStore.delete(sessionId);
}

/**
 * 👤 Obter sessão por user ID
 */
export function getSessionsByUserId(userId: string): SessionData[] {
  const sessions: SessionData[] = [];

  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.userId === userId) {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * 🧹 Limpar sessões expiradas
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  for (const [sessionId, session] of sessionStore.entries()) {
    if (
      session.createdAt < sevenDaysAgo ||
      session.lastActivity < sevenDaysAgo
    ) {
      sessionStore.delete(sessionId);
    }
  }
}

/**
 * 📊 Obter estatísticas de sessões ativas
 */
export function getSessionStats() {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  let activeSessions = 0;
  let recentSessions = 0;
  let currentSessions = 0;

  for (const session of sessionStore.values()) {
    if (session.lastActivity > oneDayAgo) {
      activeSessions++;
    }
    if (session.lastActivity > oneHourAgo) {
      recentSessions++;
    }
    if (session.lastActivity > oneHourAgo - 5 * 60 * 1000) {
      // 5 min
      currentSessions++;
    }
  }

  return {
    total: sessionStore.size,
    active24h: activeSessions,
    recent1h: recentSessions,
    current5m: currentSessions,
  };
}

// Limpeza automática a cada hora
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
