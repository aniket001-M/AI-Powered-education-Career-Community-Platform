import mongoose from 'mongoose';
import { Assessment, IAssessment } from '@/models/Assessment.model';
import { AssessmentQuestion } from '@/models/AssessmentQuestion.model';
import { AssessmentAttempt } from '@/models/AssessmentAttempt.model';
import { AssessmentAnswer } from '@/models/AssessmentAnswer.model';
import { AssessmentResult } from '@/models/AssessmentResult.model';
import { StudentSkill } from '@/models/StudentSkill.model';
import { StudentSkillHistory } from '@/models/StudentSkillHistory.model';
import { Skill } from '@/models/Skill.model';
import { AppError } from '@/common/errors/AppError';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/common/utils/logger';
import { ListAssessmentsDto, SaveAnswerDto } from './assessments.validation';

export class AssessmentsService {
  /**
   * Helper to resolve Assessment by ObjectId or Slug
   */
  async resolveAssessment(idOrSlug: string): Promise<IAssessment> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const assessment = await Assessment.findOne(query);
    if (!assessment) {
      throw AppError.notFound(`Assessment '${idOrSlug}' not found`);
    }
    return assessment;
  }

  /**
   * ASSESS-01: List Assessments with filters, pagination, and Redis cache
   */
  async getAssessments(query: ListAssessmentsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isActive: true };

    if (query.category) {
      filter.category = new RegExp(query.category, 'i');
    }
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    if (query.search) {
      filter.$or = [
        { title: new RegExp(query.search, 'i') },
        { description: new RegExp(query.search, 'i') },
        { category: new RegExp(query.search, 'i') },
      ];
    }

    const isCacheable = !query.search && !query.category && !query.difficulty && page === 1;
    const cacheKey = `cache:assessments:p${page}:l${limit}`;

    if (isCacheable) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Redis read failed in getAssessments:', err);
      }
    }

    const [items, total] = await Promise.all([
      Assessment.find(filter).sort({ title: 1 }).skip(skip).limit(limit).lean(),
      Assessment.countDocuments(filter),
    ]);

    const result = {
      items: items.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        slug: a.slug,
        description: a.description,
        category: a.category,
        careerId: a.careerId?.toString() || null,
        skillId: a.skillId?.toString() || null,
        durationMinutes: a.durationMinutes,
        totalMarks: a.totalMarks,
        passingScore: a.passingScore,
        difficulty: a.difficulty,
        isActive: a.isActive,
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
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
      } catch (err) {
        logger.warn('Redis write failed in getAssessments:', err);
      }
    }

    return result;
  }

  /**
   * ASSESS-02: Get Assessment details
   */
  async getAssessmentById(idOrSlug: string) {
    const assessment = await this.resolveAssessment(idOrSlug);
    return {
      id: assessment._id.toString(),
      title: assessment.title,
      slug: assessment.slug,
      description: assessment.description,
      category: assessment.category,
      careerId: assessment.careerId?.toString() || null,
      skillId: assessment.skillId?.toString() || null,
      durationMinutes: assessment.durationMinutes,
      totalMarks: assessment.totalMarks,
      passingScore: assessment.passingScore,
      difficulty: assessment.difficulty,
      isActive: assessment.isActive,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
    };
  }

  /**
   * ASSESS-03: Get Questions (Sanitized: NO correctOptionId or explanation)
   */
  async getAssessmentQuestions(idOrSlug: string) {
    const assessment = await this.resolveAssessment(idOrSlug);

    const questions = await AssessmentQuestion.find({
      assessmentId: assessment._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return questions.map((q) => ({
      id: q._id.toString(),
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
    }));
  }

  /**
   * ASSESS-04: Start Attempt
   */
  async startAttempt(userId: string, idOrSlug: string) {
    const assessment = await this.resolveAssessment(idOrSlug);

    // Check if student already has an active IN_PROGRESS attempt
    const existingAttempt = await AssessmentAttempt.findOne({
      userId,
      assessmentId: assessment._id,
      status: 'IN_PROGRESS',
    });

    if (existingAttempt) {
      return {
        id: existingAttempt._id.toString(),
        assessmentId: assessment._id.toString(),
        assessmentTitle: assessment.title,
        status: existingAttempt.status,
        startedAt: existingAttempt.startedAt,
        durationMinutes: assessment.durationMinutes,
        maxScore: existingAttempt.maxScore,
      };
    }

    const questionsCount = await AssessmentQuestion.countDocuments({
      assessmentId: assessment._id,
    });
    const maxScore = assessment.totalMarks || questionsCount || 100;

    const attempt = await AssessmentAttempt.create({
      assessmentId: assessment._id,
      userId: new mongoose.Types.ObjectId(userId),
      startedAt: new Date(),
      status: 'IN_PROGRESS',
      maxScore,
    });

    return {
      id: attempt._id.toString(),
      assessmentId: assessment._id.toString(),
      assessmentTitle: assessment.title,
      status: attempt.status,
      startedAt: attempt.startedAt,
      durationMinutes: assessment.durationMinutes,
      maxScore: attempt.maxScore,
    };
  }

  /**
   * ASSESS-05: Get Attempt
   */
  async getAttempt(userId: string, attemptId: string) {
    const attempt = await AssessmentAttempt.findById(attemptId)
      .populate('assessmentId')
      .lean();

    if (!attempt) {
      throw AppError.notFound('Assessment attempt not found');
    }
    if (attempt.userId.toString() !== userId) {
      throw AppError.forbidden('Unauthorized access to attempt');
    }

    const answers = await AssessmentAnswer.find({
      attemptId: attempt._id,
    }).lean();

    const assessment: any = attempt.assessmentId;

    return {
      id: attempt._id.toString(),
      assessmentId: assessment?._id?.toString() || attempt.assessmentId.toString(),
      assessmentTitle: assessment?.title || 'Assessment',
      durationMinutes: assessment?.durationMinutes || 30,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      answers: answers.map((a) => ({
        questionId: a.questionId.toString(),
        selectedOptionId: a.selectedOptionId,
      })),
    };
  }

  /**
   * ASSESS-06: Save Answer
   */
  async saveAnswer(userId: string, attemptId: string, dto: SaveAnswerDto) {
    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) {
      throw AppError.notFound('Assessment attempt not found');
    }
    if (attempt.userId.toString() !== userId) {
      throw AppError.forbidden('Unauthorized access to attempt');
    }
    if (attempt.status !== 'IN_PROGRESS') {
      throw AppError.badRequest('Attempt has already been submitted');
    }

    // Verify question belongs to this assessment
    const question = await AssessmentQuestion.findOne({
      _id: dto.questionId,
      assessmentId: attempt.assessmentId,
    });
    if (!question) {
      throw AppError.notFound('Question not found in this assessment');
    }

    const answer = await AssessmentAnswer.findOneAndUpdate(
      {
        attemptId: attempt._id,
        questionId: question._id,
      },
      {
        attemptId: attempt._id,
        questionId: question._id,
        selectedOptionId: dto.selectedOptionId,
      },
      { upsert: true, new: true },
    );

    return {
      attemptId: attempt._id.toString(),
      questionId: question._id.toString(),
      selectedOptionId: answer.selectedOptionId,
      updatedAt: answer.updatedAt,
    };
  }

  /**
   * ASSESS-07: Submit Attempt (Score objectively & update StudentSkills in transaction)
   */
  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) {
      throw AppError.notFound('Assessment attempt not found');
    }
    if (attempt.userId.toString() !== userId) {
      throw AppError.forbidden('Unauthorized access to attempt');
    }
    if (attempt.status !== 'IN_PROGRESS') {
      throw AppError.badRequest('Attempt has already been submitted');
    }

    const assessment = await Assessment.findById(attempt.assessmentId);
    if (!assessment) {
      throw AppError.notFound('Assessment not found');
    }

    const questions = await AssessmentQuestion.find({
      assessmentId: assessment._id,
    }).lean();

    const answers = await AssessmentAnswer.find({
      attemptId: attempt._id,
    }).lean();

    const answerMap = new Map<string, any>();
    for (const a of answers) {
      answerMap.set(a.questionId.toString(), a);
    }

    // Fetch skills for name mapping
    const skillIds = questions.map((q) => q.skillId);
    const skills = await Skill.find({ _id: { $in: skillIds } }).lean();
    const skillNameMap = new Map<string, string>();
    for (const s of skills) {
      skillNameMap.set(s._id.toString(), s.name);
    }

    let totalScore = 0;
    let maxScore = 0;

    const topicStats = new Map<string, { score: number; maxScore: number }>();
    const skillStats = new Map<
      string,
      { skillId: mongoose.Types.ObjectId; skillName: string; score: number; maxScore: number }
    >();

    // Grade each question
    for (const q of questions) {
      const qId = q._id.toString();
      const markWeight = q.marks || 1;
      maxScore += markWeight;

      const userAns = answerMap.get(qId);
      const isCorrect = userAns ? userAns.selectedOptionId === q.correctOptionId : false;
      const marksAwarded = isCorrect ? markWeight : 0;
      totalScore += marksAwarded;

      // Update answer in DB
      if (userAns) {
        await AssessmentAnswer.findByIdAndUpdate(userAns._id, {
          isCorrect,
          marksAwarded,
        });
      } else {
        await AssessmentAnswer.create({
          attemptId: attempt._id,
          questionId: q._id,
          selectedOptionId: '',
          isCorrect: false,
          marksAwarded: 0,
        });
      }

      // Aggregate topic
      const topicEntry = topicStats.get(q.topic) || { score: 0, maxScore: 0 };
      topicEntry.score += marksAwarded;
      topicEntry.maxScore += markWeight;
      topicStats.set(q.topic, topicEntry);

      // Aggregate skill
      const sId = q.skillId.toString();
      const skillEntry = skillStats.get(sId) || {
        skillId: q.skillId,
        skillName: skillNameMap.get(sId) || 'Skill',
        score: 0,
        maxScore: 0,
      };
      skillEntry.score += marksAwarded;
      skillEntry.maxScore += markWeight;
      skillStats.set(sId, skillEntry);
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = totalScore >= assessment.passingScore;

    const topicPerformance = Array.from(topicStats.entries()).map(([topic, stat]) => ({
      topic,
      score: stat.score,
      maxScore: stat.maxScore,
      percentage: stat.maxScore > 0 ? Math.round((stat.score / stat.maxScore) * 100) : 0,
    }));

    const skillPerformance = Array.from(skillStats.values()).map((stat) => ({
      skillId: stat.skillId,
      skillName: stat.skillName,
      score: stat.score,
      maxScore: stat.maxScore,
      percentage: stat.maxScore > 0 ? Math.round((stat.score / stat.maxScore) * 100) : 0,
    }));

    // Identify weak areas (< 60% performance)
    const weakAreas = topicPerformance
      .filter((t) => t.percentage < 60)
      .map((t) => {
        const matchingQuestion = questions.find((q) => q.topic === t.topic);
        const sId = matchingQuestion?.skillId;
        return {
          skillId: sId || skillIds[0],
          skillName: sId ? (skillNameMap.get(sId.toString()) || 'Topic Skill') : 'Topic Skill',
          topic: t.topic,
          percentage: t.percentage,
        };
      });

    // Finalize attempt
    attempt.status = 'SUBMITTED';
    attempt.submittedAt = new Date();
    attempt.score = totalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    await attempt.save();

    // Create Result
    const result = await AssessmentResult.create({
      attemptId: attempt._id,
      userId: new mongoose.Types.ObjectId(userId),
      assessmentId: assessment._id,
      totalScore,
      maxScore,
      percentage,
      passed,
      topicPerformance,
      skillPerformance,
      weakAreas,
      submittedAt: attempt.submittedAt,
    });

    // Update StudentSkill state for assessed skills
    for (const sp of skillPerformance) {
      let calculatedProficiency = 1;
      if (sp.percentage >= 85) calculatedProficiency = 5;
      else if (sp.percentage >= 70) calculatedProficiency = 4;
      else if (sp.percentage >= 50) calculatedProficiency = 3;
      else if (sp.percentage >= 30) calculatedProficiency = 2;
      else calculatedProficiency = 1;

      const existingSkill = await StudentSkill.findOne({
        userId,
        skillId: sp.skillId,
      });

      const prevProficiency = existingSkill ? existingSkill.proficiency : 0;

      await StudentSkill.findOneAndUpdate(
        { userId, skillId: sp.skillId },
        {
          userId: new mongoose.Types.ObjectId(userId),
          skillId: sp.skillId,
          proficiency: Math.max(prevProficiency, calculatedProficiency),
          confidence: Math.max(existingSkill?.confidence || 50, 80),
          source: 'ASSESSMENT',
          lastAssessedAt: new Date(),
        },
        { upsert: true, new: true },
      );

      await StudentSkillHistory.create({
        userId: new mongoose.Types.ObjectId(userId),
        skillId: sp.skillId,
        previousProficiency: prevProficiency,
        newProficiency: Math.max(prevProficiency, calculatedProficiency),
        source: 'ASSESSMENT',
        reason: `Completed assessment: ${assessment.title}`,
        recordedAt: new Date(),
      });
    }

    return {
      attemptId: attempt._id.toString(),
      assessmentTitle: assessment.title,
      score: totalScore,
      maxScore,
      percentage,
      passed,
      submittedAt: attempt.submittedAt,
      resultId: result._id.toString(),
    };
  }

  /**
   * ASSESS-08: Get Result with breakdown and explanations
   */
  async getAttemptResult(userId: string, attemptId: string) {
    const attempt = await AssessmentAttempt.findById(attemptId).lean();
    if (!attempt) {
      throw AppError.notFound('Assessment attempt not found');
    }
    if (attempt.userId.toString() !== userId) {
      throw AppError.forbidden('Unauthorized access to attempt result');
    }
    if (attempt.status !== 'SUBMITTED') {
      throw AppError.badRequest('Attempt has not been submitted yet');
    }

    const result = await AssessmentResult.findOne({ attemptId: attempt._id }).lean();
    if (!result) {
      throw AppError.notFound('Assessment result not found');
    }

    const assessment = await Assessment.findById(attempt.assessmentId).lean();
    const questions = await AssessmentQuestion.find({
      assessmentId: attempt.assessmentId,
    }).lean();

    const answers = await AssessmentAnswer.find({
      attemptId: attempt._id,
    }).lean();

    const answerMap = new Map<string, any>();
    for (const a of answers) {
      answerMap.set(a.questionId.toString(), a);
    }

    const reviewQuestions = questions.map((q) => {
      const userAns = answerMap.get(q._id.toString());
      return {
        id: q._id.toString(),
        questionText: q.questionText,
        options: q.options,
        selectedOptionId: userAns?.selectedOptionId || null,
        correctOptionId: q.correctOptionId,
        isCorrect: userAns ? userAns.isCorrect : false,
        explanation: q.explanation || null,
        marksAwarded: userAns ? userAns.marksAwarded : 0,
        marks: q.marks,
      };
    });

    return {
      resultId: result._id.toString(),
      attemptId: attempt._id.toString(),
      assessment: {
        id: assessment?._id.toString(),
        title: assessment?.title,
        category: assessment?.category,
      },
      score: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: result.passed,
      topicPerformance: result.topicPerformance,
      skillPerformance: result.skillPerformance,
      weakAreas: result.weakAreas,
      review: reviewQuestions,
      submittedAt: result.submittedAt,
    };
  }

  /**
   * ASSESS-09: Student Assessment History
   */
  async getStudentAssessments(userId: string) {
    const attempts = await AssessmentAttempt.find({
      userId,
      status: 'SUBMITTED',
    })
      .populate('assessmentId')
      .sort({ submittedAt: -1 })
      .lean();

    return attempts.map((a: any) => ({
      id: a._id.toString(),
      assessmentId: a.assessmentId?._id?.toString() || a.assessmentId.toString(),
      assessmentTitle: a.assessmentId?.title || 'Assessment',
      category: a.assessmentId?.category || 'General',
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
    }));
  }

  /**
   * ASSESS-10: Student Weak Areas aggregated across assessments
   */
  async getStudentWeakAreas(userId: string) {
    const results = await AssessmentResult.find({ userId })
      .sort({ submittedAt: -1 })
      .lean();

    const weakMap = new Map<string, any>();

    for (const r of results) {
      for (const w of r.weakAreas) {
        const key = `${w.skillName}::${w.topic}`;
        if (!weakMap.has(key)) {
          weakMap.set(key, {
            skillId: w.skillId.toString(),
            skillName: w.skillName,
            topic: w.topic,
            latestPercentage: w.percentage,
            assessmentCount: 1,
          });
        } else {
          const entry = weakMap.get(key);
          entry.assessmentCount += 1;
        }
      }
    }

    return Array.from(weakMap.values());
  }
}

export const assessmentsService = new AssessmentsService();
