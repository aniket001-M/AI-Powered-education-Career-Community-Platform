import { Router } from 'express';
import * as controller from './resources.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import {
  ListResourcesDto,
  CreateResourceDto,
  UpdateResourceDto,
} from './resources.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Learning Resources
 *   description: Course materials, notes, lab manuals, question papers, and progress tracking
 */

/**
 * @swagger
 * /resources:
 *   get:
 *     summary: List learning resources with filters & pagination (RESOURCE-01)
 *     tags: [Learning Resources]
 *     parameters:
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PDF, VIDEO, ARTICLE, COURSE, PRACTICE, PROJECT, NOTE, SYLLABUS, LAB_MANUAL, QUESTION_PAPER]
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *       - in: query
 *         name: college
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Paginated resources list
 */
router.get('/', validateRequest(ListResourcesDto, 'query'), controller.getResources);

/**
 * @swagger
 * /resources/{resourceId}:
 *   get:
 *     summary: Get learning resource details by ID or slug (RESOURCE-02)
 *     tags: [Learning Resources]
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Learning resource details
 *       404:
 *         description: Resource not found
 */
router.get('/:resourceId', controller.getResourceById);

/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Create/upload a new learning resource (RESOURCE-03)
 *     tags: [Learning Resources]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, type, url]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PDF, VIDEO, ARTICLE, COURSE, PRACTICE, PROJECT, NOTE, SYLLABUS, LAB_MANUAL, QUESTION_PAPER]
 *               url:
 *                 type: string
 *               storageKey:
 *                 type: string
 *               skillId:
 *                 type: string
 *               subject:
 *                 type: string
 *               college:
 *                 type: string
 *               department:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *     responses:
 *       201:
 *         description: Resource created
 */
router.post(
  '/',
  authenticate,
  authorize(
    UserRole.FACULTY,
    UserRole.ADMIN,
    UserRole.SENIOR,
    UserRole.MODERATOR,
  ),
  validateRequest(CreateResourceDto),
  controller.createResource,
);

/**
 * @swagger
 * /resources/{resourceId}:
 *   patch:
 *     summary: Update learning resource metadata (RESOURCE-04)
 *     tags: [Learning Resources]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource updated
 */
router.patch(
  '/:resourceId',
  authenticate,
  validateRequest(UpdateResourceDto),
  controller.updateResource,
);

/**
 * @swagger
 * /resources/{resourceId}:
 *   delete:
 *     summary: Delete learning resource (RESOURCE-05)
 *     tags: [Learning Resources]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource deleted
 */
router.delete('/:resourceId', authenticate, controller.deleteResource);

/**
 * @swagger
 * /resources/{resourceId}/access:
 *   post:
 *     summary: Track student resource access (RESOURCE-06)
 *     tags: [Learning Resources]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access recorded
 */
router.post(
  '/:resourceId/access',
  authenticate,
  authorize(UserRole.STUDENT),
  controller.trackAccess,
);

/**
 * @swagger
 * /resources/{resourceId}/complete:
 *   post:
 *     summary: Mark resource as completed by student (RESOURCE-07)
 *     tags: [Learning Resources]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource marked complete
 */
router.post(
  '/:resourceId/complete',
  authenticate,
  authorize(UserRole.STUDENT),
  controller.markComplete,
);

/**
 * @swagger
 * /resources/knowledge/search:
 *   post:
 *     summary: Search knowledge base via RAG (AI/RAG interface placeholder)
 *     tags: [Learning Resources]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       501:
 *         description: AI_NOT_ENABLED
 */
router.post(
  '/knowledge/search',
  authenticate,
  controller.searchKnowledge,
);

/**
 * @swagger
 * /resources/knowledge/ask:
 *   post:
 *     summary: Query knowledge base for grounded answer (AI/RAG interface placeholder)
 *     tags: [Learning Resources]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       501:
 *         description: AI_NOT_ENABLED
 */
router.post(
  '/knowledge/ask',
  authenticate,
  controller.askKnowledge,
);

export { router as resourcesRouter };
