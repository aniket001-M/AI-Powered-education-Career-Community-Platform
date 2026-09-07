import { Router } from 'express';
import { facultyController } from './faculty.controller';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import { validateRequest } from '@/common/middleware/validate';
import {
  CreateFacultyAssessmentDto,
  CreateFacultyResourceDto,
  FacultyAnalyticsQueryDto,
} from './faculty.validation';

const router = Router();

// Base protection: Faculty or Admin role required
router.use(authenticate);
router.use(authorize(UserRole.FACULTY, UserRole.ADMIN));

/**
 * FACULTY-01: GET /api/v1/faculty/dashboard
 */
router.get('/dashboard', (req, res, next) =>
  facultyController.getDashboard(req, res, next),
);

/**
 * FACULTY-02: POST /api/v1/faculty/assessments
 */
router.post(
  '/assessments',
  validateRequest(CreateFacultyAssessmentDto, 'body'),
  (req, res, next) => facultyController.createAssessment(req, res, next),
);

/**
 * FACULTY-03: POST /api/v1/faculty/resources
 */
router.post(
  '/resources',
  validateRequest(CreateFacultyResourceDto, 'body'),
  (req, res, next) => facultyController.uploadResource(req, res, next),
);

/**
 * FACULTY-04: GET /api/v1/faculty/analytics
 */
router.get(
  '/analytics',
  validateRequest(FacultyAnalyticsQueryDto, 'query'),
  (req, res, next) => facultyController.getAnalytics(req, res, next),
);

export default router;
