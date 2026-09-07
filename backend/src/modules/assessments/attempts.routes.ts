import { Router } from 'express';
import * as controller from './assessments.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import { SaveAnswerDto } from './assessments.validation';

const router = Router();

// All attempt operations require authentication and STUDENT role
router.use(authenticate, authorize(UserRole.STUDENT));

/**
 * @swagger
 * tags:
 *   name: Assessment Attempts
 *   description: In-progress assessment attempt management, answering, and submission
 */

/**
 * @swagger
 * /assessment-attempts/{attemptId}:
 *   get:
 *     summary: Get attempt status and saved answers (ASSESS-05)
 *     tags: [Assessment Attempts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current attempt state
 */
router.get('/:attemptId', controller.getAttempt);

/**
 * @swagger
 * /assessment-attempts/{attemptId}/answers:
 *   post:
 *     summary: Save or update answer for a question in an attempt (ASSESS-06)
 *     tags: [Assessment Attempts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId, selectedOptionId]
 *             properties:
 *               questionId:
 *                 type: string
 *               selectedOptionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer saved
 */
router.post(
  '/:attemptId/answers',
  validateRequest(SaveAnswerDto),
  controller.saveAnswer,
);

/**
 * @swagger
 * /assessment-attempts/{attemptId}/submit:
 *   post:
 *     summary: Submit attempt for server-side grading and skill state update (ASSESS-07)
 *     tags: [Assessment Attempts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment attempt submitted and graded
 */
router.post('/:attemptId/submit', controller.submitAttempt);

/**
 * @swagger
 * /assessment-attempts/{attemptId}/result:
 *   get:
 *     summary: Get comprehensive graded result, review, and explanations (ASSESS-08)
 *     tags: [Assessment Attempts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed graded results and question review
 */
router.get('/:attemptId/result', controller.getAttemptResult);

export { router as assessmentAttemptsRouter };
