import pino from 'pino';

import config from './env';

const logger = pino({
  level: config.LOG_LEVEL,
  transport: config.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
});

export default logger;
