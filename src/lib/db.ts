import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

declare global {
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: [], // Sem logs para máxima velocidade
    errorFormat: 'minimal',
  });

  return client.$extends(withAccelerate());
}

// 🗄️ Instância global do Prisma Client
export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

export default db;
