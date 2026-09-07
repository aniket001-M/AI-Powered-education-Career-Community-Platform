import mongoose from 'mongoose';
import { Career, ICareer } from '@/models/Career.model';
import { CareerSkill } from '@/models/CareerSkill.model';
import { Skill } from '@/models/Skill.model';
import { SkillRelation } from '@/models/SkillRelation.model';
import { CareerGoal } from '@/models/CareerGoal.model';
import { StudentProfile } from '@/models/StudentProfile.model';
import { AppError } from '@/common/errors/AppError';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/common/utils/logger';
import { ListCareersDto, SelectCareerGoalDto } from './careers.validation';

export class CareersService {
  /**
   * Helper to resolve Career by ObjectId or Slug
   */
  async resolveCareer(idOrSlug: string): Promise<ICareer> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const career = await Career.findOne(query);
    if (!career) {
      throw AppError.notFound(`Career '${idOrSlug}' not found`);
    }
    return career;
  }

  /**
   * CAREER-01 List Careers with filtering, search, pagination, and Redis cache
   */
  async getCareers(query: ListCareersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.active !== undefined) {
      filter.isActive = query.active;
    } else {
      filter.isActive = true;
    }

    if (query.category) {
      filter.category = new RegExp(query.category, 'i');
    }

    if (query.search) {
      filter.$or = [
        { title: new RegExp(query.search, 'i') },
        { description: new RegExp(query.search, 'i') },
        { category: new RegExp(query.search, 'i') },
      ];
    }

    const isCacheable = !query.search && !query.category && page === 1;
    const cacheKey = `cache:careers:p${page}:l${limit}`;

    if (isCacheable) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Redis read failed in getCareers:', err);
      }
    }

    const [items, total] = await Promise.all([
      Career.find(filter).sort({ title: 1 }).skip(skip).limit(limit).lean(),
      Career.countDocuments(filter),
    ]);

    const result = {
      items: items.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        category: c.category,
        description: c.description,
        overview: c.overview,
        salaryRange: c.salaryRange,
        demandLevel: c.demandLevel,
        growthRate: c.growthRate,
        isActive: c.isActive,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    if (isCacheable) {
      try {
        const redis = getRedisClient();
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 min TTL
      } catch (err) {
        logger.warn('Redis write failed in getCareers:', err);
      }
    }

    return result;
  }

  /**
   * CAREER-02 Get Career by ID or Slug
   */
  async getCareerById(idOrSlug: string) {
    const career = await this.resolveCareer(idOrSlug);
    return {
      id: career._id.toString(),
      title: career.title,
      slug: career.slug,
      category: career.category,
      description: career.description,
      overview: career.overview,
      salaryRange: career.salaryRange,
      demandLevel: career.demandLevel,
      growthRate: career.growthRate,
      isActive: career.isActive,
      createdAt: career.createdAt,
      updatedAt: career.updatedAt,
    };
  }

  /**
   * CAREER-03 Get Career Skills
   */
  async getCareerSkills(idOrSlug: string) {
    const career = await this.resolveCareer(idOrSlug);

    const careerSkills = await CareerSkill.find({ careerId: career._id })
      .populate('skillId')
      .lean();

    return careerSkills.map((cs: any) => {
      const skill = cs.skillId;
      return {
        id: cs._id.toString(),
        skillId: skill?._id?.toString() || cs.skillId.toString(),
        name: skill?.name ?? 'Unknown Skill',
        slug: skill?.slug ?? '',
        category: skill?.category ?? '',
        level: skill?.level ?? 'FOUNDATIONAL',
        importance: cs.importance,
        weight: cs.weight,
        requiredProficiency: cs.requiredProficiency,
      };
    });
  }

  /**
   * CAREER-04 Get Career Skill Graph
   */
  async getCareerSkillGraph(idOrSlug: string) {
    const career = await this.resolveCareer(idOrSlug);
    const careerSkills = await CareerSkill.find({ careerId: career._id })
      .populate('skillId')
      .lean();

    const skillIds = careerSkills
      .map((cs: any) => cs.skillId?._id)
      .filter(Boolean);

    // Find relations between these skills
    const relations = await SkillRelation.find({
      $or: [
        { parentSkillId: { $in: skillIds }, childSkillId: { $in: skillIds } },
        { childSkillId: { $in: skillIds } },
      ],
    }).lean();

    const nodes = careerSkills.map((cs: any) => {
      const s = cs.skillId;
      return {
        id: s._id.toString(),
        name: s.name,
        slug: s.slug,
        category: s.category,
        level: s.level,
        importance: cs.importance,
        requiredProficiency: cs.requiredProficiency,
      };
    });

    const edges = relations.map((r: any) => ({
      id: r._id.toString(),
      source: r.parentSkillId.toString(),
      target: r.childSkillId.toString(),
      relationType: r.relationType,
    }));

    return {
      career: {
        id: career._id.toString(),
        title: career.title,
        slug: career.slug,
      },
      nodes,
      edges,
    };
  }

  /**
   * CAREER-07 Get Student Career Goals
   */
  async getStudentCareerGoals(userId: string) {
    const goals = await CareerGoal.find({ userId })
      .populate('careerId')
      .lean();

    return goals.map((g: any) => ({
      id: g._id.toString(),
      careerId: g.careerId?._id?.toString() || g.careerId,
      careerTitle: g.careerId?.title || 'Unknown Career',
      careerSlug: g.careerId?.slug || '',
      category: g.careerId?.category || '',
      isPrimary: g.isPrimary,
      targetRole: g.targetRole || g.careerId?.title,
      timeline: g.timeline,
      preferredLocations: g.preferredLocations || [],
      notes: g.notes,
      createdAt: g.createdAt,
    }));
  }

  /**
   * CAREER-05 Select Student Career
   */
  async selectStudentCareer(userId: string, dto: SelectCareerGoalDto) {
    const career = await this.resolveCareer(dto.careerId);

    if (dto.isPrimary) {
      await CareerGoal.updateMany({ userId }, { isPrimary: false });
    }

    const existingGoalsCount = await CareerGoal.countDocuments({ userId });
    const isPrimary = dto.isPrimary ?? (existingGoalsCount === 0);

    const goal = await CareerGoal.findOneAndUpdate(
      { userId, careerId: career._id },
      {
        userId: new mongoose.Types.ObjectId(userId),
        careerId: career._id,
        isPrimary,
        targetRole: dto.targetRole || career.title,
        timeline: dto.timeline || '1 year',
        preferredLocations: dto.preferredLocations || [],
        notes: dto.notes || null,
      },
      { upsert: true, new: true },
    );

    // Synchronize into StudentProfile.careerGoals
    const profile = await StudentProfile.findOne({ userId });
    if (profile) {
      const idx = profile.careerGoals.findIndex(
        (g: any) => g.careerId?.toString() === career._id.toString(),
      );
      if (isPrimary) {
        profile.careerGoals.forEach((g) => {
          g.isPrimary = false;
        });
      }
      if (idx !== -1) {
        profile.careerGoals[idx].isPrimary = isPrimary;
        profile.careerGoals[idx].targetRole = dto.targetRole || career.title;
        profile.careerGoals[idx].timeline = dto.timeline || '1 year';
      } else {
        profile.careerGoals.push({
          careerId: career._id,
          title: career.title,
          isPrimary,
          targetRole: dto.targetRole || career.title,
          timeline: dto.timeline || '1 year',
          preferredLocations: dto.preferredLocations || [],
          notes: dto.notes || undefined,
          createdAt: new Date(),
        } as any);
      }
      await profile.save();
    }

    return {
      id: goal._id.toString(),
      careerId: career._id.toString(),
      careerTitle: career.title,
      careerSlug: career.slug,
      isPrimary: goal.isPrimary,
      targetRole: goal.targetRole,
      timeline: goal.timeline,
      preferredLocations: goal.preferredLocations,
      notes: goal.notes,
      createdAt: goal.createdAt,
    };
  }

  /**
   * CAREER-06 Remove Student Career Goal
   */
  async removeStudentCareerGoal(userId: string, goalIdOrCareerId: string) {
    const isObjectId = mongoose.Types.ObjectId.isValid(goalIdOrCareerId);
    let filter: any;
    if (isObjectId) {
      filter = {
        userId,
        $or: [{ _id: goalIdOrCareerId }, { careerId: goalIdOrCareerId }],
      };
    } else {
      const career = await Career.findOne({ slug: goalIdOrCareerId });
      if (career) {
        filter = { userId, careerId: career._id };
      } else {
        throw AppError.notFound('Career goal not found');
      }
    }

    const deleted = await CareerGoal.findOneAndDelete(filter);
    if (!deleted) {
      throw AppError.notFound('Career goal not found');
    }

    // Sync removal with StudentProfile
    const profile = await StudentProfile.findOne({ userId });
    if (profile) {
      profile.careerGoals = profile.careerGoals.filter(
        (g: any) =>
          g._id?.toString() !== deleted._id.toString() &&
          g.careerId?.toString() !== deleted.careerId?.toString(),
      );
      // Ensure there is a primary if other goals exist
      if (deleted.isPrimary && profile.careerGoals.length > 0) {
        profile.careerGoals[0].isPrimary = true;
        await CareerGoal.findByIdAndUpdate(profile.careerGoals[0].careerId, {
          isPrimary: true,
        });
      }
      await profile.save();
    }

    return { message: 'Career goal removed successfully' };
  }
}

export const careersService = new CareersService();
