import { NextRequest, NextResponse } from "next/server";
import { authGuard, logSecurityEvent, checkRateLimit } from '@/lib/security/auth-guard';
import type { SecurityContext } from '@/lib/security/auth-guard';

// 🔒 Interfaces TypeScript para type safety
interface IpResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: {
    ip: string;
    userAgent: string;
    country?: string;
    timestamp: string;
  };
}

export const dynamic = 'force-dynamic';

// Rate limiting para obter IP
const GET_IP_RATE_LIMIT = {
  window: 60000, // 1 minuto
  max: 30 // 30 verificações por minuto
} as const;

/**
 * 🌐 GET - Obter informações de IP do cliente
 * GET /api/get-ip
 */
export async function GET(req: NextRequest): Promise<NextResponse<IpResponse>> {
  let securityContext: SecurityContext;
  
  try {
    // 1. 🛡️ Validação de segurança básica
    try {
      securityContext = await authGuard(req);
    } catch (error: any) {
      // Para obter IP, usar contexto básico mesmo sem autenticação
      securityContext = {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            req.headers.get('cf-connecting-ip') || 
            'unknown',
        userAgent: req.headers.get('user-agent') || '',
        riskScore: 0,
        timestamp: Date.now(),
        endpoint: req.nextUrl.pathname,
        method: req.method,
        country: req.headers.get('x-vercel-ip-country') || 
                req.headers.get('cf-ipcountry') || 
                undefined
      };
    }

    // 2. 🚦 Rate limiting
    const ipKey = `get_ip_${securityContext.ip}`;
    if (!checkRateLimit(ipKey, GET_IP_RATE_LIMIT.window, GET_IP_RATE_LIMIT.max)) {
      logSecurityEvent('RATE_LIMITED', securityContext, 'Get IP rate limit exceeded');
      return NextResponse.json({
        success: false,
        error: 'Muitas requisições',
        message: 'Limite de verificações de IP excedido'
      }, { status: 429 });
    }

    // 3. 🔍 Extrair informações de IP
    const forwarded = req.headers.get('x-forwarded-for');
    let ip = forwarded ? forwarded.split(',')[0].trim() : null;
    
    // Verificar outros headers comuns de proxy
    if (!ip) ip = req.headers.get('x-real-ip');
    if (!ip) ip = req.headers.get('cf-connecting-ip'); // Cloudflare
    if (!ip) ip = req.headers.get('x-client-ip');
    
    // Fallback para 'unknown' se não conseguir determinar
    if (!ip) ip = 'unknown';

    const userAgent = req.headers.get('user-agent') || '';
    const country = req.headers.get('x-vercel-ip-country') || 
                   req.headers.get('cf-ipcountry') ||
                   req.headers.get('x-country-code');

    // 4. 📊 Log para auditoria
    logSecurityEvent('AUTH_SUCCESS', securityContext, `IP information requested: ${ip}`);

    // 5. ✅ Resposta com informações
    return NextResponse.json<IpResponse>({
      success: true,
      data: {
        ip,
        userAgent,
        ...(country && { country }),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("🚨 Erro ao obter IP:", error);
    
    const fallbackIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    return NextResponse.json<IpResponse>({
      success: true, // Sempre retornar sucesso para esta API
      data: {
        ip: fallbackIp,
        userAgent: req.headers.get('user-agent') || '',
        timestamp: new Date().toISOString()
      }
    });
  }
}
