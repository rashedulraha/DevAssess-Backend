import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import config from '../config';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: config.databaseUrl as string });
  return new PrismaClient({
    adapter,
    log: config.env === 'development' ? ['error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}
