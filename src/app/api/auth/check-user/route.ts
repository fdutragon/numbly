import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        devices: {
          select: {
            id: true,
            deviceId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        hasPush: false,
      });
    }

    // Verificar se há push ativo em algum dispositivo
    const activePushSubscriptions = await prisma.pushSubscription.findMany({
      where: {
        deviceId: { in: user.devices.map((device) => device.deviceId) },
        isActive: true,
      },
      select: { id: true },
    });

    const hasActivePush = activePushSubscriptions.length > 0;

    return NextResponse.json({
      exists: true,
      hasPush: hasActivePush,
      userName: user.name,
    });
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
