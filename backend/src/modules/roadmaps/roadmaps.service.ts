import mongoose from 'mongoose';
import { Roadmap, IRoadmap } from '@/models/Roadmap.model';
import { RoadmapStep, IRoadmapStep } from '@/models/RoadmapStep.model';
import { Career } from '@/models/Career.model';
import { CareerGoal } from '@/models/CareerGoal.model';
import { StudentSkill } from '@/models/StudentSkill.model';
import { StudentSkillHistory } from '@/models/StudentSkillHistory.model';
import { AppError } from '@/common/errors/AppError';
import { RecommendationEngine } from './recommendation-engine.interface';
import { ruleBasedRecommendationEngine } from './rule-based-recommendation.engine';
import { GenerateRoadmapDto, UpdateStepStatusDto } from './roadmaps.validation';

export interface IRoadmapResponse {
  id: string;
  career: {
    id?: string;
    title?: string;
    slug?: string;
  };
  targetRole: string;
  version: number;
  status: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  generatedBy: string;
  steps: any[];
}

export class RoadmapsService {
  private recommendationEngine: RecommendationEngine;

  constructor(engine: RecommendationEngine = ruleBasedRecommendationEngine) {
    this.recommendationEngine = engine;
  }

  /**
   * Helper to resolve target career for user
   */
  private async resolveTargetCareer(userId: string, careerIdOrSlug?: string) {
    if (careerIdOrSlug) {
      const isObjectId = mongoose.Types.ObjectId.isValid(careerIdOrSlug);
      const query = isObjectId
        ? { $or: [{ _id: careerIdOrSlug }, { slug: careerIdOrSlug }] }
        : { slug: careerIdOrSlug };
      const c = await Career.findOne(query);
      if (c) return c;
    }

    const primaryGoal = await CareerGoal.findOne({ userId, isPrimary: true }).populate('careerId');
    if (primaryGoal?.careerId) {
      return primaryGoal.careerId as any;
    }

    const anyGoal = await CareerGoal.findOne({ userId }).populate('careerId');
    if (anyGoal?.careerId) {
      return anyGoal.careerId as any;
    }

    return (
      (await Career.findOne({ slug: 'backend-developer' })) ||
      (await Career.findOne({ isActive: true }))
    );
  }

  /**
   * ROADMAP-01: Get Current Roadmap
   */
  async getCurrentRoadmap(userId: string): Promise<IRoadmapResponse> {
    let roadmap = await Roadmap.findOne({ userId, status: 'ACTIVE' })
      .populate('careerId')
      .lean();

    if (!roadmap) {
      // Auto-generate initial roadmap
      return this.generateRoadmap(userId, {});
    }

    const steps = await RoadmapStep.find({ roadmapId: roadmap._id })
      .sort({ stepOrder: 1 })
      .populate('skillId')
      .lean();

    return {
      id: roadmap._id.toString(),
      career: {
        id: (roadmap.careerId as any)?._id?.toString(),
        title: (roadmap.careerId as any)?.title,
        slug: (roadmap.careerId as any)?.slug,
      },
      targetRole: roadmap.targetRole,
      version: roadmap.version,
      status: roadmap.status,
      totalSteps: roadmap.totalSteps,
      completedSteps: roadmap.completedSteps,
      progressPercentage: roadmap.progressPercentage,
      generatedBy: roadmap.generatedBy,
      steps: steps.map((s: any) => ({
        id: s._id.toString(),
        stepOrder: s.stepOrder,
        skillId: s.skillId?._id?.toString() || s.skillId?.toString(),
        skillName: s.skillId?.name || 'Skill',
        title: s.title,
        description: s.description,
        status: s.status,
        currentProficiency: s.currentProficiency,
        targetProficiency: s.targetProficiency,
        prerequisiteStepIds: (s.prerequisiteStepIds || []).map((id: any) => id.toString()),
        estimatedHours: s.estimatedHours,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
      })),
    };
  }

