import mongoose from 'mongoose';
import { Notification, INotification } from '@/models/Notification.model';
import { AppError } from '@/common/errors/AppError';
import { ListNotificationsDto } from './notifications.validation';

export class NotificationsService {
  /**
   * NOTIFY-01: List Notifications
   */
  async getNotifications(userId: string, query: ListNotificationsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      items: items.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: n.isRead,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * NOTIFY-02: Mark Notification Read
   */
  async markAsRead(userId: string, notificationId: string) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw AppError.notFound(`Notification '${notificationId}' not found`);
    }

    const notif = await Notification.findOne({
      _id: notificationId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!notif) {
      throw AppError.notFound(`Notification '${notificationId}' not found`);
    }

    notif.isRead = true;
    notif.readAt = new Date();
    await notif.save();

    return {
      id: notif._id.toString(),
      isRead: notif.isRead,
      readAt: notif.readAt,
    };
  }

  /**
   * NOTIFY-03: Mark All Read
   */
  async markAllAsRead(userId: string) {
    const result = await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
    );

    return {
      message: 'All notifications marked as read',
      markedCount: result.modifiedCount,
    };
  }

  /**
   * NOTIFY-04: Get Unread Count
   */
  async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });

    return { unreadCount: count };
  }
}

export const notificationsService = new NotificationsService();
