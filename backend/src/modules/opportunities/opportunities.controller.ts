import { Request, Response, NextFunction } from 'express';
import { opportunitiesService } from './opportunities.service';
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';
import {
  ListOpportunitiesDto,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  VerifyOpportunityDto,
  AddRiskSignalDto,
} from './opportunities.validation';

/**
 * OPPORTUNITY-01: List Opportunities
 */
export async function getOpportunities(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListOpportunitiesDto;
    const result = await opportunitiesService.getOpportunities(query);
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * OPPORTUNITY-02: Get Opportunity
 */
export async function getOpportunityById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await opportunitiesService.getOpportunityById(
      req.params.opportunityId,
      req.user?.userId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * OPPORTUNITY-03: Create Opportunity
 */
export async function createOpportunity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateOpportunityDto;
    const data = await opportunitiesService.createOpportunity(
      req.user!.userId,
      req.user!.roles,
      dto,
    );
    sendCreated(res, data, 'Opportunity created');
  } catch (error) {
    next(error);
  }
}

/**
 * OPPORTUNITY-04: Update Opportunity
 */
export async function updateOpportunity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateOpportunityDto;
    const data = await opportunitiesService.updateOpportunity(
      req.user!.userId,
      req.user!.roles,
      req.params.opportunityId,
      dto,
    );
    sendSuccess(res, data, 'Opportunity updated');
  } catch (error) {
    next(error);
  }
}

/**
 * OPPORTUNITY-05: Delete Opportunity
 */
export async function deleteOpportunity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await opportunitiesService.deleteOpportunity(
      req.user!.userId,
      req.user!.roles,
      req.params.opportunityId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * OPPORTUNITY-06: Verify Opportunity
 */
export async function verifyOpportunity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as VerifyOpportunityDto;
    const data = await opportunitiesService.verifyOpportunity(
      req.user!.userId,
      req.params.opportunityId,
      dto,
    );
    sendSuccess(res, data, 'Opportunity verification status updated');
  } catch (error) {
    next(error);
  }
}

/**
 * OPPORTUNITY-07: Add Risk Signal
 */
export async function addRiskSignal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as AddRiskSignalDto;
    const data = await opportunitiesService.addRiskSignal(
      req.user!.userId,
      req.params.opportunityId,
      dto,
    );
    sendCreated(res, data, data.message);
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle Save Opportunity
 */
export async function toggleSaveOpportunity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await opportunitiesService.toggleSaveOpportunity(
      req.user!.userId,
      req.params.opportunityId,
    );
    sendSuccess(res, data, data.message);
  } catch (error) {
    next(error);
  }
}

/**
 * OPPORTUNITY-08: Get Student Saved Opportunities
 */
export async function getStudentSavedOpportunities(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await opportunitiesService.getStudentSavedOpportunities(
      req.user!.userId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
