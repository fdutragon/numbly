import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { db } from "@/lib/db";
import { addSecurityLog } from '@/lib/security';

const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de validação
const SendEmailSchema = z.object({
  to: z.string().email('Email de destino inválido'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  html: z.string().min(1, 'Conteúdo HTML é obrigatório'),
  scheduledFor: z.string().datetime().optional(),
  templateType: z.enum(['recovery', 'welcome', 'notification', 'marketing']).optional().default('notification'),
  userId: z.string().optional()
});

interface EmailTemplate {
  subject: string;
  html: string;
}

// Templates de email de recuperação
const RECOVERY_EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  '10min_recovery': {
    subject: '⚡ Você esqueceu de descobrir seus segredos!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <div style="background: linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">⚡ ATENÇÃO!</h1>
          <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 16px;">Sua sessão está expirando em poucos minutos</p>
        </div>
        
        <!-- Conteúdo principal -->
        <div style="padding: 35px;">
          <p style="font-size: 18px; margin: 0 0 25px 0; color: #e5e7eb;">Olá <strong>{{{FIRST_NAME|there}}}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
            Você estava <strong style="color: #ef4444;">a apenas um clique</strong> de descobrir segredos sobre si mesmo que poderiam mudar sua vida para sempre...
          </p>

          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 16px; color: #fca5a5; font-weight: bold;">
              ⏰ Sua sessão expira em apenas 10 minutos!
            </p>
            <p style="margin: 10px 0 0 0; color: #d1d5db; font-size: 14px;">
              Não perca esta oportunidade única de autoconhecimento.
            </p>
            <p style="margin: 10px 0 0 0; color: #10b981; font-size: 13px; font-weight: bold;">
              ✨ Seu formulário será preenchido automaticamente e o QR PIX aparecerá na tela
            </p>
          </div>

          <!-- CTA Principal -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{{LOGIN_LINK}}}" style="display: inline-block; background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 20px 45px; border-radius: 50px; font-weight: bold; font-size: 19px; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);">
              🚀 DESCOBRIR MEUS SEGREDOS AGORA
            </a>
          </div>
        </div>
      </div>
    `
  },
  '24h_recovery': {
    subject: '🔥 Última chance! Seus segredos numerológicos te esperam',
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <div style="background: linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🔥 ÚLTIMA CHANCE</h1>
          <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px;">Não deixe essa oportunidade escapar</p>
        </div>
        
        <!-- Conteúdo principal -->
        <div style="padding: 35px;">
          <p style="font-size: 18px; margin: 0 0 25px 0; color: #e5e7eb;">Oi <strong>{{{FIRST_NAME|there}}}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
            Faz 24 horas que você mostrou interesse em descobrir seus segredos numerológicos...
          </p>

          <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 15px 0; font-style: italic; color: #bfdbfe; font-size: 16px;">
              "Descobri que meu número pessoal explicava TUDO sobre meus relacionamentos. Agora sei exatamente com quem sou compatível!"
            </p>
            <p style="margin: 0; color: #93c5fd; font-size: 14px; font-weight: bold;">- Ana Paula, 28 anos, São Paulo</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 25px 0;">
            <strong style="color: #f59e0b;">15.293 pessoas</strong> já descobriram seus números. Não seja a única que ficou para trás.
          </p>

          <!-- CTA Principal -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{{LOGIN_LINK}}}" style="display: inline-block; background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 20px 45px; border-radius: 50px; font-weight: bold; font-size: 19px; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);">
              🔮 DESCOBRIR AGORA
            </a>
          </div>
        </div>
      </div>
    `
  },
  '48h_recovery': {
    subject: '💫 Por que você ainda não descobriu seus segredos?',
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <div style="background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%); padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">💫 EU ENTENDO</h1>
          <p style="color: #ddd6fe; margin: 8px 0 0 0; font-size: 16px;">Às vezes temos medo de nos conhecer</p>
        </div>
        
        <!-- Conteúdo principal -->
        <div style="padding: 35px;">
          <p style="font-size: 18px; margin: 0 0 25px 0; color: #e5e7eb;">Olá <strong>{{{FIRST_NAME|there}}}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
            Ontem você estava <strong style="color: #ef4444;">a um passo</strong> de descobrir segredos sobre si mesmo...
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
            Mas por algum motivo, você parou. <strong style="color: #f59e0b;">E eu entendo.</strong> Às vezes temos receio do que vamos descobrir.
          </p>

          <div style="background: rgba(16, 185, 129, 0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10b981; font-size: 18px; margin: 0 0 15px 0;">🔮 Descubra HOJE mesmo:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db; line-height: 1.8;">
              <li><strong style="color: #10b981;">Sua missão de vida</strong> através do Número do Destino</li>
              <li><strong style="color: #10b981;">Compatibilidade amorosa</strong> real</li>
              <li><strong style="color: #10b981;">Melhores momentos</strong> para decisões importantes</li>
            </ul>
            <p style="margin: 15px 0 0 0; color: #10b981; font-size: 13px; font-weight: bold; text-align: center;">
              ✨ Clique no botão: tudo será preenchido automaticamente
            </p>
          </div>

          <!-- CTA Principal -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{{LOGIN_LINK}}}" style="display: inline-block; background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 20px 45px; border-radius: 50px; font-weight: bold; font-size: 19px; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);">
              ✨ SUPERAR MEUS MEDOS AGORA
            </a>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <p style="color: #10b981; font-size: 18px; margin: 0; font-weight: bold;">
              ✅ Garantia de 7 dias • Sem risco
            </p>
          </div>
        </div>
      </div>
    `
  },
  '72h_recovery': {
    subject: '😢 Vou sentir sua falta... (último email)',
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <div style="background: linear-gradient(90deg, #6b7280 0%, #4b5563 50%, #374151 100%); padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">😢 ADEUS</h1>
          <p style="color: #d1d5db; margin: 8px 0 0 0; font-size: 16px;">Este é meu último email para você</p>
        </div>
        
        <!-- Conteúdo principal -->
        <div style="padding: 35px;">
          <p style="font-size: 18px; margin: 0 0 25px 0; color: #e5e7eb;">Oi <strong>{{{FIRST_NAME|there}}}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
            Este é o último email que vou te enviar sobre seus segredos numerológicos.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
            Respeito sua decisão de não querer descobrir mais sobre si mesmo neste momento.
          </p>

          <div style="background: rgba(107, 114, 128, 0.1); border-left: 4px solid #6b7280; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 16px; color: #9ca3af; font-style: italic;">
              "Às vezes, não estamos prontos para certas descobertas. E tudo bem."
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 25px 0;">
            Se um dia você mudar de ideia, saiba que seus segredos estarão sempre aqui, te esperando.
          </p>

          <!-- CTA Final -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{{LOGIN_LINK}}}" style="display: inline-block; background: linear-gradient(90deg, #6b7280 0%, #4b5563 100%); color: #ffffff; text-decoration: none; padding: 15px 35px; border-radius: 25px; font-weight: bold; font-size: 16px;">
              💫 Descobrir Agora (última chance)
            </a>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Você não receberá mais emails sobre este assunto.
            </p>
          </div>
        </div>
      </div>
    `
  }
};

