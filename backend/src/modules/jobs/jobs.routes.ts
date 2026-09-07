import { Router } from 'express';
import * as controller from './jobs.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { CreateJobAnalysisDto } from './jobs.validation';

const router = Router();

// All job analysis routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Job Analyzer
 *   description: Job description parsing, skill extraction, profile comparison, and roadmap integration
 */

/**
 * @swagger
 * /job-analyses:
 *   post:
 *     summary: Submit a job description for analysis (JOB-01)
 *     tags: [Job Analyzer]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               company:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job analysis created
 */
router.post(
  '/',
  validateRequest(CreateJobAnalysisDto),
  controller.createJobAnalysis,
);

/**
 * @swagger
 * /job-analyses/{analysisId}:
 *   get:
 *     summary: Get job analysis report with detected and missing skills (JOB-02)
 *     tags: [Job Analyzer]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job analysis details
 */
router.get('/:analysisId', controller.getJobAnalysisById);

/**
 * @swagger
 * /job-analyses/{analysisId}/analyze:
 *   post:
 *     summary: Run deterministic skill keyword extraction and gap analysis against student state (JOB-04)
 *     tags: [Job Analyzer]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Completed analysis with match score and skill breakdown
 */
router.post('/:analysisId/analyze', controller.analyzeJob);

/**
 * @swagger
 * /job-analyses/{analysisId}/add-to-roadmap:
 *   post:
 *     summary: Add missing job skills as new steps to student's active roadmap (JOB-05)
 *     tags: [Job Analyzer]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skills added to student roadmap
 */
router.post('/:analysisId/add-to-roadmap', controller.addJobSkillsToRoadmap);

/**
 * @swagger
 * /job-analyses/semantic/match:
 *   post:
 *     summary: Semantic ML embedding match placeholder
 *     tags: [Job Analyzer]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       501:
 *         description: AI_NOT_ENABLED
 */
router.post('/semantic/match', controller.semanticAnalyze);

export { router as jobAnalysesRouter };
