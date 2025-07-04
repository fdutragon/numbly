import { z } from "zod";

// 🔒 Schema para validação de push subscription
export const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url("Endpoint deve ser uma URL válida"),
    keys: z.object({
      p256dh: z.string().min(1, "Chave p256dh é obrigatória"),
      auth: z.string().min(1, "Chave auth é obrigatória"),
    }),
  }),
  deviceId: z.string().min(1, "Device ID é obrigatório").optional(),
  userAgent: z.string().optional(),
  platform: z.string().optional(),
});

// 🔒 Type para push subscription input
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

// 🔒 Schema para validação de email
export const emailSchema = z.object({
  to: z.string().email("Email deve ser válido"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  html: z.string().min(1, "Conteúdo HTML é obrigatório").optional(),
  text: z.string().min(1, "Conteúdo texto é obrigatório").optional(),
});

// 🔒 Type para email input
export type EmailInput = z.infer<typeof emailSchema>;

// 🔒 Schema para validação de usuário
export const userSchema = z.object({
  email: z.string().email("Email deve ser válido").optional(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  numerologyData: z.record(z.any()).optional(),
});

// 🔒 Type para user input
export type UserInput = z.infer<typeof userSchema>;
