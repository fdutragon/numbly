/**
 * 🚧 Mock do Prisma Client para desenvolvimento
 *
 * Este é um mock simples do Prisma para permitir que o app funcione
 * sem um banco de dados configurado. Em produção, substitua por um
 * Prisma Client real com banco de dados.
 */

export const prisma = {
  user: {
    findUnique: async (query: unknown) => {
      console.log("[Prisma Mock] user.findUnique:", query);
      return null; // Mock: usuário não encontrado
    },
    create: async (data: unknown) => {
      console.log("[Prisma Mock] user.create:", data);
      const typedData = data as any;
      return {
        id: "mock-user-id",
        email: typedData.data.email,
        nome: typedData.data.nome,
        createdAt: new Date(),
        ...typedData.data,
      };
    },
    update: async (query: unknown) => {
      console.log("[Prisma Mock] user.update:", query);
      const typedQuery = query as any;
      return {
        id: typedQuery.where.id || "mock-user-id",
        ...typedQuery.data,
      };
    },
    findMany: async (query: any) => {
      console.log("[Prisma Mock] user.findMany:", query);
      return []; // Mock: nenhum usuário encontrado
    },
    delete: async (query: any) => {
      console.log("[Prisma Mock] user.delete:", query);
      return { id: query.where.id };
    },
  },

  securityLog: {
    create: async (data: any) => {
      console.log("[Prisma Mock] securityLog.create:", data);
      return {
        id: "mock-log-id",
        ...data.data,
        createdAt: new Date(),
      };
    },
    findMany: async (query: any) => {
      console.log("[Prisma Mock] securityLog.findMany:", query);
      return []; // Mock: nenhum log encontrado
    },
  },

  pushSubscription: {
    create: async (data: any) => {
      console.log("[Prisma Mock] pushSubscription.create:", data);
      return {
        id: "mock-subscription-id",
        ...data.data,
        createdAt: new Date(),
      };
    },
    findMany: async (query: any) => {
      console.log("[Prisma Mock] pushSubscription.findMany:", query);
      return []; // Mock: nenhuma subscription encontrada
    },
    delete: async (query: any) => {
      console.log("[Prisma Mock] pushSubscription.delete:", query);
      return { id: query.where.id };
    },
  },

  // Método para verificar conexão (para health check)
  $connect: async () => {
    console.log("[Prisma Mock] $connect");
    return true;
  },

  $disconnect: async () => {
    console.log("[Prisma Mock] $disconnect");
    return true;
  },
};

export default prisma;
