import { Notification, NotificationType } from './entities/notification.entity';

export type NotificationPushJob = {
  id: string;
  recipientUserId: string | null;
  recipientRoleSlug: string | null;
  title: string;
  message: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  workflowInstanceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export function toNotificationPushJob(
  notification: Notification,
): NotificationPushJob {
  return {
    id: notification.id,
    recipientUserId: notification.recipientUserId,
    recipientRoleSlug: notification.recipientRoleSlug,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    entityType: notification.entityType,
    entityId: notification.entityId,
    workflowInstanceId: notification.workflowInstanceId,
    isRead: notification.isRead,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
