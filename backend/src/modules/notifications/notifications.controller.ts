import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess, sendPaginated } from '@/common/responses/success';
import { ListNotificationsDto } from './notifications.validation';

/**
 * NOTIFY-01: List Notifications
 */
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListNotificationsDto;
    const result = await notificationsService.getNotifications(
      req.user!.userId,
      query,
    );
    sendPaginated(res, result.items, result.pagination);
  } catch (error) {
    next(error);
  }
}

/**
 * NOTIFY-02: Mark Notification Read
 */
export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await notificationsService.markAsRead(
      req.user!.userId,
      req.params.notificationId,
    );
    sendSuccess(res, data, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

/**
 * NOTIFY-03: Mark All Read
 */
export async function markAllAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await notificationsService.markAllAsRead(req.user!.userId);
    sendSuccess(res, data, data.message);
  } catch (error) {
    next(error);
  }
}

/**
 * NOTIFY-04: Get Unread Count
 */
export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await notificationsService.getUnreadCount(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
