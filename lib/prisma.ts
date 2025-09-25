import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();
const globalForPrisma = global as unknown as {prisma: typeof prisma};

if (process.env.NODE_ENV !== 'production') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
  }
}

export default prisma;