// Função helper para determinar email de destino baseado no ambiente
function getTestEmail(originalEmail: string): string {
  const isDevMode = process.env.NODE_ENV === 'development' || 
                   (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');
  
  return isDevMode ? 'delivered@resend.dev' : originalEmail;
}

// Função para personalizar templates
function personalizeTemplate(template: EmailTemplate, variables: Record<string, string>): EmailTemplate {
  let { subject, html } = template;
  
  // Substituir variáveis no assunto e HTML
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{{${key}}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    html = html.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return { subject, html };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    if (!process.env.RESEND_API_KEY) {
      addSecurityLog('warn', {
        ip,
        userAgent,
        endpoint: '/api/email/send',
        method: 'POST'
      }, 'RESEND_API_KEY não configurada');
      
      return NextResponse.json({
        error: 'Configuração de email não encontrada'
      }, { status: 500 });
    }

    // Validação da requisição
    const body = await req.json();
    const validatedData = SendEmailSchema.parse(body);

    const { to, subject, html, scheduledFor, templateType, userId } = validatedData;
    
    // Log de início
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/email/send',
      method: 'POST'
    }, `Email sending started`, { 
      to: getTestEmail(to),
      templateType,
      userId,
      hasSchedule: !!scheduledFor
    });

    // Preparar dados do email
    const emailData: any = {
      from: 'Numbly <contato@numbly.life>',
      to: getTestEmail(to),
      subject,
      html
    };

    // Configurar agendamento se especificado
    if (scheduledFor) {
      emailData.scheduledAt = scheduledFor;
    }

    // Enviar email
    const { data, error: resendError } = await resend.emails.send(emailData);

    if (resendError) {
      console.error('Erro do Resend:', resendError);
      
      addSecurityLog('warn', {
        ip,
        userAgent,
        endpoint: '/api/email/send',  
        method: 'POST'
      }, `Email sending failed: ${resendError.message}`, {
        to: getTestEmail(to),
        templateType,
        error: resendError
      });
      
      return NextResponse.json({ 
        error: 'Falha ao enviar email',
        details: resendError.message 
      }, { status: 500 });
    }

    // Log de sucesso
    const processingTime = Date.now() - startTime;
    
    addSecurityLog('info', {
      ip,
      userAgent,
      endpoint: '/api/email/send',
      method: 'POST'
    }, 'Email sent successfully', {
      emailId: data?.id,
      to: getTestEmail(to),
      templateType,
      userId,
      processingTime,
      scheduled: !!scheduledFor
    });

    console.log(`✅ Email enviado com sucesso:`, {
      id: data?.id,
      to: getTestEmail(to),
      subject: subject.substring(0, 50),
      templateType,
      processingTime
    });

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Email enviado com sucesso',
      processingTime
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('Erro ao enviar email:', error);
    
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/email/send',
      method: 'POST'
    }, `Email sending error: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      processingTime
    });

    // Tratamento específico para erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos fornecidos',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: 'Falha ao processar envio de email'
    }, { status: 500 });
  }
}

// GET: Buscar templates disponíveis
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const { searchParams } = new URL(req.url);
    const templateType = searchParams.get('type');
    
    if (templateType === 'recovery') {
      const templates = Object.keys(RECOVERY_EMAIL_TEMPLATES).map(key => ({
        key,
        subject: RECOVERY_EMAIL_TEMPLATES[key].subject,
        description: `Template de recuperação ${key.replace('_recovery', '')}`
      }));
      
      return NextResponse.json({
        templates,
        count: templates.length
      });
    }
    
    return NextResponse.json({
      message: 'Templates de email disponíveis',
      types: ['recovery', 'welcome', 'notification', 'marketing'],
      recoveryTemplates: Object.keys(RECOVERY_EMAIL_TEMPLATES)
    });
    
  } catch (error: any) {
    addSecurityLog('warn', {
      ip,
      userAgent,
      endpoint: '/api/email/send',
      method: 'GET'
    }, `Template fetch error: ${error.message}`);
    
    return NextResponse.json({
      error: 'Erro ao buscar templates'
    }, { status: 500 });
  }
}

export { RECOVERY_EMAIL_TEMPLATES };
