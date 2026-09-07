import { ErrorCode } from './error-codes';

/**
 * Custom operational error class.
 * All known/expected errors should be thrown as AppError.
 * Unknown errors (programming bugs) will be caught by the global error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: any,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ─── Factory methods ───────────────────────────────────────

  static badRequest(message: string, details?: any): AppError {
    return new AppError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, ErrorCode.CONFLICT, message);
  }

  static rateLimited(message = 'Too many requests'): AppError {
    return new AppError(429, ErrorCode.RATE_LIMIT, message);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, ErrorCode.INTERNAL_ERROR, message, undefined, false);
  }
}
