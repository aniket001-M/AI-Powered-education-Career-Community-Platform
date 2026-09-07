import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { CommunityPost } from '@/models/CommunityPost.model';
import { CommunityComment } from '@/models/CommunityComment.model';
import { CommunityLike } from '@/models/CommunityLike.model';
import { CommunityReport } from '@/models/CommunityReport.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Community Endpoints (E2E) - Phase 7', () => {
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
    await CommunityPost.deleteMany({});
    await CommunityComment.deleteMany({});
    await CommunityLike.deleteMany({});
    await CommunityReport.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestUser(name: string, email: string, role = UserRole.STUDENT) {
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

  it('should support the full community discussion and engagement lifecycle (COMMUNITY-01 to COMMUNITY-10)', async () => {
    const student1 = await createTestUser('Alice Student', 'alice@student.edu');
    const student2 = await createTestUser('Bob Junior', 'bob@student.edu');

    // 1. Create Post (COMMUNITY-03)
    const createRes = await request(app)
      .post('/api/v1/community/posts')
      .set('Authorization', `Bearer ${student1.token}`)
      .send({
        title: 'How to prepare for Amazon SDE 1 System Design interview?',
        content:
          'What are the most important distributed systems concepts to cover for entry level?',
        category: 'Placements',
        postType: 'QUESTION',
        tags: ['SystemDesign', 'Amazon', 'InterviewPrep'],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe(
      'How to prepare for Amazon SDE 1 System Design interview?',
    );
    expect(createRes.body.data.category).toBe('Placements');
    expect(createRes.body.data.likesCount).toBe(0);

    const postId = createRes.body.data.id;

    // Create a second post for similar discussions testing
    await request(app)
      .post('/api/v1/community/posts')
      .set('Authorization', `Bearer ${student2.token}`)
      .send({
        title: 'Google SDE System Design breakdown',
        content: 'Sharing notes on caching, load balancing and CAP theorem.',
        category: 'Placements',
        postType: 'EXPERIENCE',
        tags: ['SystemDesign', 'Google'],
      });

    // 2. List Posts with filter & search (COMMUNITY-01)
    const listRes = await request(app)
      .get('/api/v1/community/posts')
      .query({
        category: 'Placements',
        search: 'Amazon',
      });

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.pagination.total).toBe(1);

    // 3. Get Post by ID (COMMUNITY-02)
    const getRes = await request(app).get(`/api/v1/community/posts/${postId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(postId);
    expect(getRes.body.data.author.name).toBe('Alice Student');

    // 4. Update Post (COMMUNITY-04)
    // Non-author cannot edit
    const unauthorizedEdit = await request(app)
      .patch(`/api/v1/community/posts/${postId}`)
      .set('Authorization', `Bearer ${student2.token}`)
      .send({ title: 'Hacked title' });
    expect(unauthorizedEdit.status).toBe(403);

    // Author edits successfully
    const updateRes = await request(app)
      .patch(`/api/v1/community/posts/${postId}`)
      .set('Authorization', `Bearer ${student1.token}`)
      .send({
        title: 'How to prepare for Amazon SDE 1 LLD & HLD interview?',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toContain('LLD & HLD');

    // 5. Add Comments (COMMUNITY-06)
    const commentRes = await request(app)
      .post(`/api/v1/community/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${student2.token}`)
      .send({
        content: 'Focus heavily on Object-Oriented Design and scalable APIs first!',
      });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.success).toBe(true);
    expect(commentRes.body.data.content).toContain('Object-Oriented Design');

    // 6. List Comments (COMMUNITY-07)
    const listCommentsRes = await request(app).get(
      `/api/v1/community/posts/${postId}/comments`,
    );
    expect(listCommentsRes.status).toBe(200);
    expect(listCommentsRes.body.data.length).toBe(1);
    expect(listCommentsRes.body.data[0].author.name).toBe('Bob Junior');

    // 7. Like / Unlike Post (COMMUNITY-08)
    const likeRes = await request(app)
      .post(`/api/v1/community/posts/${postId}/like`)
      .set('Authorization', `Bearer ${student2.token}`);

    expect(likeRes.status).toBe(200);
    expect(likeRes.body.data.liked).toBe(true);
    expect(likeRes.body.data.likesCount).toBe(1);

    // Toggling like again unlikes
    const unlikeRes = await request(app)
      .post(`/api/v1/community/posts/${postId}/like`)
      .set('Authorization', `Bearer ${student2.token}`);

    expect(unlikeRes.status).toBe(200);
    expect(unlikeRes.body.data.liked).toBe(false);
    expect(unlikeRes.body.data.likesCount).toBe(0);

    // 8. Report Post (COMMUNITY-09)
    const reportRes = await request(app)
      .post(`/api/v1/community/posts/${postId}/report`)
      .set('Authorization', `Bearer ${student2.token}`)
      .send({
        reason: 'SPAM',
        details: 'Testing report functionality',
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.success).toBe(true);

    // 9. Similar Discussions (COMMUNITY-10)
    const similarRes = await request(app).get(
      `/api/v1/community/posts/${postId}/similar`,
    );
    expect(similarRes.status).toBe(200);
    expect(similarRes.body.data.length).toBe(1);
    expect(similarRes.body.data[0].title).toContain('Google SDE');

    // 10. Delete Post (COMMUNITY-05)
    const deleteRes = await request(app)
      .delete(`/api/v1/community/posts/${postId}`)
      .set('Authorization', `Bearer ${student1.token}`);

    expect(deleteRes.status).toBe(200);

    // Verify deleted post is not returned in public listing
    const listAfterDelete = await request(app).get('/api/v1/community/posts');
    const ids = listAfterDelete.body.data.map((p: any) => p.id);
    expect(ids).not.toContain(postId);
  });
});
