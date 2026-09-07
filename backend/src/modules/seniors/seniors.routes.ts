import { Router } from 'express';
import * as controller from './seniors.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import {
  ListSeniorExperiencesDto,
  CreateSeniorExperienceDto,
  UpdateSeniorExperienceDto,
  VerifySeniorExperienceDto,
} from './seniors.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Senior Experiences
 *   description: Alumni & senior interview insights, company placement reviews, preparation guidance, and verification
 */

/**
 * @swagger
 * /senior-experiences:
 *   get:
 *     summary: List verified senior experiences with filters (SENIOR-01)
 *     tags: [Senior Experiences]
 *     parameters:
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
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
 *         description: Paginated experiences list
 */
router.get(
  '/',
  validateRequest(ListSeniorExperiencesDto, 'query'),
  controller.getExperiences,
);

/**
 * @swagger
 * /senior-experiences/{experienceId}:
 *   get:
 *     summary: Get senior experience details (SENIOR-02)
 *     tags: [Senior Experiences]
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience details
 */
router.get('/:experienceId', controller.getExperienceById);

/**
 * @swagger
 * /senior-experiences:
 *   post:
 *     summary: Create new senior experience (SENIOR-03)
 *     tags: [Senior Experiences]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company, role, batch, department, title, content]
 *             properties:
 *               company:
 *                 type: string
 *               role:
 *                 type: string
 *               batch:
 *                 type: string
 *               department:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Senior experience created
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.SENIOR, UserRole.MENTOR, UserRole.FACULTY, UserRole.ADMIN),
  validateRequest(CreateSeniorExperienceDto),
  controller.createExperience,
);

/**
 * @swagger
 * /senior-experiences/{experienceId}:
 *   patch:
 *     summary: Update senior experience (SENIOR-04)
 *     tags: [Senior Experiences]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience updated
 */
router.patch(
  '/:experienceId',
  authenticate,
  validateRequest(UpdateSeniorExperienceDto),
  controller.updateExperience,
);

/**
 * @swagger
 * /senior-experiences/{experienceId}:
 *   delete:
 *     summary: Soft delete senior experience (SENIOR-05)
 *     tags: [Senior Experiences]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience deleted
 */
router.delete('/:experienceId', authenticate, controller.deleteExperience);

/**
 * @swagger
 * /senior-experiences/{experienceId}/verify:
 *   patch:
 *     summary: Verify or reject senior experience (SENIOR-06)
 *     tags: [Senior Experiences]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experienceId
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
 *                 enum: [VERIFIED, REJECTED]
 *     responses:
 *       200:
 *         description: Verification status updated
 */
router.patch(
  '/:experienceId/verify',
  authenticate,
  authorize(UserRole.MODERATOR, UserRole.FACULTY, UserRole.ADMIN),
  validateRequest(VerifySeniorExperienceDto),
  controller.verifyExperience,
);

export { router as seniorsRouter };
