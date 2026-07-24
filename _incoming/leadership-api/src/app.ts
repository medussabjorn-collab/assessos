import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDatabases, disconnectDatabases } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setSocketServer } from './services/notificationService';

import authRoutes          from './routes/auth';
import assessmentRoutes    from './routes/assessments';
import questionRoutes      from './routes/questions';
import proctoringRoutes    from './routes/proctoring';
import adminRoutes         from './routes/admin';
import notificationRoutes  from './routes/notifications';
import offlineSyncRoutes   from './routes/offlineSync';
import codeExecutionRoutes  from './routes/codeExecution';
import organizationRoutes  from './routes/organizations';

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────

const io = new SocketServer(server, {
  cors: {
    origin:      env.CORS_ORIGINS.split(','),
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

setSocketServer(io);

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.debug(`Socket ${socket.id} joined room user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'blob:'],
    },
  },
}));

app.use(cors({
  origin:      env.CORS_ORIGINS.split(','),
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { success: false, message: 'Too many auth attempts' },
});

app.use(globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version ?? '1.0.0',
    env:       env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

const base = `/api/${env.API_VERSION}`;

app.use(`${base}/auth`,          authLimiter, authRoutes);
app.use(`${base}/assessments`,   assessmentRoutes);
app.use(`${base}/questions`,     questionRoutes);
app.use(`${base}/proctoring`,    proctoringRoutes);
app.use(`${base}/admin`,         adminRoutes);
app.use(`${base}/notifications`, notificationRoutes);
app.use(`${base}/sync`,          offlineSyncRoutes);
app.use(`${base}/code`,          codeExecutionRoutes);
app.use(`${base}/organizations`, organizationRoutes);

// ─── 404 + Error Handlers ────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  try {
    await connectDatabases();

    server.listen(env.PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════╗
║        LeaderAssess Pro — Backend API                ║
╠══════════════════════════════════════════════════════╣
║  ENV   : ${env.NODE_ENV.padEnd(43)}║
║  PORT  : ${String(env.PORT).padEnd(43)}║
║  API   : ${base.padEnd(43)}║
║  WS    : Socket.io enabled                           ║
╚══════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    logger.error('Bootstrap failed:', err);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} — shutting down gracefully...`);
  server.close(async () => {
    await disconnectDatabases();
    logger.info('Server shut down');
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT',  () => void shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { logger.error('Uncaught exception:', err); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled rejection:', reason); });

void bootstrap();

export { app, server, io };
