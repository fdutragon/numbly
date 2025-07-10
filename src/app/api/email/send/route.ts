import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit, authGuard } from '@/lib/security/auth-guard';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de validação para email
const emailSchema = z.object({
  to: z.string().email('Email do destinatário inválido'),
  subject: z
    .string()
    .min(1, 'Assunto é obrigatório')
    .max(200, 'Assunto muito longo'),
  content: z
    .string()
    .min(10, 'Conteúdo muito curto')
    .max(10000, 'Conteúdo muito longo'),
  from: z.string().email('Email do remetente inválido').optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Obter contexto de segurança
    const securityContext = await authGuard(request);

    // Verificar rate limiting
    const rateLimitKey = `email:${securityContext.ip}`;
    const rateLimitAllowed = checkRateLimit(rateLimitKey, 60000, 5); // 5 emails por minuto

    if (!rateLimitAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validar dados do email
    const validationResult = emailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { to, subject, content, from } = validationResult.data;

    // Verificar se a chave da API está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Serviço de email não configurado' },
        { status: 500 }
      );
    }

    // Domínio verificado para envio
    const fromEmail = from || 'clara@numbly.com.br';

    // Criar HTML do email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .tagline { font-size: 14px; opacity: 0.9; }
        .highlight { color: #667eea; font-weight: bold; }
        .cta { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .feature { margin: 10px 0; padding-left: 20px; position: relative; }
        .feature:before { content: "✅"; position: absolute; left: 0; }
        .plans { display: flex; gap: 20px; margin: 20px 0; }
        .plan { flex: 1; background: white; border: 2px solid #eee; border-radius: 8px; padding: 20px; text-align: center; }
        .plan.featured { border-color: #667eea; }
        .plan-price { font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0; }
        @media (max-width: 600px) {
            .plans { flex-direction: column; }
            .container { padding: 10px; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 Clara IA</div>
            <div class="tagline">Sua Assistente de Vendas Inteligente</div>
        </div>
        
        <div class="content">
            <h2>Olá! 👋</h2>
            <p>Aqui estão as informações sobre a <span class="highlight">Clara IA</span> que você solicitou:</p>
            
            <h3>🤖 O que é a Clara IA?</h3>
            <p>Clara é uma assistente de IA especializada em automação de vendas e marketing. Ela trabalha <strong>24 horas por dia</strong> para converter seus leads em clientes pagantes.</p>
            
            <div class="features">
                <h3>🎯 Por que escolher a Clara?</h3>
                <div class="feature">Automação completa de vendas</div>
                <div class="feature">Trabalha 24 horas por dia, 7 dias por semana</div>
                <div class="feature">Aumenta conversões em até 300%</div>
                <div class="feature">ROI comprovado em 30 dias</div>
                <div class="feature">Suporte especializado</div>
            </div>
            
            <h3>💰 Planos Disponíveis</h3>
            <div class="plans">
                <div class="plan">
                    <h4>Clara Basic</h4>
                    <div class="plan-price">R$ 97<span style="font-size: 14px; color: #666;">/mês</span></div>
                    <div class="feature">Automação WhatsApp</div>
                    <div class="feature">Campanhas básicas</div>
                    <div class="feature">Suporte via chat</div>
                    <div class="feature">Dashboard simples</div>
                </div>
                
                <div class="plan featured">
                    <h4>Clara Pro</h4>
                    <div class="plan-price">R$ 197<span style="font-size: 14px; color: #666;">/mês</span></div>
                    <div class="feature">Automação WhatsApp avançada</div>
                    <div class="feature">Campanhas ilimitadas</div>
                    <div class="feature">Suporte prioritário</div>
                    <div class="feature">Dashboard completo</div>
                    <div class="feature">Relatórios avançados</div>
                    <div class="feature">Integração com CRM</div>
                </div>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #2d5a2d; margin-top: 0;">🚀 Garantia de 7 dias</h3>
                <p style="color: #2d5a2d; margin-bottom: 0;">Teste sem riscos! Se não funcionar, devolvemos <strong>100% do seu investimento</strong>.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="cta">Quero começar agora! 🚀</a>
            </div>
            
            <p>Tem alguma dúvida? Responda este email ou entre em contato conosco!</p>
            
            <p>Att,<br>
            <strong>Equipe Clara IA</strong></p>
        </div>
        
        <div class="footer">
            <p>© 2024 Clara IA - Todos os direitos reservados</p>
            <p>Este email foi enviado automaticamente pela Clara IA</p>
        </div>
    </div>
</body>
</html>
    `;

    // Enviar email via Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: htmlContent,
      text: content.replace(/\n/g, '\n'), // Versão texto simples
    });

    console.log('Email enviado com sucesso:', result.data?.id);

    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso',
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);

    // Tratamento específico para diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error:
              'Limite de emails excedido. Tente novamente em alguns minutos.',
          },
          { status: 429 }
        );
      }

      if (error.message.includes('domain')) {
        return NextResponse.json(
          { error: 'Domínio de email não verificado' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao enviar email' },
      { status: 500 }
    );
  }
}

// Método GET para testar se o serviço está funcionando
export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Serviço de email não configurado' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'Email service is running',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Email service error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar serviço de email' },
      { status: 500 }
    );
  }
}
