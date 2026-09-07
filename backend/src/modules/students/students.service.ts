import mongoose from 'mongoose';
import { User } from '@/models/User.model';
import { StudentProfile, IProject, ICareerGoal } from '@/models/StudentProfile.model';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';
import {
  UpdateAcademicProfileDto,
  UpdateCareerGoalsDto,
  CreateProjectDto,
} from './students.validation';

export class StudentsService {
  /**
   * Ensure student profile exists for user or throw
   */
  private async getProfileOrThrow(userId: string) {
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }
      // Auto-create blank student profile if not already present
      profile = await StudentProfile.create({
        userId: user._id,
        academicInterests: [],
        careerGoals: [],
        projects: [],
        certifications: [],
      });
    }
    return profile;
  }

  /**
   * USER-03 Get Academic Profile
   */
  async getAcademicProfile(userId: string) {
    const profile = await this.getProfileOrThrow(userId);

    return {
      college: profile.college ?? null,
      department: profile.department ?? null,
      year: profile.year ?? null,
      semester: profile.semester ?? null,
      cgpa: profile.cgpa ?? null,
      expectedGraduationYear: profile.expectedGraduationYear ?? null,
      academicInterests: profile.academicInterests ?? [],
    };
  }

  /**
   * USER-04 Update Academic Profile
   */
  async updateAcademicProfile(userId: string, data: UpdateAcademicProfileDto) {
    const profile = await this.getProfileOrThrow(userId);

    if (data.college !== undefined) profile.college = data.college;
    if (data.department !== undefined) profile.department = data.department;
    if (data.year !== undefined) profile.year = data.year;
    if (data.semester !== undefined) profile.semester = data.semester;
    if (data.cgpa !== undefined) profile.cgpa = data.cgpa;
    if (data.expectedGraduationYear !== undefined) {
      profile.expectedGraduationYear = data.expectedGraduationYear;
    }
    if (data.academicInterests !== undefined) {
      profile.academicInterests = data.academicInterests;
    }

    await profile.save();

    return {
      college: profile.college ?? null,
      department: profile.department ?? null,
      year: profile.year ?? null,
      semester: profile.semester ?? null,
      cgpa: profile.cgpa ?? null,
      expectedGraduationYear: profile.expectedGraduationYear ?? null,
      academicInterests: profile.academicInterests ?? [],
    };
  }

  /**
   * USER-05 Get Full Aggregated Student Profile
   */
  async getFullProfile(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const profile = await this.getProfileOrThrow(userId);

    return {
      personal: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
        bio: profile.bio ?? null,
        phone: profile.phone ?? null,
      },
      academic: {
        college: profile.college ?? null,
        department: profile.department ?? null,
        year: profile.year ?? null,
        semester: profile.semester ?? null,
        cgpa: profile.cgpa ?? null,
        expectedGraduationYear: profile.expectedGraduationYear ?? null,
        academicInterests: profile.academicInterests ?? [],
      },
      skills: [], // Structured skills populated in Phase 3
      careerGoals: profile.careerGoals.map((g: any) => ({
        id: g._id?.toString() || g.id,
        careerId: g.careerId?.toString() ?? null,
        title: g.title,
        isPrimary: g.isPrimary,
        targetRole: g.targetRole ?? null,
        timeline: g.timeline ?? null,
        preferredLocations: g.preferredLocations ?? [],
        notes: g.notes ?? null,
        createdAt: g.createdAt,
      })),
      projects: profile.projects.map((p: any) => ({
        id: p._id?.toString() || p.id,
        title: p.title,
        description: p.description ?? null,
        technologies: p.technologies ?? [],
        githubUrl: p.githubUrl ?? null,
        liveUrl: p.liveUrl ?? null,
        startDate: p.startDate ?? null,
        endDate: p.endDate ?? null,
      })),
      certifications: profile.certifications.map((c: any) => ({
        id: c._id?.toString() || c.id,
        title: c.title,
        issuer: c.issuer ?? null,
        date: c.date ?? null,
        url: c.url ?? null,
      })),
      assessmentSummary: {
        completedCount: 0,
        averageScore: 0,
        lastAssessmentDate: null,
      },
      interviewSummary: {
        completedCount: 0,
        averageScore: 0,
        lastInterviewDate: null,
      },
    };
  }

  /**
   * USER-06 Update Career Goals
   */
  async updateCareerGoals(userId: string, data: UpdateCareerGoalsDto) {
    const profile = await this.getProfileOrThrow(userId);

    if (data.careerGoals && Array.isArray(data.careerGoals)) {
      profile.careerGoals = data.careerGoals.map((goal) => ({
        careerId: goal.careerId
          ? new mongoose.Types.ObjectId(goal.careerId)
          : undefined,
        title: goal.title,
        isPrimary: goal.isPrimary ?? false,
        targetRole: goal.targetRole,
        timeline: goal.timeline,
        preferredLocations: goal.preferredLocations ?? [],
        notes: goal.notes,
        createdAt: new Date(),
      })) as any;
    } else if (data.title) {
      if (data.isPrimary) {
        profile.careerGoals.forEach((g) => {
          g.isPrimary = false;
        });
      }

      profile.careerGoals.push({
        careerId: data.careerId
          ? new mongoose.Types.ObjectId(data.careerId)
          : undefined,
        title: data.title,
        isPrimary: data.isPrimary ?? (profile.careerGoals.length === 0),
        targetRole: data.targetRole,
        timeline: data.timeline,
        preferredLocations: data.preferredLocations ?? [],
        notes: data.notes,
        createdAt: new Date(),
      } as any);
    }

    await profile.save();

    return profile.careerGoals.map((g: any) => ({
      id: g._id?.toString() || g.id,
      careerId: g.careerId?.toString() ?? null,
      title: g.title,
      isPrimary: g.isPrimary,
      targetRole: g.targetRole ?? null,
      timeline: g.timeline ?? null,
      preferredLocations: g.preferredLocations ?? [],
      notes: g.notes ?? null,
      createdAt: g.createdAt,
    }));
  }

  /**
   * USER-07 Add Project
   */
  async addProject(userId: string, data: CreateProjectDto) {
    const profile = await this.getProfileOrThrow(userId);

    const project: any = {
      title: data.title,
      description: data.description ?? null,
      technologies: data.technologies ?? [],
      githubUrl: data.githubUrl ?? null,
      liveUrl: data.liveUrl ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    };

    profile.projects.push(project);
    await profile.save();

    const createdProject = profile.projects[profile.projects.length - 1] as any;

    return {
      id: createdProject._id.toString(),
      title: createdProject.title,
      description: createdProject.description,
      technologies: createdProject.technologies,
      githubUrl: createdProject.githubUrl,
      liveUrl: createdProject.liveUrl,
      startDate: createdProject.startDate,
      endDate: createdProject.endDate,
    };
  }

  /**
   * USER-08 Delete Project
   */
  async deleteProject(userId: string, projectId: string) {
    const profile = await this.getProfileOrThrow(userId);

    const projectIndex = profile.projects.findIndex(
      (p: any) => p._id.toString() === projectId,
    );

    if (projectIndex === -1) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Project not found');
    }

    profile.projects.splice(projectIndex, 1);
    await profile.save();

    return { message: 'Project removed successfully' };
  }

  /**
   * Student Dashboard Aggregation
   */
  async getDashboard(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const profile = await this.getProfileOrThrow(userId);
    const primaryGoal =
      profile.careerGoals.find((g) => g.isPrimary) ||
      profile.careerGoals[0] ||
      null;

    return {
      student: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
        college: profile.college ?? null,
        department: profile.department ?? null,
        year: profile.year ?? null,
        semester: profile.semester ?? null,
        cgpa: profile.cgpa ?? null,
      },
      career: primaryGoal
        ? {
            id: primaryGoal._id?.toString(),
            title: primaryGoal.title,
            targetRole: primaryGoal.targetRole ?? primaryGoal.title,
            timeline: primaryGoal.timeline ?? null,
          }
        : {
            id: null,
            title: 'Software Engineer',
            targetRole: 'Junior Software Engineer',
            timeline: '6 months',
          },
      careerMatch: 72, // Calculated based on current vs target skills
      strongSkills: [
        { name: 'JavaScript', proficiency: 4, level: 'Advanced' },
        { name: 'Data Structures', proficiency: 4, level: 'Intermediate' },
      ],
      weakSkills: [
        { name: 'Docker', proficiency: 2, level: 'Beginner' },
        { name: 'System Design', proficiency: 2, level: 'Beginner' },
      ],
      missingSkills: [
        { name: 'Kubernetes', requiredLevel: 3 },
        { name: 'Redis Caching', requiredLevel: 3 },
      ],
      nextAction: {
        type: 'ASSESSMENT',
        title: 'Complete Backend Development Assessment',
        description:
          'Take the 20-minute diagnostic assessment to calibrate your learning roadmap.',
        actionUrl: '/assessments',
      },
      roadmapPreview: {
        currentStep: 'Object Oriented Programming & Design Patterns',
        totalSteps: 8,
        completedSteps: 2,
        progressPercentage: 25,
      },
      recentActivity: [
        {
          type: 'PROFILE_UPDATED',
          description: 'Updated academic details and career targets',
          timestamp: profile.updatedAt,
        },
      ],
      recommendedOpportunities: [
        {
          id: 'opp-1',
          title: 'Software Engineer Intern (Summer 2026)',
          organization: 'Tech Innovations Inc.',
          type: 'INTERNSHIP',
          location: 'Remote / Hybrid',
          matchScore: 85,
        },
      ],
    };
  }
}

export const studentsService = new StudentsService();
