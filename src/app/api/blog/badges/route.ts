import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Sistema de badges ainda não implementado',
    message: 'Modelos de badge e contadores não encontrados no Prisma schema'
  }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Sistema de badges ainda não implementado',
    message: 'Modelos de badge e contadores não encontrados no Prisma schema'
  }, { status: 501 });
}
