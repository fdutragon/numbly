/**
 * 📝 Security Logger - Sistema de logs de segurança
 */

export interface SecurityLogEntry {
  level: 'info' | 'warn' | 'error' | 'critical';
  event: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
}

// Store em memória para logs (em produção usar banco de dados)
const securityLogs: SecurityLogEntry[] = [];
const MAX_LOGS_IN_MEMORY = 1000;

/**
 * 📊 Adicionar log de segurança
 */
export function addSecurityLog(
  level: SecurityLogEntry['level'],
  event: string,
  message: string,
  metadata?: Record<string, any>
): void {
  const logEntry: SecurityLogEntry = {
    level,
    event,
    message,
    metadata,
    timestamp: Date.now(),
    ip: metadata?.ip,
    userAgent: metadata?.userAgent,
    endpoint: metadata?.endpoint
  };

  // Adicionar ao array
  securityLogs.push(logEntry);

  // Manter apenas os últimos N logs
  if (securityLogs.length > MAX_LOGS_IN_MEMORY) {
    securityLogs.shift();
  }

  // Log no console baseado no nível
  if (level === 'critical' || level === 'error') {
    console.error(`[SECURITY ${level.toUpperCase()}] ${event}: ${message}`, metadata);
  } else if (level === 'warn') {
    console.warn(`[SECURITY WARN] ${event}: ${message}`, metadata);
  } else {
    console.log(`[SECURITY INFO] ${event}: ${message}`, metadata);
  }

  // Em produção, enviar para serviço de monitoramento
  if (process.env.NODE_ENV === 'production' && (level === 'critical' || level === 'error')) {
    // Aqui integraria com Sentry, DataDog, etc.
    // sentryCapture(logEntry);
  }
}

/**
 * 🔍 Obter logs de segurança
 */
export function getSecurityLogs(limit = 50): SecurityLogEntry[] {
  return securityLogs
    .slice(-limit)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 🧹 Limpar logs antigos
 */
export function clearOldSecurityLogs(olderThanMs = 24 * 60 * 60 * 1000): void {
  const cutoff = Date.now() - olderThanMs;
  const initialLength = securityLogs.length;
  
  // Remove logs antigos
  for (let i = securityLogs.length - 1; i >= 0; i--) {
    if (securityLogs[i].timestamp < cutoff) {
      securityLogs.splice(i, 1);
    }
  }
  
  const removedCount = initialLength - securityLogs.length;
  if (removedCount > 0) {
    console.log(`[SECURITY] Cleaned ${removedCount} old log entries`);
  }
}

/**
 * 📈 Obter estatísticas dos logs
 */
export function getSecurityLogStats() {
  const last24h = Date.now() - (24 * 60 * 60 * 1000);
  const recentLogs = securityLogs.filter(log => log.timestamp > last24h);
  
  const stats = {
    total: securityLogs.length,
    last24h: recentLogs.length,
    byLevel: {
      info: recentLogs.filter(l => l.level === 'info').length,
      warn: recentLogs.filter(l => l.level === 'warn').length,
      error: recentLogs.filter(l => l.level === 'error').length,
      critical: recentLogs.filter(l => l.level === 'critical').length,
    },
    topEvents: getTopEvents(recentLogs, 10)
  };
  
  return stats;
}

function getTopEvents(logs: SecurityLogEntry[], limit: number) {
  const eventCounts = logs.reduce((acc, log) => {
    acc[log.event] = (acc[log.event] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(eventCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([event, count]) => ({ event, count }));
}

// Limpeza automática a cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(clearOldSecurityLogs, 60 * 60 * 1000);
}
