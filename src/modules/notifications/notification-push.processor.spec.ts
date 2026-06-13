import type { Job } from 'bullmq';
import type { NotificationPushJob } from './notification-push.types';
import { NotificationPushProcessor } from './notification-push.processor';
import type { NotificationsGateway } from './notifications.gateway';

describe('NotificationPushProcessor', () => {
  it('emits queued notifications through the websocket gateway', async () => {
    const gateway = {
      emitNotification: jest.fn(),
    } satisfies Pick<NotificationsGateway, 'emitNotification'>;
    const processor = new NotificationPushProcessor(
      gateway as NotificationsGateway,
    );
    const data: NotificationPushJob = {
      id: 'notification-1',
      recipientUserId: 'user-1',
      recipientRoleSlug: null,
      title: 'Workflow task assigned',
      message: 'Expense needs approval',
      type: 'WORKFLOW_TASK_ASSIGNED',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      isRead: false,
      readAt: null,
      createdAt: '2026-06-13T10:00:00.000Z',
    };

    await processor.process({ data } as Job<NotificationPushJob>);

    expect(gateway.emitNotification).toHaveBeenCalledWith(data);
  });
});
