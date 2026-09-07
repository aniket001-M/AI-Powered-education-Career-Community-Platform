import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { RefreshSession } from '@/models/RefreshSession.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Students Endpoints (E2E)', () => {
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
    await StudentProfile.deleteMany({});
    await RefreshSession.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestStudent() {
    const user = await User.create({
      name: 'Alice Smith',
      email: 'alice@example.com',
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    const role = await Role.create({ userId: user._id, role: UserRole.STUDENT, isPrimary: true });

    const profile = await StudentProfile.create({
      userId: user._id,
      college: 'National Institute of Tech',
      department: 'Information Technology',
      year: 3,
      semester: 6,
      cgpa: 8.8,
      academicInterests: ['Web Systems', 'Cloud'],
      careerGoals: [],
      projects: [],
      certifications: [],
    });

    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.STUDENT],
    });

    return { user, profile, token };
  }

  async function createNonStudentUser(roleName: UserRole = UserRole.ADMIN) {
    const user = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: '$2b$04$testpasswordhashforeveryone',
      isEmailVerified: true,
    });
    const role = await Role.create({ userId: user._id, role: roleName, isPrimary: true });

    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [roleName],
    });

    return { user, role, token };
  }

  describe('Authorization checks on /students/me/*', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/students/me/academic');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 FORBIDDEN if user does not have STUDENT role', async () => {
      const { token } = await createNonStudentUser(UserRole.ADMIN);
      const res = await request(app)
        .get('/api/v1/students/me/academic')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET & PATCH /api/v1/students/me/academic', () => {
    it('should get academic profile', async () => {
      const { token } = await createTestStudent();
      const res = await request(app)
        .get('/api/v1/students/me/academic')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.college).toBe('National Institute of Tech');
      expect(res.body.data.cgpa).toBe(8.8);
      expect(res.body.data.academicInterests).toContain('Web Systems');
    });

    it('should update academic profile', async () => {
      const { token } = await createTestStudent();
      const res = await request(app)
        .patch('/api/v1/students/me/academic')
        .set('Authorization', `Bearer ${token}`)
        .send({
          college: 'IIT Delhi',
          cgpa: 9.1,
          academicInterests: ['Distributed Systems', 'Databases'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.college).toBe('IIT Delhi');
      expect(res.body.data.cgpa).toBe(9.1);
      expect(res.body.data.academicInterests).toContain('Distributed Systems');
    });
  });

  describe('GET /api/v1/students/me/profile', () => {
    it('should return full aggregated student profile', async () => {
      const { token } = await createTestStudent();
      const res = await request(app)
        .get('/api/v1/students/me/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('personal');
      expect(res.body.data).toHaveProperty('academic');
      expect(res.body.data).toHaveProperty('skills');
      expect(res.body.data).toHaveProperty('careerGoals');
      expect(res.body.data).toHaveProperty('projects');
      expect(res.body.data).toHaveProperty('certifications');
      expect(res.body.data).toHaveProperty('assessmentSummary');
      expect(res.body.data).toHaveProperty('interviewSummary');
    });
  });

  describe('PATCH /api/v1/students/me/career-goals', () => {
    it('should update career goals', async () => {
      const { token } = await createTestStudent();
      const res = await request(app)
        .patch('/api/v1/students/me/career-goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Backend Developer',
          isPrimary: true,
          targetRole: 'Senior Backend Engineer',
          timeline: '1 year',
          preferredLocations: ['Bangalore', 'Remote'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBe('Backend Developer');
      expect(res.body.data[0].isPrimary).toBe(true);
    });
  });

  describe('POST & DELETE /api/v1/students/me/projects', () => {
    it('should add a project and delete it', async () => {
      const { token } = await createTestStudent();

      // Add project
      const postRes = await request(app)
        .post('/api/v1/students/me/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'CareerGraph Platform',
          description: 'A student career guidance portal',
          technologies: ['Node.js', 'Express', 'MongoDB'],
          githubUrl: 'https://github.com/alice/careergraph',
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.title).toBe('CareerGraph Platform');
      const projectId = postRes.body.data.id;
      expect(projectId).toBeDefined();

      // Delete project
      const delRes = await request(app)
        .delete(`/api/v1/students/me/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify project is removed from full profile
      const profileRes = await request(app)
        .get('/api/v1/students/me/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.body.data.projects.length).toBe(0);
    });
  });

  describe('GET /api/v1/students/me/dashboard', () => {
    it('should return aggregated dashboard with required fields', async () => {
      const { token } = await createTestStudent();

      const res = await request(app)
        .get('/api/v1/students/me/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('student');
      expect(res.body.data).toHaveProperty('career');
      expect(res.body.data).toHaveProperty('careerMatch');
      expect(res.body.data).toHaveProperty('strongSkills');
      expect(res.body.data).toHaveProperty('weakSkills');
      expect(res.body.data).toHaveProperty('missingSkills');
      expect(res.body.data).toHaveProperty('nextAction');
      expect(res.body.data).toHaveProperty('roadmapPreview');
      expect(res.body.data).toHaveProperty('recentActivity');
      expect(res.body.data).toHaveProperty('recommendedOpportunities');
    });
  });
});
