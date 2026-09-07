import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { UserSettings } from '@/models/UserSettings.model';
import { RefreshSession } from '@/models/RefreshSession.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Settings Endpoints (E2E) - Phase 9', () => {
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
    await UserSettings.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await RefreshSession.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestUser(email = 'user@example.com', plainPassword = 'OldPassword123!') {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);
    const user = await User.create({
      name: 'Settings Test User',
      email,
      passwordHash,
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.STUDENT, isPrimary: true });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.STUDENT],
    });
    return { user, token };
  }

  it('should get settings, update preferences, change password, and deactivate account (SETTINGS-01 to SETTINGS-04)', async () => {
    const { user, token } = await createTestUser();

    // 1. Get Settings (SETTINGS-01) - auto-initializes defaults
    const getRes = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.emailNotifications).toBe(true);
    expect(getRes.body.data.theme).toBe('system');

    // 2. Update Settings (SETTINGS-02)
    const updateRes = await request(app)
      .patch('/api/v1/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        theme: 'dark',
        pushNotifications: false,
        profileVisibility: 'PUBLIC',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.theme).toBe('dark');
    expect(updateRes.body.data.pushNotifications).toBe(false);
    expect(updateRes.body.data.profileVisibility).toBe('PUBLIC');

    // 3. Change Password (SETTINGS-03)
    // Wrong current password fails
    const wrongPassRes = await request(app)
      .patch('/api/v1/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword999!',
        newPassword: 'BrandNewSecure123@',
      });
    expect(wrongPassRes.status).toBe(400);

    // Correct password update succeeds
    const changePassRes = await request(app)
      .patch('/api/v1/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'BrandNewSecure123@',
      });

    expect(changePassRes.status).toBe(200);
    expect(changePassRes.body.success).toBe(true);

    // Verify user can login with new password
    const updatedUser = await User.findById(user._id).select('+passwordHash');
    const isNewValid = await bcrypt.compare('BrandNewSecure123@', updatedUser!.passwordHash);
    expect(isNewValid).toBe(true);

    // 4. Delete Account (SETTINGS-04)
    const deleteRes = await request(app)
      .delete('/api/v1/settings/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'BrandNewSecure123@' });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify user is excluded from normal queries and soft-deleted in db
    const hiddenUser = await User.findById(user._id);
    expect(hiddenUser).toBeNull();

    const deactivatedUser = await User.findOne({ _id: user._id, deletedAt: { $ne: null } });
    expect(deactivatedUser).not.toBeNull();
    expect(deactivatedUser?.isActive).toBe(false);
    expect(deactivatedUser?.deletedAt).toBeDefined();
  });
});
