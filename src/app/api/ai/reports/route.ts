import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { addSecurityLog } from '@/lib/security/security-logger';
import { checkRateLimit } from '@/lib/security/auth-guard';

// Schema de validação
const numerologyDataSchema = z.record(z.string(), z.union([z.string(), z.number()]));

const userDataSchema = z.object({
  name: z.string().optional(),
  firstName: z.string().optional(),
  birthDate: z.string().optional(),
  date: z.string().optional(),
  numerologyData: numerologyDataSchema.optional(),
  userId: z.string().optional()
});

const reportRequestSchema = z.object({
  reportType: z.string().min(1, 'Tipo de relatório é obrigatório'),
  reportNumber: z.number().optional(),
  userData: userDataSchema.optional(),
  language: z.enum(['pt', 'en', 'es']).optional().default('pt')
});

interface ReportResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    report: string;
    cached: boolean;
    generatedAt: Date;
    reportType: string;
    reportNumber?: number;
    wordCount: number;
    processingTime: number;
  };
}

// Rate limiting para relatórios
const REPORT_RATE_LIMIT = {
  window: 300000, // 5 minutos
  max: 5 // 5 relatórios por 5 minutos
};

// Inicialização do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Obter userId do token JWT
 */
function getUserIdFromToken(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value || 
               req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    return decoded.userId || null;
  } catch {
    return null;
  }
}

/**
 * Gerar relatório numerológico com Gemini
 */
