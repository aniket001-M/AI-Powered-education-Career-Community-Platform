import { Request, Response, NextFunction } from 'express';
import { jobsService } from './jobs.service';
import { semanticMatchingEngine } from './semantic-matching.interface';
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';
import { CreateJobAnalysisDto, ListJobAnalysesDto } from './jobs.validation';

/**
 * JOB-01: Create Job Analysis
 */
export async function createJobAnalysis(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateJobAnalysisDto;
    const data = await jobsService.createJobAnalysis(req.user!.userId, dto);
    sendCreated(res, data, 'Job description saved for analysis');
  } catch (error) {
    next(error);
  }
}

/**
 * JOB-02: Get Job Analysis
 */
export async function getJobAnalysisById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await jobsService.getJobAnalysisById(
      req.user!.userId,
      req.user!.roles,
      req.params.analysisId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * JOB-03: List Student Job Analyses
 */
export async function getStudentJobAnalyses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListJobAnalysesDto;
    const result = await jobsService.getStudentJobAnalyses(
      req.user!.userId,
      query,
    );
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * JOB-04: Analyze Job
 */
export async function analyzeJob(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await jobsService.analyzeJob(
      req.user!.userId,
      req.user!.roles,
      req.params.analysisId,
    );
    sendSuccess(res, data, 'Job analysis completed');
  } catch (error) {
    next(error);
  }
}

/**
 * JOB-05: Add Job Skills to Roadmap
 */
export async function addJobSkillsToRoadmap(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await jobsService.addJobSkillsToRoadmap(
      req.user!.userId,
      req.params.analysisId,
    );
    sendSuccess(res, data, data.message);
  } catch (error) {
    next(error);
  }
}

/**
 * Semantic Matching placeholder endpoint (Controlled AI_NOT_ENABLED)
 */
export async function semanticAnalyze(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { jobSkills, studentSkills } = req.body;
    const data = await semanticMatchingEngine.computeSemanticMatch(
      jobSkills,
      studentSkills,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
