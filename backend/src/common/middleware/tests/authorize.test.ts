import { Request, Response, NextFunction } from 'express';
import { authorize } from '../authorize';
import { UserRole } from '@/common/enums/roles.enum';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';

describe('authorize middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    next = jest.fn();
  });

  it('should return 401 UNAUTHORIZED if req.user is missing', () => {
    const middleware = authorize(UserRole.ADMIN);
    middleware(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should call next() without error if user has the allowed role', () => {
    mockReq.user = {
      userId: '507f1f77bcf86cd799439011',
      email: 'admin@careergraph.dev',
      roles: [UserRole.ADMIN],
    };

    const middleware = authorize(UserRole.ADMIN);
    middleware(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should return 403 FORBIDDEN if user lacks the allowed role', () => {
    mockReq.user = {
      userId: '507f1f77bcf86cd799439011',
      email: 'student@careergraph.dev',
      roles: [UserRole.STUDENT],
    };

    const middleware = authorize(UserRole.ADMIN, UserRole.MODERATOR);
    middleware(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = (next as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('should allow multi-role user when at least one role matches', () => {
    mockReq.user = {
      userId: '507f1f77bcf86cd799439011',
      email: 'user@careergraph.dev',
      roles: [UserRole.STUDENT, UserRole.SENIOR],
    };

    const middleware = authorize(UserRole.SENIOR, UserRole.ADMIN);
    middleware(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
