import { Request, Response, NextFunction } from 'express';
import { skillsService } from './skills.service';
import { sendSuccess, sendPaginated } from '@/common/responses/success';
import { ListSkillsDto, UpdateStudentSkillDto } from './skills.validation';

/**
 * SKILL-01: List Skills
 */
export async function getSkills(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.query as unknown as ListSkillsDto;
    const result = await skillsService.getSkills(dto);
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * SKILL-02: Get Skill
 */
export async function getSkillById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await skillsService.getSkillById(req.params.skillId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SKILL-03: Get Skill Children
 */
export async function getSkillChildren(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await skillsService.getSkillChildren(req.params.skillId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SKILL-04: Get Skill Graph
 */
export async function getSkillGraph(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await skillsService.getSkillGraph();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SKILL-05: Get Student Skills
 */
export async function getStudentSkills(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await skillsService.getStudentSkills(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SKILL-06: Update Student Skill
 */
export async function updateStudentSkill(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateStudentSkillDto;
    const data = await skillsService.updateStudentSkill(
      req.user!.userId,
      req.params.skillId,
      dto,
    );
    sendSuccess(res, data, 'Skill updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * SKILL-07: Get Student Skill History
 */
export async function getStudentSkillHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await skillsService.getStudentSkillHistory(
      req.user!.userId,
      req.params.skillId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SKILL-08: Get Skill Gaps
 */
export async function getStudentSkillGaps(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const career = req.query.career as string | undefined;
    const data = await skillsService.getStudentSkillGaps(
      req.user!.userId,
      career,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
