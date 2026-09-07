import { Request, Response, NextFunction } from 'express';
import { seniorsService } from './seniors.service';
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';
import {
  ListSeniorExperiencesDto,
  CreateSeniorExperienceDto,
  UpdateSeniorExperienceDto,
  VerifySeniorExperienceDto,
} from './seniors.validation';

/**
 * SENIOR-01: List Experiences
 */
export async function getExperiences(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListSeniorExperiencesDto;
    const result = await seniorsService.getExperiences(query);
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * SENIOR-02: Get Experience
 */
export async function getExperienceById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await seniorsService.getExperienceById(req.params.experienceId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SENIOR-03: Create Experience
 */
export async function createExperience(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateSeniorExperienceDto;
    const data = await seniorsService.createExperience(
      req.user!.userId,
      req.user!.roles,
      dto,
    );
    sendCreated(res, data, 'Senior experience created');
  } catch (error) {
    next(error);
  }
}

/**
 * SENIOR-04: Update Experience
 */
export async function updateExperience(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateSeniorExperienceDto;
    const data = await seniorsService.updateExperience(
      req.user!.userId,
      req.user!.roles,
      req.params.experienceId,
      dto,
    );
    sendSuccess(res, data, 'Senior experience updated');
  } catch (error) {
    next(error);
  }
}

/**
 * SENIOR-05: Delete Experience
 */
export async function deleteExperience(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await seniorsService.deleteExperience(
      req.user!.userId,
      req.user!.roles,
      req.params.experienceId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * SENIOR-06: Verify Experience
 */
export async function verifyExperience(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as VerifySeniorExperienceDto;
    const data = await seniorsService.verifyExperience(
      req.user!.userId,
      req.params.experienceId,
      dto,
    );
    sendSuccess(res, data, 'Experience verification status updated');
  } catch (error) {
    next(error);
  }
}
