import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const acceptInviteSchema = z.object({
  code: z.string().min(6, "Código inválido"),
  userData: z.object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email().optional(),
    dataNascimento: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/AAAA"),
    numerologyData: z.object({}).passthrough(), // Aceita qualquer estrutura de dados numerológicos
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userData } = acceptInviteSchema.parse(body);

    // Buscar convite
    const invite = await prisma.invite.findUnique({
      where: { code },
      include: {
        sender: true,
        compatibilityMap: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          message: "Convite não encontrado",
        },
        { status: 404 },
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "Este convite já foi utilizado ou expirou",
        },
        { status: 400 },
      );
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      // Marcar como expirado
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Este convite expirou",
        },
        { status: 400 },
      );
    }

    // Verificar se usuário já existe
    let user = await prisma.user.findUnique({
      where: { email: userData.email || "" },
    });

    if (!user) {
      // Criar novo usuário
      const [day, month, year] = userData.dataNascimento.split("/");
      user = await prisma.user.create({
        data: {
          name: userData.nome,
          email: userData.email || "",
          birthDate: new Date(`${year}-${month}-${day}`),
          numerologyData: userData.numerologyData,
          hasSeenIntro: false,
        },
      });
    }

    // Atualizar convite
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        receiverId: user.id,
        acceptedAt: new Date(),
      },
    });

    // Atualizar mapa de compatibilidade
    if (invite.compatibilityMap) {
      await prisma.compatibilityMap.update({
        where: { id: invite.compatibilityMap.id },
        data: {
          partnerId: user.id,
          partnerData: userData.numerologyData,
          status: "REVEALED",
          revealedAt: new Date(),
        },
      });

      // TODO: Calcular compatibilidade e gerar relatório personalizado
      // Aqui você pode chamar sua função de cálculo de compatibilidade
      // e gerar o relatório IA personalizado para esta dupla
    }

    // TODO: Enviar push notification para o remetente
    // notificar que o convite foi aceito

    return NextResponse.json({
      success: true,
      message: "Convite aceito com sucesso!",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        sender: {
          name: invite.sender.name,
          relationshipType: invite.relationshipType,
        },
        compatibilityMapId: invite.compatibilityMap?.id,
        customMessage: invite.customMessage,
      },
    });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos",
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}

// Buscar dados do convite (para página de aceite)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Código não fornecido",
        },
        { status: 400 },
      );
    }

    const invite = await prisma.invite.findUnique({
      where: { code },
      include: {
        sender: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          message: "Convite não encontrado",
        },
        { status: 404 },
      );
    }

    // Incrementar contador de cliques
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        clicks: { increment: 1 },
        lastClickedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        code: invite.code,
        senderName: invite.sender.name,
        senderProfileImage: invite.sender.profileImage,
        invitedName: invite.invitedName,
        relationshipType: invite.relationshipType,
        customMessage: invite.customMessage,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar convite:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
