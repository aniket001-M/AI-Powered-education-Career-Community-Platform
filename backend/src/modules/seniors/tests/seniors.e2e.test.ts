import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { SeniorExperience } from '@/models/SeniorExperience.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Senior Experiences Endpoints (E2E) - Phase 8', () => {
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
    await SeniorExperience.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestUser(name: string, email: string, role: UserRole) {
    const user = await User.create({
      name,
      email,
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role, isPrimary: true });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [role],
    });
    return { user, token };
  }

  it('should support the full senior experience creation, verification, and retrieval lifecycle (SENIOR-01 to SENIOR-06)', async () => {
    const senior = await createTestUser('Dev Senior', 'dev@senior.edu', UserRole.SENIOR);
    const faculty = await createTestUser('Prof Davis', 'davis@faculty.edu', UserRole.FACULTY);
    const student = await createTestUser('Junior Sam', 'sam@student.edu', UserRole.STUDENT);

    // 1. Create Senior Experience (SENIOR-03)
    const createRes = await request(app)
      .post('/api/v1/senior-experiences')
      .set('Authorization', `Bearer ${senior.token}`)
      .send({
        company: 'Microsoft',
        role: 'SWE Intern',
        batch: '2024',
        department: 'CSE',
        title: 'Cracking Microsoft IDC Internship: My 3-Round Experience',
        content: 'Sharing detailed interview rounds and timeline.',
        interviewProcess: 'Round 1: DSA + OS, Round 2: System Design basics, Round 3: Culture fit',
        preparationTips: 'Focus on LeetCode Mediums and OS concurrency.',
        referralContact: 'linkedin.com/in/devsenior',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.company).toBe('Microsoft');
    expect(createRes.body.data.verificationStatus).toBe('PENDING');

    const expId = createRes.body.data.id;

    // 2. Student cannot create senior experience (403)
    const studentCreate = await request(app)
      .post('/api/v1/senior-experiences')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        company: 'Google',
        role: 'Intern',
        batch: '2026',
        department: 'IT',
        title: 'Student Fake Experience',
        content: 'Not allowed',
      });
    expect(studentCreate.status).toBe(403);

    // 3. Student cannot verify experience (403)
    const studentVerify = await request(app)
      .patch(`/api/v1/senior-experiences/${expId}/verify`)
      .set('Authorization', `Bearer ${student.token}`)
      .send({ status: 'VERIFIED' });
    expect(studentVerify.status).toBe(403);

    // 4. Authorized faculty verifies experience (SENIOR-06)
    const verifyRes = await request(app)
      .patch(`/api/v1/senior-experiences/${expId}/verify`)
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({ status: 'VERIFIED' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verificationStatus).toBe('VERIFIED');

    // 5. List verified senior experiences (SENIOR-01)
    const listRes = await request(app)
      .get('/api/v1/senior-experiences')
      .query({ company: 'Microsoft', batch: '2024' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.pagination.total).toBe(1);

    // 6. Get Senior Experience by ID (SENIOR-02)
    const getRes = await request(app).get(`/api/v1/senior-experiences/${expId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(expId);
    expect(getRes.body.data.senior.name).toBe('Dev Senior');

    // 7. Update Senior Experience (SENIOR-04)
    const updateRes = await request(app)
      .patch(`/api/v1/senior-experiences/${expId}`)
      .set('Authorization', `Bearer ${senior.token}`)
      .send({
        preparationTips: 'Focus on LeetCode Mediums, OS concurrency, and mock interviews.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.preparationTips).toContain('mock interviews');

    // 8. Delete Senior Experience (SENIOR-05)
    const deleteRes = await request(app)
      .delete(`/api/v1/senior-experiences/${expId}`)
      .set('Authorization', `Bearer ${senior.token}`);

    expect(deleteRes.status).toBe(200);

    // Verify deleted experience is excluded from public listing
    const listAfterDelete = await request(app).get('/api/v1/senior-experiences');
    expect(listAfterDelete.body.data.length).toBe(0);
  });
});
