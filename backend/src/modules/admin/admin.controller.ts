import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { auditService } from '../audit/audit.service';
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
import { sendSuccess, sendCreated, sendPaginated } from '@/common/responses/success';

export class AdminController {
  /**
   * ADMIN-01: Aggregated system analytics dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboard();
      return sendSuccess(res, stats, 'Admin dashboard metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-02: Paginated list of users with roles & status filters
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = (req as any).query as QueryUsersDto;
      const result = await adminService.listUsers(dto);
      return sendPaginated(res, result.items, result.pagination, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-03: Update user roles or account status (activate/deactivate)
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const dto = req.body as UpdateUserDto;
      const result = await adminService.updateUser(
        userId,
        dto,
        req.user!.userId,
        req.user!.roles[0],
      );
      return sendSuccess(res, result, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-04: List moderation reports
   */
  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = (req as any).query as QueryReportsDto;
      const result = await adminService.listReports(dto);
      return sendPaginated(res, result.items, result.pagination, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-05: Resolve moderation report
   */
  async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const dto = req.body as ResolveReportDto;
      const result = await adminService.resolveReport(
        reportId,
        dto,
        req.user!.userId,
        req.user!.roles[0],
      );
      return sendSuccess(res, result, 'Report resolved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-06: Create career
   */
  async createCareer(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateCareerDto;
      const career = await adminService.createCareer(
        dto,
        req.user!.userId,
        req.user!.roles[0],
      );
      return sendCreated(res, career, 'Career created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-07: Update career
   */
  async updateCareer(req: Request, res: Response, next: NextFunction) {
    try {
      const { careerId } = req.params;
      const dto = req.body as UpdateCareerDto;
      const career = await adminService.updateCareer(
        careerId,
        dto,
        req.user!.userId,
        req.user!.roles[0],
      );
      return sendSuccess(res, career, 'Career updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-08: Create skill
   */
  async createSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateSkillDto;
      const skill = await adminService.createSkill(
        dto,
        req.user!.userId,
        req.user!.roles[0],
      );
      return sendCreated(res, skill, 'Skill created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-09: Update skill
   */
  async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { skillId } = req.params;
      const dto = req.body as UpdateSkillDto;
      const skill = await adminService.updateSkill(
        skillId,
        dto,
        req.user!.userId,
        req.user!.roles[0],
      );
      return sendSuccess(res, skill, 'Skill updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN-10: Audit Logs
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
}

export const adminController = new AdminController();
