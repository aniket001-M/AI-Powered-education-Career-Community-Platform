import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Skill } from '@/models/Skill.model';
import { Assessment } from '@/models/Assessment.model';
import { AssessmentQuestion } from '@/models/AssessmentQuestion.model';
import { Resource } from '@/models/Resource.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Faculty Endpoints (E2E) - Phase 10', () => {
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
    await Skill.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await Resource.deleteMany({});
    await mockRedis.flushall();
  });

  async function createFacultyUser() {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Faculty@123', salt);
    const user = await User.create({
      name: 'Dr. Sarah Connor',
      email: 'faculty@careergraph.dev',
      passwordHash,
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.FACULTY, isPrimary: true });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.FACULTY],
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

  it('should reject non-faculty users with 403 Forbidden', async () => {
    const { token: studentToken } = await createStudentUser();

    const res = await request(app)
      .get('/api/v1/faculty/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('should support faculty lifecycle (FACULTY-01 to FACULTY-04)', async () => {
    const { user: faculty, token: facultyToken } = await createFacultyUser();

    const skill = await Skill.create({
      name: 'Algorithms & Complexity',
      slug: 'algorithms-and-complexity',
      category: 'Core CS',
      level: 'INTERMEDIATE',
    });

    // 1. FACULTY-01: Dashboard
    const dashRes = await request(app)
      .get('/api/v1/faculty/dashboard')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.success).toBe(true);
    expect(dashRes.body.data.totalAssessments).toBe(0);

    // 2. FACULTY-02: Create Assessment with Questions
    const assessRes = await request(app)
      .post('/api/v1/faculty/assessments')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Midterm Algorithms Evaluation',
        category: 'Core CS',
        description: 'Comprehensive evaluation covering asymptotic notation and dynamic programming.',
        durationMinutes: 45,
        totalMarks: 100,
        passingScore: 60,
        difficulty: 'INTERMEDIATE',
        skillId: skill._id.toString(),
        questions: [
          {
            questionText: 'What is the worst-case time complexity of QuickSort?',
            options: [
              { optionId: 'opt1', text: 'O(N log N)' },
              { optionId: 'opt2', text: 'O(N^2)' },
              { optionId: 'opt3', text: 'O(N)' },
            ],
            correctOptionId: 'opt2',
            skillId: skill._id.toString(),
            topic: 'Sorting Algorithms',
            difficulty: 'MEDIUM',
            marks: 10,
          },
        ],
      });

    expect(assessRes.status).toBe(201);
    expect(assessRes.body.success).toBe(true);
    expect(assessRes.body.data.questionsCreated).toBe(1);
    expect(assessRes.body.data.assessment.title).toBe('Midterm Algorithms Evaluation');

    // 3. FACULTY-03: Upload Academic Resource
    const resourceRes = await request(app)
      .post('/api/v1/faculty/resources')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Advanced Dynamic Programming Notes',
        description: 'Comprehensive lecture slides and recurrence relation examples.',
        type: 'NOTE',
        url: 'https://storage.careergraph.dev/academic/dp-notes.pdf',
        skillId: skill._id.toString(),
        subject: 'Design and Analysis of Algorithms',
        department: 'Computer Science and Engineering',
        college: 'Apex Institute of Technology',
        difficulty: 'ADVANCED',
      });

    expect(resourceRes.status).toBe(201);
    expect(resourceRes.body.success).toBe(true);
    expect(resourceRes.body.data.verificationStatus).toBe('VERIFIED');
    expect(resourceRes.body.data.department).toBe('Computer Science and Engineering');

    // 4. FACULTY-04: Analytics
    const analyticsRes = await request(app)
      .get('/api/v1/faculty/analytics?department=Computer Science and Engineering')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.success).toBe(true);
    expect(analyticsRes.body.data.overview).toBeDefined();
    expect(analyticsRes.body.data.overview.totalEvaluated).toBe(0);
  });
});
