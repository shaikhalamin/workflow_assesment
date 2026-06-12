import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  BillingRequest,
  BillingRequestStatus,
} from '../billing/entities/billing-request.entity';
import { Expense, ExpenseStatus } from '../expenses/entities/expense.entity';
import { Invoice, InvoiceStatus } from '../invoices/entities/invoice.entity';
import {
  LeaveRequest,
  LeaveRequestStatus,
} from '../leaves/entities/leave-request.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from '../payments/entities/payment-request.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';

type WorkflowOutcomeAction = { type: string };

@Injectable()
export class OutcomeHandlerService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(PaymentRequest)
    private readonly paymentsRepository: Repository<PaymentRequest>,
    @InjectRepository(LeaveRequest)
    private readonly leavesRepository: Repository<LeaveRequest>,
    @InjectRepository(BillingRequest)
    private readonly billingRequestsRepository: Repository<BillingRequest>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async handleApproved(
    instance: WorkflowInstance,
    actions: Record<string, unknown> | null = null,
  ): Promise<void> {
    if (instance.entityType === 'LeaveRequest') {
      await this.approveLeave(instance);
      return;
    }
    if (instance.entityType === 'BillingRequest') {
      await this.approveBillingRequest(instance, actions);
      return;
    }
    if (instance.entityType !== 'Expense') return;
    const expense = await this.expensesRepository.findOneBy({
      id: instance.entityId,
    });
    if (!expense) return;
    if (expense.status !== ExpenseStatus.UNDER_REVIEW) return;
    const shouldCreatePayment = actions?.createPaymentRequest === true;
    expense.status = shouldCreatePayment
      ? ExpenseStatus.PAYMENT_PENDING
      : ExpenseStatus.APPROVED;
    expense.approvedAt = new Date();
    await this.expensesRepository.save(expense);
    if (!shouldCreatePayment) return;

    const existingPayment = await this.paymentsRepository.findOneBy({
      expenseId: expense.id,
    });
    if (!existingPayment) {
      const payment = await this.paymentsRepository.save(
        this.paymentsRepository.create({
          expenseId: expense.id,
          requesterId: expense.requesterId,
          amount: expense.amount,
          currency: expense.currency,
          status: PaymentRequestStatus.PENDING,
        }),
      );
      await this.notificationsService.createPaymentCreated({
        entityType: 'PaymentRequest',
        entityId: payment.id,
        workflowInstanceId: instance.id,
        recipientRoleSlug: 'accounts-officer',
      });
    }
  }

  async handleRejected(
    instance: WorkflowInstance,
    reason: string,
  ): Promise<void> {
    if (instance.entityType === 'LeaveRequest') {
      await this.rejectLeave(instance, reason);
      return;
    }
    if (instance.entityType === 'BillingRequest') {
      await this.rejectBillingRequest(instance, reason);
      return;
    }
    if (instance.entityType !== 'Expense') return;
    const expense = await this.expensesRepository.findOneBy({
      id: instance.entityId,
    });
    if (!expense) return;
    if (expense.status !== ExpenseStatus.UNDER_REVIEW) return;
    expense.status = ExpenseStatus.REJECTED;
    expense.rejectionReason = reason;
    expense.rejectedAt = new Date();
    await this.expensesRepository.save(expense);
  }

  private async approveLeave(instance: WorkflowInstance): Promise<void> {
    const leave = await this.leavesRepository.findOneBy({
      id: instance.entityId,
    });
    if (!leave) return;
    if (leave.status !== LeaveRequestStatus.UNDER_REVIEW) return;
    leave.status = LeaveRequestStatus.APPROVED;
    leave.approvedAt = new Date();
    leave.approvedPeriodJson = {
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveDays: leave.leaveDays,
    };
    await this.leavesRepository.save(leave);
  }

  private async rejectLeave(
    instance: WorkflowInstance,
    reason: string,
  ): Promise<void> {
    const leave = await this.leavesRepository.findOneBy({
      id: instance.entityId,
    });
    if (!leave) return;
    if (leave.status !== LeaveRequestStatus.UNDER_REVIEW) return;
    leave.status = LeaveRequestStatus.REJECTED;
    leave.rejectionReason = reason;
    leave.rejectedAt = new Date();
    await this.leavesRepository.save(leave);
  }

  private async approveBillingRequest(
    instance: WorkflowInstance,
    actions: Record<string, unknown> | null,
  ): Promise<void> {
    const billingRequest = await this.billingRequestsRepository.findOneBy({
      id: instance.entityId,
    });
    if (!billingRequest) return;
    if (
      ![
        BillingRequestStatus.UNDER_REVIEW,
        BillingRequestStatus.APPROVED,
        BillingRequestStatus.INVOICED,
      ].includes(billingRequest.status)
    ) {
      return;
    }

    const actionTypes = this.outcomeActionTypes(actions);
    if (
      actionTypes.includes('MARK_BILLING_APPROVED') &&
      billingRequest.status === BillingRequestStatus.UNDER_REVIEW
    ) {
      billingRequest.status = BillingRequestStatus.APPROVED;
      billingRequest.approvedAt = new Date();
      billingRequest.rejectionReason = null;
      await this.billingRequestsRepository.save(billingRequest);
      await this.auditLogsService.record({
        actorUserId: null,
        action: 'BILLING_REQUEST_APPROVED',
        entityType: 'BillingRequest',
        entityId: billingRequest.id,
        workflowInstanceId: instance.id,
        oldStatus: BillingRequestStatus.UNDER_REVIEW,
        newStatus: BillingRequestStatus.APPROVED,
      });
      await this.notificationsService.createBillingApproved({
        recipientUserId: billingRequest.requesterId,
        entityId: billingRequest.id,
        workflowInstanceId: instance.id,
      });
    }

    if (actionTypes.includes('CREATE_INVOICE')) {
      await this.createInvoiceForBillingRequest(billingRequest, instance);
    }
  }

  private async createInvoiceForBillingRequest(
    billingRequest: BillingRequest,
    instance: WorkflowInstance,
  ): Promise<Invoice> {
    const existingInvoice = await this.invoicesRepository.findOneBy({
      billingRequestId: billingRequest.id,
    });
    if (existingInvoice) {
      if (
        billingRequest.invoiceId !== existingInvoice.id ||
        billingRequest.status !== BillingRequestStatus.INVOICED
      ) {
        billingRequest.invoiceId = existingInvoice.id;
        billingRequest.status = BillingRequestStatus.INVOICED;
        await this.billingRequestsRepository.save(billingRequest);
      }
      return existingInvoice;
    }

    const issuedAt = new Date();
    const invoice = await this.invoicesRepository.save(
      this.invoicesRepository.create({
        billingRequestId: billingRequest.id,
        invoiceNumber: await this.nextInvoiceNumber(issuedAt),
        requesterId: billingRequest.requesterId,
        departmentId: billingRequest.departmentId,
        customerName: billingRequest.customerName,
        customerEmail: billingRequest.customerEmail,
        customerAddress: billingRequest.customerAddress,
        title: billingRequest.title,
        description: billingRequest.description,
        amount: billingRequest.amount,
        currency: billingRequest.currency,
        dueDate: this.dueDateFromIssuedAt(issuedAt),
        status: InvoiceStatus.ISSUED,
        issuedAt,
        cancelledAt: null,
        paidAt: null,
      }),
    );

    billingRequest.invoiceId = invoice.id;
    billingRequest.status = BillingRequestStatus.INVOICED;
    await this.billingRequestsRepository.save(billingRequest);
    await this.auditLogsService.record({
      actorUserId: null,
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      workflowInstanceId: instance.id,
      newStatus: InvoiceStatus.ISSUED,
      metadataJson: { billingRequestId: billingRequest.id },
    });
    await this.notificationsService.createInvoiceCreated({
      recipientUserId: billingRequest.requesterId,
      entityId: invoice.id,
      workflowInstanceId: instance.id,
    });
    await this.notificationsService.createInvoiceCreated({
      recipientRoleSlug: 'accounts-officer',
      entityId: invoice.id,
      workflowInstanceId: instance.id,
    });
    return invoice;
  }

  private async rejectBillingRequest(
    instance: WorkflowInstance,
    reason: string,
  ): Promise<void> {
    const billingRequest = await this.billingRequestsRepository.findOneBy({
      id: instance.entityId,
    });
    if (!billingRequest) return;
    billingRequest.status = BillingRequestStatus.REJECTED;
    billingRequest.rejectionReason = reason;
    billingRequest.rejectedAt = new Date();
    await this.billingRequestsRepository.save(billingRequest);
    await this.auditLogsService.record({
      actorUserId: null,
      action: 'BILLING_REQUEST_REJECTED',
      entityType: 'BillingRequest',
      entityId: billingRequest.id,
      workflowInstanceId: instance.id,
      oldStatus: BillingRequestStatus.UNDER_REVIEW,
      newStatus: BillingRequestStatus.REJECTED,
      reason,
    });
    await this.notificationsService.createBillingRejected({
      recipientUserId: billingRequest.requesterId,
      entityId: billingRequest.id,
      workflowInstanceId: instance.id,
    });
  }

  private outcomeActionTypes(
    actions: Record<string, unknown> | null,
  ): string[] {
    const configuredActions = actions?.actions;
    if (!Array.isArray(configuredActions)) return [];
    return configuredActions.flatMap((action) =>
      this.isWorkflowOutcomeAction(action) ? [action.type] : [],
    );
  }

  private isWorkflowOutcomeAction(
    value: unknown,
  ): value is WorkflowOutcomeAction {
    if (typeof value !== 'object' || value === null || !('type' in value)) {
      return false;
    }
    const action = value;
    return typeof action.type === 'string';
  }

  private async nextInvoiceNumber(issuedAt: Date): Promise<string> {
    const datePart = issuedAt.toISOString().slice(0, 10).replaceAll('-', '');
    const prefix = `INV-${datePart}`;
    const sequence =
      (await this.invoicesRepository.countBy({
        invoiceNumber: Like(`${prefix}-%`),
      })) + 1;
    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  private dueDateFromIssuedAt(issuedAt: Date): string {
    const dueDate = new Date(issuedAt);
    dueDate.setUTCDate(dueDate.getUTCDate() + 30);
    return dueDate.toISOString().slice(0, 10);
  }
}
