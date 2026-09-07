import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { AuditLog } from '@/models/AuditLog.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Audit Logs Endpoints (E2E) - Phase 10', () => {
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
    await AuditLog.deleteMany({});
    await mockRedis.flushall();
  });

  async function createAdminUser() {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);
    const user = await User.create({
      name: 'Auditor Admin',
      email: 'admin@careergraph.dev',
      passwordHash,
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.ADMIN, isPrimary: true });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.ADMIN],
    });
    return { user, token };
  }

  async function createStudentUser() {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Student@123', salt);
    const user = await User.create({
      name: 'Test Student',
      email: 'student@careergraph.dev',
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

  it('should reject non-admin access to audit logs with 403', async () => {
    const { token: studentToken } = await createStudentUser();

    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('should list and retrieve audit logs (AUDIT-01 and AUDIT-02)', async () => {
    const { user: admin, token: adminToken } = await createAdminUser();

    const log1 = await AuditLog.create({
      actorId: admin._id,
      actorEmail: admin.email,
      actorRole: 'ADMIN',
      action: 'USER_ROLE_CHANGED',
      resourceType: 'User',
      resourceId: admin._id.toString(),
      details: { role: 'ADMIN' },
      status: 'SUCCESS',
    });

    const log2 = await AuditLog.create({
      actorId: admin._id,
      actorEmail: admin.email,
      actorRole: 'ADMIN',
      action: 'SETTINGS_MODIFIED',
      resourceType: 'UserSettings',
      details: { theme: 'DARK' },
      status: 'SUCCESS',
    });

    // AUDIT-01: List logs
    const listRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(2);

    // Filter by action
    const filteredRes = await request(app)
      .get('/api/v1/audit-logs?action=USER_ROLE_CHANGED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.data.length).toBe(1);
    expect(filteredRes.body.data[0].action).toBe('USER_ROLE_CHANGED');

    // AUDIT-02: Get log detail
    const detailRes = await request(app)
      .get(`/api/v1/audit-logs/${log1._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.action).toBe('USER_ROLE_CHANGED');
    expect(detailRes.body.data.resourceType).toBe('User');
  });
});
