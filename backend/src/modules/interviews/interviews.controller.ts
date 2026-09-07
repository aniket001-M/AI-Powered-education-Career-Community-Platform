import { Request, Response, NextFunction } from 'express';
import { interviewsService } from './interviews.service';
import { sendSuccess, sendCreated } from '@/common/responses/success';
import { StartInterviewDto, SubmitAnswerDto } from './interviews.validation';

/**
 * INTERVIEW-01: List Interview Roles
 */
export async function getAvailableRoles(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await interviewsService.getAvailableRoles();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * INTERVIEW-02: Start Interview
 */
export async function startInterview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as StartInterviewDto;
    const data = await interviewsService.startInterview(req.user!.userId, dto);
    sendCreated(res, data, 'Interview session started');
  } catch (error) {
    next(error);
  }
}

/**
 * INTERVIEW-03: Get Interview Session
 */
export async function getInterviewSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await interviewsService.getInterviewSession(
      req.user!.userId,
      req.params.interviewId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * INTERVIEW-04: Submit Answer
 */
export async function submitAnswer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as SubmitAnswerDto;
    const data = await interviewsService.submitAnswer(
      req.user!.userId,
      req.params.interviewId,
      dto,
    );
    sendSuccess(res, data, 'Answer submitted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * INTERVIEW-05: Complete Interview
 */
export async function completeInterview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await interviewsService.completeInterview(
      req.user!.userId,
      req.params.interviewId,
    );
    sendSuccess(res, data, data.message);
  } catch (error) {
    next(error);
  }
}

/**
 * INTERVIEW-06: Get Interview Result
 */
export async function getInterviewResult(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await interviewsService.getInterviewResult(
      req.user!.userId,
      req.params.interviewId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * INTERVIEW-07: Student Interview History
 */
export async function getStudentInterviewHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await interviewsService.getStudentInterviewHistory(
      req.user!.userId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
