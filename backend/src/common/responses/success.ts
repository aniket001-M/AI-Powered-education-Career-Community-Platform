import { Response } from 'express';

/**
 * Send a standard success response matching the FRD envelope:
 * { success: true, data: {}, message: "Success" }
 */
export function sendSuccess(
  res: Response,
  data: any,
  message = 'Success',
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

/**
 * Send a 201 Created response.
 */
export function sendCreated(
  res: Response,
  data: any,
  message = 'Created successfully',
): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send a standard paginated response matching the FRD envelope:
 * { success: true, data: [], pagination: { page, limit, total, totalPages } }
 */
export function sendPaginated(
  res: Response,
  items: any[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    data: items,
    pagination,
  });
}
