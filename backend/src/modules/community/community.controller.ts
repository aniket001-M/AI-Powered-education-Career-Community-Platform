import { Request, Response, NextFunction } from 'express';
import { communityService } from './community.service';
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';
import {
  ListPostsDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  ReportPostDto,
} from './community.validation';

/**
 * COMMUNITY-01: List Posts
 */
export async function getPosts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListPostsDto;
    const result = await communityService.getPosts(query);
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-02: Get Post
 */
export async function getPostById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await communityService.getPostById(
      req.params.postId,
      req.user?.userId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-03: Create Post
 */
export async function createPost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreatePostDto;
    const data = await communityService.createPost(req.user!.userId, dto);
    sendCreated(res, data, 'Community post created');
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-04: Update Post
 */
export async function updatePost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as UpdatePostDto;
    const data = await communityService.updatePost(
      req.user!.userId,
      req.user!.roles,
      req.params.postId,
      dto,
    );
    sendSuccess(res, data, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-05: Delete Post
 */
export async function deletePost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await communityService.deletePost(
      req.user!.userId,
      req.user!.roles,
      req.params.postId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-06: Add Comment
 */
export async function addComment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateCommentDto;
    const data = await communityService.addComment(
      req.user!.userId,
      req.params.postId,
      dto,
    );
    sendCreated(res, data, 'Comment added');
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-07: List Comments
 */
export async function getComments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await communityService.getComments(req.params.postId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-08: Like/Unlike Post
 */
export async function toggleLike(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await communityService.toggleLike(
      req.user!.userId,
      req.params.postId,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-09: Report Post
 */
export async function reportPost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as ReportPostDto;
    const data = await communityService.reportPost(
      req.user!.userId,
      req.params.postId,
      dto,
    );
    sendCreated(res, data, data.message);
  } catch (error) {
    next(error);
  }
}

/**
 * COMMUNITY-10: Similar Discussions
 */
export async function getSimilarPosts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await communityService.getSimilarPosts(req.params.postId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
