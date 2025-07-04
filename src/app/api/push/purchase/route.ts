import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authGuard, addSecurityLog } from "@/lib/security/auth-guard";
import { z } from "zod";

const purchaseSchema = z.object({
  deviceId: z.string().min(1, "Device ID é obrigatório"),
  purchaseId: z.string().min(1, "Purchase ID é obrigatório"),
  amount: z.number().positive("Valor deve ser positivo"),
});

export async function POST(req: NextRequest) {
  try {
    const securityContext = await authGuard(req);

    const body = await req.json();
    const validatedData = purchaseSchema.parse(body);

    addSecurityLog(
      "info",
      {
        ip: securityContext.ip,
        userAgent: securityContext.userAgent,
        endpoint: "/api/push/purchase",
        method: "POST",
      },
      `Purchase registered for device: ${validatedData.deviceId}`,
    );

    // Atualizar subscription com dados de compra
    const updatedSubscription = await db.pushSubscription.update({
      where: {
        deviceId: validatedData.deviceId,
      },
      data: {
        hasPurchased: true,
        purchasedAt: new Date(),
        purchaseId: validatedData.purchaseId,
        purchaseAmount: validatedData.amount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Compra registrada com sucesso",
      data: {
        id: updatedSubscription.id,
        deviceId: updatedSubscription.deviceId,
        purchaseId: updatedSubscription.purchaseId,
        amount: updatedSubscription.purchaseAmount,
        purchasedAt: updatedSubscription.purchasedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao registrar compra:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
