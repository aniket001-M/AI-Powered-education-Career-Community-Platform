import mongoose from 'mongoose';
import { User } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Resource } from '@/models/Resource.model';
import { CommunityPost } from '@/models/CommunityPost.model';
import { CommunityReport } from '@/models/CommunityReport.model';
import { Opportunity } from '@/models/Opportunity.model';
import { Career, ICareer } from '@/models/Career.model';
import { Skill, ISkill } from '@/models/Skill.model';
import { AuditLog } from '@/models/AuditLog.model';
import { auditService } from '../audit/audit.service';
import { AppError } from '@/common/errors/AppError';
import {
  QueryUsersDto,
  UpdateUserDto,
  QueryReportsDto,
  ResolveReportDto,
  CreateCareerDto,
  UpdateCareerDto,
  CreateSkillDto,
  UpdateSkillDto,
} from './admin.validation';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class AdminService {
  /**
   * ADMIN-01: Aggregated system analytics dashboard
   */
  async getDashboard() {
    const [
      totalUsers,
      activeUsers,
      rolesAggregation,
      totalResources,
      verifiedResources,
      pendingResources,
      totalPosts,
      totalOpportunities,
      pendingReports,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ isActive: true, deletedAt: null }),
      Role.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Resource.countDocuments({ deletedAt: null }),
      Resource.countDocuments({ verificationStatus: 'VERIFIED', deletedAt: null }),
      Resource.countDocuments({ verificationStatus: 'PENDING', deletedAt: null }),
      CommunityPost.countDocuments({ deletedAt: null }),
      Opportunity.countDocuments({ deletedAt: null }),
      CommunityReport.countDocuments({ status: 'PENDING' }),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('actorId', 'name email')
        .lean(),
    ]);

    const usersByRole: Record<string, number> = {};
    for (const item of rolesAggregation) {
      usersByRole[item._id] = item.count;
    }

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole,
      },
      resources: {
        total: totalResources,
        verified: verifiedResources,
        pending: pendingResources,
      },
      community: {
        posts: totalPosts,
        pendingReports,
      },
      opportunities: {
        total: totalOpportunities,
      },
      recentActivity,
    };
  }

  /**
   * ADMIN-02: Paginated list of users with roles & status filters
   */
  async listUsers(dto: QueryUsersDto): Promise<{
    items: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { deletedAt: null };

    if (dto.isActive !== undefined) {
      filter.isActive = dto.isActive;
    }

    if (dto.search) {
      const searchRegex = new RegExp(dto.search, 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (dto.role) {
      const userRoles = await Role.find({ role: dto.role }).select('userId').lean();
      const userIdsWithRole = userRoles.map((r) => r.userId);
      filter._id = { $in: userIdsWithRole };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Attach roles to users
    const userIds = users.map((u) => u._id);
    const roles = await Role.find({ userId: { $in: userIds } }).lean();
    const roleMap = new Map<string, string[]>();
    for (const r of roles) {
      const key = r.userId.toString();
      if (!roleMap.has(key)) {
        roleMap.set(key, []);
      }
      roleMap.get(key)!.push(r.role);
    }

    const items = users.map((u: any) => ({
      ...u,
      id: u._id.toString(),
      roles: roleMap.get(u._id.toString()) || [],
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * ADMIN-03: Update user roles or account status (activate/deactivate)
   */
  async updateUser(
    targetUserId: string,
    dto: UpdateUserDto,
    adminId: string,
    adminRole: string,
  ): Promise<{ user: any }> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw AppError.notFound('User not found');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    if (dto.isEmailVerified !== undefined) {
      user.isEmailVerified = dto.isEmailVerified;
    }
    await user.save();

    if (dto.roles && dto.roles.length > 0) {
      // Replace existing roles
      await Role.deleteMany({ userId: user._id });
      const newRoles = dto.roles.map((role, idx) => ({
        userId: user._id,
        role,
        isPrimary: idx === 0,
        assignedBy: new mongoose.Types.ObjectId(adminId),
        assignedAt: new Date(),
      }));
      await Role.insertMany(newRoles);
    }

    // Fetch refreshed roles
    const currentRoles = await Role.find({ userId: user._id }).lean();
    const rolesList = currentRoles.map((r) => r.role);

    // Audit log
    await auditService.log({
      actorId: adminId,
      actorRole: adminRole,
      action: 'USER_UPDATED',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: {
        targetUserId,
        isActive: dto.isActive,
        roles: dto.roles,
      },
    });

    return {
      user: {
        ...user.toJSON(),
        roles: rolesList,
      },
    };
  }

  /**
   * ADMIN-04: List moderation reports
   */
  async listReports(dto: QueryReportsDto): Promise<{
    items: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (dto.status) {
      filter.status = dto.status;
    }

    const [reports, total] = await Promise.all([
      CommunityReport.find(filter)
        .populate('postId', 'title content authorId category')
        .populate('reporterId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunityReport.countDocuments(filter),
    ]);

    return {
      items: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * ADMIN-05: Resolve moderation report
   */
  async resolveReport(
    reportId: string,
    dto: ResolveReportDto,
    adminId: string,
    adminRole: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw AppError.notFound('Report not found');
    }

    const report = await CommunityReport.findById(reportId);
    if (!report) {
      throw AppError.notFound('Report not found');
    }

    report.status = dto.status;
    await report.save();

    // If action taken is to delete post, soft-delete it
    if (dto.actionTaken === 'DELETE_POST') {
      await CommunityPost.findByIdAndUpdate(report.postId, {
        isDeleted: true,
        deletedAt: new Date(),
      });
    }

    // Audit log
    await auditService.log({
      actorId: adminId,
      actorRole: adminRole,
      action: 'REPORT_RESOLVED',
      resourceType: 'CommunityReport',
      resourceId: report._id.toString(),
      details: {
        status: dto.status,
        actionTaken: dto.actionTaken,
        resolutionNotes: dto.resolutionNotes,
      },
    });

    return report;
  }

  /**
   * ADMIN-06: Create career
   */
  async createCareer(
    dto: CreateCareerDto,
    adminId: string,
    adminRole: string,
  ): Promise<ICareer> {
    let slug = slugify(dto.title);
    const existing = await Career.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const career = new Career({
      ...dto,
      slug,
      salaryRange: dto.salaryRange
        ? {
            min: dto.salaryRange.min,
            max: dto.salaryRange.max,
            currency: dto.salaryRange.currency || 'INR',
          }
        : undefined,
      isActive: true,
    });
    await career.save();

    await auditService.log({
      actorId: adminId,
      actorRole: adminRole,
      action: 'CAREER_CREATED',
      resourceType: 'Career',
      resourceId: career._id.toString(),
      details: { title: career.title, slug: career.slug },
    });

    return career;
  }

  /**
   * ADMIN-07: Update career
   */
  async updateCareer(
    careerId: string,
    dto: UpdateCareerDto,
    adminId: string,
    adminRole: string,
  ): Promise<ICareer> {
    if (!mongoose.Types.ObjectId.isValid(careerId)) {
      throw AppError.notFound('Career not found');
    }

    const career = await Career.findById(careerId);
    if (!career) {
      throw AppError.notFound('Career not found');
    }

    if (dto.title && dto.title !== career.title) {
      career.title = dto.title;
      career.slug = slugify(dto.title);
    }
    if (dto.category !== undefined) career.category = dto.category;
    if (dto.description !== undefined) career.description = dto.description;
    if (dto.overview !== undefined) career.overview = dto.overview;
    if (dto.salaryRange !== undefined) {
      career.salaryRange = {
        min: dto.salaryRange.min,
        max: dto.salaryRange.max,
        currency: dto.salaryRange.currency || 'INR',
      };
    }
    if (dto.demandLevel !== undefined) career.demandLevel = dto.demandLevel;
    if (dto.growthRate !== undefined) career.growthRate = dto.growthRate;
    if (dto.isActive !== undefined) career.isActive = dto.isActive;

    await career.save();

    await auditService.log({
      actorId: adminId,
      actorRole: adminRole,
      action: 'CAREER_UPDATED',
      resourceType: 'Career',
      resourceId: career._id.toString(),
      details: dto,
    });

    return career;
  }

  /**
   * ADMIN-08: Create skill
   */
  async createSkill(
    dto: CreateSkillDto,
    adminId: string,
    adminRole: string,
  ): Promise<ISkill> {
    let slug = slugify(dto.name);
    const existing = await Skill.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const skill = new Skill({
      name: dto.name,
      slug,
      category: dto.category,
      description: dto.description || null,
      parentId: dto.parentId ? new mongoose.Types.ObjectId(dto.parentId) : null,
      level: dto.level || 'FOUNDATIONAL',
      tags: dto.tags || [],
      isActive: true,
    });
    await skill.save();

    await auditService.log({
      actorId: adminId,
      actorRole: adminRole,
      action: 'SKILL_CREATED',
      resourceType: 'Skill',
      resourceId: skill._id.toString(),
      details: { name: skill.name, slug: skill.slug },
    });

    return skill;
  }

  /**
   * ADMIN-09: Update skill
   */
  async updateSkill(
    skillId: string,
    dto: UpdateSkillDto,
    adminId: string,
    adminRole: string,
  ): Promise<ISkill> {
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      throw AppError.notFound('Skill not found');
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      throw AppError.notFound('Skill not found');
    }

    if (dto.name && dto.name !== skill.name) {
      skill.name = dto.name;
      skill.slug = slugify(dto.name);
    }
    if (dto.category !== undefined) skill.category = dto.category;
    if (dto.description !== undefined) skill.description = dto.description;
    if (dto.parentId !== undefined) {
      skill.parentId = dto.parentId ? new mongoose.Types.ObjectId(dto.parentId) : (null as any);
    }
    if (dto.level !== undefined) skill.level = dto.level;
    if (dto.tags !== undefined) skill.tags = dto.tags;
    if (dto.isActive !== undefined) skill.isActive = dto.isActive;

    await skill.save();

    await auditService.log({
      actorId: adminId,
      actorRole: adminRole,
      action: 'SKILL_UPDATED',
      resourceType: 'Skill',
      resourceId: skill._id.toString(),
      details: dto,
    });

    return skill;
  }
}

export const adminService = new AdminService();
