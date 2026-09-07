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
import { StudentSkill } from '@/models/StudentSkill.model';
import { StudentSkillHistory } from '@/models/StudentSkillHistory.model';
import { CareerGoal } from '@/models/CareerGoal.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Skills Endpoints (E2E)', () => {
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
    await Skill.deleteMany({});
    await SkillRelation.deleteMany({});
    await StudentSkill.deleteMany({});
    await StudentSkillHistory.deleteMany({});
    await Career.deleteMany({});
    await CareerSkill.deleteMany({});
    await CareerGoal.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await StudentProfile.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestStudent() {
    const user = await User.create({
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.STUDENT, isPrimary: true });
    await StudentProfile.create({
      userId: user._id,
      college: 'Institute of Tech',
      department: 'CS',
      year: 4,
      semester: 7,
      careerGoals: [],
    });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.STUDENT],
    });
    return { user, token };
  }

  async function seedSkillsData() {
    const parent = await Skill.create({
      name: 'Programming Fundamentals',
      slug: 'programming-fundamentals',
      category: 'Core CS',
      level: 'FOUNDATIONAL',
      tags: ['basics', 'syntax'],
      isActive: true,
    });

    const child1 = await Skill.create({
      name: 'Java',
      slug: 'java',
      category: 'Programming',
      parentId: parent._id,
      level: 'INTERMEDIATE',
      tags: ['jvm', 'oop'],
      isActive: true,
    });

    const child2 = await Skill.create({
      name: 'Python',
      slug: 'python',
      category: 'Programming',
      parentId: parent._id,
      level: 'FOUNDATIONAL',
      tags: ['python', 'scripting'],
      isActive: true,
    });

    await SkillRelation.create({
      parentSkillId: parent._id,
      childSkillId: child1._id,
      relationType: 'SUBCATEGORY',
    });

    await SkillRelation.create({
      parentSkillId: parent._id,
      childSkillId: child2._id,
      relationType: 'PREREQUISITE',
    });

    const career = await Career.create({
      title: 'Backend Developer',
      slug: 'backend-developer',
      category: 'Engineering',
      description: 'Build robust backend architectures',
      demandLevel: 'HIGH',
      isActive: true,
    });

    await CareerSkill.create({
      careerId: career._id,
      skillId: child1._id,
      importance: 'CRITICAL',
      weight: 5,
      requiredProficiency: 4,
    });

    await CareerSkill.create({
      careerId: career._id,
      skillId: child2._id,
      importance: 'IMPORTANT',
      weight: 3,
      requiredProficiency: 3,
    });

    return { parent, child1, child2, career };
  }

  describe('GET /api/v1/skills (SKILL-01)', () => {
    it('should list all active skills with pagination', async () => {
      await seedSkillsData();

      const res = await request(app).get('/api/v1/skills');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should filter by category', async () => {
      await seedSkillsData();

      const res = await request(app).get('/api/v1/skills?category=Programming');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should search by keyword in tags or name', async () => {
      await seedSkillsData();

      const res = await request(app).get('/api/v1/skills?search=jvm');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('java');
    });

    it('should filter by parent skill', async () => {
      await seedSkillsData();

      const res = await request(app).get(
        '/api/v1/skills?parent=programming-fundamentals',
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/v1/skills/graph (SKILL-04)', () => {
    it('should return complete skill graph with nodes and edges', async () => {
      await seedSkillsData();

      const res = await request(app).get('/api/v1/skills/graph');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nodes).toHaveLength(3);
      expect(res.body.data.edges).toHaveLength(2);
    });
  });

  describe('GET /api/v1/skills/:skillId (SKILL-02)', () => {
    it('should get skill details by slug', async () => {
      await seedSkillsData();

      const res = await request(app).get('/api/v1/skills/java');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Java');
      expect(res.body.data.category).toBe('Programming');
    });

    it('should return 404 for unknown skill', async () => {
      const res = await request(app).get('/api/v1/skills/unknown-skill-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/skills/:skillId/children (SKILL-03)', () => {
    it('should return child skills of a parent', async () => {
      await seedSkillsData();

      const res = await request(app).get(
        '/api/v1/skills/programming-fundamentals/children',
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('Student Skills (SKILL-05, SKILL-06, SKILL-07)', () => {
    it('should update student skill, retrieve it, and view audit history', async () => {
      const { token } = await createTestStudent();
      const { child1 } = await seedSkillsData();

      // PATCH /students/me/skills/:skillId (SKILL-06)
      const patchRes = await request(app)
        .patch(`/api/v1/students/me/skills/${child1.slug}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          proficiency: 3,
          confidence: 80,
          reason: 'Passed Java certification',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.proficiency).toBe(3);
      expect(patchRes.body.data.confidence).toBe(80);

      // GET /students/me/skills (SKILL-05)
      const getRes = await request(app)
        .get('/api/v1/students/me/skills')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data).toHaveLength(1);
      expect(getRes.body.data[0].slug).toBe('java');
      expect(getRes.body.data[0].proficiency).toBe(3);

      // Update again to generate history
      await request(app)
        .patch(`/api/v1/students/me/skills/${child1.slug}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          proficiency: 4,
          confidence: 90,
          reason: 'Built production backend service',
        });

      // GET /students/me/skills/:skillId/history (SKILL-07)
      const histRes = await request(app)
        .get(`/api/v1/students/me/skills/${child1.slug}/history`)
        .set('Authorization', `Bearer ${token}`);

      expect(histRes.status).toBe(200);
      expect(histRes.body.success).toBe(true);
      expect(histRes.body.data).toHaveLength(2);
      expect(histRes.body.data[0].previousProficiency).toBe(3);
      expect(histRes.body.data[0].newProficiency).toBe(4);
    });

    it('should reject invalid proficiency out of 0-5 range', async () => {
      const { token } = await createTestStudent();
      const { child1 } = await seedSkillsData();

      const res = await request(app)
        .patch(`/api/v1/students/me/skills/${child1.slug}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          proficiency: 10,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/students/me/skill-gaps (SKILL-08)', () => {
    it('should compute deterministic skill gaps and match score against target career', async () => {
      const { token } = await createTestStudent();
      const { child1, career } = await seedSkillsData();

      // Student has Java at proficiency 2 (required 4 -> gap 2)
      // Student has no Python (required 3 -> gap 3, missing)
      await request(app)
        .patch(`/api/v1/students/me/skills/${child1.slug}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          proficiency: 2,
        });

      // Set career goal
      await request(app)
        .post('/api/v1/students/me/career-goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          careerId: career.slug,
          isPrimary: true,
        });

      const res = await request(app)
        .get('/api/v1/students/me/skill-gaps')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetCareer.slug).toBe('backend-developer');
      expect(res.body.data.summary.totalSkills).toBe(2);
      expect(res.body.data.summary.weakSkills).toBe(1); // Java (2 out of 4)
      expect(res.body.data.summary.missingSkills).toBe(1); // Python (0 out of 3)
      expect(res.body.data.matchScore).toBeGreaterThan(0);
      expect(res.body.data.gaps).toHaveLength(2);
      // First gap should be highest priority (CRITICAL importance with gap)
      expect(res.body.data.gaps[0].slug).toBe('java');
      expect(res.body.data.gaps[0].gap).toBe(2);
      expect(res.body.data.gaps[0].priority).toBe('HIGH');
    });
  });
});
