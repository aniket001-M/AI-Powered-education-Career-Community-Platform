import { Router } from 'express';
import * as controller from './users.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { UpdateUserDto } from './users.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile (USER-01)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Update current user profile (USER-02)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul Sharma
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *               bio:
 *                 type: string
 *                 example: Aspiring backend engineer passionate about distributed systems
 *               phone:
 *                 type: string
 *                 example: +919876543210
 *               department:
 *                 type: string
 *                 example: Computer Science
 *               year:
 *                 type: integer
 *                 example: 3
 *               semester:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardResponse'
 *       422:
 *         description: Validation error
 */
router.get('/me', authenticate, controller.getMe);
router.patch('/me', authenticate, validateRequest(UpdateUserDto), controller.updateMe);

export { router as usersRouter };
