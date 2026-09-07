import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Career } from '@/models/Career.model';
import { Skill } from '@/models/Skill.model';
import { CommunityPost } from '@/models/CommunityPost.model';
import { CommunityReport } from '@/models/CommunityReport.model';
import { AuditLog } from '@/models/AuditLog.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Admin Endpoints (E2E) - Phase 10', () => {
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
    await Career.deleteMany({});
    await Skill.deleteMany({});
    await CommunityPost.deleteMany({});
    await CommunityReport.deleteMany({});
    await AuditLog.deleteMany({});
    await mockRedis.flushall();
  });

  async function createAdminUser() {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);
    const user = await User.create({
      name: 'System Admin',
      email: 'admin@careergraph.dev',
      passwordHash,
      isEmailVerified: true,
    });
    await Role.create({ userId: user._id, role: UserRole.ADMIN, isPrimary: true });
    const token = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: [UserRole.ADMIN],
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

  it('should enforce RBAC - reject non-admin users from admin routes with 403', async () => {
    const { token: studentToken } = await createStudentUser();

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should support complete admin management lifecycle (ADMIN-01 to ADMIN-10)', async () => {
    const { user: admin, token: adminToken } = await createAdminUser();
    const { user: student } = await createStudentUser();

    // 1. ADMIN-01: Get Dashboard
    const dashRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.success).toBe(true);
    expect(dashRes.body.data.users.total).toBe(2);
    expect(dashRes.body.data.users.active).toBe(2);

    // 2. ADMIN-02: List Users
    const usersRes = await request(app)
      .get('/api/v1/admin/users?role=STUDENT')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(usersRes.status).toBe(200);
    expect(usersRes.body.success).toBe(true);
    expect(usersRes.body.data.length).toBe(1);
    expect(usersRes.body.data[0].email).toBe('student@careergraph.dev');

    // 3. ADMIN-03: Update User (Roles & status)
    const updateRes = await request(app)
      .patch(`/api/v1/admin/users/${student._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isActive: true,
        roles: [UserRole.STUDENT, UserRole.SENIOR],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.user.roles).toContain(UserRole.SENIOR);

    // 4. Create sample post and report for ADMIN-04 & ADMIN-05
    const post = await CommunityPost.create({
      authorId: student._id,
      title: 'Flagged Discussion',
      content: 'Content that needs review',
      category: 'GENERAL',
    });

    const report = await CommunityReport.create({
      postId: post._id,
      reporterId: admin._id,
      reason: 'SPAM',
      status: 'PENDING',
    });

    // ADMIN-04: List Reports
    const reportsRes = await request(app)
      .get('/api/v1/admin/reports?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body.data.length).toBe(1);

    // ADMIN-05: Resolve Report
    const resolveRes = await request(app)
      .patch(`/api/v1/admin/reports/${report._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'ACTION_TAKEN',
        actionTaken: 'DELETE_POST',
        resolutionNotes: 'Violated content guidelines',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('ACTION_TAKEN');

    // Verify post was soft deleted
    const updatedPost = await CommunityPost.findById(post._id);
    expect(updatedPost).toBeNull(); // Excluded by default find hook

    // 5. ADMIN-06: Create Career
    const careerRes = await request(app)
      .post('/api/v1/admin/careers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Cloud Solutions Architect',
        category: 'Cloud & Infrastructure',
        description: 'Designs resilient cloud infrastructure and distributed microservices.',
        salaryRange: { min: 1200000, max: 2800000, currency: 'INR' },
        demandLevel: 'VERY_HIGH',
        growthRate: '+24%',
      });

    expect(careerRes.status).toBe(201);
    expect(careerRes.body.data.slug).toBe('cloud-solutions-architect');
    const careerId = careerRes.body.data.id || careerRes.body.data._id;

    // 6. ADMIN-07: Update Career
    const patchCareerRes = await request(app)
      .patch(`/api/v1/admin/careers/${careerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        growthRate: '+30%',
      });

    expect(patchCareerRes.status).toBe(200);
    expect(patchCareerRes.body.data.growthRate).toBe('+30%');

    // 7. ADMIN-08: Create Skill
    const skillRes = await request(app)
      .post('/api/v1/admin/skills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Terraform Infrastructure as Code',
        category: 'DevOps',
        description: 'Declarative cloud infrastructure provisioning',
        level: 'INTERMEDIATE',
        tags: ['iac', 'terraform', 'cloud'],
      });

    expect(skillRes.status).toBe(201);
    expect(skillRes.body.data.slug).toBe('terraform-infrastructure-as-code');
    const skillId = skillRes.body.data.id || skillRes.body.data._id;

    // 8. ADMIN-09: Update Skill
    const patchSkillRes = await request(app)
      .patch(`/api/v1/admin/skills/${skillId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        level: 'ADVANCED',
      });

    expect(patchSkillRes.status).toBe(200);
    expect(patchSkillRes.body.data.level).toBe('ADVANCED');

    // 9. ADMIN-10: Audit Logs
    const auditRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.data.length).toBeGreaterThanOrEqual(4); // User update, report resolve, career create, skill create
  });
});
