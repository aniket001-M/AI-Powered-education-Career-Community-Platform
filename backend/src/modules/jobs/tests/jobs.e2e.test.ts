import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Skill } from '@/models/Skill.model';
import { StudentSkill } from '@/models/StudentSkill.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { JobAnalysis } from '@/models/JobAnalysis.model';
import { JobSkill } from '@/models/JobSkill.model';
import { Roadmap } from '@/models/Roadmap.model';
import { RoadmapStep } from '@/models/RoadmapStep.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Job Analyzer Endpoints (E2E) - Phase 7', () => {
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
    await JobAnalysis.deleteMany({});
    await JobSkill.deleteMany({});
    await Roadmap.deleteMany({});
    await RoadmapStep.deleteMany({});
    await Skill.deleteMany({});
    await StudentSkill.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await StudentProfile.deleteMany({});
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
    await StudentProfile.create({
      userId: user._id,
      college: 'Institute of Tech',
      department: 'CSE',
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

  it('should complete the job analysis and roadmap integration lifecycle (JOB-01 to JOB-05)', async () => {
    const student = await createTestStudent('Charlie Brown', 'charlie@student.edu');

    // 1. Seed Skills in catalog
    const javaSkill = await Skill.create({
      name: 'Java',
      slug: 'java',
      category: 'Programming',
      level: 'FOUNDATIONAL',
    });

    const springSkill = await Skill.create({
      name: 'Spring Boot',
      slug: 'spring-boot',
      category: 'Backend',
      level: 'INTERMEDIATE',
    });

    const dockerSkill = await Skill.create({
      name: 'Docker',
      slug: 'docker',
      category: 'DevOps',
      level: 'INTERMEDIATE',
    });

    // Student has proficiency 4 in Java, but 0 in Spring Boot and Docker
    await StudentSkill.create({
      userId: student.user._id,
      skillId: javaSkill._id,
      proficiency: 4,
    });

    // 2. Submit Job Description (JOB-01)
    const createRes = await request(app)
      .post('/api/v1/job-analyses')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        title: 'Backend Software Engineer',
        company: 'Cloud Corp',
        source: 'PASTED',
        description:
          'We are seeking a talented engineer with deep proficiency in Java, building microservices using Spring Boot, and containerization with Docker.',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe('Backend Software Engineer');
    expect(createRes.body.data.status).toBe('PENDING');

    const analysisId = createRes.body.data.id;

    // 3. Get Job Analysis (JOB-02)
    const getRes = await request(app)
      .get(`/api/v1/job-analyses/${analysisId}`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(analysisId);

    // 4. Run Deterministic Analysis (JOB-04)
    const analyzeRes = await request(app)
      .post(`/api/v1/job-analyses/${analysisId}/analyze`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(analyzeRes.status).toBe(200);
    expect(analyzeRes.body.success).toBe(true);
    expect(analyzeRes.body.data.status).toBe('COMPLETED');
    expect(analyzeRes.body.data.matchedSkillsCount).toBe(1); // Java
    expect(analyzeRes.body.data.missingSkillsCount).toBe(2); // Spring Boot, Docker
    expect(analyzeRes.body.data.skills.strong.length).toBe(1);
    expect(analyzeRes.body.data.skills.strong[0].skillName).toBe('Java');
    expect(analyzeRes.body.data.skills.missing.length).toBe(2);
    expect(analyzeRes.body.data.explanation).toContain('Deterministic keyword extraction');

    // 5. List Student Job Analyses (JOB-03)
    const listRes = await request(app)
      .get('/api/v1/students/me/job-analyses')
      .set('Authorization', `Bearer ${student.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.pagination.total).toBe(1);

    // 6. Add Missing Skills to Roadmap (JOB-05)
    const roadmapRes = await request(app)
      .post(`/api/v1/job-analyses/${analysisId}/add-to-roadmap`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(roadmapRes.status).toBe(200);
    expect(roadmapRes.body.success).toBe(true);
    expect(roadmapRes.body.data.addedSkillsCount).toBe(2); // Spring Boot and Docker added

    // Verify roadmap steps in database
    const steps = await RoadmapStep.find({ roadmapId: roadmapRes.body.data.roadmapId });
    expect(steps.length).toBe(2);

    // 7. Controlled Semantic Matching AI placeholder endpoint
    const semanticRes = await request(app)
      .post('/api/v1/job-analyses/semantic/match')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        jobSkills: ['Java', 'Spring Boot'],
        studentSkills: [{ skillName: 'Java', proficiency: 4 }],
      });

    expect(semanticRes.status).toBe(501);
    expect(semanticRes.body.error.code).toBe('AI_NOT_ENABLED');
  });
});
