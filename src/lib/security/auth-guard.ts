import { NextRequest } from 'next/server';

export interface SecurityContext {
  ip: string;
  userAgent: string;
  timestamp: number;
  requestId: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Security logging levels
 */
type SecurityEventType = 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'RATE_LIMITED' | 'SUSPICIOUS' | 'ERROR';

/**
 * Auth guard for API routes
 */
export async function authGuard(req: NextRequest): Promise<SecurityContext> {
  const ip = req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            req.headers.get('cf-connecting-ip') || 
            'unknown';
  
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Basic security checks
  if (userAgent.length > 1000) {
    throw new Error('Invalid user agent');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scanner/i,
    /hack/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(userAgent) || pattern.test(ip)
  );

  if (isSuspicious) {
    logSecurityEvent('SUSPICIOUS', {
      ip,
      userAgent,
      timestamp: Date.now(),
      requestId
    }, 'Suspicious request detected');
  }

  return {
    ip: ip.split(',')[0].trim(), // Get first IP if multiple
    userAgent,
    timestamp: Date.now(),
    requestId
  };
}

/**
 * Rate limiting check
 */
export function checkRateLimit(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (now > entry.resetTime) {
    // Window expired, reset
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return true;
}

/**
 * Log security events
 */
export function logSecurityEvent(
  type: SecurityEventType,
  context: SecurityContext,
  message: string,
  metadata?: unknown
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    metadata: metadata || {}
  };

  // In production, send to security monitoring service
  console.log(`[SECURITY:${type}]`, JSON.stringify(logEntry, null, 2));

  // Store critical events
  if (type === 'SUSPICIOUS' || type === 'RATE_LIMITED') {
    // In production, store in database or security service
    console.warn(`🚨 Security Alert: ${message}`, {
      ip: context.ip,
      userAgent: context.userAgent
    });
  }
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000);
