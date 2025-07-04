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
        endpoint: "/api/push/list",
        method: "GET",
      },
      "Push subscriptions list requested",
    );

    const subscriptions = await db.pushSubscription.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        installedAt: true,
        hasPurchased: true,
        pushSent: true,
        pushSentAt: true,
      },
      orderBy: {
        installedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: subscriptions,
      count: subscriptions.length,
    });
  } catch (error: any) {
    console.error("❌ Erro ao listar push subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
