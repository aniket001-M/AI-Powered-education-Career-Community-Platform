import { Router } from 'express';
import * as controller from './assessments.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import { ListAssessmentsDto } from './assessments.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Assessments
 *   description: Diagnostic tests, question retrieval, and attempt lifecycle
 */

/**
 * @swagger
 * /assessments:
 *   get:
 *     summary: List assessments with category, difficulty, search filters & pagination (ASSESS-01)
 *     tags: [Assessments]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
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
 *         description: Paginated list of assessments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', validateRequest(ListAssessmentsDto, 'query'), controller.getAssessments);

/**
 * @swagger
 * /assessments/{assessmentId}:
 *   get:
 *     summary: Get assessment details by ID or slug (ASSESS-02)
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment details
 *       404:
 *         description: Assessment not found
 */
router.get('/:assessmentId', controller.getAssessmentById);

/**
 * @swagger
 * /assessments/{assessmentId}/questions:
 *   get:
 *     summary: Get sanitized questions for an assessment (ASSESS-03)
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sanitized questions without answers
 */
router.get('/:assessmentId/questions', controller.getAssessmentQuestions);

/**
 * @swagger
 * /assessments/{assessmentId}/attempts:
 *   post:
 *     summary: Start a new assessment attempt session (ASSESS-04)
 *     tags: [Assessments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Assessment attempt session started
 */
router.post(
  '/:assessmentId/attempts',
  authenticate,
  authorize(UserRole.STUDENT),
  controller.startAttempt,
);

export { router as assessmentsRouter };
