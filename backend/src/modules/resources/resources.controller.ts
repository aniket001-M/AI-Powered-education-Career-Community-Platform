import { Request, Response, NextFunction } from 'express';
import { resourcesService } from './resources.service';
import { knowledgeRetrievalEngine } from './knowledge-retrieval.interface';
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';
import {
  ListResourcesDto,
  CreateResourceDto,
  UpdateResourceDto,
} from './resources.validation';

/**
 * RESOURCE-01: List Resources
 */
export async function getResources(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.query as unknown as ListResourcesDto;
    const result = await resourcesService.getResources(dto);
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * RESOURCE-02: Get Resource
 */
export async function getResourceById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await resourcesService.getResourceById(req.params.resourceId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * RESOURCE-03: Create Resource
 */
export async function createResource(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateResourceDto;
    const data = await resourcesService.createResource(
      req.user!.userId,
      req.user!.roles,
      dto,
    );
    sendCreated(res, data, 'Resource created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * RESOURCE-04: Update Resource
 */
export async function updateResource(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdateResourceDto;
    const data = await resourcesService.updateResource(
      req.user!.userId,
      req.user!.roles,
      req.params.resourceId,
      dto,
    );
    sendSuccess(res, data, 'Resource updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * RESOURCE-05: Delete Resource
 */
export async function deleteResource(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await resourcesService.deleteResource(
      req.user!.userId,
      req.user!.roles,
      req.params.resourceId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * RESOURCE-06: Track Resource Access
 */
export async function trackAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await resourcesService.trackAccess(
      req.user!.userId,
      req.params.resourceId,
    );
    sendSuccess(res, data, 'Resource access recorded');
  } catch (error) {
    next(error);
  }
}

/**
 * RESOURCE-07: Mark Resource Complete
 */
export async function markComplete(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await resourcesService.markComplete(
      req.user!.userId,
      req.params.resourceId,
    );
    sendSuccess(res, data, 'Resource marked as complete');
  } catch (error) {
    next(error);
  }
}

/**
 * RESOURCE-08: Get Student Resource History
 */
export async function getStudentHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await resourcesService.getStudentHistory(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * Controlled AI/RAG query endpoints
 */
export async function searchKnowledge(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await knowledgeRetrievalEngine.searchKnowledge(req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function askKnowledge(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { query, contextDocuments } = req.body;
    const data = await knowledgeRetrievalEngine.generateGroundedAnswer(
      query,
      contextDocuments,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
