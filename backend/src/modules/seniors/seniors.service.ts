import mongoose from 'mongoose';
import { SeniorExperience, ISeniorExperience } from '@/models/SeniorExperience.model';
import { AppError } from '@/common/errors/AppError';
import { UserRole } from '@/common/enums/roles.enum';
import {
  ListSeniorExperiencesDto,
  CreateSeniorExperienceDto,
  UpdateSeniorExperienceDto,
  VerifySeniorExperienceDto,
} from './seniors.validation';

export class SeniorsService {
  /**
   * SENIOR-01: List Senior Experiences
   */
  async getExperiences(query: ListSeniorExperiencesDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.company) filter.company = new RegExp(query.company, 'i');
    if (query.role) filter.role = new RegExp(query.role, 'i');
    if (query.batch) filter.batch = query.batch;
    if (query.department) filter.department = new RegExp(query.department, 'i');

    if (query.verificationStatus) {
      filter.verificationStatus = query.verificationStatus;
    } else {
      filter.verificationStatus = 'VERIFIED';
    }

    const [items, total] = await Promise.all([
      SeniorExperience.find(filter)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SeniorExperience.countDocuments(filter),
    ]);

    return {
      items: items.map((e: any) => ({
        id: e._id.toString(),
        company: e.company,
        role: e.role,
        batch: e.batch,
        department: e.department,
        title: e.title,
        content: e.content,
        interviewProcess: e.interviewProcess,
        preparationTips: e.preparationTips,
        referralContact: e.referralContact,
        verificationStatus: e.verificationStatus,
        senior: e.userId
          ? {
              id: e.userId._id.toString(),
              name: e.userId.name,
              email: e.userId.email,
              avatar: e.userId.avatar,
            }
          : null,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * SENIOR-02: Get Senior Experience by ID
   */
  async getExperienceById(experienceId: string) {
    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    const exp = await SeniorExperience.findById(experienceId)
      .populate('userId', 'name email avatar')
      .populate('verifiedBy', 'name email')
      .lean();

    if (!exp) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    const e: any = exp;
    return {
      id: e._id.toString(),
      company: e.company,
      role: e.role,
      batch: e.batch,
      department: e.department,
      title: e.title,
      content: e.content,
      interviewProcess: e.interviewProcess,
      preparationTips: e.preparationTips,
      referralContact: e.referralContact,
      verificationStatus: e.verificationStatus,
      verifiedAt: e.verifiedAt,
      senior: e.userId
        ? {
            id: e.userId._id.toString(),
            name: e.userId.name,
            email: e.userId.email,
            avatar: e.userId.avatar,
          }
        : null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  /**
   * SENIOR-03: Create Experience
   */
  async createExperience(
    userId: string,
    roles: string[],
    dto: CreateSeniorExperienceDto,
  ) {
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.FACULTY].includes(r as UserRole),
    );

    const exp = await SeniorExperience.create({
      userId: new mongoose.Types.ObjectId(userId),
      company: dto.company,
      role: dto.role,
      batch: dto.batch,
      department: dto.department,
      title: dto.title,
      content: dto.content,
      interviewProcess: dto.interviewProcess || null,
      preparationTips: dto.preparationTips || null,
      referralContact: dto.referralContact || null,
      verificationStatus: isElevated ? 'VERIFIED' : 'PENDING',
      verifiedAt: isElevated ? new Date() : null,
      verifiedBy: isElevated ? new mongoose.Types.ObjectId(userId) : null,
    });

    return this.getExperienceById(exp._id.toString());
  }

  /**
   * SENIOR-04: Update Experience
   */
  async updateExperience(
    userId: string,
    roles: string[],
    experienceId: string,
    dto: UpdateSeniorExperienceDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    const exp = await SeniorExperience.findById(experienceId);
    if (!exp) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    const isAuthor = exp.userId.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isAuthor && !isElevated) {
      throw AppError.forbidden('You do not have permission to edit this experience');
    }

    if (dto.company !== undefined) exp.company = dto.company;
    if (dto.role !== undefined) exp.role = dto.role;
    if (dto.batch !== undefined) exp.batch = dto.batch;
    if (dto.department !== undefined) exp.department = dto.department;
    if (dto.title !== undefined) exp.title = dto.title;
    if (dto.content !== undefined) exp.content = dto.content;
    if (dto.interviewProcess !== undefined) exp.interviewProcess = dto.interviewProcess;
    if (dto.preparationTips !== undefined) exp.preparationTips = dto.preparationTips;
    if (dto.referralContact !== undefined) exp.referralContact = dto.referralContact;

    await exp.save();
    return this.getExperienceById(exp._id.toString());
  }

  /**
   * SENIOR-05: Delete Experience (Soft delete)
   */
  async deleteExperience(userId: string, roles: string[], experienceId: string) {
    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    const exp = await SeniorExperience.findById(experienceId);
    if (!exp) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    const isAuthor = exp.userId.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isAuthor && !isElevated) {
      throw AppError.forbidden('You do not have permission to delete this experience');
    }

    exp.isDeleted = true;
    exp.deletedAt = new Date();
    await exp.save();

    return { message: 'Senior experience deleted successfully' };
  }

  /**
   * SENIOR-06: Verify Experience (Authorized roles only: MODERATOR, FACULTY, ADMIN)
   */
  async verifyExperience(
    verifierId: string,
    experienceId: string,
    dto: VerifySeniorExperienceDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    const exp = await SeniorExperience.findById(experienceId);
    if (!exp) {
      throw AppError.notFound(`Senior experience '${experienceId}' not found`);
    }

    exp.verificationStatus = dto.status;
    exp.verifiedBy = new mongoose.Types.ObjectId(verifierId);
    exp.verifiedAt = new Date();
    await exp.save();

    return this.getExperienceById(exp._id.toString());
  }
}

export const seniorsService = new SeniorsService();
