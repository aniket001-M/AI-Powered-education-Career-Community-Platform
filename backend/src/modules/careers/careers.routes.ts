import { Router } from 'express';
import * as controller from './careers.controller';
import { validateRequest } from '@/common/middleware/validate';
import { ListCareersDto } from './careers.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Careers
 *   description: Career paths, career skills, and skill taxonomy graphs
 */

/**
 * @swagger
 * /careers:
 *   get:
 *     summary: List careers with filters & search (CAREER-01)
 *     tags: [Careers]
 *     parameters:
 *       - in: query
 *         name: category
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
 *         description: Paginated list of careers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', validateRequest(ListCareersDto, 'query'), controller.getCareers);

/**
 * @swagger
 * /careers/{careerId}:
 *   get:
 *     summary: Get career details by ID or slug (CAREER-02)
 *     tags: [Careers]
 *     parameters:
 *       - in: path
 *         name: careerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Career details
 *       404:
 *         description: Career not found
 */
router.get('/:careerId', controller.getCareerById);

/**
 * @swagger
 * /careers/{careerId}/skills:
 *   get:
 *     summary: Get skills required for a career (CAREER-03)
 *     tags: [Careers]
 *     parameters:
 *       - in: path
 *         name: careerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Career skills list
 */
router.get('/:careerId/skills', controller.getCareerSkills);

/**
 * @swagger
 * /careers/{careerId}/skill-graph:
 *   get:
 *     summary: Get career skill prerequisite graph (CAREER-04)
 *     tags: [Careers]
 *     parameters:
 *       - in: path
 *         name: careerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Graph nodes and edges for the career
 */
router.get('/:careerId/skill-graph', controller.getCareerSkillGraph);

export { router as careersRouter };
