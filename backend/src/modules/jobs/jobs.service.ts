import mongoose from 'mongoose';
import { JobAnalysis, IJobAnalysis } from '@/models/JobAnalysis.model';
import { JobSkill } from '@/models/JobSkill.model';
import { Skill } from '@/models/Skill.model';
import { StudentSkill } from '@/models/StudentSkill.model';
import { Roadmap } from '@/models/Roadmap.model';
import { RoadmapStep } from '@/models/RoadmapStep.model';
import { Career } from '@/models/Career.model';
import { CareerGoal } from '@/models/CareerGoal.model';
import { AppError } from '@/common/errors/AppError';
import { UserRole } from '@/common/enums/roles.enum';
import { CreateJobAnalysisDto, ListJobAnalysesDto } from './jobs.validation';

export class JobsService {
  /**
   * JOB-01: Create Job Analysis
   */
  async createJobAnalysis(
    userId: string,
    dto: CreateJobAnalysisDto,
  ): Promise<IJobAnalysis> {
    const analysis = await JobAnalysis.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: dto.title,
      company: dto.company || null,
      source: dto.source || 'PASTED',
      rawDescription: dto.description,
      status: 'PENDING',
    });

    return analysis;
  }

  /**
   * JOB-02: Get Job Analysis by ID
   */
  async getJobAnalysisById(
    userId: string,
    roles: string[],
    analysisId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(analysisId)) {
      throw AppError.notFound(`Job analysis '${analysisId}' not found`);
    }

    const analysis = await JobAnalysis.findById(analysisId).lean();
    if (!analysis) {
      throw AppError.notFound(`Job analysis '${analysisId}' not found`);
    }

    const isOwner = analysis.userId.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isOwner && !isElevated) {
      throw AppError.forbidden('You do not have permission to view this job analysis');
    }

    const skills = await JobSkill.find({ jobAnalysisId: analysis._id })
      .populate('skillId', 'name slug category')
      .lean();

    const strong = skills.filter((s) => s.status === 'STRONG');
    const needsImprovement = skills.filter((s) => s.status === 'NEEDS_IMPROVEMENT');
    const missing = skills.filter((s) => s.status === 'MISSING');

    return {
      id: analysis._id.toString(),
      title: analysis.title,
      company: analysis.company,
      source: analysis.source,
      rawDescription: analysis.rawDescription,
      status: analysis.status,
      matchScore: analysis.matchScore,
      matchedSkillsCount: analysis.matchedSkillsCount,
      missingSkillsCount: analysis.missingSkillsCount,
      explanation: analysis.explanation,
      skills: {
        strong,
        needsImprovement,
        missing,
        all: skills,
      },
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    };
  }

  /**
   * JOB-03: List Student Job Analyses
   */
  async getStudentJobAnalyses(userId: string, query: ListJobAnalysesDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      JobAnalysis.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobAnalysis.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);

    return {
      items: items.map((a: any) => ({
        id: a._id.toString(),
        title: a.title,
        company: a.company,
        source: a.source,
        status: a.status,
        matchScore: a.matchScore,
        matchedSkillsCount: a.matchedSkillsCount,
        missingSkillsCount: a.missingSkillsCount,
        explanation: a.explanation,
        createdAt: a.createdAt,
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
   * JOB-04: Analyze Job (Deterministic keyword matching against skill graph)
   */
  async analyzeJob(userId: string, roles: string[], analysisId: string) {
    if (!mongoose.Types.ObjectId.isValid(analysisId)) {
      throw AppError.notFound(`Job analysis '${analysisId}' not found`);
    }

    const analysis = await JobAnalysis.findById(analysisId);
    if (!analysis) {
      throw AppError.notFound(`Job analysis '${analysisId}' not found`);
    }

    const isOwner = analysis.userId.toString() === userId;
    const isElevated = roles.some((r) =>
      [UserRole.ADMIN, UserRole.MODERATOR].includes(r as UserRole),
    );

    if (!isOwner && !isElevated) {
      throw AppError.forbidden('You do not have permission to analyze this job');
    }

    analysis.status = 'ANALYZING';
    await analysis.save();

    // 1. Fetch all active skills from the graph database
    const allSkills = await Skill.find({ isActive: true }).lean();

    // 2. Perform deterministic word-boundary keyword extraction
    const combinedText = `${analysis.title} ${analysis.rawDescription}`.toLowerCase();
    const matchedSkillsFromCatalog: any[] = [];

    for (const skill of allSkills) {
      const skillName = skill.name.toLowerCase();
      // Handle special characters like C++, C#, .NET
      const escaped = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');

      if (regex.test(combinedText)) {
        matchedSkillsFromCatalog.push(skill);
      }
    }

    // 3. Fetch student's skill proficiency state
    const studentSkills = await StudentSkill.find({
      userId: analysis.userId,
    }).lean();

    const studentSkillMap = new Map<string, number>();
    studentSkills.forEach((ss) => {
      studentSkillMap.set(ss.skillId.toString(), ss.proficiency);
    });

    // 4. Remove previous JobSkill entries for this analysis
    await JobSkill.deleteMany({ jobAnalysisId: analysis._id });

    // 5. Build JobSkill documents and compute match metrics
    let totalScore = 0;
    let matchedCount = 0;
    let missingCount = 0;

    const jobSkillsToInsert: any[] = [];

    for (const skill of matchedSkillsFromCatalog) {
      const proficiency = studentSkillMap.get(skill._id.toString()) || 0;
      let status: 'STRONG' | 'NEEDS_IMPROVEMENT' | 'MISSING' = 'MISSING';

      if (proficiency >= 3) {
        status = 'STRONG';
        matchedCount++;
        totalScore += (proficiency / 5) * 100;
      } else if (proficiency > 0) {
        status = 'NEEDS_IMPROVEMENT';
        matchedCount++;
        totalScore += (proficiency / 5) * 100;
      } else {
        status = 'MISSING';
        missingCount++;
      }

      jobSkillsToInsert.push({
        jobAnalysisId: analysis._id,
        skillId: skill._id,
        skillName: skill.name,
        importance: 'REQUIRED',
        studentProficiency: proficiency,
        status,
      });
    }

    if (jobSkillsToInsert.length > 0) {
      await JobSkill.insertMany(jobSkillsToInsert);
    }

    const totalDetected = matchedSkillsFromCatalog.length;
    const finalScore =
      totalDetected > 0 ? Math.round(totalScore / totalDetected) : 0;

    const strongCount = jobSkillsToInsert.filter((s) => s.status === 'STRONG').length;
    const needsImpCount = jobSkillsToInsert.filter(
      (s) => s.status === 'NEEDS_IMPROVEMENT',
    ).length;

    const explanation = totalDetected > 0
      ? `Deterministic keyword extraction detected ${totalDetected} skills. You have strong proficiency in ${strongCount} skill(s), ${needsImpCount} needing improvement, and ${missingCount} missing skill(s).`
      : 'No recognized platform skills were detected in the provided job description. You can manually adjust or select your target skills.';

    analysis.status = 'COMPLETED';
    analysis.matchScore = finalScore;
    analysis.matchedSkillsCount = matchedCount;
    analysis.missingSkillsCount = missingCount;
    analysis.explanation = explanation;
    await analysis.save();

    return this.getJobAnalysisById(userId, roles, analysis._id.toString());
  }

  /**
   * JOB-05: Add Job Skills to Roadmap
   */
  async addJobSkillsToRoadmap(
    userId: string,
    analysisId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(analysisId)) {
      throw AppError.notFound(`Job analysis '${analysisId}' not found`);
    }

    const analysis = await JobAnalysis.findById(analysisId);
    if (!analysis) {
      throw AppError.notFound(`Job analysis '${analysisId}' not found`);
    }

    if (analysis.userId.toString() !== userId) {
      throw AppError.forbidden('You can only add skills from your own job analyses');
    }

    // Fetch missing or improvement-needed skills
    const candidateSkills = await JobSkill.find({
      jobAnalysisId: analysis._id,
      status: { $in: ['MISSING', 'NEEDS_IMPROVEMENT'] },
      skillId: { $ne: null },
    }).lean();

    if (candidateSkills.length === 0) {
      return {
        message: 'No missing skills to add from this job analysis',
        addedSkillsCount: 0,
      };
    }

    // Find student's active roadmap
    let roadmap = await Roadmap.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'ACTIVE',
    });

    if (!roadmap) {
      // Look up student's primary career goal or active career
      let careerId: mongoose.Types.ObjectId;
      const primaryGoal = await CareerGoal.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        isPrimary: true,
      });
      if (primaryGoal) {
        careerId = primaryGoal.careerId;
      } else {
        const anyCareer = await Career.findOne({ isActive: true });
        careerId = anyCareer ? anyCareer._id : new mongoose.Types.ObjectId();
      }

      roadmap = await Roadmap.create({
        userId: new mongoose.Types.ObjectId(userId),
        careerId,
        targetRole: analysis.title || 'Software Engineer',
        version: 1,
        status: 'ACTIVE',
        totalSteps: 0,
        completedSteps: 0,
        progressPercentage: 0,
        generatedBy: 'RULE_BASED',
      });
    }

    // Find existing steps in roadmap to prevent duplicates
    const existingSteps = await RoadmapStep.find({ roadmapId: roadmap._id }).lean();
    const existingSkillIds = new Set(
      existingSteps.map((s) => s.skillId.toString()),
    );

    let nextOrder = existingSteps.length + 1;
    let addedCount = 0;

    for (const jobSkill of candidateSkills) {
      if (!existingSkillIds.has(jobSkill.skillId!.toString())) {
        await RoadmapStep.create({
          roadmapId: roadmap._id,
          userId: roadmap.userId,
          skillId: jobSkill.skillId,
          title: `Master ${jobSkill.skillName}`,
          description: `Acquire target competency for ${analysis.title} requirements`,
          stepOrder: nextOrder++,
          status: existingSteps.length === 0 && addedCount === 0 ? 'IN_PROGRESS' : 'LOCKED',
          estimatedHours: 12,
        });
        existingSkillIds.add(jobSkill.skillId!.toString());
        addedCount++;
      }
    }

    // Update total steps on roadmap
    const totalSteps = await RoadmapStep.countDocuments({ roadmapId: roadmap._id });
    const completedSteps = await RoadmapStep.countDocuments({
      roadmapId: roadmap._id,
      status: 'COMPLETED',
    });

    roadmap.totalSteps = totalSteps;
    roadmap.completedSteps = completedSteps;
    roadmap.progressPercentage =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    await roadmap.save();

    return {
      message: `Added ${addedCount} skill step(s) to your roadmap`,
      addedSkillsCount: addedCount,
      roadmapId: roadmap._id.toString(),
      totalRoadmapSteps: totalSteps,
    };
  }
}

export const jobsService = new JobsService();
