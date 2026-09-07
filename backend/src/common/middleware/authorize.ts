import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';
import { UserRole } from '@/common/enums/roles.enum';

/**
 * Role-based authorization guard factory.
 * Usage: authorize(UserRole.ADMIN, UserRole.MODERATOR)
 *
 * Checks that req.user has at least one of the specified roles.
 * Designed so multi-role users work naturally — if the user's roles array
 * contains ANY of the allowed roles, access is granted.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError(401, ErrorCode.UNAUTHORIZED, 'Authentication required'),
      );
    }

    const userRoles = req.user.roles;

    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return next(
        new AppError(
          403,
          ErrorCode.FORBIDDEN,
          'You do not have permission to perform this action',
        ),
      );
    }

    next();
  };
}
