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
import { Roadmap } from '@/models/Roadmap.model';
import { RoadmapStep } from '@/models/RoadmapStep.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Roadmaps Endpoints (E2E)', () => {
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
    await Roadmap.deleteMany({});
    await RoadmapStep.deleteMany({});
    await Career.deleteMany({});
    await Skill.deleteMany({});
    await CareerSkill.deleteMany({});
    await SkillRelation.deleteMany({});
    await StudentSkill.deleteMany({});
    await StudentSkillHistory.deleteMany({});
    await CareerGoal.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await StudentProfile.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestStudent() {
    const user = await User.create({
      name: 'Dave Pathfinder',
      email: 'dave@example.com',
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.STUDENT, isPrimary: true });
    await StudentProfile.create({
      userId: user._id,
      college: 'Tech University',
      department: 'CSE',
      year: 2,
      semester: 4,
    });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.STUDENT],
    });
    return { user, token };
  }

  async function seedCareerAndSkills() {
    const career = await Career.create({
      title: 'Backend Developer',
      slug: 'backend-developer',
      category: 'Engineering',
      description: 'Backend web and API development',
      isActive: true,
    });

    const skillJs = await Skill.create({
      name: 'JavaScript',
      slug: 'javascript',
      category: 'Programming',
      level: 'FOUNDATIONAL',
      isActive: true,
    });

    const skillNode = await Skill.create({
      name: 'Node.js & Express',
      slug: 'nodejs-express',
      category: 'Backend',
      level: 'INTERMEDIATE',
      isActive: true,
    });

    // JavaScript is prerequisite for Node.js
    await SkillRelation.create({
      parentSkillId: skillJs._id,
      childSkillId: skillNode._id,
      relationType: 'PREREQUISITE',
    });

    await CareerSkill.create({
      careerId: career._id,
      skillId: skillJs._id,
      importance: 'CRITICAL',
      weight: 5,
      requiredProficiency: 3,
    });

    await CareerSkill.create({
      careerId: career._id,
      skillId: skillNode._id,
      importance: 'CRITICAL',
      weight: 5,
      requiredProficiency: 4,
    });

    return { career, skillJs, skillNode };
  }

  describe('Roadmap Lifecycle (ROADMAP-01 through ROADMAP-07)', () => {
    it('should generate roadmap with prerequisite ordering, unlock steps upon completion, and track progress', async () => {
      const { token } = await createTestStudent();
      const { career } = await seedCareerAndSkills();

      // 1. Generate Roadmap (ROADMAP-02)
      const genRes = await request(app)
        .post('/api/v1/students/me/roadmap/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          careerId: career.slug,
          targetRole: 'Junior Backend Engineer',
        });

      expect(genRes.status).toBe(201);
      expect(genRes.body.success).toBe(true);
      expect(genRes.body.data.targetRole).toBe('Junior Backend Engineer');
      expect(genRes.body.data.totalSteps).toBe(2);
      expect(genRes.body.data.completedSteps).toBe(0);
      expect(genRes.body.data.progressPercentage).toBe(0);

      // Verify topological order: JavaScript (prereq) comes first
      const steps = genRes.body.data.steps;
      expect(steps[0].skillName).toBe('JavaScript');
      expect(steps[0].status).toBe('AVAILABLE');
      expect(steps[1].skillName).toBe('Node.js & Express');
      expect(steps[1].status).toBe('LOCKED');
      expect(steps[1].prerequisiteStepIds).toContain(steps[0].id);

      const step1Id = steps[0].id;
      const step2Id = steps[1].id;

      // 2. Get Current Roadmap (ROADMAP-01)
      const currentRes = await request(app)
        .get('/api/v1/students/me/roadmap')
        .set('Authorization', `Bearer ${token}`);

      expect(currentRes.status).toBe(200);
      expect(currentRes.body.data.steps).toHaveLength(2);

      // 3. Get Step details (ROADMAP-03)
      const stepRes = await request(app)
        .get(`/api/v1/roadmap-steps/${step1Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(stepRes.status).toBe(200);
      expect(stepRes.body.data.title).toBe('Master JavaScript');

      // 4. Update Step status to IN_PROGRESS (ROADMAP-04)
      const updateRes = await request(app)
        .patch(`/api/v1/roadmap-steps/${step1Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('IN_PROGRESS');
      expect(updateRes.body.data.startedAt).toBeDefined();

      // 5. Complete Step 1 (ROADMAP-05)
      const completeRes = await request(app)
        .post(`/api/v1/roadmap-steps/${step1Id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.step.status).toBe('COMPLETED');
      expect(completeRes.body.data.roadmapProgress.completedSteps).toBe(1);
      expect(completeRes.body.data.roadmapProgress.progressPercentage).toBe(50);

      // Verify Step 2 is now automatically unlocked (AVAILABLE)
      const step2Res = await request(app)
        .get(`/api/v1/roadmap-steps/${step2Id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(step2Res.body.data.status).toBe('AVAILABLE');

      // Verify StudentSkill was updated to target proficiency
      const studentSkill = await StudentSkill.findOne({ skillId: steps[0].skillId });
      expect(studentSkill).toBeDefined();
      expect(studentSkill?.proficiency).toBe(3);
      expect(studentSkill?.source).toBe('SYSTEM');

      // 6. Recalculate Roadmap (ROADMAP-07)
      const recalcRes = await request(app)
        .post('/api/v1/students/me/roadmap/recalculate')
        .set('Authorization', `Bearer ${token}`);

      expect(recalcRes.status).toBe(200);
      expect(recalcRes.body.data.completedSteps).toBe(1);

      // 7. Get Roadmap History (ROADMAP-06)
      const historyRes = await request(app)
        .get('/api/v1/students/me/roadmap/history')
        .set('Authorization', `Bearer ${token}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data).toHaveLength(1);
      expect(historyRes.body.data[0].version).toBe(1);
    });
  });
});
