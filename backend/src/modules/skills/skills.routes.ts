import { Router } from 'express';
import * as controller from './skills.controller';
import { validateRequest } from '@/common/middleware/validate';
import { ListSkillsDto } from './skills.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: Skill taxonomy, relationships, and skill graph
 */

/**
 * @swagger
 * /skills:
 *   get:
 *     summary: List skills with category, parent, search filters & pagination (SKILL-01)
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: parent
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
 *         description: Paginated list of skills
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', validateRequest(ListSkillsDto, 'query'), controller.getSkills);

/**
 * @swagger
 * /skills/graph:
 *   get:
 *     summary: Get complete skill prerequisite and hierarchy graph (SKILL-04)
 *     tags: [Skills]
 *     responses:
 *       200:
 *         description: Full skill taxonomy graph (nodes and edges)
 */
router.get('/graph', controller.getSkillGraph);

/**
 * @swagger
 * /skills/{skillId}:
 *   get:
 *     summary: Get skill details by ID or slug (SKILL-02)
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill details
 *       404:
 *         description: Skill not found
 */
router.get('/:skillId', controller.getSkillById);

/**
 * @swagger
 * /skills/{skillId}/children:
 *   get:
 *     summary: Get child skills and subcategories for a skill (SKILL-03)
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of child skills
 *       404:
 *         description: Skill not found
 */
router.get('/:skillId/children', controller.getSkillChildren);

export { router as skillsRouter };
