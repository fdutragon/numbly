/**
 * 🛡️ Sistema de Segurança Completo do Numbly
 * 
 * Este módulo centraliza todas as funcionalidades de segurança:
 * - Auth Guard (proteção e análise de risco)
 * - JWT/Session Management (autenticação)
 * - Auth Middleware (middlewares para APIs)
 * - Rate Limiting (controle de taxa)
 * - Security Logging (logs de segurança)
 */

// Importar todas as funcionalidades
import {
  type SecurityContext,
  type RateLimitEntry,
  authGuard,
  checkRateLimit,
  logSecurityEvent,
  handleSecurityError,
  getSecurityStats,
  cleanupSecurityData,
  hashSensitiveData,
  isIPSuspicious,
  checkEndpointThrottle,
  createSecurityMiddleware
} from './auth-guard';

import {
  type JWTPayload,
  type SessionData,
  generateToken,
  verifyToken,
  generateSessionId,
  generateDeviceId,
  createSession,
  validateSession,
  invalidateSession,
  getSessionsByUserId,
  cleanupExpiredSessions,
  getSessionStats
} from './jwt';

import {
  type AuthenticatedRequest,
  type AuthMiddlewareOptions,
  withAuth,
  authMiddleware,
  getAuthUser,
  getAuthSession,
  getSecurityContext
} from './auth-middleware';

import {
  type SecurityLogEntry,
  addSecurityLog,
  getSecurityLogs,
  clearOldSecurityLogs,
  getSecurityLogStats
} from './security-logger';

// Re-exportar tudo
export {
  // Types
  type SecurityContext,
  type RateLimitEntry,
  type JWTPayload,
  type SessionData,
  type AuthenticatedRequest,
  type AuthMiddlewareOptions,
  type SecurityLogEntry,
  
  // Auth Guard
  authGuard,
  checkRateLimit,
  logSecurityEvent,
  handleSecurityError,
  getSecurityStats,
  cleanupSecurityData,
  hashSensitiveData,
  isIPSuspicious,
  checkEndpointThrottle,
  createSecurityMiddleware,
  
  // JWT/Sessions
  generateToken,
  verifyToken,
  generateSessionId,
  generateDeviceId,
  createSession,
  validateSession,
  invalidateSession,
  getSessionsByUserId,
  cleanupExpiredSessions,
  getSessionStats,
  
  // Auth Middleware
  withAuth,
  authMiddleware,
  getAuthUser,
  getAuthSession,
  getSecurityContext,
  
  // Security Logger
  addSecurityLog,
  getSecurityLogs,
  clearOldSecurityLogs,
  getSecurityLogStats
};

/**
 * 🚀 Configurações padrão do sistema de segurança
 */
export const SECURITY_DEFAULTS = {
  // Rate limits padrão
  RATE_LIMITS: {
    AUTH: { window: 60000, max: 5 }, // Login/registro: 5 tentativas por minuto
    API_PUBLIC: { window: 60000, max: 100 }, // APIs públicas: 100 req/min
    API_PROTECTED: { window: 60000, max: 60 }, // APIs protegidas: 60 req/min
    API_SECURE: { window: 60000, max: 20 }, // APIs seguras: 20 req/min
    WEBHOOK: { window: 60000, max: 200 } // Webhooks: 200 req/min
  },
  
  // Scores de risco
  RISK_SCORES: {
    LOW: 20,
    MEDIUM: 50,
    HIGH: 80,
    BLOCK_THRESHOLD: 80
  },
  
  // Timeouts de sessão
  SESSION_TIMEOUTS: {
    JWT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 dias
    SESSION_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas de inatividade
    CLEANUP_INTERVAL: 60 * 60 * 1000 // Limpeza a cada hora
  }
} as const;

/**
 * 🔧 Utilitários de configuração rápida
 */
export const SecurityUtils = {
  /**
   * 🏗️ Criar middleware de segurança personalizado
   */
  createCustomMiddleware: (config: {
    rateLimit?: { window: number; max: number };
    requireAuth?: boolean;
    maxRiskScore?: number;
    allowedOrigins?: string[];
  }) => {
    return createSecurityMiddleware({
      rateLimit: config.rateLimit,
      requireAuth: config.requireAuth,
      maxRiskScore: config.maxRiskScore || SECURITY_DEFAULTS.RISK_SCORES.HIGH,
      allowedOrigins: config.allowedOrigins
    });
  },

  /**
   * 📊 Obter relatório completo de segurança
   */
  getFullSecurityReport: () => {
    const securityStats = getSecurityStats();
    const sessionStats = getSessionStats();
    
    return {
      timestamp: new Date().toISOString(),
      security: securityStats,
      sessions: sessionStats,
      config: {
        rateLimits: SECURITY_DEFAULTS.RATE_LIMITS,
        riskScores: SECURITY_DEFAULTS.RISK_SCORES
      }
    };
  },

  /**
   * 🧹 Executar limpeza completa do sistema
   */
  performFullCleanup: () => {
    cleanupSecurityData();
    cleanupExpiredSessions();
    console.log('[Security] Full cleanup completed');
  }
};

/**
 * 🎯 Presets de middleware para casos comuns
 */
export const SecurityPresets = {
  // Para páginas de autenticação (login, registro)
  authPage: authMiddleware.public,
  
  // Para APIs de dados do usuário
  userAPI: authMiddleware.protected,
  
  // Para APIs de administração
  adminAPI: authMiddleware.secure,
  
  // Para webhooks de pagamento
  paymentWebhook: authMiddleware.webhook,
  
  // Para chat AI (requer autenticação, mas menos restritivo)
  chatAPI: (handler: any) => withAuth(handler, {
    requireAuth: true,
    rateLimit: { window: 60000, max: 30 } // 30 mensagens por minuto
  }),
  
  // Para APIs de compatibilidade (podem ser usadas sem auth)
  compatibilityAPI: (handler: any) => withAuth(handler, {
    requireAuth: false,
    rateLimit: { window: 60000, max: 20 } // 20 consultas por minuto
  })
};

// Inicializar limpeza automática quando o módulo for carregado
if (typeof setInterval !== 'undefined') {
  // Limpeza a cada 30 minutos
  setInterval(SecurityUtils.performFullCleanup, 30 * 60 * 1000);
}

/**
 * 📝 Logging estruturado para debugging
 */
export const SecurityLogger = {
  info: (message: string, context?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Security] ${message}`, context);
    }
  },
  
  warn: (message: string, context?: any) => {
    console.warn(`[Security] ${message}`, context);
  },
  
  error: (message: string, error?: any) => {
    console.error(`[Security] ${message}`, error);
  }
};

export default {
  // Funcionalidades principais
  authGuard,
  authMiddleware,
  SecurityUtils,
  SecurityPresets,
  SecurityLogger,
  
  // Constantes
  SECURITY_DEFAULTS,
  
  // Helpers rápidos
  createSession,
  verifyToken,
  logSecurityEvent
};
