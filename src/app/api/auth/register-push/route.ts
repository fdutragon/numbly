import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarMapaNumerologicoCompleto } from "@/lib/numerologia";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { nome, dataNascimento } = await req.json();

    if (!nome || !dataNascimento) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome e data de nascimento são obrigatórios",
        },
        { status: 400 },
      );
    }

    // Converter data
    const birthDate = new Date(dataNascimento);

    // Calcular mapa numerológico
    const mapa = gerarMapaNumerologicoCompleto(nome, dataNascimento);

    // Verificar se usuário já existe (por nome e data)
    const existingUser = await db.user.findFirst({
      where: {
        name: nome,
        birthDate: birthDate,
      },
    });

    let user;
    if (existingUser) {
      // Atualizar usuário existente
      user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          numerologyData: mapa,
          updatedAt: new Date(),
        },
      });
    } else {
      // Criar novo usuário
      user = await db.user.create({
        data: {
          name: nome,
          birthDate: birthDate,
          numerologyData: mapa,
          isPremium: false,
        },
      });
    }

    // Criar token de autenticação
    const token = await createToken({
      userId: user.id,
      email: user.email || "",
      nome: user.name || "",
    });

    // Resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: "Usuário registrado com sucesso",
      user: {
        id: user.id,
        nome: user.name,
        dataNascimento: user.birthDate.toISOString().split("T")[0],
        numerologyData: mapa,
      },
    });

    // Definir cookie de autenticação
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no registro push:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
