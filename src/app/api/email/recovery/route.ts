import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { addSecurityLog } from "@/lib/security";
import { RECOVERY_EMAIL_TEMPLATES } from "../send/route";

const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de validação para emails de recuperação
const RecoveryEmailSchema = z.object({
  userEmail: z.string().email("Email inválido"),
  userName: z.string().min(1, "Nome é obrigatório"),
  loginLink: z.string().url("Link de login inválido").optional(),
  userId: z.string().optional(),
});

// Schema para cancelamento
const CancelRecoverySchema = z.object({
  scheduledEmailIds: z
    .array(z.string())
    .min(1, "IDs de emails são obrigatórios"),
});

interface RecoveryEmailConfig {
  template: keyof typeof RECOVERY_EMAIL_TEMPLATES;
  delay: number; // em milissegundos
}

// Configuração dos emails de recuperação
const RECOVERY_SCHEDULE: RecoveryEmailConfig[] = [
  {
    template: "10min_recovery",
    delay: 10 * 60 * 1000, // 10 minutos
  },
  {
    template: "24h_recovery",
    delay: 24 * 60 * 60 * 1000, // 24 horas
  },
  {
    template: "48h_recovery",
    delay: 48 * 60 * 60 * 1000, // 48 horas
  },
  {
    template: "72h_recovery",
    delay: 72 * 60 * 60 * 1000, // 72 horas
  },
];

// Função helper para determinar email de destino baseado no ambiente
function getTestEmail(originalEmail: string): string {
  const isDevMode =
    process.env.NODE_ENV === "development" ||
    (typeof process !== "undefined" && process.env.NODE_ENV !== "production");

  return isDevMode ? "delivered@resend.dev" : originalEmail;
}

// Verificar se email existe na audiência do Resend
async function checkEmailExists(userEmail: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { exists: false, error: "RESEND_API_KEY não configurada" };
    }

    const audienceId = "07f442d3-2661-4694-9bc7-2320154beab6";
    const targetEmail = getTestEmail(userEmail);

    const contact = await resend.contacts.get({
      email: targetEmail,
      audienceId,
    });

    const exists = !!(contact && contact.data);
    console.log(
      `🔍 Resultado: ${targetEmail} ${exists ? "JÁ EXISTE" : "NÃO EXISTE"} na audiência`,
    );

    return {
      exists,
      contact: contact?.data || null,
      audienceId,
    };
  } catch (error: any) {
    // Se der erro 404, significa que o contato não existe
    if (error.statusCode === 404 || error.message?.includes("not found")) {
      console.log(
        `🔍 Resultado: ${getTestEmail(userEmail)} NÃO EXISTE na audiência (404)`,
      );
      return {
        exists: false,
        contact: null,
        audienceId: "07f442d3-2661-4694-9bc7-2320154beab6",
      };
    }

    console.error("Erro ao verificar email na audiência:", error);
    return {
      exists: false,
      error: error.message,
    };
  }
}

