import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    api: 'operational';
  };
  version?: string;
  environment: string;
}

export const dynamic = 'force-dynamic';

/**
 * 🏥 Health Check Endpoint
 * GET /api/health
 */
export async function GET(req: NextRequest): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now();
  
  try {
    // 1. 🔍 Verificar conexão com banco de dados
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
    
    try {
      await db.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      console.error('Database health check failed:', error);
      databaseStatus = 'disconnected';
    }

    // 2. 📊 Calcular uptime (aproximado)
    const uptime = process.uptime();

    // 3. 🎯 Determinar status geral
    const isHealthy = databaseStatus === 'connected';
    
    const response: HealthResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      services: {
        database: databaseStatus,
        api: 'operational'
      },
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // 4. 📤 Retornar resposta com status apropriado
    const statusCode = isHealthy ? 200 : 503;
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error: any) {
    console.error("🚨 Health check error:", error);
    
    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'disconnected',
        api: 'operational'
      },
      environment: process.env.NODE_ENV || 'development'
    };
    
    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}
