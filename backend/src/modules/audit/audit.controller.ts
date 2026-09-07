import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { QueryAuditLogsDto } from './audit.validation';
import { sendSuccess, sendPaginated } from '@/common/responses/success';

export class AuditController {
  /**
   * AUDIT-01: List audit logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = (req as any).query as QueryAuditLogsDto;
      const result = await auditService.getLogs(dto);
      return sendPaginated(res, result.items, result.pagination, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * AUDIT-02: Get audit log detail
   */
  async getAuditLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.params;
      const log = await auditService.getLogById(logId);
      return sendSuccess(res, log, 'Audit log retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
