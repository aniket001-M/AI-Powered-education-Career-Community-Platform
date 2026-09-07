import { Request, Response, NextFunction } from 'express';
import { studentsService } from './students.service';
import { sendSuccess, sendCreated } from '@/common/responses/success';
import {
  UpdateAcademicProfileDto,
  UpdateCareerGoalsDto,
  CreateProjectDto,
} from './students.validation';

/**
 * USER-03: Get Academic Profile
 */
export async function getAcademic(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await studentsService.getAcademicProfile(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * USER-04: Update Academic Profile
 */
export async function updateAcademic(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateAcademicProfileDto;
    const data = await studentsService.updateAcademicProfile(req.user!.userId, dto);
    sendSuccess(res, data, 'Academic profile updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * USER-05: Get Full Aggregated Student Profile
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await studentsService.getFullProfile(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * USER-06: Update Career Goals
 */
export async function updateCareerGoals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateCareerGoalsDto;
    const data = await studentsService.updateCareerGoals(req.user!.userId, dto);
    sendSuccess(res, data, 'Career goals updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * USER-07: Add Project
 */
export async function addProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateProjectDto;
    const data = await studentsService.addProject(req.user!.userId, dto);
    sendCreated(res, data, 'Project added successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * USER-08: Delete Project
 */
export async function deleteProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await studentsService.deleteProject(
      req.user!.userId,
      req.params.projectId,
    );
    sendSuccess(res, data, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get Student Dashboard
 */
export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await studentsService.getDashboard(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
