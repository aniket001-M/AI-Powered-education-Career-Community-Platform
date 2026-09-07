import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { env } from '@/config/env';
import { getRedisClient } from '@/config/redis';
import { User, IUser } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { RefreshSession } from '@/models/RefreshSession.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { UserRole } from '@/common/enums/roles.enum';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';
import { logger } from '@/common/utils/logger';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthTokens,
  AuthResponse,
} from './auth.types';

// ─── Helpers ─────────────────────────────────────────────────

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 min
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: return 900;
  }
}

function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Token Generation ────────────────────────────────────────

function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

// ─── Redis Keys ──────────────────────────────────────────────

function refreshSessionKey(sessionId: string): string {
  return `refresh:${sessionId}`;
}

function userSessionsKey(userId: string): string {
  return `user_sessions:${userId}`;
}

// ─── Service ─────────────────────────────────────────────────

export class AuthService {
  /**
   * AUTH-01: Register a new user.
   * Creates User + Role (+ StudentProfile if STUDENT) in a transaction.
   */
  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(409, ErrorCode.CONFLICT, 'Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    // Generate email verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Use transaction for multi-collection write
    const session = await mongoose.startSession();
    let user: IUser;

    try {
      session.startTransaction();

      // Create user
      const [createdUser] = await User.create(
        [
          {
            name,
            email: email.toLowerCase(),
            passwordHash,
            emailVerificationToken: hashToken(verificationToken),
            emailVerificationExpires: verificationExpires,
          },
        ],
        { session },
      );
      user = createdUser;

      // Create role
      await Role.create(
        [
          {
            userId: user._id,
            role,
            isPrimary: true,
          },
        ],
        { session },
      );

      // Create student profile if role is STUDENT
      if (role === UserRole.STUDENT) {
        await StudentProfile.create(
          [
            {
              userId: user._id,
            },
          ],
          { session },
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Log verification token in development
    if (env.NODE_ENV !== 'production') {
      logger.info(`[DEV] Email verification token for ${email}: ${verificationToken}`);
    }

    // Generate tokens
    const tokens = await this.createSession(user._id.toString(), email, [role], meta);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        roles: [role],
        avatar: user.avatar || null,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  /**
   * AUTH-02: Login.
   */
  async login(
    email: string,
    password: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    // Find user with password hash (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash',
    );

    if (!user) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // Check active status
    if (!user.isActive) {
      throw new AppError(403, ErrorCode.FORBIDDEN, 'Account is deactivated');
    }

    // Check email verification if required
    if (env.EMAIL_VERIFICATION_REQUIRED && !user.isEmailVerified) {
      throw new AppError(
        403,
        ErrorCode.EMAIL_NOT_VERIFIED,
        'Please verify your email before logging in',
      );
    }

    // Fetch roles
    const roles = await this.getUserRoles(user._id.toString());

    // Generate tokens
    const tokens = await this.createSession(
      user._id.toString(),
      user.email,
      roles,
      meta,
    );

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: roles[0], // Primary role
        roles,
        avatar: user.avatar || null,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  /**
   * AUTH-03: Refresh token with rotation.
   * Detects token reuse (replay attack) and revokes all sessions for that user.
   */
  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    let payload: RefreshTokenPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, ErrorCode.TOKEN_INVALID, 'Invalid refresh token');
    }

    const redis = getRedisClient();
    const sessionKey = refreshSessionKey(payload.sessionId);

    // Check if session exists in Redis
    const sessionData = await redis.get(sessionKey);
    if (!sessionData) {
      // Session was revoked or expired → potential token reuse
      // Revoke ALL sessions for this user as a security measure
      logger.warn('Refresh token reuse detected, revoking all sessions', {
        userId: payload.userId,
        sessionId: payload.sessionId,
      });
      await this.revokeAllUserSessions(payload.userId);
      throw new AppError(401, ErrorCode.SESSION_REVOKED, 'Session has been revoked');
    }

    const session = JSON.parse(sessionData);

    // Verify token family matches (rotation check)
    if (session.family !== payload.family) {
      logger.warn('Token family mismatch, revoking all sessions', {
        userId: payload.userId,
      });
      await this.revokeAllUserSessions(payload.userId);
      throw new AppError(401, ErrorCode.SESSION_REVOKED, 'Session has been revoked');
    }

    // Delete old session
    await redis.del(sessionKey);

    // Remove old session from user's session set
    await redis.srem(userSessionsKey(payload.userId), payload.sessionId);

    // Fetch fresh roles
    const roles = await this.getUserRoles(payload.userId);
    const user = await User.findById(payload.userId);

    if (!user || !user.isActive) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, 'User not found or deactivated');
    }

    // Create new session with same family (rotation)
    const newSessionId = uuidv4();
    const ttl = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const newRefreshPayload: RefreshTokenPayload = {
      userId: payload.userId,
      sessionId: newSessionId,
      family: payload.family, // Same family for rotation tracking
    };

