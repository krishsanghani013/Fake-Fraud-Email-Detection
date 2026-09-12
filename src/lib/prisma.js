import { PrismaClient } from '@prisma/client';

/**
 * Server-only Prisma Client singleton for Next.js App Router.
 * Prevents multiple instances of Prisma Client from being created in development
 * due to Next.js Hot Module Replacement (HMR).
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
