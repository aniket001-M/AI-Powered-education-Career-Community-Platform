import { Router } from 'express';
import * as controller from './roadmaps.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import { UpdateStepStatusDto } from './roadmaps.validation';

const router = Router();

// All roadmap step routes require student authentication
router.use(authenticate, authorize(UserRole.STUDENT));

/**
 * @swagger
 * tags:
 *   name: Roadmap Steps
 *   description: Roadmap step management and completion
 */

/**
 * @swagger
 * /roadmap-steps/{stepId}:
 *   get:
 *     summary: Get roadmap step details (ROADMAP-03)
 *     tags: [Roadmap Steps]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roadmap step details
 */
router.get('/:stepId', controller.getStepById);

/**
 * @swagger
 * /roadmap-steps/{stepId}:
 *   patch:
 *     summary: Update step status (e.g. IN_PROGRESS, SKIPPED) (ROADMAP-04)
 *     tags: [Roadmap Steps]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED, SKIPPED]
 *     responses:
 *       200:
 *         description: Step status updated successfully
 */
router.patch(
  '/:stepId',
  validateRequest(UpdateStepStatusDto),
  controller.updateStepStatus,
);

/**
 * @swagger
 * /roadmap-steps/{stepId}/complete:
 *   post:
 *     summary: Complete learning step and unlock dependent steps (ROADMAP-05)
 *     tags: [Roadmap Steps]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Step completed and dependent steps unlocked
 */
router.post('/:stepId/complete', controller.completeStep);

export { router as roadmapStepsRouter };
