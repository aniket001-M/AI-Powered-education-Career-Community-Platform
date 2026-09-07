import { Router } from 'express';
import * as controller from './interviews.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { StartInterviewDto, SubmitAnswerDto } from './interviews.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Interviews
 *   description: Mock technical and behavioral interview sessions, answer capture, and result reporting
 */

/**
 * @swagger
 * /interviews/roles:
 *   get:
 *     summary: List available career roles for mock interviews (INTERVIEW-01)
 *     tags: [Interviews]
 *     responses:
 *       200:
 *         description: Available roles
 */
router.get('/roles', controller.getAvailableRoles);

/**
 * @swagger
 * /interviews:
 *   post:
 *     summary: Start a new mock interview session (INTERVIEW-02)
 *     tags: [Interviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [careerId]
 *             properties:
 *               careerId:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *     responses:
 *       201:
 *         description: Interview session started with questions
 */
router.post(
  '/',
  authenticate,
  validateRequest(StartInterviewDto),
  controller.startInterview,
);

/**
 * @swagger
 * /interviews/{interviewId}:
 *   get:
 *     summary: Get interview session progress, questions, and submitted answers (INTERVIEW-03)
 *     tags: [Interviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details
 */
router.get('/:interviewId', authenticate, controller.getInterviewSession);

/**
 * @swagger
 * /interviews/{interviewId}/answers:
 *   post:
 *     summary: Submit an answer to an interview question (INTERVIEW-04)
 *     tags: [Interviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId, answerText]
 *             properties:
 *               questionId:
 *                 type: string
 *               answerText:
 *                 type: string
 *               durationSeconds:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Answer recorded
 */
router.post(
  '/:interviewId/answers',
  authenticate,
  validateRequest(SubmitAnswerDto),
  controller.submitAnswer,
);

/**
 * @swagger
 * /interviews/{interviewId}/complete:
 *   post:
 *     summary: Finalize and complete interview session (INTERVIEW-05)
 *     tags: [Interviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Interview finalized
 */
router.post(
  '/:interviewId/complete',
  authenticate,
  controller.completeInterview,
);

/**
 * @swagger
 * /interviews/{interviewId}/result:
 *   get:
 *     summary: Get interview session evaluation report (INTERVIEW-06)
 *     tags: [Interviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Interview result report
 */
router.get('/:interviewId/result', authenticate, controller.getInterviewResult);

export { router as interviewsRouter };
