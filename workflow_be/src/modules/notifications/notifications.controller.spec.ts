import { Paginated } from '../../common/http/paginated';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  const actor: Express.User = {
    userId: 'user-1',
    email: 'user@example.com',
    employeeGrade: null,
    departmentId: null,
    roles: ['manager'],
    permissions: [],
    sid: 'session-1',
  };
  const notification = {
    id: 'notification-1',
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
    createdAt: new Date('2026-06-13T10:00:00.000Z'),
  } satisfies Notification;

  function createController() {
    const service = {
      list: jest.fn(() =>
        Promise.resolve(new Paginated([notification], 1, 25, 1)),
      ),
      markRead: jest.fn(() =>
        Promise.resolve({ ...notification, isRead: true, readAt: new Date() }),
      ),
    } satisfies Pick<NotificationsService, 'list' | 'markRead'>;

    return {
      controller: new NotificationsController(service as NotificationsService),
      service,
    };
  }

  it('lists current user notifications with the query options', async () => {
    const { controller, service } = createController();

    const result = await controller.list(
      { page: 1, limit: 25, unreadOnly: true },
      actor,
    );

    expect(service.list).toHaveBeenCalledWith(
      { page: 1, limit: 25, unreadOnly: true },
      actor,
    );
    expect(result.items[0]).toEqual({
      id: 'notification-1',
      title: 'Workflow task assigned',
      message: 'Expense needs approval',
      type: NotificationType.WORKFLOW_TASK_ASSIGNED,
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      isRead: false,
      readAt: null,
      createdAt: '2026-06-13T10:00:00.000Z',
    });
  });

  it('marks a current user notification as read', async () => {
    const { controller, service } = createController();

    const result = await controller.markRead({ id: 'notification-1' }, actor);

    expect(service.markRead).toHaveBeenCalledWith('notification-1', actor);
    expect(result).toMatchObject({
      id: 'notification-1',
      isRead: true,
    });
    expect(result.readAt).toEqual(expect.any(String));
  });
});
