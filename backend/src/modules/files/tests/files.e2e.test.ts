import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { File } from '@/models/File.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Files Endpoints (E2E) - Phase 9', () => {
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
    await File.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestUser(email: string) {
    const user = await User.create({
      name: 'Files Test User',
      email,
      passwordHash: '$2b$04$testpasswordhashforeveryone',
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

  it('should support file metadata upload, signed URL generation, and lifecycle (FILE-01 to FILE-03)', async () => {
    const user1 = await createTestUser('user1@example.com');
    const user2 = await createTestUser('user2@example.com');

    // 1. Upload File Metadata (FILE-01)
    const uploadRes = await request(app)
      .post('/api/v1/files/upload')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({
        originalName: 'Operating_Systems_Notes.pdf',
        mimeType: 'application/pdf',
        size: 1048576, // 1MB
        isPublic: false,
      });

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.storageKey).toBeDefined();
    expect(uploadRes.body.data.url).toContain('https://assets.careergraph.internal');

    const fileId = uploadRes.body.data.id;

    // Reject unsupported MIME type (422 validation error)
    const badMimeRes = await request(app)
      .post('/api/v1/files/upload')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({
        originalName: 'virus.exe',
        mimeType: 'application/x-msdownload',
        size: 5000,
      });
    expect(badMimeRes.status).toBe(422);

    // 2. Get File Metadata & Signed URL (FILE-02)
    // Non-owner cannot access private file
    const forbiddenGet = await request(app)
      .get(`/api/v1/files/${fileId}`)
      .set('Authorization', `Bearer ${user2.token}`);
    expect(forbiddenGet.status).toBe(403);

    // Owner accesses file and receives signed URL
    const getFileRes = await request(app)
      .get(`/api/v1/files/${fileId}`)
      .set('Authorization', `Bearer ${user1.token}`);

    expect(getFileRes.status).toBe(200);
    expect(getFileRes.body.data.id).toBe(fileId);
    expect(getFileRes.body.data.downloadUrl).toContain('token=');

    // 3. Delete File (FILE-03)
    const deleteRes = await request(app)
      .delete(`/api/v1/files/${fileId}`)
      .set('Authorization', `Bearer ${user1.token}`);

    expect(deleteRes.status).toBe(200);

    // After soft-delete, file is 404
    const getAfterDelete = await request(app)
      .get(`/api/v1/files/${fileId}`)
      .set('Authorization', `Bearer ${user1.token}`);
    expect(getAfterDelete.status).toBe(404);
  });
});
