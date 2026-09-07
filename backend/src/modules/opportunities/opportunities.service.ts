import mongoose from 'mongoose';
import { Opportunity, IOpportunity } from '@/models/Opportunity.model';
import { OpportunitySkill } from '@/models/OpportunitySkill.model';
import { OpportunityRiskSignal } from '@/models/OpportunityRiskSignal.model';
import { SavedOpportunity } from '@/models/SavedOpportunity.model';
import { Skill } from '@/models/Skill.model';
import { AppError } from '@/common/errors/AppError';
import { UserRole } from '@/common/enums/roles.enum';
import {
  ListOpportunitiesDto,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  VerifyOpportunityDto,
  AddRiskSignalDto,
} from './opportunities.validation';

export class OpportunitiesService {
  /**
   * OPPORTUNITY-01: List Opportunities
   */
  async getOpportunities(query: ListOpportunitiesDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.type) filter.type = query.type;
    if (query.location) filter.location = new RegExp(query.location, 'i');
    if (query.deadline) filter.deadline = { $gte: new Date(query.deadline) };

    if (query.verificationStatus) {
      filter.verificationStatus = query.verificationStatus;
    } else {
      filter.verificationStatus = 'VERIFIED';
    }

    if (query.search) {
      filter.$or = [
        { title: new RegExp(query.search, 'i') },
        { company: new RegExp(query.search, 'i') },
        { description: new RegExp(query.search, 'i') },
      ];
    }

    if (query.skill) {
      const isObjectId = mongoose.Types.ObjectId.isValid(query.skill);
      const skill = await Skill.findOne(
        isObjectId
          ? { $or: [{ _id: query.skill }, { slug: query.skill }] }
          : { slug: query.skill },
      );

      if (skill) {
        const oppSkills = await OpportunitySkill.find({ skillId: skill._id }).lean();
        const oppIds = oppSkills.map((os) => os.opportunityId);
        filter._id = { $in: oppIds };
      }
    }

