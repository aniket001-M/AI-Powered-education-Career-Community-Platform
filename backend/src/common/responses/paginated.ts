import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Send a paginated response matching the FRD envelope:
 * { success: true, data: [], pagination: { page, limit, total, totalPages } }
 */
export function sendPaginated(
  res: Response,
  data: any[],
  pagination: PaginationMeta,
): void {
  res.status(200).json({
    success: true,
    data,
    pagination,
  });
}
