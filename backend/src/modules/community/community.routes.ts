import { Router } from 'express';
import * as controller from './community.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import {
  ListPostsDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  ReportPostDto,
} from './community.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Peer discussions, Q&A, college threads, comments, likes, reports, and similar topics
 */

/**
 * @swagger
 * /community/posts:
 *   get:
 *     summary: List community posts with filters & pagination (COMMUNITY-01)
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: postType
 *         schema:
 *           type: string
 *           enum: [QUESTION, EXPERIENCE, RESOURCE, INTERVIEW_EXPERIENCE, OPPORTUNITY, WARNING, DISCUSSION]
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular, mostCommented]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated posts list
 */
router.get('/posts', validateRequest(ListPostsDto, 'query'), controller.getPosts);

/**
 * @swagger
 * /community/posts/{postId}:
 *   get:
 *     summary: Get a community post by ID (COMMUNITY-02)
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 */
router.get('/posts/:postId', controller.getPostById);

/**
 * @swagger
 * /community/posts:
 *   post:
 *     summary: Create a new community post (COMMUNITY-03)
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, category]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               postType:
 *                 type: string
 *                 enum: [QUESTION, EXPERIENCE, RESOURCE, INTERVIEW_EXPERIENCE, OPPORTUNITY, WARNING, DISCUSSION]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Post created
 */
router.post(
  '/posts',
  authenticate,
  validateRequest(CreatePostDto),
  controller.createPost,
);

/**
 * @swagger
 * /community/posts/{postId}:
 *   patch:
 *     summary: Update an existing community post (COMMUNITY-04)
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Post updated
 */
router.patch(
  '/posts/:postId',
  authenticate,
  validateRequest(UpdatePostDto),
  controller.updatePost,
);

/**
 * @swagger
 * /community/posts/{postId}:
 *   delete:
 *     summary: Soft delete community post (COMMUNITY-05)
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 */
router.delete('/posts/:postId', authenticate, controller.deletePost);

/**
 * @swagger
 * /community/posts/{postId}/comments:
 *   post:
 *     summary: Add comment to a community post (COMMUNITY-06)
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *               parentCommentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post(
  '/posts/:postId/comments',
  authenticate,
  validateRequest(CreateCommentDto),
  controller.addComment,
);

/**
 * @swagger
 * /community/posts/{postId}/comments:
 *   get:
 *     summary: Get all comments for a post (COMMUNITY-07)
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/posts/:postId/comments', controller.getComments);

/**
 * @swagger
 * /community/posts/{postId}/like:
 *   post:
 *     summary: Like or unlike a community post (toggle) (COMMUNITY-08)
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like status toggled
 */
router.post('/posts/:postId/like', authenticate, controller.toggleLike);

/**
 * @swagger
 * /community/posts/{postId}/report:
 *   post:
 *     summary: Report a community post to moderators (COMMUNITY-09)
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *               details:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post(
  '/posts/:postId/report',
  authenticate,
  validateRequest(ReportPostDto),
  controller.reportPost,
);

/**
 * @swagger
 * /community/posts/{postId}/similar:
 *   get:
 *     summary: Find similar discussion threads by category and tags (COMMUNITY-10)
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of similar discussion posts
 */
router.get('/posts/:postId/similar', controller.getSimilarPosts);

export { router as communityRouter };
