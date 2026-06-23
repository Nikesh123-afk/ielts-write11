import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { ServerEnvSchema } from '@ielts-checker/validators';
import { globalRateLimit } from './middleware/rateLimit.js';
import { logger, requestLogger } from './middleware/logger.js';
import { startEvaluationWorker } from './workers/evaluation.worker.js';
import { prisma } from './db/prisma.js';

import authRoutes from './routes/auth.js';
import submissionsRoutes from './routes/submissions.js';
import evaluationsRoutes from './routes/evaluations.js';
import webhooksRoutes from './routes/webhooks.js';
import userRoutes from './routes/user.js';
import coachRoutes from './routes/coach.js';
import practiceRoutes from './routes/practice.js';

// ─── Validate environment ─────────────────────────────────────────────────────
const envResult = ServerEnvSchema.safeParse(process.env);
if (!envResult.success) {
  logger.error('Invalid environment configuration', {
    errors: envResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  });
  process.exit(1);
}

// ─── Sentry ───────────────────────────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Stripe webhook needs raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.use(requestLogger);
app.use(globalRateLimit);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/user', userRoutes);
app.use('/api/plans', async (_req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { price_monthly: 'asc' } });
  res.json({ success: true, data: plans });
});
app.use('/api/coach', coachRoutes);
app.use('/api/practice', practiceRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  Sentry.captureException(err);
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001');

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');

  startEvaluationWorker();
  logger.info('Evaluation worker started');

  app.listen(PORT, () => {
    logger.info(`API server running on port ${PORT}`, { env: process.env.NODE_ENV });
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
