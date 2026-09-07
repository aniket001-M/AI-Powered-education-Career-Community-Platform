import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Career } from '@/models/Career.model';
import { Skill } from '@/models/Skill.model';
import { CareerSkill } from '@/models/CareerSkill.model';
import { SkillRelation } from '@/models/SkillRelation.model';
import { CareerGoal } from '@/models/CareerGoal.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Careers Endpoints (E2E)', () => {
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
    await Career.deleteMany({});
    await Skill.deleteMany({});
    await CareerSkill.deleteMany({});
    await SkillRelation.deleteMany({});
    await CareerGoal.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await StudentProfile.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestStudent() {
    const user = await User.create({
      name: 'Bob Martin',
      email: 'bob@example.com',
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.STUDENT, isPrimary: true });
    await StudentProfile.create({
      userId: user._id,
      college: 'Test Tech',
      department: 'CSE',
      year: 3,
      semester: 5,
      careerGoals: [],
    });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.STUDENT],
    });
    return { user, token };
  }

  async function seedSampleCareersAndSkills() {
    const backendCareer = await Career.create({
      title: 'Backend Developer',
      slug: 'backend-developer',
      category: 'Engineering',
      description: 'Build backend architectures and APIs.',
      overview: 'Develop scalable server systems.',
      salaryRange: { min: 800000, max: 2400000, currency: 'INR' },
      demandLevel: 'VERY_HIGH',
      growthRate: '+25%',
      isActive: true,
    });

    const dataAnalyst = await Career.create({
      title: 'Data Analyst',
      slug: 'data-analyst',
      category: 'Data',
      description: 'Analyze data and generate insights.',
      overview: 'Transform data into charts.',
      salaryRange: { min: 600000, max: 1800000, currency: 'INR' },
      demandLevel: 'HIGH',
      growthRate: '+20%',
      isActive: true,
    });

    const skillNode = await Skill.create({
      name: 'Node.js',
      slug: 'nodejs',
      category: 'Backend',
      level: 'INTERMEDIATE',
      tags: ['javascript', 'express'],
      isActive: true,
    });

    const skillSql = await Skill.create({
      name: 'SQL',
      slug: 'sql',
      category: 'Databases',
      level: 'INTERMEDIATE',
      tags: ['database', 'queries'],
      isActive: true,
    });

    await SkillRelation.create({
      parentSkillId: skillSql._id,
      childSkillId: skillNode._id,
      relationType: 'RELATED',
    });

    await CareerSkill.create({
      careerId: backendCareer._id,
      skillId: skillNode._id,
      importance: 'CRITICAL',
      weight: 5,
      requiredProficiency: 4,
    });

    await CareerSkill.create({
      careerId: backendCareer._id,
      skillId: skillSql._id,
      importance: 'IMPORTANT',
      weight: 4,
      requiredProficiency: 3,
    });

    return { backendCareer, dataAnalyst, skillNode, skillSql };
  }

  describe('GET /api/v1/careers (CAREER-01)', () => {
    it('should return paginated careers list', async () => {
      await seedSampleCareersAndSkills();

      const res = await request(app).get('/api/v1/careers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter careers by category', async () => {
      await seedSampleCareersAndSkills();

      const res = await request(app).get('/api/v1/careers?category=Data');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('data-analyst');
    });

    it('should search careers by keyword', async () => {
      await seedSampleCareersAndSkills();

      const res = await request(app).get('/api/v1/careers?search=Backend');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Backend Developer');
    });
  });

  describe('GET /api/v1/careers/:careerId (CAREER-02)', () => {
    it('should get career details by slug', async () => {
      await seedSampleCareersAndSkills();

      const res = await request(app).get('/api/v1/careers/backend-developer');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Backend Developer');
      expect(res.body.data.demandLevel).toBe('VERY_HIGH');
    });

    it('should get career details by ObjectId', async () => {
      const { backendCareer } = await seedSampleCareersAndSkills();

      const res = await request(app).get(`/api/v1/careers/${backendCareer._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('backend-developer');
    });

    it('should return 404 for non-existent career', async () => {
      const res = await request(app).get('/api/v1/careers/non-existent-career');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/careers/:careerId/skills (CAREER-03)', () => {
    it('should return skills mapped to the career', async () => {
      await seedSampleCareersAndSkills();

      const res = await request(app).get('/api/v1/careers/backend-developer/skills');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('importance');
      expect(res.body.data[0]).toHaveProperty('requiredProficiency');
    });
  });

  describe('GET /api/v1/careers/:careerId/skill-graph (CAREER-04)', () => {
    it('should return nodes and edges for the career skill graph', async () => {
      await seedSampleCareersAndSkills();

      const res = await request(app).get('/api/v1/careers/backend-developer/skill-graph');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nodes).toHaveLength(2);
      expect(res.body.data.edges).toHaveLength(1);
      expect(res.body.data.career.slug).toBe('backend-developer');
    });
  });

  describe('Student Career Goals (CAREER-05, 06, 07)', () => {
    it('should select career goal, retrieve it, and remove it', async () => {
      const { token } = await createTestStudent();
      const { backendCareer } = await seedSampleCareersAndSkills();

      // POST /students/me/career-goals (CAREER-05)
      const postRes = await request(app)
        .post('/api/v1/students/me/career-goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          careerId: backendCareer.slug,
          isPrimary: true,
          targetRole: 'Senior Backend Architect',
          timeline: '1 year',
          preferredLocations: ['Bangalore', 'Remote'],
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.targetRole).toBe('Senior Backend Architect');

      // GET /students/me/career-goals (CAREER-07)
      const getRes = await request(app)
        .get('/api/v1/students/me/career-goals')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data).toHaveLength(1);
      expect(getRes.body.data[0].careerSlug).toBe('backend-developer');

      const goalId = getRes.body.data[0].id;

      // DELETE /students/me/career-goals/:careerGoalId (CAREER-06)
      const delRes = await request(app)
        .delete(`/api/v1/students/me/career-goals/${goalId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify deletion
      const afterDel = await request(app)
        .get('/api/v1/students/me/career-goals')
        .set('Authorization', `Bearer ${token}`);
      expect(afterDel.body.data).toHaveLength(0);
    });
  });
});
