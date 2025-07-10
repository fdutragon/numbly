import { NextRequest } from 'next/server';

// Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitResult {
  status?: number;
  headers?: Record<string, string>;
}

// Função para aplicar rate limiting
export function paymentRateLimiter(request: NextRequest): RateLimitResult {
  try {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const key = `payment_${ip}`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutos
    const maxRequests = 3; // Máximo 3 tentativas por 5 minutos

    // Limpar entradas antigas
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) {
        rateLimitMap.delete(k);
      }
    }

    const current = rateLimitMap.get(key);

    if (!current) {
      // Primeira tentativa
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return {
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': (maxRequests - 1).toString(),
          'X-RateLimit-Reset': Math.ceil((now + windowMs) / 1000).toString(),
        },
      };
    }

    if (current.count >= maxRequests) {
      // Limite excedido
      return {
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString(),
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
        },
      };
    }

    // Incrementar contador
    current.count++;
    rateLimitMap.set(key, current);

    return {
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - current.count).toString(),
        'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString(),
      },
    };
  } catch (error) {
    console.error('[RATE LIMITER] Erro:', error);
    return {}; // Permitir em caso de erro
  }
}
