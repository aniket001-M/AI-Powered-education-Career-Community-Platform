import mongoose from 'mongoose';
import { Skill, ISkill } from '@/models/Skill.model';
import { SkillRelation } from '@/models/SkillRelation.model';
import { StudentSkill } from '@/models/StudentSkill.model';
import { StudentSkillHistory } from '@/models/StudentSkillHistory.model';
import { Career } from '@/models/Career.model';
import { CareerGoal } from '@/models/CareerGoal.model';
import { CareerSkill } from '@/models/CareerSkill.model';
import { AppError } from '@/common/errors/AppError';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/common/utils/logger';
import { ListSkillsDto, UpdateStudentSkillDto } from './skills.validation';

export class SkillsService {
  /**
   * Helper to resolve Skill by ObjectId or Slug
   */
  async resolveSkill(idOrSlug: string): Promise<ISkill> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const skill = await Skill.findOne(query);
    if (!skill) {
      throw AppError.notFound(`Skill '${idOrSlug}' not found`);
    }
    return skill;
  }

  /**
   * SKILL-01: List Skills with filters, search, pagination, and Redis cache
   */
  async getSkills(query: ListSkillsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isActive: true };

    if (query.category) {
      filter.category = new RegExp(query.category, 'i');
    }

    if (query.parent) {
      const parentSkill = await this.resolveSkill(query.parent).catch(() => null);
      if (parentSkill) {
        filter.parentId = parentSkill._id;
      } else {
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
    }

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { slug: new RegExp(query.search, 'i') },
        { tags: new RegExp(query.search, 'i') },
        { category: new RegExp(query.search, 'i') },
      ];
    }

    const isCacheable = !query.search && !query.category && !query.parent && page === 1;
    const cacheKey = `cache:skills:p${page}:l${limit}`;

    if (isCacheable) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Redis read failed in getSkills:', err);
      }
    }

    const [items, total] = await Promise.all([
      Skill.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Skill.countDocuments(filter),
    ]);

    const result = {
      items: items.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        slug: s.slug,
        category: s.category,
        description: s.description,
        parentId: s.parentId ? s.parentId.toString() : null,
        level: s.level,
        tags: s.tags || [],
        isActive: s.isActive,
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
        logger.warn('Redis write failed in getSkills:', err);
      }
    }

    return result;
  }

  /**
   * SKILL-02: Get Skill by ID or Slug
   */
  async getSkillById(idOrSlug: string) {
    const skill = await this.resolveSkill(idOrSlug);
    return {
      id: skill._id.toString(),
      name: skill.name,
      slug: skill.slug,
      category: skill.category,
      description: skill.description,
      parentId: skill.parentId ? skill.parentId.toString() : null,
      level: skill.level,
      tags: skill.tags || [],
      isActive: skill.isActive,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }

  /**
   * SKILL-03: Get Skill Children
   */
  async getSkillChildren(idOrSlug: string) {
    const skill = await this.resolveSkill(idOrSlug);

    // Find direct children by parentId
    const directChildren = await Skill.find({ parentId: skill._id, isActive: true }).lean();

    // Find relations where this skill is parent
    const relations = await SkillRelation.find({ parentSkillId: skill._id })
      .populate('childSkillId')
      .lean();

    const childrenMap = new Map<string, any>();

    for (const child of directChildren) {
      childrenMap.set(child._id.toString(), {
        id: child._id.toString(),
        name: child.name,
        slug: child.slug,
        category: child.category,
        level: child.level,
        relationType: 'SUBCATEGORY',
      });
    }

    for (const rel of relations) {
      const child: any = rel.childSkillId;
      if (child && !childrenMap.has(child._id.toString())) {
        childrenMap.set(child._id.toString(), {
          id: child._id.toString(),
          name: child.name,
          slug: child.slug,
          category: child.category,
          level: child.level,
          relationType: rel.relationType,
        });
      }
    }

    return Array.from(childrenMap.values());
  }

  /**
   * SKILL-04: Get Skill Graph
   */
  async getSkillGraph() {
    const cacheKey = 'cache:skills:graph';
    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn('Redis read failed in getSkillGraph:', err);
    }

    const [skills, relations] = await Promise.all([
      Skill.find({ isActive: true }).lean(),
      SkillRelation.find().lean(),
    ]);

    const nodes = skills.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      category: s.category,
      level: s.level,
      tags: s.tags || [],
    }));

    const edges = relations.map((r) => ({
      id: r._id.toString(),
      source: r.parentSkillId.toString(),
      target: r.childSkillId.toString(),
      relationType: r.relationType,
    }));

    const result = { nodes, edges };

    try {
      const redis = getRedisClient();
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    } catch (err) {
      logger.warn('Redis write failed in getSkillGraph:', err);
    }

    return result;
  }

  /**
   * SKILL-05: Get Student Skills
   */
  async getStudentSkills(userId: string) {
    const studentSkills = await StudentSkill.find({ userId })
      .populate('skillId')
      .lean();

    return studentSkills.map((ss: any) => {
      const skill = ss.skillId;
      return {
        id: ss._id.toString(),
        skillId: skill?._id?.toString() || ss.skillId.toString(),
        name: skill?.name || 'Unknown Skill',
        slug: skill?.slug || '',
        category: skill?.category || '',
        level: skill?.level || 'FOUNDATIONAL',
        proficiency: ss.proficiency,
        confidence: ss.confidence,
        source: ss.source,
        lastAssessedAt: ss.lastAssessedAt,
        createdAt: ss.createdAt,
        updatedAt: ss.updatedAt,
      };
    });
  }

  /**
   * SKILL-06: Update Student Skill
   */
  async updateStudentSkill(
    userId: string,
    skillIdOrSlug: string,
    dto: UpdateStudentSkillDto,
  ) {
    const skill = await this.resolveSkill(skillIdOrSlug);

    const existing = await StudentSkill.findOne({
      userId,
      skillId: skill._id,
    });

    const previousProficiency = existing ? existing.proficiency : 0;
    const confidence = dto.confidence ?? (existing ? existing.confidence : 50);

    const updated = await StudentSkill.findOneAndUpdate(
      { userId, skillId: skill._id },
      {
        userId: new mongoose.Types.ObjectId(userId),
        skillId: skill._id,
        proficiency: dto.proficiency,
        confidence,
        source: 'MANUAL',
        lastAssessedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Record history
    await StudentSkillHistory.create({
      userId: new mongoose.Types.ObjectId(userId),
      skillId: skill._id,
      previousProficiency,
      newProficiency: dto.proficiency,
      source: 'MANUAL',
      reason: dto.reason || 'Manual proficiency update',
      recordedAt: new Date(),
    });

    return {
      id: updated._id.toString(),
      skillId: skill._id.toString(),
      name: skill.name,
      slug: skill.slug,
      category: skill.category,
      level: skill.level,
      proficiency: updated.proficiency,
      confidence: updated.confidence,
      source: updated.source,
      lastAssessedAt: updated.lastAssessedAt,
    };
  }

  /**
   * SKILL-07: Get Student Skill History
   */
  async getStudentSkillHistory(userId: string, skillIdOrSlug: string) {
    const skill = await this.resolveSkill(skillIdOrSlug);

    const history = await StudentSkillHistory.find({
      userId,
      skillId: skill._id,
    })
      .sort({ recordedAt: -1 })
      .lean();

    return history.map((h) => ({
      id: h._id.toString(),
      skillId: skill._id.toString(),
      skillName: skill.name,
      previousProficiency: h.previousProficiency,
      newProficiency: h.newProficiency,
      source: h.source,
      reason: h.reason,
      recordedAt: h.recordedAt,
    }));
  }

  /**
   * SKILL-08: Get Skill Gaps
   */
  async getStudentSkillGaps(userId: string, targetCareerIdOrSlug?: string) {
    let targetCareer: any = null;

    if (targetCareerIdOrSlug) {
      const isObjectId = mongoose.Types.ObjectId.isValid(targetCareerIdOrSlug);
      const query = isObjectId
        ? { $or: [{ _id: targetCareerIdOrSlug }, { slug: targetCareerIdOrSlug }] }
        : { slug: targetCareerIdOrSlug };
      targetCareer = await Career.findOne(query);
    }

    if (!targetCareer) {
      // Find student primary career goal
      const primaryGoal = await CareerGoal.findOne({ userId, isPrimary: true }).populate('careerId');
      if (primaryGoal?.careerId) {
        targetCareer = primaryGoal.careerId;
      } else {
        // Find any career goal
        const anyGoal = await CareerGoal.findOne({ userId }).populate('careerId');
        if (anyGoal?.careerId) {
          targetCareer = anyGoal.careerId;
        } else {
          // Fallback to default career (e.g. Software Engineer or first available)
          targetCareer = await Career.findOne({ slug: 'software-engineer', isActive: true }) ||
            await Career.findOne({ isActive: true });
        }
      }
    }

    if (!targetCareer) {
      return {
        targetCareer: null,
        matchScore: 0,
        summary: { totalSkills: 0, strongSkills: 0, weakSkills: 0, missingSkills: 0 },
        gaps: [],
      };
    }

    // Fetch career requirements
    const careerSkills = await CareerSkill.find({ careerId: targetCareer._id })
      .populate('skillId')
      .lean();

    // Fetch student's skills
    const studentSkills = await StudentSkill.find({ userId }).lean();
    const studentSkillMap = new Map<string, number>();
    for (const ss of studentSkills) {
      studentSkillMap.set(ss.skillId.toString(), ss.proficiency);
    }

    let totalPoints = 0;
    let earnedPoints = 0;

    const gaps = careerSkills.map((cs: any) => {
      const skill = cs.skillId;
      const skillId = skill?._id?.toString() || cs.skillId.toString();
      const currentProficiency = studentSkillMap.get(skillId) ?? 0;
      const requiredProficiency = cs.requiredProficiency;
      const weight = cs.weight || 3;
      const importance = cs.importance || 'IMPORTANT';
      const gap = Math.max(0, requiredProficiency - currentProficiency);

      totalPoints += weight * requiredProficiency;
      earnedPoints += weight * Math.min(currentProficiency, requiredProficiency);

      let status: 'STRONG' | 'GROWTH_NEEDED' | 'MISSING';
      if (currentProficiency >= requiredProficiency) {
        status = 'STRONG';
      } else if (currentProficiency > 0) {
        status = 'GROWTH_NEEDED';
      } else {
        status = 'MISSING';
      }

      let priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
      if (gap === 0) {
        priority = 'NONE';
      } else if (importance === 'CRITICAL') {
        priority = 'HIGH';
      } else if (importance === 'IMPORTANT') {
        priority = 'MEDIUM';
      } else {
        priority = 'LOW';
      }

      return {
        skillId,
        name: skill?.name || 'Unknown Skill',
        slug: skill?.slug || '',
        category: skill?.category || '',
        importance,
        weight,
        requiredProficiency,
        currentProficiency,
        gap,
        status,
        priority,
      };
    });

    const priorityWeight: Record<string, number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      NONE: 0,
    };

    gaps.sort((a, b) => {
      if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }
      return b.gap - a.gap;
    });

    const matchScore =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    const summary = {
      totalSkills: careerSkills.length,
      strongSkills: gaps.filter((g) => g.status === 'STRONG').length,
      weakSkills: gaps.filter((g) => g.status === 'GROWTH_NEEDED').length,
      missingSkills: gaps.filter((g) => g.status === 'MISSING').length,
    };

    return {
      targetCareer: {
        id: targetCareer._id.toString(),
        title: targetCareer.title,
        slug: targetCareer.slug,
        category: targetCareer.category,
      },
      matchScore,
      summary,
      gaps,
    };
  }
}

export const skillsService = new SkillsService();
