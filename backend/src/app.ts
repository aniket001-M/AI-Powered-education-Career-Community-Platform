import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/config/env';
import { swaggerSpec } from '@/config/swagger';
import { globalErrorHandler } from '@/common/middleware/error-handler';
import { generalLimiter } from '@/common/middleware/rate-limiter';
import { logger } from '@/common/utils/logger';
import { ErrorCode } from '@/common/errors/error-codes';
import apiRoutes from '@/routes/index';

const app = express();

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ───────────────────────────────────────────
app.use('/api/', generalLimiter);

// ─── Request Logging ─────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Swagger Documentation ───────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CareerGraph API Docs',
}));

// Serve swagger spec as JSON
app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: 'Route not found',
    },
  });
});

// ─── Global Error Handler ────────────────────────────────────
app.use(globalErrorHandler);

export default app;
