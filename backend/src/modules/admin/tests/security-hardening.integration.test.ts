import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { InterviewSession } from '@/models/InterviewSession.model';
import { RefreshSession } from '@/models/RefreshSession.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Security Hardening & Protection (Integration) - Phase 11', () => {
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
    await InterviewSession.deleteMany({});
    await RefreshSession.deleteMany({});
    await mockRedis.flushall();
  });

  async function createUser(email: string, role: UserRole) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);
    const user = await User.create({
      name: `${role} User`,
      email,
      passwordHash,
      isEmailVerified: true,
      isActive: true,
    });
    await Role.create({ userId: user._id, role, isPrimary: true });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [role],
    });
    return { user, token };
  }

  it('IDOR Protection: Student cannot view or modify another student interview session', async () => {
    const { user: studentA, token: tokenA } = await createUser('studentA@careergraph.dev', UserRole.STUDENT);
    const { token: tokenB } = await createUser('studentB@careergraph.dev', UserRole.STUDENT);

    const sessionA = await InterviewSession.create({
      userId: studentA._id,
      careerId: new mongoose.Types.ObjectId(),
      roleTitle: 'Full Stack Engineer',
      difficulty: 'MEDIUM',
      status: 'IN_PROGRESS',
    });

    // Student B attempts to access Student A session
    const res = await request(app)
      .get(`/api/v1/interviews/${sessionA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // Must be 403 Forbidden or 404 Not Found to prevent IDOR disclosure
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('Role Hierarchy: Faculty cannot access Admin-only endpoints', async () => {
    const { token: facultyToken } = await createUser('faculty@careergraph.dev', UserRole.FACULTY);

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Role Hierarchy: Student cannot access Faculty dashboard', async () => {
    const { token: studentToken } = await createUser('student@careergraph.dev', UserRole.STUDENT);

    const res = await request(app)
      .get('/api/v1/faculty/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Refresh Token Rotation & Revocation on Reuse', async () => {
    // 1. Register user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rotator User',
        email: 'rotator@careergraph.dev',
        password: 'Password123!',
        role: 'STUDENT',
      });

    expect(regRes.status).toBe(201);
    const initialRefreshToken = regRes.body.data.tokens.refreshToken;

    // 2. Valid Refresh
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(initialRefreshToken);

    // 3. Reuse Attack: Attempting to use the already-rotated initial refresh token
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    // Must be rejected with 401
    expect(reuseRes.status).toBe(401);
  });

  it('NoSQL Injection Resistance: DTO validation rejects operator objects in array and enum fields', async () => {
    const { token } = await createUser('admin@careergraph.dev', UserRole.ADMIN);

    // Attempting to send NoSQL injection operator in demandLevel enum field
    const res = await request(app)
      .post('/api/v1/admin/careers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Valid Title',
        category: 'Valid Category',
        description: 'Valid Description',
        demandLevel: { $ne: 'LOW' }, // Malicious NoSQL operator
      });

    expect(res.status).toBe(422); // Validation error
    expect(res.body.success).toBe(false);
  });
});
