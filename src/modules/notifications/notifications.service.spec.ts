import type { Repository } from 'typeorm';
import type { MailerService } from '../../mailer/mailer.service';
import { Notification, NotificationType } from './entities/notification.entity';
import type { NotificationPushQueue } from './notification-push.queue';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const createdAt = new Date('2026-06-13T10:00:00.000Z');

  function createRepository() {
    const create = jest.fn((input: Partial<Notification>) => ({
      id: 'notification-1',
      createdAt,
      ...input,
    }));
    const save = jest.fn((notification: Notification) =>
      Promise.resolve(notification),
    );

    return {
      repository: { create, save } as unknown as Repository<Notification>,
      create,
      save,
    };
  }

  it('saves the notification and enqueues selected push and email channels', async () => {
    const { repository, create, save } = createRepository();
    const pushQueue = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<NotificationPushQueue, 'enqueue'>;
    const mailerService = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<MailerService, 'enqueue'>;
    const service = new NotificationsService(
      repository,
      pushQueue as NotificationPushQueue,
      mailerService as MailerService,
    );

    const notification = await service.create({
      recipientUserId: 'user-1',
      title: 'Workflow task assigned',
      message: 'Expense needs approval',
      type: NotificationType.WORKFLOW_TASK_ASSIGNED,
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      channels: {
        push: true,
        email: {
          template: 'notification',
          to: 'manager@example.com',
          subject: 'Workflow task assigned',
          props: {
            recipientEmail: 'manager@example.com',
            title: 'Workflow task assigned',
            message: 'Expense needs approval',
          },
        },
      },
    });

    expect(create).toHaveBeenCalledWith({
      recipientUserId: 'user-1',
      recipientRoleSlug: null,
      title: 'Workflow task assigned',
      message: 'Expense needs approval',
      type: NotificationType.WORKFLOW_TASK_ASSIGNED,
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      isRead: false,
      readAt: null,
    });
    expect(save).toHaveBeenCalledWith(notification);
    expect(pushQueue.enqueue).toHaveBeenCalledWith(notification);
    expect(mailerService.enqueue).toHaveBeenCalledWith({
      template: 'notification',
      to: 'manager@example.com',
      subject: 'Workflow task assigned',
      props: {
        recipientEmail: 'manager@example.com',
        title: 'Workflow task assigned',
        message: 'Expense needs approval',
      },
    });
  });

  it('allows notification helper methods to forward selected channels', async () => {
    const { repository } = createRepository();
    const pushQueue = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<NotificationPushQueue, 'enqueue'>;
    const mailerService = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<MailerService, 'enqueue'>;
    const service = new NotificationsService(
      repository,
      pushQueue as NotificationPushQueue,
      mailerService as MailerService,
    );

    const notification = await service.createTaskAssigned({
      assignedUserId: 'manager-1',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true },
    });

    expect(pushQueue.enqueue).toHaveBeenCalledWith(notification);
  });
});