// Personalizar template com variáveis do usuário
function personalizeTemplate(
  templateKey: keyof typeof RECOVERY_EMAIL_TEMPLATES,
  variables: Record<string, string>,
) {
  const template = RECOVERY_EMAIL_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} não encontrado`);
  }

  let { subject, html } = template;

  // Substituir variáveis
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{{${key}}}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), value);
    html = html.replace(new RegExp(placeholder, "g"), value);
  });

  return { subject, html };
}

// POST: Agendar emails de recuperação
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    if (!process.env.RESEND_API_KEY) {
      addSecurityLog(
        "warn",
        {
          ip,
          userAgent,
          endpoint: "/api/email/recovery",
          method: "POST",
        },
        "RESEND_API_KEY não configurada",
      );

      return NextResponse.json(
        {
          error: "Configuração de email não encontrada",
        },
        { status: 500 },
      );
    }

    // Validação da requisição
    const body = await req.json();
    const validatedData = RecoveryEmailSchema.parse(body);

    const { userEmail, userName, loginLink, userId } = validatedData;
    const targetEmail = getTestEmail(userEmail);

    console.log(
      `Iniciando agendamento de emails de recuperação para ${userEmail} -> ${targetEmail}`,
    );

    // Log de início
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/email/recovery",
        method: "POST",
      },
      `Recovery email scheduling started`,
      {
        userEmail: targetEmail,
        userId,
      },
    );

    // Verificar se o email já existe na audiência
    const existsCheck = await checkEmailExists(userEmail);

    if (existsCheck.exists) {
      console.log(
        `⚠️ Email ${userEmail} -> ${targetEmail} já existe na audiência. Pulando agendamento.`,
      );

      return NextResponse.json({
        success: true,
        alreadyExists: true,
        contact: existsCheck.contact,
        message:
          "Email já existe na audiência. Emails de recuperação não foram reagendados.",
        scheduledCount: 0,
        totalEmails: 0,
        recoveryEmails: [],
        audienceId: existsCheck.audienceId,
      });
    }

    // Adicionar à audiência do Resend
    const audienceId = "07f442d3-2661-4694-9bc7-2320154beab6";

    const contactResult = await resend.contacts.create({
      email: targetEmail,
      firstName: userName.split(" ")[0],
      lastName: userName.split(" ").slice(1).join(" ") || "",
      unsubscribed: false,
      audienceId,
    });

    console.log(
      `Usuário ${userEmail} -> ${targetEmail} adicionado à audiência:`,
      contactResult,
    );

    // Agendar emails individuais de recuperação
    const now = new Date();
    const emailResults = [];
    const firstName = userName.split(" ")[0];
    const defaultLoginLink =
      loginLink ||
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login`;

    for (const emailConfig of RECOVERY_SCHEDULE) {
      try {
        // Calcular horário de envio
        const scheduledTime = new Date(now.getTime() + emailConfig.delay);

        // Personalizar template
        const personalizedTemplate = personalizeTemplate(emailConfig.template, {
          "FIRST_NAME|there": firstName,
          LOGIN_LINK: defaultLoginLink,
        });

        console.log(
          `📧 Agendando ${emailConfig.template} para ${scheduledTime.toISOString()}`,
        );

        // Agendar email
        const emailResult = await resend.emails.send({
          from: "Numbly <contato@numbly.life>",
          to: targetEmail,
          subject: personalizedTemplate.subject,
          html: personalizedTemplate.html,
          scheduledAt: scheduledTime.toISOString(),
        });

        if (emailResult.error) {
          console.error(
            `Erro ao agendar ${emailConfig.template}:`,
            emailResult.error,
          );
          throw new Error(
            `Falha ao agendar ${emailConfig.template}: ${emailResult.error.message}`,
          );
        }

        emailResults.push({
          template: emailConfig.template,
          emailId: emailResult.data?.id,
          scheduledFor: scheduledTime.toISOString(),
          delay: emailConfig.delay,
          subject: personalizedTemplate.subject.substring(0, 50),
        });

        console.log(
          `✅ ${emailConfig.template} agendado com ID: ${emailResult.data?.id}`,
        );
      } catch (emailError: any) {
        console.error(
          `Erro ao agendar email ${emailConfig.template}:`,
          emailError,
        );

        emailResults.push({
          template: emailConfig.template,
          error: emailError.message,
          delay: emailConfig.delay,
        });
      }
    }

    const successfulEmails = emailResults.filter((result) => result.emailId);
    const processingTime = Date.now() - startTime;

    // Log de sucesso
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/email/recovery",
        method: "POST",
      },
      "Recovery emails scheduled successfully",
      {
        userEmail: targetEmail,
        userId,
        scheduledCount: successfulEmails.length,
        totalCount: RECOVERY_SCHEDULE.length,
        processingTime,
        contactId: contactResult.data?.id,
      },
    );

    console.log(
      `✅ Processo concluído: ${successfulEmails.length}/${RECOVERY_SCHEDULE.length} emails agendados`,
    );

    return NextResponse.json({
      success: true,
      message: "Emails de recuperação agendados com sucesso",
      contact: contactResult.data,
      scheduledCount: successfulEmails.length,
      totalEmails: RECOVERY_SCHEDULE.length,
      recoveryEmails: emailResults,
      audienceId,
      processingTime,
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error("Erro ao agendar emails de recuperação:", error);

    addSecurityLog(
      "warn",
      {
        ip,
        userAgent,
        endpoint: "/api/email/recovery",
        method: "POST",
      },
      `Recovery email scheduling error: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
        processingTime,
      },
    );

    // Tratamento específico para erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos fornecidos",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Falha ao agendar emails de recuperação",
      },
      { status: 500 },
    );
  }
}

// DELETE: Cancelar emails agendados
export async function DELETE(req: NextRequest) {
  const startTime = Date.now();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: "Configuração de email não encontrada",
        },
        { status: 500 },
      );
    }

    // Validação da requisição
    const body = await req.json();
    const validatedData = CancelRecoverySchema.parse(body);

    const { scheduledEmailIds } = validatedData;

    console.log(
      `Iniciando cancelamento de ${scheduledEmailIds.length} emails agendados`,
    );

    // Log de início
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/email/recovery",
        method: "DELETE",
      },
      `Email cancellation started`,
      {
        emailCount: scheduledEmailIds.length,
      },
    );

    const cancelResults = [];

    for (const emailId of scheduledEmailIds) {
      if (!emailId || typeof emailId !== "string") {
        console.log(`ID de email inválido ignorado: ${emailId}`);
        cancelResults.push({
          emailId,
          success: false,
          error: "ID inválido",
        });
        continue;
      }

      try {
        console.log(`Tentando cancelar email: ${emailId}`);

        const response = await fetch(
          `https://api.resend.com/emails/${emailId}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        const responseText = await response.text();

        if (response.ok) {
          console.log(`✅ Email cancelado com sucesso: ${emailId}`);
          cancelResults.push({
            emailId,
            success: true,
            message: "Cancelado com sucesso",
          });
        } else {
          const errorMessage =
            response.status === 422
              ? "Email já foi enviado ou não pode ser cancelado"
              : `Erro ${response.status}: ${responseText}`;

          console.log(`⚠️ Falha ao cancelar email ${emailId}: ${errorMessage}`);
          cancelResults.push({
            emailId,
            success: false,
            error: errorMessage,
            status: response.status,
          });
        }
      } catch (err: any) {
        console.error(
          `❌ Erro de rede ao cancelar email ${emailId}:`,
          err.message,
        );
        cancelResults.push({
          emailId,
          success: false,
          error: `Erro de rede: ${err.message}`,
        });
      }
    }

    const successfulCancellations = cancelResults.filter(
      (result) => result.success,
    );
    const processingTime = Date.now() - startTime;

    // Log de resultado
    addSecurityLog(
      "info",
      {
        ip,
        userAgent,
        endpoint: "/api/email/recovery",
        method: "DELETE",
      },
      "Email cancellation completed",
      {
        totalRequested: scheduledEmailIds.length,
        successfulCancellations: successfulCancellations.length,
        processingTime,
      },
    );

    console.log(
      `✅ Processo de cancelamento concluído: ${successfulCancellations.length}/${scheduledEmailIds.length} emails cancelados`,
    );

    return NextResponse.json({
      success: true,
      message: "Processo de cancelamento concluído",
      totalRequested: scheduledEmailIds.length,
      successfulCancellations: successfulCancellations.length,
      results: cancelResults,
      processingTime,
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error("Erro ao cancelar emails:", error);

    addSecurityLog(
      "warn",
      {
        ip,
        userAgent,
        endpoint: "/api/email/recovery",
        method: "DELETE",
      },
      `Email cancellation error: ${error.message}`,
      {
        error: error.message,
        stack: error.stack,
        processingTime,
      },
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos fornecidos",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Falha ao cancelar emails",
      },
      { status: 500 },
    );
  }
}
