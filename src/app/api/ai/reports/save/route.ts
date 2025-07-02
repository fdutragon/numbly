import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    const { type, data, content } = await req.json();

    if (!type || !content) {
      return NextResponse.json({
        success: false,
        error: 'Tipo e conteúdo são obrigatórios'
      }, { status: 400 });
    }

    // Criar chave única para o relatório
    const reportKey = `${type}_${JSON.stringify(data)}`;

    // Salvar no banco de dados
    const report = await db.report.upsert({
      where: {
        userId_type: {
          userId: userId,
          type: reportKey
        }
      },
      update: {
        content: content,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        type: reportKey,
        number: type,
        content: content
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Relatório salvo com sucesso',
      reportId: report.id
    });

  } catch (error) {
    console.error('Erro ao salvar relatório:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const data = searchParams.get('data');

    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de relatório é obrigatório'
      }, { status: 400 });
    }

    const reportKey = `${type}_${data || ''}`;

    // Buscar relatório salvo
    const report = await db.report.findUnique({
      where: {
        userId_type: {
          userId: userId,
          type: reportKey
        }
      }
    });

    if (!report) {
      return NextResponse.json({
        success: false,
        error: 'Relatório não encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        type: report.type,
        number: report.number,
        content: report.content,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }
    });

  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
