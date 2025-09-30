import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import qs from 'qs';
import swaggerUi from 'swagger-ui-express';

import config from './config/env';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './modules';
import swaggerSpec from './docs/swagger';

const app = express();

app.set('trust proxy', 1);
app.set('query parser', (query: string) => qs.parse(query, { allowDots: true, comma: true }));

app.use(
  pinoHttp({
    logger,
    customLogLevel: (res, err) => {
      const statusCode = res.statusCode ?? 200;
      if (err || statusCode >= 500) return 'error';
      if (statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/auth', authLimiter);

app.use('/api/v1', routes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Laundry API is running',
    docs: '/docs',
    api: '/api/v1',
  });
});

app.get('/doc', (_req, res) => {
  res.redirect(301, '/docs');
});

if (!config.isTest) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
