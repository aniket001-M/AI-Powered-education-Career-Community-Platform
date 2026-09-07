import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';
import { logger } from '@/common/utils/logger';
import { isProduction } from '@/config/env';

/**
 * Global Express error handler.
 * Converts AppErrors → FRD standard error envelope.
 * Hides stack traces and internals in production.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── AppError (known, operational) ───────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational AppError', {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
    }

    const response: any = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    // Attach validation details if present
    if (err.details && !isProduction) {
      response.error.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // ── Mongoose validation error ──────────────────────────────
  if (err.name === 'ValidationError') {
    res.status(422).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        ...(!isProduction && { details: err.message }),
      },
    });
    return;
  }

  // ── Mongoose duplicate key error ───────────────────────────
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: ErrorCode.CONFLICT,
        message: 'Duplicate entry',
      },
    });
    return;
  }

  // ── JWT errors ─────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid token',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
      },
    });
    return;
  }

  // ── Unknown error (programming bug) ────────────────────────
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: isProduction ? 'Internal server error' : err.message,
    },
  });
}