    const [items, total] = await Promise.all([
      Opportunity.find(filter)
        .populate('postedBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Opportunity.countDocuments(filter),
    ]);

    return {
      items: items.map((o: any) => ({
        id: o._id.toString(),
        title: o.title,
        company: o.company,
        type: o.type,
        description: o.description,
        location: o.location,
        applyUrl: o.applyUrl,
        deadline: o.deadline,
        eligibility: o.eligibility,
        stipendOrSalary: o.stipendOrSalary,
        verificationStatus: o.verificationStatus,
        riskScore: o.riskScore,
        riskSignalsCount: o.riskSignalsCount,
        postedBy: o.postedBy
          ? {
              id: o.postedBy._id.toString(),
              name: o.postedBy.name,
              email: o.postedBy.email,
            }
          : null,
        createdAt: o.createdAt,
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
   * OPPORTUNITY-02: Get Opportunity by ID
   */
  async getOpportunityById(opportunityId: string, currentUserId?: string) {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const opp = await Opportunity.findById(opportunityId)
      .populate('postedBy', 'name email avatar')
      .populate('verifiedBy', 'name email')
      .lean();

    if (!opp) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    // Mapped skills
    const oppSkills = await OpportunitySkill.find({ opportunityId: opp._id })
      .populate('skillId', 'name slug category')
      .lean();

    // Risk signals
    const riskSignals = await OpportunityRiskSignal.find({
      opportunityId: opp._id,
      status: { $ne: 'DISMISSED' },
    })
      .select('signalType severity evidenceDescription status createdAt')
      .lean();

    let isSaved = false;
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      const exists = await SavedOpportunity.exists({
        opportunityId: opp._id,
        userId: new mongoose.Types.ObjectId(currentUserId),
      });
      isSaved = Boolean(exists);
    }

    const o: any = opp;
    return {
      id: o._id.toString(),
      title: o.title,
      company: o.company,
      type: o.type,
      description: o.description,
      location: o.location,
      applyUrl: o.applyUrl,
      deadline: o.deadline,
      eligibility: o.eligibility,
      stipendOrSalary: o.stipendOrSalary,
      verificationStatus: o.verificationStatus,
      verifiedAt: o.verifiedAt,
      riskScore: o.riskScore,
      riskSignalsCount: o.riskSignalsCount,
      isSaved,
      skills: oppSkills.map((os: any) => ({
        id: os.skillId?._id?.toString(),
        name: os.skillId?.name,
        slug: os.skillId?.slug,
        category: os.skillId?.category,
        importance: os.importance,
      })),
      riskSignals,
      postedBy: o.postedBy
        ? {
            id: o.postedBy._id.toString(),
            name: o.postedBy.name,
            email: o.postedBy.email,
          }
        : null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  /**
   * OPPORTUNITY-03: Create Opportunity
   */
  async createOpportunity(
    userId: string,
    roles: string[],
    dto: CreateOpportunityDto,
  ) {
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.FACULTY].includes(r as UserRole),
    );

    const opp = await Opportunity.create({
      postedBy: new mongoose.Types.ObjectId(userId),
      title: dto.title,
      company: dto.company,
      type: dto.type,
      description: dto.description,
      location: dto.location,
      applyUrl: dto.applyUrl,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      eligibility: dto.eligibility || null,
      stipendOrSalary: dto.stipendOrSalary || null,
      verificationStatus: isElevated ? 'VERIFIED' : 'PENDING',
      verifiedAt: isElevated ? new Date() : null,
      verifiedBy: isElevated ? new mongoose.Types.ObjectId(userId) : null,
    });

    if (dto.skills && dto.skills.length > 0) {
      for (const skillKey of dto.skills) {
        const isObjectId = mongoose.Types.ObjectId.isValid(skillKey);
        const s = await Skill.findOne(
          isObjectId
            ? { $or: [{ _id: skillKey }, { slug: skillKey }] }
            : { slug: skillKey },
        );
        if (s) {
          await OpportunitySkill.create({
            opportunityId: opp._id,
            skillId: s._id,
            importance: 'REQUIRED',
          });
        }
      }
    }

    return this.getOpportunityById(opp._id.toString(), userId);
  }

  /**
   * OPPORTUNITY-04: Update Opportunity
   */
  async updateOpportunity(
    userId: string,
    roles: string[],
    opportunityId: string,
    dto: UpdateOpportunityDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const isPoster = opp.postedBy.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isPoster && !isElevated) {
      throw AppError.forbidden('You do not have permission to edit this opportunity');
    }

    if (dto.title !== undefined) opp.title = dto.title;
    if (dto.company !== undefined) opp.company = dto.company;
    if (dto.type !== undefined) opp.type = dto.type;
    if (dto.description !== undefined) opp.description = dto.description;
    if (dto.location !== undefined) opp.location = dto.location;
    if (dto.applyUrl !== undefined) opp.applyUrl = dto.applyUrl;
    if (dto.deadline !== undefined) opp.deadline = dto.deadline ? new Date(dto.deadline) : undefined;
    if (dto.eligibility !== undefined) opp.eligibility = dto.eligibility;
    if (dto.stipendOrSalary !== undefined) opp.stipendOrSalary = dto.stipendOrSalary;

    await opp.save();
    return this.getOpportunityById(opp._id.toString(), userId);
  }

  /**
   * OPPORTUNITY-05: Delete Opportunity (Soft delete)
   */
  async deleteOpportunity(userId: string, roles: string[], opportunityId: string) {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const isPoster = opp.postedBy.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isPoster && !isElevated) {
      throw AppError.forbidden('You do not have permission to delete this opportunity');
    }

    opp.isDeleted = true;
    opp.deletedAt = new Date();
    await opp.save();

    return { message: 'Opportunity deleted successfully' };
  }

  /**
   * OPPORTUNITY-06: Verify Opportunity (Authorized roles only: MODERATOR, FACULTY, ADMIN)
   */
  async verifyOpportunity(
    verifierId: string,
    opportunityId: string,
    dto: VerifyOpportunityDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    opp.verificationStatus = dto.status;
    opp.verifiedBy = new mongoose.Types.ObjectId(verifierId);
    opp.verifiedAt = new Date();
    await opp.save();

    return this.getOpportunityById(opp._id.toString());
  }

  /**
   * OPPORTUNITY-07: Add Risk Signal (Evidence-based indicator — never auto-declares fraud)
   */
  async addRiskSignal(
    reporterId: string,
    opportunityId: string,
    dto: AddRiskSignalDto,
  ) {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const signal = await OpportunityRiskSignal.create({
      opportunityId: opp._id,
      reportedBy: new mongoose.Types.ObjectId(reporterId),
      signalType: dto.signalType,
      severity: dto.severity,
      evidenceDescription: dto.evidenceDescription,
      status: 'FLAGGED',
    });

    // Compute evidence-weighted risk score (0-100)
    const weightMap = { LOW: 15, MEDIUM: 30, HIGH: 50 };
    const additionalRisk = weightMap[dto.severity] || 20;

    opp.riskSignalsCount += 1;
    opp.riskScore = Math.min(100, opp.riskScore + additionalRisk);
    await opp.save();

    return {
      signalId: signal._id.toString(),
      signalType: signal.signalType,
      severity: signal.severity,
      evidenceDescription: signal.evidenceDescription,
      status: signal.status,
      updatedOpportunityRiskScore: opp.riskScore,
      message: 'Evidence-based risk signal recorded for moderation review',
    };
  }

  /**
   * Toggle Save Opportunity
   */
  async toggleSaveOpportunity(userId: string, opportunityId: string) {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      throw AppError.notFound(`Opportunity '${opportunityId}' not found`);
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const existing = await SavedOpportunity.findOne({
      userId: userObjId,
      opportunityId: opp._id,
    });

    if (existing) {
      await SavedOpportunity.findByIdAndDelete(existing._id);
      return { saved: false, message: 'Opportunity removed from saved list' };
    } else {
      await SavedOpportunity.create({
        userId: userObjId,
        opportunityId: opp._id,
      });
      return { saved: true, message: 'Opportunity saved successfully' };
    }
  }

  /**
   * OPPORTUNITY-08: Get Student Saved Opportunities
   */
  async getStudentSavedOpportunities(userId: string) {
    const saved = await SavedOpportunity.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate({
        path: 'opportunityId',
        match: { isDeleted: false },
        populate: { path: 'postedBy', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return saved
      .filter((s: any) => s.opportunityId != null)
      .map((s: any) => {
        const o = s.opportunityId;
        return {
          id: s._id.toString(),
          opportunityId: o._id.toString(),
          title: o.title,
          company: o.company,
          type: o.type,
          location: o.location,
          applyUrl: o.applyUrl,
          deadline: o.deadline,
          verificationStatus: o.verificationStatus,
          riskScore: o.riskScore,
          savedAt: s.createdAt,
        };
      });
  }
}

export const opportunitiesService = new OpportunitiesService();
