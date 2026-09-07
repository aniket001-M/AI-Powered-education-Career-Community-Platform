import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { RefreshSession } from '@/models/RefreshSession.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Users Endpoints (E2E)', () => {
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

  async function createTestUser(roleName: UserRole = UserRole.STUDENT) {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    const role = await Role.create({ userId: user._id, role: roleName, isPrimary: true });

    if (roleName === UserRole.STUDENT) {
      await StudentProfile.create({
        userId: user._id,
        college: 'Test College',
        department: 'CS',
        year: 2,
        semester: 3,
        cgpa: 8.5,
        academicInterests: ['Algorithms'],
        careerGoals: [],
        projects: [],
        certifications: [],
      });
    }

    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [roleName],
    });

    return { user, role, token };
  }

  describe('GET /api/v1/users/me', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with user profile and student details', async () => {
      const { token } = await createTestUser(UserRole.STUDENT);

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe');
      expect(res.body.data.email).toBe('john@example.com');
      expect(res.body.data.department).toBe('CS');
      expect(res.body.data.year).toBe(2);
      expect(res.body.data.semester).toBe(3);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update user name and student profile fields', async () => {
      const { token } = await createTestUser(UserRole.STUDENT);

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Johnathan Doe',
          bio: 'Aspiring Cloud Architect',
          year: 3,
          semester: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Johnathan Doe');
      expect(res.body.data.bio).toBe('Aspiring Cloud Architect');
      expect(res.body.data.year).toBe(3);
      expect(res.body.data.semester).toBe(5);
    });

    it('should return 422 if year or semester is out of bounds', async () => {
      const { token } = await createTestUser(UserRole.STUDENT);

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          year: 10, // Max is 6
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
