import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Skill } from '@/models/Skill.model';
import { Resource } from '@/models/Resource.model';
import { ResourceProgress } from '@/models/ResourceProgress.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Resources Endpoints (E2E) - Phase 6', () => {
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
    await Resource.deleteMany({});
    await ResourceProgress.deleteMany({});
    await Skill.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await StudentProfile.deleteMany({});
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
    if (role === UserRole.STUDENT) {
      await StudentProfile.create({
        userId: user._id,
        college: 'Apex Engineering College',
        department: 'CSE',
        year: 3,
        semester: 5,
      });
    }
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [role],
    });
    return { user, token };
  }

  it('should support all 10 resource types and complete CRUD lifecycle', async () => {
    const faculty = await createTestUser('Dr. Sarah', 'sarah@faculty.edu', UserRole.FACULTY);
    const student = await createTestUser('Student Bob', 'bob@student.edu', UserRole.STUDENT);

    const skill = await Skill.create({
      name: 'Distributed Systems',
      slug: 'distributed-systems',
      category: 'Architecture',
      level: 'ADVANCED',
    });

    // 1. Create Resource (as FACULTY) with storageKey
    const createRes = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({
        title: 'Distributed Consensus & Raft Paper',
        description: 'Comprehensive guide to raft consensus algorithm',
        type: 'PDF',
        url: 'https://s3.example.com/materials/raft.pdf',
        storageKey: 's3://careergraph-assets/materials/raft.pdf',
        skillId: skill.slug,
        subject: 'Distributed Computing',
        college: 'Apex Engineering College',
        department: 'CSE',
        difficulty: 'ADVANCED',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe('Distributed Consensus & Raft Paper');
    expect(createRes.body.data.type).toBe('PDF');
    expect(createRes.body.data.storageKey).toBe('s3://careergraph-assets/materials/raft.pdf');
    expect(createRes.body.data.verificationStatus).toBe('VERIFIED');
    expect(createRes.body.data.slug).toBe('distributed-consensus-raft-paper');

    const resourceId = createRes.body.data.id;

    // 2. Reject resource creation by student directly
    const studentCreateRes = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        title: 'Student Upload',
        description: 'Attempted student upload',
        type: 'NOTE',
        url: 'https://example.com/note.txt',
      });

    expect(studentCreateRes.status).toBe(403);

    // 3. List resources with filters (RESOURCE-01)
    const listRes = await request(app)
      .get('/api/v1/resources')
      .query({
        type: 'PDF',
        difficulty: 'ADVANCED',
      });

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.pagination.total).toBe(1);

    // 4. Get resource by ID and Slug (RESOURCE-02)
    const getByIdRes = await request(app).get(`/api/v1/resources/${resourceId}`);
    expect(getByIdRes.status).toBe(200);
    expect(getByIdRes.body.data.id).toBe(resourceId);

    const getBySlugRes = await request(app).get(
      `/api/v1/resources/distributed-consensus-raft-paper`,
    );
    expect(getBySlugRes.status).toBe(200);
    expect(getBySlugRes.body.data.title).toBe('Distributed Consensus & Raft Paper');

    // 5. Update resource (RESOURCE-04)
    const updateRes = await request(app)
      .patch(`/api/v1/resources/${resourceId}`)
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({
        description: 'Updated comprehensive guide to raft consensus algorithm with TLA+ specs',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toContain('with TLA+ specs');

    // 6. Track student access (RESOURCE-06)
    const accessRes = await request(app)
      .post(`/api/v1/resources/${resourceId}/access`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(accessRes.status).toBe(200);
    expect(accessRes.body.success).toBe(true);
    expect(accessRes.body.data.status).toBe('ACCESSED');
    expect(accessRes.body.data.accessCount).toBe(1);

    // Track access a second time
    const accessRes2 = await request(app)
      .post(`/api/v1/resources/${resourceId}/access`)
      .set('Authorization', `Bearer ${student.token}`);
    expect(accessRes2.body.data.accessCount).toBe(2);

    // 7. Mark resource complete (RESOURCE-07)
    const completeRes = await request(app)
      .post(`/api/v1/resources/${resourceId}/complete`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.status).toBe('COMPLETED');
    expect(completeRes.body.data.completedAt).toBeDefined();

    // 8. Get student resource history (RESOURCE-08: GET /api/v1/students/me/resources/history)
    const historyRes = await request(app)
      .get('/api/v1/students/me/resources/history')
      .set('Authorization', `Bearer ${student.token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].resourceId).toBe(resourceId);
    expect(historyRes.body.data[0].status).toBe('COMPLETED');
    expect(historyRes.body.data[0].accessCount).toBe(2);

    // 9. Soft delete resource (RESOURCE-05)
    const deleteRes = await request(app)
      .delete(`/api/v1/resources/${resourceId}`)
      .set('Authorization', `Bearer ${faculty.token}`);

    expect(deleteRes.status).toBe(200);

    // Should no longer appear in public list
    const listAfterDelete = await request(app).get('/api/v1/resources');
    expect(listAfterDelete.body.data.length).toBe(0);
  });

  it('should validate all 10 supported resource types', async () => {
    const admin = await createTestUser('Super Admin', 'admin@careergraph.internal', UserRole.ADMIN);

    const types = [
      'PDF',
      'VIDEO',
      'ARTICLE',
      'COURSE',
      'PRACTICE',
      'PROJECT',
      'NOTE',
      'SYLLABUS',
      'LAB_MANUAL',
      'QUESTION_PAPER',
    ] as const;

    for (const t of types) {
      const res = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: `Sample ${t} Material`,
          description: `Detailed description for ${t}`,
          type: t,
          url: `https://example.com/assets/${t.toLowerCase()}`,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe(t);
    }

    // Invalid type should fail validation
    const invalidTypeRes = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Invalid Type',
        description: 'Should fail validation',
        type: 'INVALID_TYPE',
        url: 'https://example.com/invalid',
      });

    expect(invalidTypeRes.status).toBe(422);
    expect(invalidTypeRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return controlled AI_NOT_ENABLED for AI/RAG query endpoints', async () => {
    const student = await createTestUser('Alice Student', 'alice@student.edu', UserRole.STUDENT);

    const searchRagRes = await request(app)
      .post('/api/v1/resources/knowledge/search')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ query: 'Explain Raft election' });

    expect(searchRagRes.status).toBe(501);
    expect(searchRagRes.body.success).toBe(false);
    expect(searchRagRes.body.error.code).toBe('AI_NOT_ENABLED');

    const askRagRes = await request(app)
      .post('/api/v1/resources/knowledge/ask')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ query: 'What is quorum in distributed consensus?' });

    expect(askRagRes.status).toBe(501);
    expect(askRagRes.body.success).toBe(false);
    expect(askRagRes.body.error.code).toBe('AI_NOT_ENABLED');
  });
});
