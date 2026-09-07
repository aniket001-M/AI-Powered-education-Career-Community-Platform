import { Request, Response, NextFunction } from 'express';
import { roadmapsService } from './roadmaps.service';
import { sendSuccess, sendCreated } from '@/common/responses/success';
import { GenerateRoadmapDto, UpdateStepStatusDto } from './roadmaps.validation';

/**
 * ROADMAP-01: Get Current Roadmap
 */
export async function getCurrentRoadmap(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await roadmapsService.getCurrentRoadmap(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ROADMAP-02: Generate/Rebuild Roadmap
 */
export async function generateRoadmap(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as GenerateRoadmapDto;
    const data = await roadmapsService.generateRoadmap(req.user!.userId, dto);
    sendCreated(res, data, 'Roadmap generated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * ROADMAP-03: Get Roadmap Step
 */
export async function getStepById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await roadmapsService.getStepById(
      req.user!.userId,
      req.params.stepId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ROADMAP-04: Update Step Status
 */
export async function updateStepStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateStepStatusDto;
    const data = await roadmapsService.updateStepStatus(
      req.user!.userId,
      req.params.stepId,
      dto,
    );
    sendSuccess(res, data, 'Step status updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * ROADMAP-05: Complete Learning Activity / Step
 */
export async function completeStep(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await roadmapsService.completeStep(
      req.user!.userId,
      req.params.stepId,
    );
    sendSuccess(res, data, 'Roadmap step marked as complete');
  } catch (error) {
    next(error);
  }
}

/**
 * ROADMAP-06: Roadmap History
 */
export async function getRoadmapHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await roadmapsService.getRoadmapHistory(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * ROADMAP-07: Recalculate Roadmap
 */
export async function recalculateRoadmap(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await roadmapsService.recalculateRoadmap(req.user!.userId);
    sendSuccess(res, data, 'Roadmap recalculated successfully');
  } catch (error) {
    next(error);
  }
}