async function generateNumerologyReport(
  userData: any, 
  reportType: string, 
  number?: number,
  language: string = 'pt'
): Promise<{ report: string; cached: boolean; generatedAt: Date; wordCount: number }> {
  
  // Verificar cache primeiro (se usuário estiver logado)
  const userId = userData?.userId;
  if (userId) {
    const existingReport = await db.report.findFirst({
      where: {
        userId: userId,
        type: reportType,
        ...(number && { number: number.toString() })
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingReport) {
      return {
        report: existingReport.content,
        cached: true,
        generatedAt: existingReport.createdAt,
        wordCount: existingReport.content.split(/\s+/).length
      };
    }
  }

  // Preparar contexto numerológico
  let numerologyContext = '';
  if (userData?.numerologyData) {
    const nums = userData.numerologyData;
    const numerologyInfo: string[] = [];
    
    // Principais números numerológicos
    const priorityOrder = [
      { key: 'Caminho da Vida', value: nums['Caminho da Vida'] },
      { key: 'Destino', value: nums['Destino'] },
      { key: 'Impulso da Alma', value: nums['Impulso da Alma'] },
      { key: 'Personalidade', value: nums['Personalidade'] },
      { key: 'Expressão', value: nums['Expressão'] },
      { key: 'Número do Aniversário', value: nums['Número do Aniversário'] },
      { key: 'Atitude', value: nums['Atitude'] },
      { key: 'Número da Sorte', value: nums['Número da Sorte'] },
      { key: 'Número do Desafio', value: nums['Número do Desafio'] },
      { key: 'Número da Maturidade', value: nums['Número da Maturidade'] },
    ];
    
    priorityOrder.forEach(({ key, value }) => {
      if (value !== undefined && value !== null && value !== '') {
        numerologyInfo.push(`${key}: ${value}`);
      }
    });
    
    if (numerologyInfo.length > 0) {
      numerologyContext = `NÚMEROS NUMEROLÓGICOS:\n${numerologyInfo.join('\n')}`;
    }
  }

  // Configurar idioma
  const languageConfig = {
    pt: {
      name: 'português brasileiro',
      greeting: 'Olá',
      instructions: 'Responda em português brasileiro com linguagem acessível e inspiradora'
    },
    en: {
      name: 'English',
      greeting: 'Hello',
      instructions: 'Respond in English with accessible and inspiring language'
    },
    es: {
      name: 'español',
      greeting: 'Hola',
      instructions: 'Responde en español con lenguaje accesible e inspirador'
    }
  };

  const lang = languageConfig[language as keyof typeof languageConfig] || languageConfig.pt;

  // Gerar prompt baseado no tipo de relatório
  let prompt = `Você é Eve, uma especialista em numerologia pitagórica. Crie um relatório numerológico detalhado e personalizado.

DADOS DO USUÁRIO:
- Nome: ${userData?.name || userData?.firstName || 'Usuário'}
- Data de nascimento: ${userData?.birthDate || 'Não informada'}
- Tipo de relatório: ${reportType}
${number ? `- Número específico: ${number}` : ''}

${numerologyContext}

INSTRUÇÕES:
1. ${lang.instructions}
2. Use linguagem acessível e inspiradora
3. Inclua insights práticos para a vida cotidiana
4. Mantenha um tom carinhoso e empoderador
5. Estruture o conteúdo de forma organizada
6. Seja específico e personalizado baseado nos números fornecidos

`;

  // Prompts específicos por tipo de relatório
  const reportPrompts = {
    'geral': 'Crie um relatório numerológico geral completo cobrindo todos os aspectos da vida da pessoa baseado em seus números.',
    'amor': 'Foque na vida amorosa e relacionamentos, analisando compatibilidade e padrões românticos.',
    'carreira': 'Analise a vida profissional, talentos naturais e direcionamento de carreira.',
    'saude': 'Explore aspectos relacionados à saúde física e mental através da numerologia.',
    'dinheiro': 'Examine a relação com dinheiro, prosperidade e abundância financeira.',
    'espiritual': 'Aprofunde-se na jornada espiritual e propósito de vida.',
    'anual': 'Faça uma análise numerológica para o ano atual, incluindo ciclos e oportunidades.',
    'mensal': 'Analise o mês atual através da numerologia pessoal.',
    'compatibilidade': 'Analise a compatibilidade numerológica (quando aplicável).'
  };

  prompt += reportPrompts[reportType as keyof typeof reportPrompts] || reportPrompts.geral;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const report = response.text();

    const wordCount = report.split(/\s+/).length;

    // Salvar no cache se usuário estiver logado
    if (userId) {
      await db.report.create({
        data: {
          userId: userId,
          type: reportType,
          content: report,
          number: number ? number.toString() : '0'
        }
      });
    }

    return {
      report,
      cached: false,
      generatedAt: new Date(),
      wordCount
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    throw new Error('Falha ao gerar relatório numerológico');
  }
}

export const dynamic = 'force-dynamic';

// POST: Gerar relatório numerológico
export async function POST(req: NextRequest): Promise<NextResponse<ReportResponse>> {
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Rate limiting específico para relatórios
    const rateLimitKey = `ai_report_${ip}`;
    
    if (!checkRateLimit(rateLimitKey, REPORT_RATE_LIMIT.window, REPORT_RATE_LIMIT.max)) {
      addSecurityLog('warn', {
        ip,
        userAgent,
        endpoint: '/api/ai/reports',
        method: 'POST'
      }, `Report rate limit exceeded`);
      
      return NextResponse.json<ReportResponse>({
        success: false,
        error: 'Muitos relatórios',
        message: 'Limite de relatórios excedido. Tente novamente em alguns minutos.'
      }, { status: 429 });
    }

    // Validar dados de entrada
    const body = await req.json().catch(() => ({}));
    
    let validatedData: z.infer<typeof reportRequestSchema>;
    try {
      validatedData = reportRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        
        addSecurityLog('warn', {
          ip,
          userAgent,
          endpoint: '/api/ai/reports',
          method: 'POST'
        }, `Invalid report data: ${errorMessages}`);
        
        return NextResponse.json<ReportResponse>({
          success: false,
          error: 'Dados inválidos',
          message: error.errors[0]?.message || 'Dados de entrada inválidos'
        }, { status: 400 });
      }
      throw error;
    }

    // Obter userId do token
    const userId = getUserIdFromToken(req);
    const userData = {
      ...validatedData.userData,
      userId
    };

    // Log de início
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/ai/reports',
      method: 'POST'
    }, `Report generation started`, {
      reportType: validatedData.reportType,
      reportNumber: validatedData.reportNumber,
      userId,
      language: validatedData.language
    });

    // Gerar relatório
    const reportResult = await generateNumerologyReport(
      userData,
      validatedData.reportType,
      validatedData.reportNumber,
      validatedData.language
    );
    
    const processingTime = Date.now() - startTime;
    
    // Log de sucesso
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/ai/reports',
      method: 'POST'
    }, 'Report generated successfully', {
      reportType: validatedData.reportType,
      reportNumber: validatedData.reportNumber,
      userId,
      cached: reportResult.cached,
      wordCount: reportResult.wordCount,
      processingTime
    });
    
    return NextResponse.json<ReportResponse>({
      success: true,
      data: {
        report: reportResult.report,
        cached: reportResult.cached,
        generatedAt: reportResult.generatedAt,
        reportType: validatedData.reportType,
        reportNumber: validatedData.reportNumber,
        wordCount: reportResult.wordCount,
        processingTime
      }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error("🚨 Erro na geração de relatório:", error);
    
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/ai/reports',
      method: 'POST'
    }, `Report generation error: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      processingTime
    });
    
    return NextResponse.json<ReportResponse>(
      { 
        success: false, 
        error: 'Erro interno',
        message: 'Falha ao gerar relatório numerológico' 
      },
      { status: 500 }
    );
  }
}

// GET: Buscar relatórios existentes
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Buscar relatórios do usuário
    const where: any = { userId };
    if (reportType) {
      where.type = reportType;
    }

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        number: true,
        createdAt: true,
        content: true
      }
    });

    const total = await db.report.count({ where });

    // Log de consulta
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/ai/reports',
      method: 'GET'
    }, 'User reports retrieved', { 
      userId,
      reportType,
      count: reports.length,
      total
    });

    return NextResponse.json({
      success: true,
      data: {
        reports: reports.map(report => ({
          id: report.id,
          type: report.type,
          number: report.number,
          createdAt: report.createdAt,
          preview: report.content.substring(0, 200) + '...',
          wordCount: report.content.split(/\s+/).length
        })),
        total,
        limit,
        offset
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar relatórios:', error);
    
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/ai/reports',
      method: 'GET'
    }, `Reports retrieval error: ${error.message}`);

    return NextResponse.json({
      error: 'Erro ao buscar relatórios'
    }, { status: 500 });
  }
}

// DELETE: Excluir relatório específico
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({
        error: 'ID do relatório é obrigatório'
      }, { status: 400 });
    }

    // Verificar se o relatório pertence ao usuário
    const report = await db.report.findFirst({
      where: {
        id: reportId,
        userId: userId
      }
    });

    if (!report) {
      return NextResponse.json({
        error: 'Relatório não encontrado'
      }, { status: 404 });
    }

    // Excluir o relatório
    await db.report.delete({
      where: { id: reportId }
    });

    // Log de exclusão
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/ai/reports',
      method: 'DELETE'
    }, 'Report deleted successfully', { 
      userId,
      reportId,
      reportType: report.type
    });

    return NextResponse.json({
      success: true,
      message: 'Relatório excluído com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao excluir relatório:', error);
    
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/ai/reports',
      method: 'DELETE'
    }, `Report deletion error: ${error.message}`);

    return NextResponse.json({
      error: 'Erro ao excluir relatório'
    }, { status: 500 });
  }
}
