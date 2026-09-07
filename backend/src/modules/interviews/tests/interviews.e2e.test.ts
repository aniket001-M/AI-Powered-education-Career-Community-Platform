import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Career } from '@/models/Career.model';
import { InterviewSession } from '@/models/InterviewSession.model';
import { InterviewQuestion } from '@/models/InterviewQuestion.model';
import { InterviewAnswer } from '@/models/InterviewAnswer.model';
import { InterviewResult } from '@/models/InterviewResult.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Interviews Endpoints (E2E) - Phase 9', () => {
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
    await InterviewSession.deleteMany({});
    await InterviewQuestion.deleteMany({});
    await InterviewAnswer.deleteMany({});
    await InterviewResult.deleteMany({});
    await Career.deleteMany({});
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

  it('should support the interview session, answer capture, and result reporting lifecycle (INTERVIEW-01 to INTERVIEW-07)', async () => {
    const student = await createTestStudent('Diana Prince', 'diana@student.edu');

    // Seed Career
    const career = await Career.create({
      title: 'Backend Engineer',
      slug: 'backend-engineer',
      category: 'Software Engineering',
      description: 'Design and build resilient scalable backend services',
      isActive: true,
    });

    // 1. List Interview Roles (INTERVIEW-01)
    const rolesRes = await request(app).get('/api/v1/interviews/roles');
    expect(rolesRes.status).toBe(200);
    expect(rolesRes.body.success).toBe(true);
    expect(rolesRes.body.data.length).toBe(1);
    expect(rolesRes.body.data[0].roleTitle).toBe('Backend Engineer');

    // 2. Start Interview Session (INTERVIEW-02)
    const startRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        careerId: career.slug,
        difficulty: 'MEDIUM',
      });

    expect(startRes.status).toBe(201);
    expect(startRes.body.success).toBe(true);
    expect(startRes.body.data.session.roleTitle).toBe('Backend Engineer');
    expect(startRes.body.data.session.status).toBe('IN_PROGRESS');
    expect(startRes.body.data.questions.length).toBeGreaterThanOrEqual(3);

    const interviewId = startRes.body.data.session.id;
    const firstQuestionId = startRes.body.data.questions[0].id;

    // 3. Get Interview Session (INTERVIEW-03)
    const getSessionRes = await request(app)
      .get(`/api/v1/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(getSessionRes.status).toBe(200);
    expect(getSessionRes.body.data.id).toBe(interviewId);
    expect(getSessionRes.body.data.answeredCount).toBe(0);

    // 4. Submit Answer (INTERVIEW-04)
    const answerRes = await request(app)
      .post(`/api/v1/interviews/${interviewId}/answers`)
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        questionId: firstQuestionId,
        answerText:
          'I have 2 years of experience building REST APIs using Node.js and MongoDB, focusing on authentication and scalable databases.',
        durationSeconds: 45,
      });

    expect(answerRes.status).toBe(200);
    expect(answerRes.body.success).toBe(true);
    expect(answerRes.body.data.answeredCount).toBe(1);

    // 5. Complete Interview (INTERVIEW-05)
    const completeRes = await request(app)
      .post(`/api/v1/interviews/${interviewId}/complete`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
    expect(completeRes.body.data.evaluationStatus).toBe('EVALUATION_PENDING');

    // 6. Get Interview Result (INTERVIEW-06)
    const resultRes = await request(app)
      .get(`/api/v1/interviews/${interviewId}/result`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(resultRes.status).toBe(200);
    expect(resultRes.body.success).toBe(true);
    expect(resultRes.body.data.status).toBe('EVALUATION_PENDING');
    // Scores are NOT fabricated
    expect(resultRes.body.data.overallScore).toBeNull();
    expect(resultRes.body.data.feedback).toContain('Automated AI evaluation is not enabled');

    // 7. Student Interview History (INTERVIEW-07)
    const historyRes = await request(app)
      .get('/api/v1/students/me/interviews')
      .set('Authorization', `Bearer ${student.token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].id).toBe(interviewId);
    expect(historyRes.body.data[0].status).toBe('COMPLETED');
  });
});
