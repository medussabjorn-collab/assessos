import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:    z.enum(['development', 'production', 'test']).default('development'),
  PORT:        z.string().default('4000').transform(Number),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MONGODB_URI:  z.string().min(1, 'MONGODB_URI is required'),

  // Render provides a full REDIS_URL; local dev uses host/port
  REDIS_URL:      z.string().optional(),
  REDIS_HOST:     z.string().default('localhost'),
  REDIS_PORT:     z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB:       z.string().default('0').transform(Number),

  JWT_SECRET:             z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN:         z.string().default('15m'),
  JWT_REFRESH_SECRET:     z.string().min(32, 'JWT_REFRESH_SECRET required'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Email — Resend (production) or SMTP (dev)
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST:      z.string().optional(),
  SMTP_PORT:      z.string().default('587').transform(Number),
  SMTP_USER:      z.string().optional(),
  SMTP_PASS:      z.string().optional(),
  EMAIL_FROM:     z.string().default('noreply@leaderassess.com'),

  // Judge0 code execution
  JUDGE0_API_URL: z.string().optional(),
  JUDGE0_API_KEY: z.string().optional(),

  BCRYPT_ROUNDS:        z.string().default('12').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX:       z.string().default('100').transform(Number),
  CORS_ORIGINS:         z.string().default('http://localhost:5173'),

  APP_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
