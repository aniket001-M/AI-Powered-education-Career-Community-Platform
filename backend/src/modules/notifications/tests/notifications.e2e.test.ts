import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Notification } from '@/models/Notification.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Notifications Endpoints (E2E) - Phase 9', () => {
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
    await Notification.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestStudent(name: string, email: string) {
    const user = await User.create({
      name,
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

  it('should support notification listing, unread counting, and marking read (NOTIFY-01 to NOTIFY-04)', async () => {
    const student = await createTestStudent('Evan Student', 'evan@student.edu');

    // Create 3 notifications for student
    const notif1 = await Notification.create({
      userId: student.user._id,
      title: 'New Roadmap Step Unlocked',
      message: 'You have unlocked Step 3: Distributed Caching',
      type: 'ROADMAP',
      isRead: false,
    });

    const notif2 = await Notification.create({
      userId: student.user._id,
      title: 'New Opportunity Matching Your Profile',
      message: 'Vanguard Tech has posted a Frontend Internship',
      type: 'OPPORTUNITY',
      isRead: false,
    });

    await Notification.create({
      userId: student.user._id,
      title: 'Welcome to CareerGraph',
      message: 'Your profile has been created successfully',
      type: 'INFO',
      isRead: true,
      readAt: new Date(),
    });

    // 1. Get Unread Count (NOTIFY-04)
    const unreadRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${student.token}`);

    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.data.unreadCount).toBe(2);

    // 2. List Notifications (NOTIFY-01)
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${student.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(3);
    expect(listRes.body.pagination.total).toBe(3);

    // 3. Mark Single Notification Read (NOTIFY-02)
    const readSingleRes = await request(app)
      .patch(`/api/v1/notifications/${notif1._id}/read`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(readSingleRes.status).toBe(200);
    expect(readSingleRes.body.data.isRead).toBe(true);

    const unreadAfterOne = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${student.token}`);
    expect(unreadAfterOne.body.data.unreadCount).toBe(1);

    // 4. Mark All Notifications Read (NOTIFY-03)
    const readAllRes = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${student.token}`);

    expect(readAllRes.status).toBe(200);

    const unreadFinal = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${student.token}`);
    expect(unreadFinal.body.data.unreadCount).toBe(0);
  });
});
