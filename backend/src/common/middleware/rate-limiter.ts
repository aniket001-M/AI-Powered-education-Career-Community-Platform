import rateLimit from 'express-rate-limit';
import { env, isTest } from '@/config/env';
import { ErrorCode } from '@/common/errors/error-codes';

/**
 * General API rate limiter.
 */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_TTL * 1000,
  max: env.RATE_LIMIT_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT,
      message: 'Too many requests, please try again later',
    },
  },
});

/**
 * Strict rate limiter for auth endpoints (login, register, forgot-password).
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT,
      message: 'Too many authentication attempts, please try again later',
    },
  },
});
