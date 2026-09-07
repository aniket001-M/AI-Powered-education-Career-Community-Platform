import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';
import app from '@/app';
import { setRedisClient } from '@/config/redis';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Skill } from '@/models/Skill.model';
import { Opportunity } from '@/models/Opportunity.model';
import { OpportunitySkill } from '@/models/OpportunitySkill.model';
import { OpportunityRiskSignal } from '@/models/OpportunityRiskSignal.model';
import { SavedOpportunity } from '@/models/SavedOpportunity.model';
import { UserRole } from '@/common/enums/roles.enum';
import { signAccessToken } from '@/common/utils/jwt';

describe('Opportunities Endpoints (E2E) - Phase 8', () => {
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
    await Opportunity.deleteMany({});
    await OpportunitySkill.deleteMany({});
    await OpportunityRiskSignal.deleteMany({});
    await SavedOpportunity.deleteMany({});
    await Skill.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await mockRedis.flushall();
  });

  async function createTestUser(name: string, email: string, role: UserRole) {
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

  it('should support the complete opportunity lifecycle (OPPORTUNITY-01 to OPPORTUNITY-08)', async () => {
    const faculty = await createTestUser('Prof Smith', 'smith@faculty.edu', UserRole.FACULTY);
    const student = await createTestUser('Leo Student', 'leo@student.edu', UserRole.STUDENT);
    const moderator = await createTestUser('Mod Ray', 'ray@mod.edu', UserRole.MODERATOR);

    // Seed Skill
    const reactSkill = await Skill.create({
      name: 'React.js',
      slug: 'reactjs',
      category: 'Frontend',
      level: 'INTERMEDIATE',
    });

    // 1. Create Opportunity (OPPORTUNITY-03)
    const createRes = await request(app)
      .post('/api/v1/opportunities')
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({
        title: 'Frontend Engineer Intern',
        company: 'Vanguard Tech',
        type: 'INTERNSHIP',
        description: 'Building modern interfaces with React and TypeScript.',
        location: 'Remote',
        applyUrl: 'https://vanguard.example.com/apply/fe-intern',
        deadline: '2026-12-31T23:59:59.000Z',
        eligibility: 'Pre-final and final year B.Tech students',
        stipendOrSalary: '₹40,000 / month',
        skills: ['reactjs'],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe('Frontend Engineer Intern');
    expect(createRes.body.data.verificationStatus).toBe('VERIFIED');
    expect(createRes.body.data.skills.length).toBe(1);
    expect(createRes.body.data.skills[0].name).toBe('React.js');

    const oppId = createRes.body.data.id;

    // 2. List Opportunities with filter (OPPORTUNITY-01)
    const listRes = await request(app)
      .get('/api/v1/opportunities')
      .query({ type: 'INTERNSHIP', location: 'Remote', skill: 'reactjs' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.pagination.total).toBe(1);

    // 3. Get Opportunity Details (OPPORTUNITY-02)
    const getRes = await request(app)
      .get(`/api/v1/opportunities/${oppId}`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(oppId);
    expect(getRes.body.data.isSaved).toBe(false);

    // 4. Update Opportunity (OPPORTUNITY-04)
    const updateRes = await request(app)
      .patch(`/api/v1/opportunities/${oppId}`)
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({
        stipendOrSalary: '₹45,000 / month',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.stipendOrSalary).toBe('₹45,000 / month');

    // 5. Add Evidence-based Risk Signal (OPPORTUNITY-07)
    const riskSignalRes = await request(app)
      .post(`/api/v1/opportunities/${oppId}/risk-signals`)
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        signalType: 'UPFRONT_FEE_REQUEST',
        severity: 'HIGH',
        evidenceDescription:
          'Applicant was directed to a WhatsApp number asking for ₹500 registration deposit.',
      });

    expect(riskSignalRes.status).toBe(201);
    expect(riskSignalRes.body.success).toBe(true);
    expect(riskSignalRes.body.data.updatedOpportunityRiskScore).toBe(50);

    // Verify opportunity detail now contains the risk signal
    const getWithRisk = await request(app).get(`/api/v1/opportunities/${oppId}`);
    expect(getWithRisk.body.data.riskSignals.length).toBe(1);
    expect(getWithRisk.body.data.riskSignals[0].signalType).toBe('UPFRONT_FEE_REQUEST');
    expect(getWithRisk.body.data.riskScore).toBe(50);

    // 6. Verify Opportunity by Moderator (OPPORTUNITY-06)
    const verifyRes = await request(app)
      .patch(`/api/v1/opportunities/${oppId}/verify`)
      .set('Authorization', `Bearer ${moderator.token}`)
      .send({ status: 'VERIFIED' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verificationStatus).toBe('VERIFIED');

    // 7. Toggle Save Opportunity as student
    const saveRes = await request(app)
      .post(`/api/v1/opportunities/${oppId}/save`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.saved).toBe(true);

    // 8. Get Student Saved Opportunities (OPPORTUNITY-08)
    const savedListRes = await request(app)
      .get('/api/v1/students/me/saved-opportunities')
      .set('Authorization', `Bearer ${student.token}`);

    expect(savedListRes.status).toBe(200);
    expect(savedListRes.body.success).toBe(true);
    expect(savedListRes.body.data.length).toBe(1);
    expect(savedListRes.body.data[0].opportunityId).toBe(oppId);

    // Toggle save again to unsave
    const unsaveRes = await request(app)
      .post(`/api/v1/opportunities/${oppId}/save`)
      .set('Authorization', `Bearer ${student.token}`);

    expect(unsaveRes.status).toBe(200);
    expect(unsaveRes.body.data.saved).toBe(false);

    // 9. Soft delete opportunity (OPPORTUNITY-05)
    const deleteRes = await request(app)
      .delete(`/api/v1/opportunities/${oppId}`)
      .set('Authorization', `Bearer ${faculty.token}`);

    expect(deleteRes.status).toBe(200);

    const listAfterDelete = await request(app).get('/api/v1/opportunities');
    expect(listAfterDelete.body.data.length).toBe(0);
  });
});
