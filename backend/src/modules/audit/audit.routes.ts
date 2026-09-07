import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate } from '@/common/middleware/authenticate';
import { authorize } from '@/common/middleware/authorize';
import { UserRole } from '@/common/enums/roles.enum';
import { validateRequest } from '@/common/middleware/validate';
import { QueryAuditLogsDto } from './audit.validation';

const router = Router();

// All audit routes are ADMIN only
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * AUDIT-01: GET /api/v1/audit-logs
 */
router.get('/', validateRequest(QueryAuditLogsDto, 'query'), (req, res, next) =>
  auditController.getAuditLogs(req, res, next),
);

/**
 * AUDIT-02: GET /api/v1/audit-logs/:logId
 */
router.get('/:logId', (req, res, next) =>
  auditController.getAuditLogById(req, res, next),
);

export default router;
