import type { Repository } from 'typeorm';
import type { MailerService } from '../../mailer/mailer.service';
import type { Role } from '../rbac/entities/role.entity';
import type { UserRole } from '../rbac/entities/user-role.entity';
import type { User } from '../users/entities/user.entity';
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

  function createService(input: {
    notificationsRepository: Repository<Notification>;
    pushQueue?: Pick<NotificationPushQueue, 'enqueue'>;
    mailerService?: Pick<MailerService, 'enqueue'>;
    usersRepository?: Pick<Repository<User>, 'findOne'>;
    userRolesRepository?: Pick<Repository<UserRole>, 'findOne'>;
  }) {
    return new NotificationsService(
      input.notificationsRepository,
      (input.pushQueue ?? {
        enqueue: jest.fn(() => Promise.resolve()),
      }) as NotificationPushQueue,
      (input.mailerService ?? {
        enqueue: jest.fn(() => Promise.resolve()),
      }) as MailerService,
      (input.usersRepository ?? {
        findOne: jest.fn(() => Promise.resolve(null)),
      }) as Repository<User>,
      (input.userRolesRepository ?? {
        findOne: jest.fn(() => Promise.resolve(null)),
      }) as Repository<UserRole>,
    );
  }

  it('saves the notification and enqueues selected push and email channels', async () => {
    const { repository, create, save } = createRepository();
    const pushQueue = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<NotificationPushQueue, 'enqueue'>;
    const mailerService = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<MailerService, 'enqueue'>;
    const service = createService({
      notificationsRepository: repository,
      pushQueue,
      mailerService,
    });

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
    const service = createService({
      notificationsRepository: repository,
      pushQueue,
      mailerService,
    });

    const notification = await service.createTaskAssigned({
      assignedUserId: 'manager-1',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true },
    });

    expect(pushQueue.enqueue).toHaveBeenCalledWith(notification);
  });

  it('builds the default notification email for a recipient user', async () => {
    const { repository } = createRepository();
    const mailerService = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<MailerService, 'enqueue'>;
    const usersRepository = {
      findOne: jest.fn(() =>
        Promise.resolve({
          id: 'manager-1',
          email: 'manager@example.com',
        } as User),
      ),
    } satisfies Pick<Repository<User>, 'findOne'>;
    const service = createService({
      notificationsRepository: repository,
      mailerService,
      usersRepository,
    });

    await service.createTaskAssigned({
      assignedUserId: 'manager-1',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      channels: { email: true },
    });

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'manager-1', isActive: true },
      select: { id: true, email: true },
    });
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

  it('builds the default notification email for the first active role user', async () => {
    const { repository } = createRepository();
    const mailerService = {
      enqueue: jest.fn(() => Promise.resolve()),
    } satisfies Pick<MailerService, 'enqueue'>;
    const userRolesRepository = {
      findOne: jest.fn(() =>
        Promise.resolve({
          user: {
            id: 'accounts-1',
            email: 'accounts@example.com',
          } as User,
          role: {
            slug: 'accounts-officer',
          } as Role,
        } as UserRole),
      ),
    } satisfies Pick<Repository<UserRole>, 'findOne'>;
    const service = createService({
      notificationsRepository: repository,
      mailerService,
      userRolesRepository,
    });

    await service.createPaymentCreated({
      recipientRoleSlug: 'accounts-officer',
      entityType: 'PaymentRequest',
      entityId: 'payment-1',
      workflowInstanceId: 'workflow-1',
      channels: { email: true },
    });

    expect(userRolesRepository.findOne).toHaveBeenCalledWith({
      where: {
        role: { slug: 'accounts-officer' },
        user: { isActive: true },
      },
      relations: { role: true, user: true },
      order: { createdAt: 'ASC' },
    });
    expect(mailerService.enqueue).toHaveBeenCalledWith({
      template: 'notification',
      to: 'accounts@example.com',
      subject: 'Payment request created',
      props: {
        recipientEmail: 'accounts@example.com',
        title: 'Payment request created',
        message: 'A payment request is pending',
      },
    });
  });
});
