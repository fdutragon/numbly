import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

// 📧 Templates de email
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: '🎉 Bem-vindo(a) ao Numbly! Seu acesso está liberado',
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header -->
        <div style="background: linear-gradient(90deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%); padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 PARABÉNS!</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Seu acesso ao Numbly foi liberado</p>
        </div>
        
        <!-- Conteúdo principal -->
        <div style="padding: 35px;">
          <p style="font-size: 18px; margin: 0 0 25px 0; color: #e5e7eb;">Olá <strong>{{FIRST_NAME}}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin: 0 0 25px 0;">
            Bem-vindo(a) ao <strong style="color: #7c3aed;">Numbly Oráculo!</strong> Agora você tem acesso completo aos seus segredos numerológicos.
          </p>

          <div style="background: rgba(124, 58, 237, 0.1); border-left: 4px solid #7c3aed; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #7c3aed; font-size: 18px; margin: 0 0 15px 0;">🔮 Sua jornada inclui:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db; line-height: 1.8;">
              <li><strong style="color: #7c3aed;">Mapa Numerológico Completo</strong> - Sua missão de vida revelada</li>
              <li><strong style="color: #7c3aed;">Compatibilidade Amorosa</strong> - Analise sua sintonia com qualquer pessoa</li>
              <li><strong style="color: #7c3aed;">Oráculo IA Personalizado</strong> - Orientação baseada no seu mapa</li>
              <li><strong style="color: #7c3aed;">Números da Sorte</strong> - Para cada área da sua vida</li>
            </ul>
          </div>

          <!-- CTA Principal -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{DASHBOARD_LINK}}" style="display: inline-block; background: linear-gradient(90deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 20px 45px; border-radius: 50px; font-weight: bold; font-size: 19px; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);">
              🚀 ACESSAR DASHBOARD
            </a>
          </div>
          
          <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 30px;">
            Se você não conseguir clicar no botão, copie e cole este link: {{DASHBOARD_LINK}}
          </p>
        </div>
      </div>
    `
  },
  
  passwordReset: {
    subject: '🔐 Redefinir sua senha do Numbly',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: linear-gradient(90deg, #7c3aed 0%, #6366f1 100%); padding: 25px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔐 Redefinir Senha</h1>
        </div>
        
        <div style="background: #ffffff; padding: 35px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin: 0 0 20px 0; color: #374151;">Olá <strong>{{FIRST_NAME}}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #6b7280; margin: 0 0 25px 0;">
            Recebemos uma solicitação para redefinir a senha da sua conta no Numbly. Clique no botão abaixo para criar uma nova senha:
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{RESET_LINK}}" style="display: inline-block; background: linear-gradient(90deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Redefinir Senha
            </a>
          </div>
          
          <p style="font-size: 14px; color: #9ca3af; text-align: center;">
            Este link expira em 24 horas. Se você não solicitou esta redefinição, ignore este email.
          </p>
        </div>
      </div>
    `
  },
  
  notification: {
    subject: '🔮 {{TITLE}} - Numbly Oráculo',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: linear-gradient(90deg, #7c3aed 0%, #6366f1 100%); padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">🔮 Numbly Oráculo</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 18px;">{{TITLE}}</h2>
          
          <div style="color: #6b7280; line-height: 1.6;">
            {{CONTENT}}
          </div>
          
          <div style="text-align: center; margin: 25px 0 0 0;">
            <a href="{{ACTION_LINK}}" style="display: inline-block; background: linear-gradient(90deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 500;">
              Ver no Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  }
};

/**
 * 📧 Enviar email usando Resend
 */
export async function sendEmail(options: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Email não enviado.');
    return { success: false, error: 'API key não configurada' };
  }

  try {
    const result = await resend.emails.send({
      from: options.from || 'Numbly <noreply@numbly.life>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      headers: options.headers
    });

    console.log('Email enviado com sucesso:', result);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Erro ao enviar email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}

/**
 * 🎉 Enviar email de boas-vindas
 */
export async function sendWelcomeEmail(
  email: string, 
  firstName: string = 'Amigo(a)',
  dashboardLink?: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://numbly.life';
  const finalDashboardLink = dashboardLink || `${baseUrl}/dashboard`;
  
  const personalizedHtml = EMAIL_TEMPLATES.welcome.html
    .replace(/{{FIRST_NAME}}/g, firstName)
    .replace(/{{DASHBOARD_LINK}}/g, finalDashboardLink);

  return sendEmail({
    to: email,
    subject: EMAIL_TEMPLATES.welcome.subject,
    html: personalizedHtml,
    headers: {
      'X-Welcome-Email': 'true',
      'X-User-Email': email
    }
  });
}

/**
 * 🔐 Enviar email de redefinição de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetLink: string
) {
  const personalizedHtml = EMAIL_TEMPLATES.passwordReset.html
    .replace(/{{FIRST_NAME}}/g, firstName)
    .replace(/{{RESET_LINK}}/g, resetLink);

  return sendEmail({
    to: email,
    subject: EMAIL_TEMPLATES.passwordReset.subject,
    html: personalizedHtml,
    headers: {
      'X-Password-Reset': 'true',
      'X-User-Email': email
    }
  });
}

/**
 * 🔔 Enviar notificação por email
 */
export async function sendNotificationEmail(
  email: string,
  title: string,
  content: string,
  actionLink?: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://numbly.life';
  const finalActionLink = actionLink || `${baseUrl}/dashboard`;
  
  const personalizedHtml = EMAIL_TEMPLATES.notification.html
    .replace(/{{TITLE}}/g, title)
    .replace(/{{CONTENT}}/g, content)
    .replace(/{{ACTION_LINK}}/g, finalActionLink);
    
  const personalizedSubject = EMAIL_TEMPLATES.notification.subject
    .replace(/{{TITLE}}/g, title);

  return sendEmail({
    to: email,
    subject: personalizedSubject,
    html: personalizedHtml,
    headers: {
      'X-Notification-Email': 'true',
      'X-User-Email': email
    }
  });
}

/**
 * 📊 Helper para emails em modo de desenvolvimento
 */
export function getTestEmail(originalEmail: string): string {
  const isDevMode = process.env.NODE_ENV === 'development' || 
                   process.env.NODE_ENV !== 'production';
  
  return isDevMode ? 'delivered@resend.dev' : originalEmail;
}
