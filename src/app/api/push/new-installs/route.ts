import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authGuard, addSecurityLog } from "@/lib/security/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const securityContext = await authGuard(req);

    addSecurityLog(
      "info",
      {
        ip: securityContext.ip,
        userAgent: securityContext.userAgent,
        endpoint: "/api/push/new-installs",
        method: "GET",
      },
      "New installs requested",
    );

    // Buscar instalações das últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newInstalls = await db.pushSubscription.findMany({
      where: {
        installedAt: {
          gte: yesterday,
        },
        isActive: true,
      },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        installedAt: true,
        userAgent: true,
      },
      orderBy: {
        installedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: newInstalls,
      count: newInstalls.length,
      period: "24h",
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar novas instalações:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
