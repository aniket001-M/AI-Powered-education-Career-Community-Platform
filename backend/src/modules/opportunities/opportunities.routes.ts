import { Router } from 'express';
import * as controller from './opportunities.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import {
  ListOpportunitiesDto,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  VerifyOpportunityDto,
  AddRiskSignalDto,
} from './opportunities.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Opportunities
 *   description: Internships, jobs, scholarships, hackathons, verification, risk signaling, and student saved opportunities
 */

/**
 * @swagger
 * /opportunities:
 *   get:
 *     summary: List verified opportunities with filters & pagination (OPPORTUNITY-01)
 *     tags: [Opportunities]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INTERNSHIP, JOB, SCHOLARSHIP, HACKATHON, COMPETITION, CAMPUS_OPPORTUNITY]
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: deadline
 *         schema:
 *           type: string
 *       - in: query
 *         name: skill
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
 *         description: Paginated opportunities list
 */
router.get(
  '/',
  validateRequest(ListOpportunitiesDto, 'query'),
  controller.getOpportunities,
);

/**
 * @swagger
 * /opportunities/{opportunityId}:
 *   get:
 *     summary: Get opportunity details, mapped skills, and evidence-based risk signals (OPPORTUNITY-02)
 *     tags: [Opportunities]
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opportunity details
 */
router.get('/:opportunityId', controller.getOpportunityById);

/**
 * @swagger
 * /opportunities:
 *   post:
 *     summary: Create a new opportunity (OPPORTUNITY-03)
 *     tags: [Opportunities]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, company, type, description, location, applyUrl]
 *             properties:
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INTERNSHIP, JOB, SCHOLARSHIP, HACKATHON, COMPETITION, CAMPUS_OPPORTUNITY]
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               applyUrl:
 *                 type: string
 *               deadline:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Opportunity created
 */
router.post(
  '/',
  authenticate,
  authorize(
    UserRole.FACULTY,
    UserRole.SENIOR,
    UserRole.MENTOR,
    UserRole.ADMIN,
    UserRole.MODERATOR,
  ),
  validateRequest(CreateOpportunityDto),
  controller.createOpportunity,
);

/**
 * @swagger
 * /opportunities/{opportunityId}:
 *   patch:
 *     summary: Update opportunity metadata (OPPORTUNITY-04)
 *     tags: [Opportunities]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opportunity updated
 */
router.patch(
  '/:opportunityId',
  authenticate,
  validateRequest(UpdateOpportunityDto),
  controller.updateOpportunity,
);

/**
 * @swagger
 * /opportunities/{opportunityId}:
 *   delete:
 *     summary: Soft delete opportunity (OPPORTUNITY-05)
 *     tags: [Opportunities]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opportunity deleted
 */
router.delete('/:opportunityId', authenticate, controller.deleteOpportunity);

/**
 * @swagger
 * /opportunities/{opportunityId}/verify:
 *   patch:
 *     summary: Verify opportunity by moderator or faculty (OPPORTUNITY-06)
 *     tags: [Opportunities]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
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
  '/:opportunityId/verify',
  authenticate,
  authorize(UserRole.MODERATOR, UserRole.FACULTY, UserRole.ADMIN),
  validateRequest(VerifyOpportunityDto),
  controller.verifyOpportunity,
);

/**
 * @swagger
 * /opportunities/{opportunityId}/risk-signals:
 *   post:
 *     summary: Add evidence-based risk indicator to opportunity (OPPORTUNITY-07)
 *     tags: [Opportunities]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signalType, severity, evidenceDescription]
 *             properties:
 *               signalType:
 *                 type: string
 *                 enum: [UNVERIFIED_EMAIL_DOMAIN, UPFRONT_FEE_REQUEST, SUSPICIOUS_TELEGRAM_LINK, UNREALISTIC_COMPENSATION, ANONYMOUS_RECRUITER, OTHER]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               evidenceDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Risk signal recorded
 */
router.post(
  '/:opportunityId/risk-signals',
  authenticate,
  validateRequest(AddRiskSignalDto),
  controller.addRiskSignal,
);

/**
 * @swagger
 * /opportunities/{opportunityId}/save:
 *   post:
 *     summary: Save or unsave an opportunity for student (toggle)
 *     tags: [Opportunities]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Save status toggled
 */
router.post(
  '/:opportunityId/save',
  authenticate,
  authorize(UserRole.STUDENT),
  controller.toggleSaveOpportunity,
);

export { router as opportunitiesRouter };
