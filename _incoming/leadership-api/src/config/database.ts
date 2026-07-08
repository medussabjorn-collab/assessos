import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// ─── PostgreSQL via Prisma ────────────────────────────────────────────────────

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export async function connectPostgres(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅  PostgreSQL connected via Prisma');
  } catch (err) {
    logger.error('❌  PostgreSQL connection failed:', err);
    throw err;
  }
}

// ─── MongoDB via Mongoose ─────────────────────────────────────────────────────

export async function connectMongo(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
    });
    logger.info('✅  MongoDB connected via Mongoose');
  } catch (err) {
    logger.error('❌  MongoDB connection failed:', err);
    throw err;
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — attempting reconnect...');
});

// ─── Redis ────────────────────────────────────────────────────────────────────
// Render provides REDIS_URL (full connection string); local dev uses host/port

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    })
  : new Redis({
      host:     env.REDIS_HOST,
      port:     env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db:       env.REDIS_DB,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
    });

redis.on('connect',    () => logger.info('✅  Redis connected'));
redis.on('error',  (e) => logger.error('❌  Redis error:', e));
redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

// ─── Connect All ─────────────────────────────────────────────────────────────

export async function connectDatabases(): Promise<void> {
  await Promise.all([
    connectPostgres(),
    connectMongo(),
    connectRedis(),
  ]);
}

export async function disconnectDatabases(): Promise<void> {
  await prisma.$disconnect();
  await mongoose.disconnect();
  await redis.quit();
  logger.info('All database connections closed');
}
