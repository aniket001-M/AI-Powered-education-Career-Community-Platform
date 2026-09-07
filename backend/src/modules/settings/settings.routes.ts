import { Router } from 'express';
import * as controller from './settings.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import {
  UpdateSettingsDto,
  ChangePasswordDto,
  DeleteAccountDto,
} from './settings.validation';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: User preferences, notification controls, password management, and account deactivation
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Retrieve user account settings and preferences (SETTINGS-01)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 */
router.get('/', controller.getSettings);

/**
 * @swagger
 * /settings:
 *   patch:
 *     summary: Update notification and theme preferences (SETTINGS-02)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *               profileVisibility:
 *                 type: string
 *                 enum: [PUBLIC, COLLEGE_ONLY, PRIVATE]
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch(
  '/',
  validateRequest(UpdateSettingsDto),
  controller.updateSettings,
);

/**
 * @swagger
 * /settings/password:
 *   patch:
 *     summary: Change user account password (SETTINGS-03)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.patch(
  '/password',
  validateRequest(ChangePasswordDto),
  controller.changePassword,
);

/**
 * @swagger
 * /settings/account:
 *   delete:
 *     summary: Deactivate and schedule user account for deletion (SETTINGS-04)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.delete(
  '/account',
  validateRequest(DeleteAccountDto),
  controller.deleteAccount,
);

export { router as settingsRouter };
