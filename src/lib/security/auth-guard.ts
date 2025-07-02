import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface SecurityContext {
  ip: string;
  userAgent: string;
  riskScore: number;
  timestamp: number;
  endpoint: string;
  method: string;
  userId?: string;
  deviceId?: string;
  country?: string;
  isTor?: boolean;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store em memória para rate limiting (em produção usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();
const securityLogs = new Map<string, Array<{ event: string; context: SecurityContext; message: string; timestamp: number }>>();

/**
 * 🛡️ Rate limiting simples em memória (flexível para desenvolvimento)
 */
export function checkRateLimit(key: string, windowMs: number, maxRequests: number, options: { allowLocalhost?: boolean } = {}): boolean {
  // Em desenvolvimento com localhost, aumentar significativamente os limites
  if (options.allowLocalhost && process.env.NODE_ENV === 'development') {
    // Verificar se a chave contém indicadores de localhost
    if (key.includes('127.0.0.1') || key.includes('localhost') || key.includes('::1') || key.includes('unknown')) {
      maxRequests = Math.max(maxRequests * 10, 100); // Aumenta pelo menos 10x ou mínimo 100
      windowMs = Math.max(windowMs, 60000); // Mínimo 1 minuto de janela
    }
  }

  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Nova janela ou primeira requisição
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false; // Rate limit excedido
  }
  
  // Incrementa contador
  entry.count++;
  rateLimitStore.set(key, entry);
  return true;
}

/**
 * 🔍 Calcular score de risco baseado em heurísticas avançadas
 */
function calculateRiskScore(req: NextRequest, ip: string, userAgent: string): number {
  let score = 0;
  
  // IP suspeito (lista simples + verificações avançadas)
  const suspiciousIPs = ['127.0.0.1', '0.0.0.0', '::1'];
  if (suspiciousIPs.includes(ip)) score += 30;
  
  // Verificar se é IP local/privado
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) score += 10;
  
  // User-Agent suspeito
  if (!userAgent || userAgent.length < 10) score += 25;
  if (userAgent.toLowerCase().includes('bot')) score += 20;
  if (userAgent.toLowerCase().includes('curl')) score += 30;
  if (userAgent.toLowerCase().includes('wget')) score += 30;
  if (userAgent.toLowerCase().includes('python')) score += 25;
  if (userAgent.toLowerCase().includes('postman')) score += 15;
  
  // Headers suspeitos
  const referer = req.headers.get('referer');
  if (!referer && req.method === 'POST') score += 15;
  
  // Sem headers de segurança modernos
  if (!req.headers.get('sec-fetch-site')) score += 10;
  if (!req.headers.get('accept-language')) score += 5;
  
  // Verificações de headers específicos
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor && xForwardedFor.split(',').length > 3) score += 10; // Muitos proxies
  
  // Verificar se há tentativa de bypass de CORS
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host && !origin.includes(host) && req.method === 'POST') score += 20;
  
  return Math.min(score, 100); // Max 100
}

/**
 * 🛡️ Auth Guard principal
 */
export async function authGuard(req: NextRequest, options: { allowLocalhost?: boolean } = {}): Promise<SecurityContext> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
           req.headers.get('x-real-ip') || 
           req.headers.get('cf-connecting-ip') || 
           'unknown';
           
  const userAgent = req.headers.get('user-agent') || '';
  
  // Reduzir score de risco para localhost em desenvolvimento
  let riskScore = calculateRiskScore(req, ip, userAgent);
  if (options.allowLocalhost && process.env.NODE_ENV === 'development') {
    if (ip.includes('127.0.0.1') || ip.includes('localhost') || ip.includes('::1')) {
      riskScore = Math.max(0, riskScore - 50); // Reduz score significativamente
    }
  }
  
  const context: SecurityContext = {
    ip: ip.trim(),
    userAgent,
    riskScore,
    timestamp: Date.now(),
    endpoint: req.nextUrl.pathname,
    method: req.method
  };
  
  // Flexibilizar bloqueio para localhost em desenvolvimento
  const blockThreshold = (options.allowLocalhost && process.env.NODE_ENV === 'development') ? 95 : 80;
  
  // Bloquear IPs com score muito alto
  if (riskScore >= blockThreshold) {
    logSecurityEvent('HIGH_RISK_BLOCKED', context, `High risk score: ${riskScore}`);
    throw new Error('Access denied due to security policy');
  }
  
  return context;
}

/**
 * 🔐 Verificar autenticação JWT
 */
export function verifyAuth(token: string): { userId: string; email?: string } | null {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    return {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    return null;
  }
}

/**
 * 📝 Log de eventos de segurança
 */
export function logSecurityEvent(
  event: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'RATE_LIMITED' | 'SUSPICIOUS' | 'HIGH_RISK_BLOCKED',
  context: SecurityContext,
  message: string
): void {
  const logEntry = {
    event,
    context,
    message,
    timestamp: Date.now()
  };
  
  // Armazenar logs por IP (limitar a 100 entradas por IP)
  const ipLogs = securityLogs.get(context.ip) || [];
  ipLogs.push(logEntry);
  
  if (ipLogs.length > 100) {
    ipLogs.shift(); // Remove o mais antigo
  }
  
  securityLogs.set(context.ip, ipLogs);
  
  // Log no console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY] ${event}: ${message}`, {
      ip: context.ip,
      endpoint: context.endpoint,
      riskScore: context.riskScore
    });
  }
  
  // Em produção, enviar para serviço de monitoramento
  if (process.env.NODE_ENV === 'production' && (event === 'HIGH_RISK_BLOCKED' || event === 'SUSPICIOUS')) {
    // Aqui você integraria com Sentry, DataDog, etc.
    console.error(`[SECURITY ALERT] ${event}: ${message}`, logEntry);
  }
}

