import { afterAll, beforeAll } from 'vitest';
import type { PrismaClient } from '@prisma/client';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES ??= '15m';
process.env.JWT_REFRESH_EXPIRES ??= '7d';
process.env.RATE_LIMIT_WINDOW_MS ??= '60000';
process.env.RATE_LIMIT_MAX ??= '100';
process.env.NODE_ENV = 'test';

let prisma: PrismaClient | null = null;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  const prismaModule = await import('../src/db/prisma');
  prisma = prismaModule.prisma;
  await prisma.$connect();
});

afterAll(async () => {
  if (!prisma) {
    return;
  }

  await prisma.$disconnect();
});
