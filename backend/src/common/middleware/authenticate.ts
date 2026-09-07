import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';
import { UserRole } from '@/common/enums/roles.enum';

/**
 * Shape of the JWT access-token payload attached to req.user.
 */
export interface JwtPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT authentication middleware.
 * Extracts token from Authorization: Bearer <token>, verifies, and attaches req.user.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError(401, ErrorCode.UNAUTHORIZED, 'Access token required'),
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(
        new AppError(401, ErrorCode.TOKEN_EXPIRED, 'Access token expired'),
      );
    }
    return next(
      new AppError(401, ErrorCode.TOKEN_INVALID, 'Invalid access token'),
    );
  }
}