  /**
   * ROADMAP-02: Generate/Rebuild Roadmap
   */
  async generateRoadmap(
    userId: string,
    dto: GenerateRoadmapDto,
  ): Promise<IRoadmapResponse> {
    const career = await this.resolveTargetCareer(userId, dto.careerId);
    if (!career) {
      throw AppError.notFound('No career found to generate roadmap for');
    }

    const targetRole = dto.targetRole || career.title;

    // Archive any currently active roadmap
    await Roadmap.updateMany({ userId, status: 'ACTIVE' }, { status: 'ARCHIVED' });

    const existingCount = await Roadmap.countDocuments({ userId });
    const version = existingCount + 1;

    // Use RecommendationEngine interface to get dependency-ordered step plan
    const stepPlans = await this.recommendationEngine.generateStepPlan({
      userId,
      careerId: career._id,
      targetRole,
    });

    const roadmap = await Roadmap.create({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: career._id,
      targetRole,
      version,
      status: 'ACTIVE',
      totalSteps: stepPlans.length,
      completedSteps: 0,
      progressPercentage: 0,
      generatedBy: 'RULE_BASED',
    });

    // Create steps and resolve prerequisite step IDs
    const skillToStepIdMap = new Map<string, mongoose.Types.ObjectId>();
    const createdSteps: any[] = [];

    // Pre-allocate step ObjectIds
    for (let i = 0; i < stepPlans.length; i++) {
      const plan = stepPlans[i];
      const stepId = new mongoose.Types.ObjectId();
      skillToStepIdMap.set(plan.skillId.toString(), stepId);
    }

    for (let i = 0; i < stepPlans.length; i++) {
      const plan = stepPlans[i];
      const stepId = skillToStepIdMap.get(plan.skillId.toString())!;

      const prerequisiteStepIds = plan.prerequisiteSkillIds
        .map((sId) => skillToStepIdMap.get(sId.toString()))
        .filter(Boolean) as mongoose.Types.ObjectId[];

      // If no prerequisites, step is immediately AVAILABLE, else LOCKED
      const status = prerequisiteStepIds.length === 0 ? 'AVAILABLE' : 'LOCKED';

      const stepDoc = await RoadmapStep.create({
        _id: stepId,
        roadmapId: roadmap._id,
        userId: new mongoose.Types.ObjectId(userId),
        skillId: plan.skillId,
        stepOrder: i + 1,
        title: plan.title,
        description: plan.description,
        status,
        currentProficiency: plan.currentProficiency,
        targetProficiency: plan.targetProficiency,
        prerequisiteStepIds,
        estimatedHours: plan.estimatedHours,
      });

      createdSteps.push(stepDoc);
    }

    return this.getCurrentRoadmap(userId);
  }

  /**
   * ROADMAP-03: Get Roadmap Step
   */
  async getStepById(userId: string, stepId: string) {
    const step = await RoadmapStep.findById(stepId).populate('skillId').lean();
    if (!step) {
      throw AppError.notFound('Roadmap step not found');
    }
    if (step.userId.toString() !== userId) {
      throw AppError.forbidden('Unauthorized access to roadmap step');
    }

    const s: any = step;
    return {
      id: s._id.toString(),
      roadmapId: s.roadmapId.toString(),
      stepOrder: s.stepOrder,
      skillId: s.skillId?._id?.toString() || s.skillId?.toString(),
      skillName: s.skillId?.name || 'Skill',
      title: s.title,
      description: s.description,
      status: s.status,
      currentProficiency: s.currentProficiency,
      targetProficiency: s.targetProficiency,
      prerequisiteStepIds: (s.prerequisiteStepIds || []).map((id: any) => id.toString()),
      estimatedHours: s.estimatedHours,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    };
  }

  /**
   * ROADMAP-04: Update Step Status
   */
  async updateStepStatus(
    userId: string,
    stepId: string,
    dto: UpdateStepStatusDto,
  ) {
    if (dto.status === 'COMPLETED') {
      return this.completeStep(userId, stepId);
    }

    const step = await RoadmapStep.findById(stepId);
    if (!step) {
      throw AppError.notFound('Roadmap step not found');
    }
    if (step.userId.toString() !== userId) {
      throw AppError.forbidden('Unauthorized access to roadmap step');
    }

    step.status = dto.status;
    if (dto.status === 'IN_PROGRESS' && !step.startedAt) {
      step.startedAt = new Date();
    }
    await step.save();

    return this.getStepById(userId, stepId);
  }

