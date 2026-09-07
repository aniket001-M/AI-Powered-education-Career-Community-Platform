import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import { validateRequest } from '@/common/middleware/validate';
import {
  QueryUsersDto,
  UpdateUserDto,
  QueryReportsDto,
  ResolveReportDto,
  CreateCareerDto,
  UpdateCareerDto,
  CreateSkillDto,
  UpdateSkillDto,
} from './admin.validation';
import { QueryAuditLogsDto } from '../audit/audit.validation';

const router = Router();

// Base authentication required for all admin routes
router.use(authenticate);

/**
 * ADMIN-01: GET /api/v1/admin/dashboard
 */
router.get(
  '/dashboard',
  authorize(UserRole.ADMIN),
  (req, res, next) => adminController.getDashboard(req, res, next),
);

/**
 * ADMIN-02: GET /api/v1/admin/users
 */
router.get(
  '/users',
  authorize(UserRole.ADMIN),
  validateRequest(QueryUsersDto, 'query'),
  (req, res, next) => adminController.listUsers(req, res, next),
);

/**
 * ADMIN-03: PATCH /api/v1/admin/users/:userId
 */
router.patch(
  '/users/:userId',
  authorize(UserRole.ADMIN),
  validateRequest(UpdateUserDto, 'body'),
  (req, res, next) => adminController.updateUser(req, res, next),
);

/**
 * ADMIN-04: GET /api/v1/admin/reports
 */
router.get(
  '/reports',
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest(QueryReportsDto, 'query'),
  (req, res, next) => adminController.listReports(req, res, next),
);

/**
 * ADMIN-05: PATCH /api/v1/admin/reports/:reportId
 */
router.patch(
  '/reports/:reportId',
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest(ResolveReportDto, 'body'),
  (req, res, next) => adminController.resolveReport(req, res, next),
);

/**
 * ADMIN-06: POST /api/v1/admin/careers
 */
router.post(
  '/careers',
  authorize(UserRole.ADMIN),
  validateRequest(CreateCareerDto, 'body'),
  (req, res, next) => adminController.createCareer(req, res, next),
);

/**
 * ADMIN-07: PATCH /api/v1/admin/careers/:careerId
 */
router.patch(
  '/careers/:careerId',
  authorize(UserRole.ADMIN),
  validateRequest(UpdateCareerDto, 'body'),
  (req, res, next) => adminController.updateCareer(req, res, next),
);

/**
 * ADMIN-08: POST /api/v1/admin/skills
 */
router.post(
  '/skills',
  authorize(UserRole.ADMIN),
  validateRequest(CreateSkillDto, 'body'),
  (req, res, next) => adminController.createSkill(req, res, next),
);

/**
 * ADMIN-09: PATCH /api/v1/admin/skills/:skillId
 */
router.patch(
  '/skills/:skillId',
  authorize(UserRole.ADMIN),
  validateRequest(UpdateSkillDto, 'body'),
  (req, res, next) => adminController.updateSkill(req, res, next),
);

/**
 * ADMIN-10: GET /api/v1/admin/audit-logs
 */
router.get(
  '/audit-logs',
  authorize(UserRole.ADMIN),
  validateRequest(QueryAuditLogsDto, 'query'),
  (req, res, next) => adminController.getAuditLogs(req, res, next),
);

export default router;
