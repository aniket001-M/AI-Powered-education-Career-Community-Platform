import { Request, Response, NextFunction } from 'express';
import { careersService } from './careers.service';
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';
import { ListCareersDto, SelectCareerGoalDto } from './careers.validation';

/**
 * CAREER-01: List Careers
 */
export async function getCareers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.query as unknown as ListCareersDto;
    const result = await careersService.getCareers(dto);
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * CAREER-02: Get Career
 */
export async function getCareerById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await careersService.getCareerById(req.params.careerId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * CAREER-03: Get Career Skills
 */
export async function getCareerSkills(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await careersService.getCareerSkills(req.params.careerId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * CAREER-04: Get Career Skill Graph
 */
export async function getCareerSkillGraph(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await careersService.getCareerSkillGraph(req.params.careerId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * CAREER-05: Select Student Career
 */
export async function selectStudentCareer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as SelectCareerGoalDto;
    const data = await careersService.selectStudentCareer(req.user!.userId, dto);
    sendCreated(res, data, 'Career goal added successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * CAREER-07: Get Student Career Goals
 */
export async function getStudentCareerGoals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await careersService.getStudentCareerGoals(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * CAREER-06: Remove Student Career Goal
 */
export async function removeStudentCareerGoal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await careersService.removeStudentCareerGoal(
      req.user!.userId,
      req.params.careerGoalId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