  /**
   * ROADMAP-05: Complete Learning Activity / Step
   */
  async completeStep(userId: string, stepId: string) {
    const step = await RoadmapStep.findById(stepId);
    if (!step) {
      throw AppError.notFound('Roadmap step not found');
    }
    if (step.userId.toString() !== userId) {
      throw AppError.forbidden('Unauthorized access to roadmap step');
    }

    step.status = 'COMPLETED';
    step.completedAt = new Date();
    step.currentProficiency = step.targetProficiency;
    await step.save();

    // Update student's StudentSkill state
    const existingSkill = await StudentSkill.findOne({
      userId,
      skillId: step.skillId,
    });
    const prevProficiency = existingSkill ? existingSkill.proficiency : 0;

    await StudentSkill.findOneAndUpdate(
      { userId, skillId: step.skillId },
      {
        userId: new mongoose.Types.ObjectId(userId),
        skillId: step.skillId,
        proficiency: Math.max(prevProficiency, step.targetProficiency),
        confidence: Math.max(existingSkill?.confidence || 50, 80),
        source: 'SYSTEM',
        lastAssessedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    await StudentSkillHistory.create({
      userId: new mongoose.Types.ObjectId(userId),
      skillId: step.skillId,
      previousProficiency: prevProficiency,
      newProficiency: Math.max(prevProficiency, step.targetProficiency),
      source: 'SYSTEM',
      reason: `Completed roadmap step: ${step.title}`,
      recordedAt: new Date(),
    });

    // Unlock dependent steps in the same roadmap
    const lockedSteps = await RoadmapStep.find({
      roadmapId: step.roadmapId,
      status: 'LOCKED',
      prerequisiteStepIds: step._id,
    });

    for (const ls of lockedSteps) {
      // Check if ALL prerequisite steps are completed or skipped
      const prereqs = await RoadmapStep.find({
        _id: { $in: ls.prerequisiteStepIds },
      });
      const allDone = prereqs.every(
        (p) => p.status === 'COMPLETED' || p.status === 'SKIPPED',
      );
      if (allDone) {
        ls.status = 'AVAILABLE';
        await ls.save();
      }
    }

    // Recalculate Roadmap progress
    const allRoadmapSteps = await RoadmapStep.find({ roadmapId: step.roadmapId });
    const completedCount = allRoadmapSteps.filter(
      (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED',
    ).length;
    const progressPercentage = Math.round(
      (completedCount / allRoadmapSteps.length) * 100,
    );

    const roadmap = await Roadmap.findById(step.roadmapId);
    if (roadmap) {
      roadmap.completedSteps = completedCount;
      roadmap.progressPercentage = progressPercentage;
      if (completedCount === allRoadmapSteps.length) {
        roadmap.status = 'COMPLETED';
      }
      await roadmap.save();
    }

    return {
      step: await this.getStepById(userId, stepId),
      roadmapProgress: {
        completedSteps: completedCount,
        totalSteps: allRoadmapSteps.length,
        progressPercentage,
      },
    };
  }

  /**
   * ROADMAP-06: Roadmap History
   */
  async getRoadmapHistory(userId: string) {
    const roadmaps = await Roadmap.find({ userId })
      .populate('careerId')
      .sort({ createdAt: -1 })
      .lean();

    return roadmaps.map((r: any) => ({
      id: r._id.toString(),
      careerTitle: r.careerId?.title || 'Career',
      targetRole: r.targetRole,
      version: r.version,
      status: r.status,
      totalSteps: r.totalSteps,
      completedSteps: r.completedSteps,
      progressPercentage: r.progressPercentage,
      createdAt: r.createdAt,
    }));
  }

  /**
   * ROADMAP-07: Recalculate Roadmap
   */
  async recalculateRoadmap(userId: string) {
    const roadmap = await Roadmap.findOne({ userId, status: 'ACTIVE' });
    if (!roadmap) {
      throw AppError.notFound('No active roadmap to recalculate');
    }

    // Fetch current student skills
    const studentSkills = await StudentSkill.find({ userId }).lean();
    const studentSkillMap = new Map<string, number>();
    for (const ss of studentSkills) {
      studentSkillMap.set(ss.skillId.toString(), ss.proficiency);
    }

    const steps = await RoadmapStep.find({ roadmapId: roadmap._id }).sort({
      stepOrder: 1,
    });

    for (const step of steps) {
      const curr = studentSkillMap.get(step.skillId.toString()) ?? 0;
      step.currentProficiency = curr;
      if (curr >= step.targetProficiency && step.status !== 'COMPLETED') {
        step.status = 'COMPLETED';
        step.completedAt = new Date();
      }
      await step.save();
    }

    // Recalculate progress & unlocks
    for (const step of steps) {
      if (step.status === 'LOCKED') {
        const prereqs = await RoadmapStep.find({
          _id: { $in: step.prerequisiteStepIds },
        });
        const allDone = prereqs.every(
          (p) => p.status === 'COMPLETED' || p.status === 'SKIPPED',
        );
        if (allDone) {
          step.status = 'AVAILABLE';
          await step.save();
        }
      }
    }

    const refreshedSteps = await RoadmapStep.find({ roadmapId: roadmap._id });
    const completedCount = refreshedSteps.filter(
      (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED',
    ).length;
    const progressPercentage = Math.round(
      (completedCount / refreshedSteps.length) * 100,
    );

    roadmap.completedSteps = completedCount;
    roadmap.progressPercentage = progressPercentage;
    if (completedCount === refreshedSteps.length) {
      roadmap.status = 'COMPLETED';
    }
    await roadmap.save();

    return this.getCurrentRoadmap(userId);
  }
}

export const roadmapsService = new RoadmapsService();
