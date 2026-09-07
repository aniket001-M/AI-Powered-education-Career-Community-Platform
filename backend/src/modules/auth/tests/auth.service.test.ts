import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import crypto from 'crypto';
import { authService } from '../auth.service';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { RefreshSession } from '@/models/RefreshSession.model';
import { UserRole } from '@/common/enums/roles.enum';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';

describe('AuthService', () => {
  let replSet: MongoMemoryReplSet;
  let mockRedis: any;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = replSet.getUri();
    await mongoose.connect(uri);

    mockRedis = new RedisMock();
    setRedisClient(mockRedis as any);
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (replSet) {
      await replSet.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await StudentProfile.deleteMany({});
    await RefreshSession.deleteMany({});
    await mockRedis.flushall();
  });

  describe('register', () => {
    it('should register a new STUDENT user, create Role and StudentProfile within transaction', async () => {
      const result = await authService.register(
        'Student User',
        'student@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('student@test.com');
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      // Check DB records
      const user = await User.findOne({ email: 'student@test.com' });
      expect(user).toBeTruthy();
      expect(user!.name).toBe('Student User');

      const role = await Role.findOne({ userId: user!._id });
      expect(role).toBeTruthy();
      expect(role!.role).toBe(UserRole.STUDENT);

      const profile = await StudentProfile.findOne({ userId: user!._id });
      expect(profile).toBeTruthy();
    });

    it('should register an ADMIN user without creating StudentProfile', async () => {
      const result = await authService.register(
        'Admin User',
        'admin@test.com',
        'StrongP@ss123',
        UserRole.ADMIN,
      );

      expect(result.user.role).toBe(UserRole.ADMIN);

      const user = await User.findOne({ email: 'admin@test.com' });
      const profile = await StudentProfile.findOne({ userId: user!._id });
      expect(profile).toBeNull();
    });

    it('should throw 409 CONFLICT if email is already registered', async () => {
      await authService.register(
        'First User',
        'duplicate@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );

      await expect(
        authService.register(
          'Second User',
          'duplicate@test.com',
          'StrongP@ss123',
          UserRole.SENIOR,
        ),
      ).rejects.toThrow(AppError);

      try {
        await authService.register(
          'Second User',
          'duplicate@test.com',
          'StrongP@ss123',
          UserRole.SENIOR,
        );
      } catch (err: any) {
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe(ErrorCode.CONFLICT);
      }
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(
        'Login User',
        'login@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );
    });

    it('should successfully log in with valid credentials', async () => {
      const result = await authService.login('login@test.com', 'StrongP@ss123');

      expect(result.user.email).toBe('login@test.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw 401 INVALID_CREDENTIALS for wrong password', async () => {
      await expect(
        authService.login('login@test.com', 'WrongPassword123!'),
      ).rejects.toThrow(AppError);

      try {
        await authService.login('login@test.com', 'WrongPassword123!');
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      }
    });

    it('should throw 401 INVALID_CREDENTIALS for non-existent user', async () => {
      await expect(
        authService.login('nobody@test.com', 'StrongP@ss123'),
      ).rejects.toThrow(AppError);
    });

    it('should throw 401 UNAUTHORIZED if account is deactivated', async () => {
      await User.updateOne({ email: 'login@test.com' }, { isActive: false });

      await expect(
        authService.login('login@test.com', 'StrongP@ss123'),
      ).rejects.toThrow(AppError);
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully with valid refresh token', async () => {
      const reg = await authService.register(
        'Refresh User',
        'refresh@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );

      const rotated = await authService.refresh(reg.tokens.refreshToken);
      expect(rotated.accessToken).toBeDefined();
      expect(rotated.refreshToken).toBeDefined();
      expect(rotated.refreshToken).not.toBe(reg.tokens.refreshToken);
    });

    it('should detect token replay and revoke all sessions', async () => {
      const reg = await authService.register(
        'Replay User',
        'replay@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );

      // First refresh succeeds
      await authService.refresh(reg.tokens.refreshToken);

      // Replay old refresh token must fail with 401 SESSION_REVOKED
      await expect(
        authService.refresh(reg.tokens.refreshToken),
      ).rejects.toThrow(AppError);

      try {
        await authService.refresh(reg.tokens.refreshToken);
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe(ErrorCode.SESSION_REVOKED);
      }
    });
  });

  describe('logout and logoutAll', () => {
    it('should logout and invalidate refresh token', async () => {
      const reg = await authService.register(
        'Logout User',
        'logout@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );

      await authService.logout(reg.tokens.refreshToken);

      // Attempting to refresh should now fail
      await expect(
        authService.refresh(reg.tokens.refreshToken),
      ).rejects.toThrow();
    });

    it('should logoutAll and invalidate all user sessions', async () => {
      const reg = await authService.register(
        'LogoutAll User',
        'logoutall@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );

      // User logs in again to create a second session
      const loginRes = await authService.login('logoutall@test.com', 'StrongP@ss123');

      // Logout all sessions
      await authService.logoutAll(reg.user.id);

      // Both tokens should now be invalid for refresh
      await expect(authService.refresh(reg.tokens.refreshToken)).rejects.toThrow();
      await expect(authService.refresh(loginRes.tokens.refreshToken)).rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified when valid token is provided', async () => {
      await authService.register(
        'Verify User',
        'verify@test.com',
        'StrongP@ss123',
        UserRole.STUDENT,
      );

      const rawToken = 'my-verification-token';
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

      await User.updateOne(
        { email: 'verify@test.com' },
        {
          emailVerificationToken: hashed,
          emailVerificationExpires: new Date(Date.now() + 60000),
          isEmailVerified: false,
        },
      );

      await authService.verifyEmail(rawToken);

      const updated = await User.findOne({ email: 'verify@test.com' });
      expect(updated!.isEmailVerified).toBe(true);
      expect(updated!.emailVerificationToken).toBeFalsy();
    });

    it('should throw 400 for invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(AppError);
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('should generate password reset token and allow password reset', async () => {
      await authService.register(
        'Reset User',
        'reset@test.com',
        'OldPassword@123',
        UserRole.STUDENT,
      );

      const rawResetToken = 'my-reset-token';
      const hashed = crypto.createHash('sha256').update(rawResetToken).digest('hex');

      await User.updateOne(
        { email: 'reset@test.com' },
        {
          passwordResetToken: hashed,
          passwordResetExpires: new Date(Date.now() + 60000),
        },
      );

      await authService.resetPassword(rawResetToken, 'NewPassword@456');

      // Now should be able to log in with new password
      const loginRes = await authService.login('reset@test.com', 'NewPassword@456');
      expect(loginRes.user.email).toBe('reset@test.com');

      // Old password should fail
      await expect(
        authService.login('reset@test.com', 'OldPassword@123'),
      ).rejects.toThrow(AppError);
    });
  });

  describe('me', () => {
    it('should return user profile and roles', async () => {
      const reg = await authService.register(
        'Me User',
        'me@test.com',
        'StrongP@ss123',
        UserRole.SENIOR,
      );

      const me = await authService.me(reg.user.id);
      expect(me.id).toBe(reg.user.id);
      expect(me.name).toBe('Me User');
      expect(me.email).toBe('me@test.com');
      expect(me.role).toBe(UserRole.SENIOR);
      expect(me.roles).toContain(UserRole.SENIOR);
    });

    it('should throw 404 if user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(authService.me(nonExistentId)).rejects.toThrow(AppError);
    });
  });
});
