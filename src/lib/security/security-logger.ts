// Security Logger - Sistema de logs de segurança

export interface SecurityLogEntry {
  level: "info" | "warn" | "error" | "critical";
  event: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
}

const securityLogs: SecurityLogEntry[] = [];
const MAX_LOGS_IN_MEMORY = 1000;

export function addSecurityLog(
  level: SecurityLogEntry["level"],
  metadata: Record<string, any>,
  message: string,
  additionalMetadata?: Record<string, any>,
): void {
  const logEntry: SecurityLogEntry = {
    level,
    event: metadata.endpoint || "unknown",
    message,
    metadata: { ...metadata, ...additionalMetadata },
    timestamp: Date.now(),
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    endpoint: metadata.endpoint,
  };
  securityLogs.push(logEntry);
  if (securityLogs.length > MAX_LOGS_IN_MEMORY) securityLogs.shift();
}

export function getSecurityLogs(
  level?: SecurityLogEntry["level"],
  limit: number = 100,
): SecurityLogEntry[] {
  let logs = [...securityLogs];
  if (level) logs = logs.filter((log) => log.level === level);
  return logs.slice(-limit).reverse();
}

export function clearSecurityLogs(): void {
  securityLogs.length = 0;
}

export function getSecurityStats(): {
  total: number;
  byLevel: Record<SecurityLogEntry["level"], number>;
  recentActivity: SecurityLogEntry[];
  totalIPs: number;
  rateLimitEntries: number;
  recentEvents: SecurityLogEntry[];
} {
  const byLevel = { info: 0, warn: 0, error: 0, critical: 0 };
  securityLogs.forEach((log) => {
    byLevel[log.level]++;
  });

  // Novos campos para compatibilidade
  const ipSet = new Set<string>();
  let rateLimitEntries = 0;
  const recentEvents: SecurityLogEntry[] = [];
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  for (const log of securityLogs) {
    if (log.ip) ipSet.add(log.ip);
    if (
      log.message &&
      (log.message.includes("rate limit") ||
        log.message.includes("too many requests"))
    ) {
      rateLimitEntries++;
    }
    if (now - log.timestamp < oneHour) recentEvents.push(log);
  }

  return {
    total: securityLogs.length,
    byLevel,
    recentActivity: securityLogs.slice(-10).reverse(),
    totalIPs: ipSet.size,
    rateLimitEntries,
    recentEvents: recentEvents.slice(-20).reverse(),
  };
}

export function searchSecurityLogs(criteria: {
  level?: SecurityLogEntry["level"];
  ip?: string;
  event?: string;
  timeRange?: { start: number; end: number };
}): SecurityLogEntry[] {
  return securityLogs.filter((log) => {
    if (criteria.level && log.level !== criteria.level) return false;
    if (criteria.ip && log.ip !== criteria.ip) return false;
    if (criteria.event && !log.event.includes(criteria.event)) return false;
    if (criteria.timeRange) {
      if (
        log.timestamp < criteria.timeRange.start ||
        log.timestamp > criteria.timeRange.end
      )
        return false;
    }
    return true;
  });
}

export function detectSuspiciousActivity(): {
  multipleFailedLogins: SecurityLogEntry[];
  suspiciousIPs: string[];
  rateLimitViolations: SecurityLogEntry[];
} {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const recentLogs = securityLogs.filter(
    (log) => now - log.timestamp <= oneHour,
  );
  const multipleFailedLogins = recentLogs.filter(
    (log) => log.event.includes("login") && log.level === "warn",
  );
  const ipCounts: Record<string, number> = {};
  recentLogs.forEach((log) => {
    if (log.ip) ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
  });
  const suspiciousIPs = Object.keys(ipCounts).filter((ip) => ipCounts[ip] > 50);
  const rateLimitViolations = recentLogs.filter(
    (log) =>
      log.message.includes("rate limit") ||
      log.message.includes("too many requests"),
  );
  return { multipleFailedLogins, suspiciousIPs, rateLimitViolations };
}