    const newRefreshToken = signRefreshToken(newRefreshPayload);
    const accessToken = signAccessToken({
      userId: payload.userId,
      email: user.email,
      roles,
    });

    // Store new session in Redis
    await redis.set(
      refreshSessionKey(newSessionId),
      JSON.stringify({
        userId: payload.userId,
        family: payload.family,
        createdAt: new Date().toISOString(),
      }),
      'EX',
      ttl,
    );

    // Add to user's session set
    await redis.sadd(userSessionsKey(payload.userId), newSessionId);

    // Update DB audit record
    await RefreshSession.findOneAndUpdate(
      { tokenFamily: payload.family, isRevoked: false },
      { isRevoked: true },
    );
    await RefreshSession.create({
      userId: payload.userId,
      tokenFamily: payload.family,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * AUTH-04: Logout — invalidate current refresh session.
   */
  async logout(refreshToken: string): Promise<void> {
    let payload: RefreshTokenPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      // Token is invalid, but logout should still succeed
      return;
    }

    const redis = getRedisClient();

    // Remove session from Redis
    await redis.del(refreshSessionKey(payload.sessionId));
    await redis.srem(userSessionsKey(payload.userId), payload.sessionId);

    // Mark DB record as revoked
    await RefreshSession.updateMany(
      { tokenFamily: payload.family, isRevoked: false },
      { isRevoked: true },
    );
  }

  /**
   * AUTH-05: Logout all sessions.
   */
  async logoutAll(userId: string): Promise<void> {
    await this.revokeAllUserSessions(userId);
  }

  /**
   * AUTH-06: Verify email.
   */
  async verifyEmail(token: string): Promise<void> {
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError(400, ErrorCode.TOKEN_INVALID, 'Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      throw new AppError(400, ErrorCode.EMAIL_ALREADY_VERIFIED, 'Email is already verified');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  }

  /**
   * AUTH-07: Resend verification email.
   */
  async resendVerification(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    if (user.isEmailVerified) {
      throw new AppError(400, ErrorCode.EMAIL_ALREADY_VERIFIED, 'Email is already verified');
    }

    const verificationToken = generateToken();
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Log token in development (placeholder for email service)
    if (env.NODE_ENV !== 'production') {
      logger.info(`[DEV] Email verification token for ${email}: ${verificationToken}`);
    }
  }

  /**
   * AUTH-08: Forgot password.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    const resetToken = generateToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // Log token in development (placeholder for email service)
    if (env.NODE_ENV !== 'production') {
      logger.info(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }
  }

  /**
   * AUTH-09: Reset password.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError(400, ErrorCode.TOKEN_INVALID, 'Invalid or expired reset token');
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all sessions for security
    await this.revokeAllUserSessions(user._id.toString());
  }

  /**
   * AUTH-10: Get current user.
   */
  async me(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const roles = await this.getUserRoles(userId);

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: roles[0],
      roles,
      avatar: user.avatar || null,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  // ─── Private Helpers ───────────────────────────────────────

  /**
   * Get all roles for a user.
   */
  private async getUserRoles(userId: string): Promise<UserRole[]> {
    const roles = await Role.find({ userId }).lean();
    return roles.map((r) => r.role);
  }

  /**
   * Create a new refresh session and return access + refresh tokens.
   */
  private async createSession(
    userId: string,
    email: string,
    roles: UserRole[],
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const sessionId = uuidv4();
    const family = uuidv4();
    const ttl = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const accessToken = signAccessToken({ userId, email, roles });
    const refreshToken = signRefreshToken({ userId, sessionId, family });

    // Store session in Redis
    const redis = getRedisClient();
    await redis.set(
      refreshSessionKey(sessionId),
      JSON.stringify({
        userId,
        family,
        createdAt: new Date().toISOString(),
      }),
      'EX',
      ttl,
    );

    // Track session in user's session set
    await redis.sadd(userSessionsKey(userId), sessionId);

    // Store audit record in MongoDB
    await RefreshSession.create({
      userId,
      tokenFamily: family,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Revoke all refresh sessions for a user (Redis + MongoDB).
   */
  private async revokeAllUserSessions(userId: string): Promise<void> {
    const redis = getRedisClient();

    // Get all session IDs for this user
    const sessionIds = await redis.smembers(userSessionsKey(userId));

    // Delete all sessions from Redis
    if (sessionIds.length > 0) {
      const pipeline = redis.pipeline();
      for (const sid of sessionIds) {
        pipeline.del(refreshSessionKey(sid));
      }
      pipeline.del(userSessionsKey(userId));
      await pipeline.exec();
    }

    // Mark all DB records as revoked
    await RefreshSession.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }
}

// Export singleton instance
export const authService = new AuthService();
