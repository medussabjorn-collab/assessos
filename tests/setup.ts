// Set test environment variables before any module is imported
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/leaderassess_test';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/leaderassess_test';
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum-x';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-min-x';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '4';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.APP_URL = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '1000';
