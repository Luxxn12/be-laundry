import http from 'http';

import app from './app';
import config from './config/env';
import logger from './config/logger';
import { connectPrisma, disconnectPrisma } from './db/prisma';

async function startServer(): Promise<void> {
  await connectPrisma();

  const server = http.createServer(app);

  server.listen(config.PORT, () => {
    logger.info(`Server listening on port ${config.PORT}`);
  });

  const shutdown = async () => {
    logger.info('Gracefully shutting down');
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error during server shutdown');
        process.exit(1);
      }
      await disconnectPrisma();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    void shutdown();
  });
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    void shutdown();
  });
}

void startServer();
