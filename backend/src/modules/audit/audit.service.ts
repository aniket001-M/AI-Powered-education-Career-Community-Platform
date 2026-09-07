import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '@/models/AuditLog.model';
import { QueryAuditLogsDto } from './audit.validation';
import { AppError } from '@/common/errors/AppError';

export interface CreateAuditLogParams {
  actorId: string | mongoose.Types.ObjectId;
  actorEmail?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILED';
}

export class AuditService {
  /**
   * Record an audit trail entry
   */
  async log(params: CreateAuditLogParams): Promise<IAuditLog> {
    const logEntry = new AuditLog({
      actorId: new mongoose.Types.ObjectId(params.actorId.toString()),
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      status: params.status || 'SUCCESS',
    });

    return await logEntry.save();
  }

  /**
   * AUDIT-01: Query audit logs with pagination and filters
   */
  async getLogs(dto: QueryAuditLogsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (dto.action) {
      filter.action = dto.action;
    }
    if (dto.resourceType) {
      filter.resourceType = dto.resourceType;
    }
    if (dto.actorId && mongoose.Types.ObjectId.isValid(dto.actorId)) {
      filter.actorId = new mongoose.Types.ObjectId(dto.actorId);
    }
    if (dto.status) {
      filter.status = dto.status;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      items: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * AUDIT-02: Get single audit log detail
   */
  async getLogById(logId: string): Promise<IAuditLog> {
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      throw AppError.notFound('Audit log not found');
    }

    const log = await AuditLog.findById(logId)
      .populate('actorId', 'name email')
      .lean();

    if (!log) {
      throw AppError.notFound('Audit log entry not found');
    }

    return log as unknown as IAuditLog;
  }
}

export const auditService = new AuditService();
