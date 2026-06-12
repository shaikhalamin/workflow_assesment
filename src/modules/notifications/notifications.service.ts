import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

type NotificationInput = {
  recipientUserId?: string | null;
  recipientRoleSlug?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  workflowInstanceId?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  create(
    input: NotificationInput,
    notificationsRepository: Repository<Notification> = this
      .notificationsRepository,
  ): Promise<Notification> {
    return notificationsRepository.save(
      notificationsRepository.create({
        recipientUserId: input.recipientUserId ?? null,
        recipientRoleSlug: input.recipientRoleSlug ?? null,
        title: input.title,
        message: input.message,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
        workflowInstanceId: input.workflowInstanceId ?? null,
        isRead: false,
        readAt: null,
      }),
    );
  }

  createTaskAssigned(
    input: {
      assignedUserId?: string | null;
      assignedRoleSlug?: string | null;
      entityType: string;
      entityId: string;
      workflowInstanceId: string;
    },
    notificationsRepository?: Repository<Notification>,
  ) {
    return this.create(
      {
        recipientUserId: input.assignedUserId ?? null,
        recipientRoleSlug: input.assignedRoleSlug ?? null,
        title: 'Workflow task assigned',
        message: `${input.entityType} needs approval`,
        type: NotificationType.WORKFLOW_TASK_ASSIGNED,
        entityType: input.entityType,
        entityId: input.entityId,
        workflowInstanceId: input.workflowInstanceId,
      },
      notificationsRepository,
    );
  }

  createWorkflowApproved(input: {
    recipientUserId: string;
    entityType: string;
    entityId: string;
    workflowInstanceId: string;
  }) {
    return this.create({
      recipientUserId: input.recipientUserId,
      title: 'Workflow approved',
      message: `${input.entityType} was approved`,
      type: NotificationType.WORKFLOW_APPROVED,
      entityType: input.entityType,
      entityId: input.entityId,
      workflowInstanceId: input.workflowInstanceId,
    });
  }

  createWorkflowRejected(input: {
    recipientUserId: string;
    entityType: string;
    entityId: string;
    workflowInstanceId: string;
  }) {
    return this.create({
      recipientUserId: input.recipientUserId,
      title: 'Workflow rejected',
      message: `${input.entityType} was rejected`,
      type: NotificationType.WORKFLOW_REJECTED,
      entityType: input.entityType,
      entityId: input.entityId,
      workflowInstanceId: input.workflowInstanceId,
    });
  }

  createPaymentCreated(input: {
    recipientRoleSlug?: string | null;
    entityType: string;
    entityId: string;
    workflowInstanceId?: string | null;
  }) {
    return this.create({
      recipientRoleSlug: input.recipientRoleSlug ?? 'accounts-officer',
      title: 'Payment request created',
      message: 'A payment request is pending',
      type: NotificationType.PAYMENT_REQUEST_CREATED,
      entityType: input.entityType,
      entityId: input.entityId,
      workflowInstanceId: input.workflowInstanceId ?? null,
    });
  }

  createPaymentPaid(input: {
    recipientUserId?: string | null;
    entityType: string;
    entityId: string;
  }) {
    return this.create({
      recipientUserId: input.recipientUserId ?? null,
      title: 'Payment paid',
      message: 'A payment request was paid',
      type: NotificationType.PAYMENT_PAID,
      entityType: input.entityType,
      entityId: input.entityId,
      workflowInstanceId: null,
    });
  }

  createBillingApproved(input: {
    recipientUserId: string;
    entityId: string;
    workflowInstanceId: string;
  }) {
    return this.create({
      recipientUserId: input.recipientUserId,
      title: 'Billing request approved',
      message: 'A billing request was approved',
      type: NotificationType.BILLING_REQUEST_APPROVED,
      entityType: 'BillingRequest',
      entityId: input.entityId,
      workflowInstanceId: input.workflowInstanceId,
    });
  }

  createBillingRejected(input: {
    recipientUserId: string;
    entityId: string;
    workflowInstanceId: string;
  }) {
    return this.create({
      recipientUserId: input.recipientUserId,
      title: 'Billing request rejected',
      message: 'A billing request was rejected',
      type: NotificationType.BILLING_REQUEST_REJECTED,
      entityType: 'BillingRequest',
      entityId: input.entityId,
      workflowInstanceId: input.workflowInstanceId,
    });
  }

  createInvoiceCreated(input: {
    recipientUserId?: string | null;
    recipientRoleSlug?: string | null;
    entityId: string;
    workflowInstanceId: string;
  }) {
    return this.create({
      recipientUserId: input.recipientUserId ?? null,
      recipientRoleSlug: input.recipientRoleSlug ?? null,
      title: 'Invoice created',
      message: 'An invoice was issued',
      type: NotificationType.INVOICE_CREATED,
      entityType: 'Invoice',
      entityId: input.entityId,
      workflowInstanceId: input.workflowInstanceId,
    });
  }
}
