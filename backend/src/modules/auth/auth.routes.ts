import { Router } from 'express';
import * as controller from './auth.controller';
import { validateRequest } from '@/common/middleware/validate';
import { authenticate } from '@/common/middleware/authenticate';
import { authLimiter } from '@/common/middleware/rate-limiter';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and session management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (AUTH-01)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rahul@example.com
 *               password:
 *                 type: string
 *                 example: Rahul@123
 *               role:
 *                 type: string
 *                 enum: [STUDENT, SENIOR, MENTOR, FACULTY, MODERATOR, ADMIN]
 *                 example: STUDENT
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                         avatar:
 *                           type: string
 *                           nullable: true
 *                         isEmailVerified:
 *                           type: boolean
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                 message:
 *                   type: string
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
router.post(
  '/register',
  authLimiter,
  validateRequest(RegisterDto),
  controller.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password (AUTH-02)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@careergraph.dev
 *               password:
 *                 type: string
 *                 example: Student@123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  authLimiter,
  validateRequest(LoginDto),
  controller.login,
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token (AUTH-03)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  '/refresh',
  validateRequest(RefreshDto),
  controller.refresh,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session (AUTH-04)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', controller.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout all sessions (AUTH-05)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions logged out
 *       401:
 *         description: Unauthorized
 */
router.post('/logout-all', authenticate, controller.logoutAll);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address (AUTH-06)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/verify-email',
  validateRequest(VerifyEmailDto),
  controller.verifyEmail,
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email (AUTH-07)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent if email exists
 */
router.post(
  '/resend-verification',
  authLimiter,
  validateRequest(ResendVerificationDto),
  controller.resendVerification,
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset (AUTH-08)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent if email exists
 */
router.post(
  '/forgot-password',
  authLimiter,
  validateRequest(ForgotPasswordDto),
  controller.forgotPassword,
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token (AUTH-09)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  authLimiter,
  validateRequest(ResetPasswordDto),
  controller.resetPassword,
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user (AUTH-10)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                     isEmailVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, controller.me);

export const authRouter = router;
