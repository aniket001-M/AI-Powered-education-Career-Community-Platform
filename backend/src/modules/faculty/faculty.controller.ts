import { Request, Response, NextFunction } from 'express';
import { facultyService } from './faculty.service';
import {
  CreateFacultyAssessmentDto,
  CreateFacultyResourceDto,
  FacultyAnalyticsQueryDto,
} from './faculty.validation';
import { sendSuccess, sendCreated } from '@/common/responses/success';

export class FacultyController {
  /**
   * FACULTY-01: Faculty Dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await facultyService.getDashboard(req.user!.userId);
      return sendSuccess(res, stats, 'Faculty dashboard metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * FACULTY-02: Create Assessment
   */
  async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateFacultyAssessmentDto;
      const result = await facultyService.createAssessment(
        req.user!.userId,
        dto,
      );
      return sendCreated(res, result, 'Assessment created successfully by faculty');
    } catch (error) {
      next(error);
    }
  }

  /**
   * FACULTY-03: Upload Academic Resource
   */
  async uploadResource(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateFacultyResourceDto;
      const resource = await facultyService.uploadResource(
        req.user!.userId,
        dto,
      );
      return sendCreated(res, resource, 'Academic resource uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * FACULTY-04: Learning Analytics
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req as any).query as FacultyAnalyticsQueryDto;
      const analytics = await facultyService.getAnalytics(
        req.user!.userId,
        query,
      );
      return sendSuccess(res, analytics, 'Learning analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const facultyController = new FacultyController();
