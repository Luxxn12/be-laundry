import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.preprocess(
    () => (process.env.VERCEL ? undefined : process.env.PORT),
    z.coerce.number().int().positive().optional().default(4001),
  ),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  CORS_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
});

const env = envSchema.parse(process.env);

const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : ['*'];

if (!corsOrigins.includes('*')) {
  const sameHostOrigins = [`http://localhost:${env.PORT}`, `http://127.0.0.1:${env.PORT}`];

  for (const origin of sameHostOrigins) {
    if (!corsOrigins.includes(origin)) {
      corsOrigins.push(origin);
    }
  }
}

export const config = {
  ...env,
  corsOrigins,
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
};

type AppConfig = typeof config;

export default config as AppConfig;
