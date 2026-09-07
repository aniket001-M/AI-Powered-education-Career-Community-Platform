import mongoose from 'mongoose';
import { Assessment, IAssessment } from '@/models/Assessment.model';
import { AssessmentQuestion } from '@/models/AssessmentQuestion.model';
import { AssessmentResult } from '@/models/AssessmentResult.model';
import { AssessmentAttempt } from '@/models/AssessmentAttempt.model';
import { Resource, IResource } from '@/models/Resource.model';
import { auditService } from '../audit/audit.service';
import {
  CreateFacultyAssessmentDto,
  CreateFacultyResourceDto,
  FacultyAnalyticsQueryDto,
} from './faculty.validation';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class FacultyService {
  /**
   * FACULTY-01: Faculty Dashboard metrics
   */
  async getDashboard(facultyUserId: string) {
    const facultyObjId = new mongoose.Types.ObjectId(facultyUserId);

    const [
      totalAssessments,
      facultyResources,
      totalSubmissions,
      uniqueStudentsAssessed,
      avgScoreResult,
    ] = await Promise.all([
      Assessment.countDocuments({ deletedAt: null }),
      Resource.countDocuments({ uploadedBy: facultyObjId, deletedAt: null }),
      AssessmentResult.countDocuments(),
      AssessmentAttempt.distinct('userId'),
      AssessmentResult.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$percentage' } } },
      ]),
    ]);

    const averageScore = avgScoreResult[0]?.avgScore
      ? Math.round(avgScoreResult[0].avgScore * 10) / 10
      : 0;

    return {
      totalAssessments,
      uploadedResources: facultyResources,
      totalSubmissions,
      uniqueStudentsAssessed: uniqueStudentsAssessed.length,
      averageScorePercentage: averageScore,
    };
  }

  /**
   * FACULTY-02: Create Assessment with optional questions
   */
  async createAssessment(
    facultyUserId: string,
    dto: CreateFacultyAssessmentDto,
  ): Promise<{ assessment: IAssessment; questionsCreated: number }> {
    let slug = slugify(dto.title);
    const existing = await Assessment.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const assessment = new Assessment({
      title: dto.title,
      slug,
      description: dto.description,
      category: dto.category,
      careerId: dto.careerId ? new mongoose.Types.ObjectId(dto.careerId) : null,
      skillId: dto.skillId ? new mongoose.Types.ObjectId(dto.skillId) : null,
      durationMinutes: dto.durationMinutes || 30,
      totalMarks: dto.totalMarks || 100,
      passingScore: dto.passingScore || 60,
      difficulty: dto.difficulty || 'INTERMEDIATE',
      isActive: true,
    });

    await assessment.save();

    let questionsCreated = 0;
    if (dto.questions && dto.questions.length > 0) {
      const questionDocs = dto.questions.map((q) => ({
        assessmentId: assessment._id,
        questionText: q.questionText,
        options: q.options,
        correctOptionId: q.correctOptionId,
        skillId: new mongoose.Types.ObjectId(q.skillId),
        topic: q.topic,
        difficulty: q.difficulty || 'MEDIUM',
        marks: q.marks || 1,
        explanation: q.explanation || null,
      }));

      await AssessmentQuestion.insertMany(questionDocs);
      questionsCreated = questionDocs.length;
    }

    await auditService.log({
      actorId: facultyUserId,
      actorRole: 'FACULTY',
      action: 'FACULTY_ASSESSMENT_CREATED',
      resourceType: 'Assessment',
      resourceId: assessment._id.toString(),
      details: { title: assessment.title, questionsCount: questionsCreated },
    });

    return { assessment, questionsCreated };
  }

  /**
   * FACULTY-03: Upload Academic Resource
   */
  async uploadResource(
    facultyUserId: string,
    dto: CreateFacultyResourceDto,
  ): Promise<IResource> {
    let slug = slugify(dto.title);
    const existing = await Resource.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const resource = new Resource({
      title: dto.title,
      slug,
      description: dto.description,
      type: dto.type,
      url: dto.url,
      skillId: dto.skillId ? new mongoose.Types.ObjectId(dto.skillId) : null,
      subject: dto.subject || null,
      college: dto.college || null,
      department: dto.department || null,
      difficulty: dto.difficulty || 'INTERMEDIATE',
      uploadedBy: new mongoose.Types.ObjectId(facultyUserId),
      verificationStatus: 'VERIFIED', // Faculty content is verified by default
      accessCount: 0,
      completionCount: 0,
      isActive: true,
    });

    await resource.save();

    await auditService.log({
      actorId: facultyUserId,
      actorRole: 'FACULTY',
      action: 'FACULTY_RESOURCE_UPLOADED',
      resourceType: 'Resource',
      resourceId: resource._id.toString(),
      details: { title: resource.title, type: resource.type },
    });

    return resource;
  }

  /**
   * FACULTY-04: Learning Analytics
   */
  async getAnalytics(facultyUserId: string, query: FacultyAnalyticsQueryDto) {
    const [
      passFailStats,
      performanceByAssessment,
      frequentWeakAreas,
    ] = await Promise.all([
      AssessmentResult.aggregate([
        {
          $group: {
            _id: '$passed',
            count: { $sum: 1 },
          },
        },
      ]),
      AssessmentResult.aggregate([
        {
          $group: {
            _id: '$assessmentId',
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: '$percentage' },
            passedCount: {
              $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] },
            },
          },
        },
        { $limit: 10 },
      ]),
      AssessmentResult.aggregate([
        { $unwind: '$weakAreas' },
        {
          $group: {
            _id: {
              skillName: '$weakAreas.skillName',
              topic: '$weakAreas.topic',
            },
            frequency: { $sum: 1 },
            avgPercentage: { $avg: '$weakAreas.percentage' },
          },
        },
        { $sort: { frequency: -1 } },
        { $limit: 10 },
      ]),
    ]);

    let passed = 0;
    let failed = 0;
    for (const s of passFailStats) {
      if (s._id === true) passed = s.count;
      if (s._id === false) failed = s.count;
    }

    return {
      overview: {
        totalEvaluated: passed + failed,
        passed,
        failed,
        passRate: passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0,
      },
      assessmentBreakdown: performanceByAssessment.map((item) => ({
        assessmentId: item._id,
        totalAttempts: item.totalAttempts,
        avgScore: Math.round(item.avgScore * 10) / 10,
        passRate: Math.round((item.passedCount / item.totalAttempts) * 100),
      })),
      commonGapsAndWeakTopics: frequentWeakAreas.map((w) => ({
        skill: w._id.skillName,
        topic: w._id.topic,
        studentCountEncountered: w.frequency,
        averageScore: Math.round(w.avgPercentage * 10) / 10,
      })),
    };
  }
}

export const facultyService = new FacultyService();
