import { Request, Response, NextFunction } from 'express';
import { assessmentsService } from './assessments.service';
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';
import { ListAssessmentsDto, SaveAnswerDto } from './assessments.validation';

/**
 * ASSESS-01: List Assessments
 */
export async function getAssessments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.query as unknown as ListAssessmentsDto;
    const result = await assessmentsService.getAssessments(dto);
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-02: Get Assessment details
 */
export async function getAssessmentById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.getAssessmentById(req.params.assessmentId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-03: Get Assessment Questions
 */
export async function getAssessmentQuestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.getAssessmentQuestions(req.params.assessmentId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-04: Start Attempt
 */
export async function startAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.startAttempt(
      req.user!.userId,
      req.params.assessmentId,
    );
    sendCreated(res, data, 'Assessment attempt started');
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-05: Get Attempt
 */
export async function getAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.getAttempt(
      req.user!.userId,
      req.params.attemptId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-06: Save Answer
 */
export async function saveAnswer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as SaveAnswerDto;
    const data = await assessmentsService.saveAnswer(
      req.user!.userId,
      req.params.attemptId,
      dto,
    );
    sendSuccess(res, data, 'Answer saved');
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-07: Submit Attempt
 */
export async function submitAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.submitAttempt(
      req.user!.userId,
      req.params.attemptId,
    );
    sendSuccess(res, data, 'Assessment attempt submitted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-08: Get Attempt Result
 */
export async function getAttemptResult(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.getAttemptResult(
      req.user!.userId,
      req.params.attemptId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-09: Student Assessment History
 */
export async function getStudentAssessments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.getStudentAssessments(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ASSESS-10: Student Weak Areas
 */
export async function getStudentWeakAreas(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await assessmentsService.getStudentWeakAreas(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