/**
 * 🚨 Manipular erros de segurança
 */
export function handleSecurityError(error: any, context?: SecurityContext): never {
  if (context) {
    logSecurityEvent('SUSPICIOUS', context, `Security error: ${error.message}`);
  }
  
  throw new Error('Security validation failed');
}

/**
 * 📊 Obter estatísticas de segurança (para admin)
 */
export function getSecurityStats() {
  const stats = {
    totalIPs: securityLogs.size,
    rateLimitEntries: rateLimitStore.size,
    recentEvents: [] as any[]
  };
  
  // Coletar eventos recentes de todos os IPs
  securityLogs.forEach((logs, ip) => {
    const recentLogs = logs.filter(log => Date.now() - log.timestamp < 24 * 60 * 60 * 1000); // Últimas 24h
    stats.recentEvents.push(...recentLogs);
  });
  
  // Ordenar por timestamp
  stats.recentEvents.sort((a, b) => b.timestamp - a.timestamp);
  stats.recentEvents = stats.recentEvents.slice(0, 50); // Últimos 50 eventos
  
  return stats;
}

/**
 * 🧹 Limpeza periódica de dados antigos
 */
export function cleanupSecurityData(): void {
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  // Limpar rate limits expirados
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  
  // Limpar logs antigos
  for (const [ip, logs] of securityLogs.entries()) {
    const recentLogs = logs.filter(log => log.timestamp > oneDayAgo);
    
    if (recentLogs.length === 0) {
      securityLogs.delete(ip);
    } else if (recentLogs.length !== logs.length) {
      securityLogs.set(ip, recentLogs);
    }
  }
}

// Executar limpeza a cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupSecurityData, 60 * 60 * 1000);
}

/**
 * 🔐 Gerar hash SHA-256 para dados sensíveis
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

/**
 * 🎯 Validar se o IP é suspeito
 */
export function isIPSuspicious(ip: string): boolean {
  const suspiciousPatterns = [
    /^127\./, // localhost
    /^192\.168\./, // rede privada
    /^10\./, // rede privada
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // rede privada
    /^0\.0\.0\.0$/, // inválido
    /^::1$/, // localhost IPv6
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(ip));
}

/**
 * 🚨 Verificar se excedeu limites de tentativas por endpoint
 */
export function checkEndpointThrottle(ip: string, endpoint: string, maxAttempts: number = 20): boolean {
  const ipLogs = securityLogs.get(ip) || [];
  const recentLogs = ipLogs.filter(log => 
    Date.now() - log.timestamp < 60000 && // Última hora
    log.context.endpoint === endpoint
  );
  
  return recentLogs.length < maxAttempts;
}

/**
 * 🛡️ Middleware de proteção para APIs críticas
 */
export function createSecurityMiddleware(options: {
  rateLimit?: { window: number; max: number };
  requireAuth?: boolean;
  allowedOrigins?: string[];
  maxRiskScore?: number;
}) {
  return async function securityMiddleware(req: NextRequest) {
    const context = await authGuard(req);
    
    // Verificar rate limit específico
    if (options.rateLimit) {
      const key = `${context.endpoint}_${context.ip}`;
      if (!checkRateLimit(key, options.rateLimit.window, options.rateLimit.max, { allowLocalhost: true })) {
        throw new Error('Rate limit exceeded');
      }
    }
    
    // Verificar origem se especificada
    if (options.allowedOrigins && options.allowedOrigins.length > 0) {
      const origin = req.headers.get('origin');
      if (origin && !options.allowedOrigins.includes(origin)) {
        logSecurityEvent('SUSPICIOUS', context, `Origin not allowed: ${origin}`);
        throw new Error('Origin not allowed');
      }
    }
    
    // Verificar score de risco máximo
    if (options.maxRiskScore && context.riskScore > options.maxRiskScore) {
      throw new Error('Risk score too high');
    }
    
    return context;
  };
}

/**
 * 📝 Log de segurança alternativo (para compatibilidade)
 */
export function addSecurityLog(
  level: 'error' | 'info' | 'warn' | 'critical',
  context: { ip: string; userAgent: string; endpoint: string; method: string },
  message: string
): void {
  // Converter para o formato do logSecurityEvent
  const securityContext: SecurityContext = {
    ip: context.ip,
    userAgent: context.userAgent,
    riskScore: 0,
    timestamp: Date.now(),
    endpoint: context.endpoint,
    method: context.method
  };
  
  // Mapear levels para eventos de segurança
  let event: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'RATE_LIMITED' | 'SUSPICIOUS' | 'HIGH_RISK_BLOCKED';
  
  switch (level) {
    case 'critical':
      event = 'HIGH_RISK_BLOCKED';
      break;
    case 'error':
      event = 'AUTH_FAILURE';
      break;
    case 'warn':
      event = 'SUSPICIOUS';
      break;
    case 'info':
    default:
      event = 'AUTH_SUCCESS';
      break;
  }
  
  logSecurityEvent(event, securityContext, message);
}
