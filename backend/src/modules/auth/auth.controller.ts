import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '@/common/responses/success';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.validation';

/**
 * AUTH-01: Register
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as RegisterDto;
    const result = await authService.register(
      dto.name,
      dto.email,
      dto.password,
      dto.role,
      {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    );
    sendCreated(res, result, 'Registration successful');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-02: Login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as LoginDto;
    const result = await authService.login(dto.email, dto.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-03: Refresh token
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as RefreshDto;
    const tokens = await authService.refresh(dto.refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    sendSuccess(res, tokens, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-04: Logout
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-05: Logout all sessions
 */
export async function logoutAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.logoutAll(req.user!.userId);
    sendSuccess(res, null, 'All sessions logged out');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-06: Verify email
 */
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as VerifyEmailDto;
    await authService.verifyEmail(dto.token);
    sendSuccess(res, null, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-07: Resend verification
 */
export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as ResendVerificationDto;
    await authService.resendVerification(dto.email);
    // Always return success to avoid email enumeration
    sendSuccess(res, null, 'If the email exists, a verification link has been sent');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-08: Forgot password
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as ForgotPasswordDto;
    await authService.forgotPassword(dto.email);
    // Always return success to avoid email enumeration
    sendSuccess(res, null, 'If the email exists, a reset link has been sent');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-09: Reset password
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as ResetPasswordDto;
    await authService.resetPassword(dto.token, dto.newPassword);
    sendSuccess(res, null, 'Password reset successful');
  } catch (error) {
    next(error);
  }
}

/**
 * AUTH-10: Current user
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.me(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
