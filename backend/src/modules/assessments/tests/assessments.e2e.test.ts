import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Skill } from '@/models/Skill.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { StudentSkill } from '@/models/StudentSkill.model';
import { StudentSkillHistory } from '@/models/StudentSkillHistory.model';
import { Assessment } from '@/models/Assessment.model';
import { AssessmentQuestion } from '@/models/AssessmentQuestion.model';
import { AssessmentAttempt } from '@/models/AssessmentAttempt.model';
import { AssessmentAnswer } from '@/models/AssessmentAnswer.model';
import { AssessmentResult } from '@/models/AssessmentResult.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Assessments Endpoints (E2E)', () => {
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
    await Assessment.deleteMany({});
    await AssessmentQuestion.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await AssessmentAnswer.deleteMany({});
    await AssessmentResult.deleteMany({});
    await Skill.deleteMany({});
    await StudentSkill.deleteMany({});
    await StudentSkillHistory.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await StudentProfile.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestStudent(email = 'student@example.com') {
    const user = await User.create({
      name: 'Alice Learner',
      email,
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.STUDENT, isPrimary: true });
    await StudentProfile.create({
      userId: user._id,
      college: 'Test Tech Institute',
      department: 'CS',
      year: 3,
      semester: 6,
    });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.STUDENT],
    });
    return { user, token };
  }

  async function seedSampleAssessment() {
    const nodeSkill = await Skill.create({
      name: 'Node.js',
      slug: 'nodejs',
      category: 'Backend',
      level: 'INTERMEDIATE',
      tags: ['javascript', 'backend'],
      isActive: true,
    });

    const dsaSkill = await Skill.create({
      name: 'Data Structures',
      slug: 'dsa',
      category: 'Core CS',
      level: 'INTERMEDIATE',
      tags: ['dsa', 'algorithms'],
      isActive: true,
    });

    const assessment = await Assessment.create({
      title: 'Backend Diagnostic Assessment',
      slug: 'backend-diagnostic',
      description: 'Comprehensive diagnostic test covering Node.js and DSA.',
      category: 'Backend',
      durationMinutes: 30,
      totalMarks: 20,
      passingScore: 10,
      difficulty: 'INTERMEDIATE',
      isActive: true,
    });

    // Question 1 (Node.js)
    const q1 = await AssessmentQuestion.create({
      assessmentId: assessment._id,
      questionText: 'What is the Node.js event loop responsible for?',
      options: [
        { optionId: 'opt_1', text: 'Executing non-blocking I/O operations asynchronously' },
        { optionId: 'opt_2', text: 'Managing multi-threaded UI renders' },
        { optionId: 'opt_3', text: 'Compiling TypeScript to machine bytecode' },
      ],
      correctOptionId: 'opt_1',
      explanation: 'The event loop processes non-blocking I/O callbacks on a single thread.',
      skillId: nodeSkill._id,
      topic: 'Event Loop',
      difficulty: 'MEDIUM',
      marks: 10,
    });

    // Question 2 (DSA)
    const q2 = await AssessmentQuestion.create({
      assessmentId: assessment._id,
      questionText: 'What is the average time complexity of a hash table lookup?',
      options: [
        { optionId: 'opt_a', text: 'O(n)' },
        { optionId: 'opt_b', text: 'O(1)' },
        { optionId: 'opt_c', text: 'O(log n)' },
      ],
      correctOptionId: 'opt_b',
      explanation: 'Hash table lookups average O(1) assuming a uniform hash distribution.',
      skillId: dsaSkill._id,
      topic: 'Hashing',
      difficulty: 'EASY',
      marks: 10,
    });

    return { assessment, nodeSkill, dsaSkill, q1, q2 };
  }

  describe('GET /api/v1/assessments (ASSESS-01)', () => {
    it('should list assessments with pagination and filters', async () => {
      await seedSampleAssessment();

      const res = await request(app).get('/api/v1/assessments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('backend-diagnostic');
      expect(res.body.pagination.total).toBe(1);
    });

    it('should filter by category and difficulty', async () => {
      await seedSampleAssessment();

      const res = await request(app).get(
        '/api/v1/assessments?category=Backend&difficulty=INTERMEDIATE',
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);

      const emptyRes = await request(app).get(
        '/api/v1/assessments?difficulty=ADVANCED',
      );
      expect(emptyRes.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/assessments/:assessmentId (ASSESS-02)', () => {
    it('should get assessment details by slug', async () => {
      await seedSampleAssessment();

      const res = await request(app).get('/api/v1/assessments/backend-diagnostic');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Backend Diagnostic Assessment');
    });

    it('should return 404 for non-existent assessment', async () => {
      const res = await request(app).get('/api/v1/assessments/unknown-test');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/assessments/:assessmentId/questions (ASSESS-03)', () => {
    it('should return sanitized questions without correctOptionId or explanation', async () => {
      await seedSampleAssessment();

      const res = await request(app).get(
        '/api/v1/assessments/backend-diagnostic/questions',
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);

      // Verify strict security sanitization
      for (const question of res.body.data) {
        expect(question).not.toHaveProperty('correctOptionId');
        expect(question).not.toHaveProperty('explanation');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('questionText');
        expect(question).toHaveProperty('topic');
      }
    });
  });

  describe('Assessment Attempt Lifecycle (ASSESS-04 through ASSESS-08)', () => {
    it('should start attempt, save answers, submit, score objectively, and update skills', async () => {
      const { token } = await createTestStudent();
      const { assessment, q1, q2 } = await seedSampleAssessment();

      // 1. Start attempt (ASSESS-04)
      const startRes = await request(app)
        .post(`/api/v1/assessments/${assessment.slug}/attempts`)
        .set('Authorization', `Bearer ${token}`);

      expect(startRes.status).toBe(201);
      expect(startRes.body.success).toBe(true);
      expect(startRes.body.data.status).toBe('IN_PROGRESS');
      const attemptId = startRes.body.data.id;

      // 2. Get attempt state (ASSESS-05)
      const getAttemptRes = await request(app)
        .get(`/api/v1/assessment-attempts/${attemptId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getAttemptRes.status).toBe(200);
      expect(getAttemptRes.body.data.status).toBe('IN_PROGRESS');
      expect(getAttemptRes.body.data.answers).toHaveLength(0);

      // 3. Save answers (ASSESS-06)
      // Answer q1 correctly (opt_1)
      const ans1Res = await request(app)
        .post(`/api/v1/assessment-attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: q1._id.toString(),
          selectedOptionId: 'opt_1',
        });
      expect(ans1Res.status).toBe(200);

      // Answer q2 incorrectly (opt_a instead of opt_b)
      const ans2Res = await request(app)
        .post(`/api/v1/assessment-attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: q2._id.toString(),
          selectedOptionId: 'opt_a',
        });
      expect(ans2Res.status).toBe(200);

      // 4. Submit attempt (ASSESS-07)
      const submitRes = await request(app)
        .post(`/api/v1/assessment-attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${token}`);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.data.score).toBe(10); // 10 out of 20
      expect(submitRes.body.data.percentage).toBe(50);
      expect(submitRes.body.data.passed).toBe(true); // passingScore is 10

      // 5. Attempt cannot be modified once submitted
      const reAnswerRes = await request(app)
        .post(`/api/v1/assessment-attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: q1._id.toString(),
          selectedOptionId: 'opt_2',
        });
      expect(reAnswerRes.status).toBe(400);

      // 6. Get Result (ASSESS-08)
      const resultRes = await request(app)
        .get(`/api/v1/assessment-attempts/${attemptId}/result`)
        .set('Authorization', `Bearer ${token}`);

      expect(resultRes.status).toBe(200);
      expect(resultRes.body.data.score).toBe(10);
      expect(resultRes.body.data.topicPerformance).toHaveLength(2);
      expect(resultRes.body.data.skillPerformance).toHaveLength(2);
      expect(resultRes.body.data.weakAreas).toHaveLength(1); // Hashing was 0%
      expect(resultRes.body.data.weakAreas[0].topic).toBe('Hashing');
      expect(resultRes.body.data.review).toHaveLength(2);
      expect(resultRes.body.data.review[0]).toHaveProperty('explanation');

      // 7. Verify StudentSkill was updated with source = 'ASSESSMENT'
      const studentSkills = await StudentSkill.find();
      expect(studentSkills.length).toBeGreaterThanOrEqual(1);
      const assessedSkill = studentSkills.find(
        (s) => s.skillId.toString() === q1.skillId.toString(),
      );
      expect(assessedSkill).toBeDefined();
      expect(assessedSkill?.source).toBe('ASSESSMENT');

      // Verify StudentSkillHistory recorded the assessment event
      const history = await StudentSkillHistory.find();
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].source).toBe('ASSESSMENT');

      // 8. Student Assessment History (ASSESS-09)
      const historyRes = await request(app)
        .get('/api/v1/students/me/assessments')
        .set('Authorization', `Bearer ${token}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data).toHaveLength(1);
      expect(historyRes.body.data[0].score).toBe(10);

      // 9. Student Weak Areas (ASSESS-10)
      const weakAreasRes = await request(app)
        .get('/api/v1/students/me/assessment-weak-areas')
        .set('Authorization', `Bearer ${token}`);

      expect(weakAreasRes.status).toBe(200);
      expect(weakAreasRes.body.data).toHaveLength(1);
      expect(weakAreasRes.body.data[0].topic).toBe('Hashing');
    });
  });
});
