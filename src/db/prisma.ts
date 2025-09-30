import { PrismaClient } from '@prisma/client';

import config from '../config/env';
import logger from '../config/logger';

const prisma = new PrismaClient({
  log: config.isProduction ? ['error'] : ['info', 'warn', 'error'],
});

async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to database');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma, connectPrisma, disconnectPrisma };
