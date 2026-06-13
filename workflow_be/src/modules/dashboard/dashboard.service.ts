import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOperator,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
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
import {
  PaymentRequest,
  PaymentRequestStatus,
} from '../payments/entities/payment-request.entity';
import { WorkflowInstance } from '../workflow-runtime/entities/workflow-instance.entity';
import { WorkflowStep } from '../workflow-runtime/entities/workflow-step.entity';
import {
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from '../workflow-runtime/enums/workflow-runtime.enums';
import { DashboardDateRangeQueryDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(BillingRequest)
    private readonly billingRequestsRepository: Repository<BillingRequest>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(LeaveRequest)
    private readonly leavesRepository: Repository<LeaveRequest>,
    @InjectRepository(WorkflowStep)
    private readonly workflowStepsRepository: Repository<WorkflowStep>,
    @InjectRepository(PaymentRequest)
    private readonly paymentsRepository: Repository<PaymentRequest>,
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstancesRepository: Repository<WorkflowInstance>,
  ) {}

  async employee(actor: Express.User) {
    const [
      draftExpenses,
      reviewExpenses,
      approvedLeaves,
      pendingLeaves,
      draftBillingRequests,
      reviewBillingRequests,
      rejectedBillingRequests,
      invoicedBillingRequests,
      recentInvoices,
    ] = await Promise.all([
      this.expensesRepository.countBy({
        requesterId: actor.userId,
        status: ExpenseStatus.DRAFT,
      }),
      this.expensesRepository.countBy({
        requesterId: actor.userId,
        status: ExpenseStatus.UNDER_REVIEW,
      }),
      this.leavesRepository.countBy({
        requesterId: actor.userId,
        status: LeaveRequestStatus.APPROVED,
      }),
      this.leavesRepository.countBy({
        requesterId: actor.userId,
        status: LeaveRequestStatus.UNDER_REVIEW,
      }),
      this.billingRequestsRepository.countBy({
        requesterId: actor.userId,
        status: BillingRequestStatus.DRAFT,
      }),
      this.billingRequestsRepository.countBy({
        requesterId: actor.userId,
        status: BillingRequestStatus.UNDER_REVIEW,
      }),
      this.billingRequestsRepository.countBy({
        requesterId: actor.userId,
        status: BillingRequestStatus.REJECTED,
      }),
      this.billingRequestsRepository.countBy({
        requesterId: actor.userId,
        status: BillingRequestStatus.INVOICED,
      }),
      this.invoicesRepository.find({
        where: { requesterId: actor.userId },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      expenses: { draft: draftExpenses, underReview: reviewExpenses },
      leaves: { approved: approvedLeaves, underReview: pendingLeaves },
      billing: {
        draft: draftBillingRequests,
        submitted: 0,
        underReview: reviewBillingRequests,
        approved: 0,
        rejected: rejectedBillingRequests,
        invoiced: invoicedBillingRequests,
        cancelled: 0,
      },
      recentInvoices: recentInvoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        createdAt: invoice.createdAt.toISOString(),
      })),
      recentItems: [],
    };
  }

  async admin(query: DashboardDateRangeQueryDto = {}) {
    const createdAt = this.createdAtCondition(query);
    const workflowWhere = createdAt ? { createdAt } : {};
    const billingWhere = createdAt ? { createdAt } : {};
    const invoiceWhere = createdAt ? { createdAt } : {};
    const paymentWhere = createdAt ? { createdAt } : {};
    const [
      active,
      approved,
      rejected,
      failed,
      billingDraft,
      billingSubmitted,
      billingUnderReview,
      billingApproved,
      billingRejected,
      billingInvoiced,
      billingCancelled,
      issuedInvoices,
      paidInvoices,
      cancelledInvoices,
      pendingPayments,
      paidPayments,
      cancelledPayments,
      recentWorkflowChanges,
    ] = await Promise.all([
      this.workflowInstancesRepository.countBy({
        ...workflowWhere,
        status: WorkflowInstanceStatus.ACTIVE,
      }),
      this.workflowInstancesRepository.countBy({
        ...workflowWhere,
        status: WorkflowInstanceStatus.APPROVED,
      }),
      this.workflowInstancesRepository.countBy({
        ...workflowWhere,
        status: WorkflowInstanceStatus.REJECTED,
      }),
      this.workflowInstancesRepository.countBy({
        ...workflowWhere,
        status: WorkflowInstanceStatus.FAILED,
      }),
      this.billingRequestsRepository.countBy({
        ...billingWhere,
        status: BillingRequestStatus.DRAFT,
      }),
      this.billingRequestsRepository.countBy({
        ...billingWhere,
        status: BillingRequestStatus.SUBMITTED,
      }),
      this.billingRequestsRepository.countBy({
        ...billingWhere,
        status: BillingRequestStatus.UNDER_REVIEW,
      }),
      this.billingRequestsRepository.countBy({
        ...billingWhere,
        status: BillingRequestStatus.APPROVED,
      }),
      this.billingRequestsRepository.countBy({
        ...billingWhere,
        status: BillingRequestStatus.REJECTED,
      }),
      this.billingRequestsRepository.countBy({
        ...billingWhere,
        status: BillingRequestStatus.INVOICED,
      }),
      this.billingRequestsRepository.countBy({
        ...billingWhere,
        status: BillingRequestStatus.CANCELLED,
      }),
      this.invoicesRepository.countBy({
        ...invoiceWhere,
        status: InvoiceStatus.ISSUED,
      }),
      this.invoicesRepository.countBy({
        ...invoiceWhere,
        status: InvoiceStatus.PAID,
      }),
      this.invoicesRepository.countBy({
        ...invoiceWhere,
        status: InvoiceStatus.CANCELLED,
      }),
      this.paymentsRepository.countBy({
        ...paymentWhere,
        status: PaymentRequestStatus.PENDING,
      }),
      this.paymentsRepository.countBy({
        ...paymentWhere,
        status: PaymentRequestStatus.PAID,
      }),
      this.paymentsRepository.countBy({
        ...paymentWhere,
        status: PaymentRequestStatus.CANCELLED,
      }),
      this.workflowInstancesRepository.find({
        where: workflowWhere,
        order: { updatedAt: 'DESC' },
        take: 5,
      }),
    ]);
    return {
      workflows: { active, approved, rejected, failed },
      billing: {
        draft: billingDraft,
        submitted: billingSubmitted,
        underReview: billingUnderReview,
        approved: billingApproved,
        rejected: billingRejected,
        invoiced: billingInvoiced,
        cancelled: billingCancelled,
      },
      invoices: {
        issued: issuedInvoices,
        paid: paidInvoices,
        cancelled: cancelledInvoices,
      },
      payments: {
        pending: pendingPayments,
        paid: paidPayments,
        cancelled: cancelledPayments,
      },
      recentWorkflowChanges: recentWorkflowChanges.map((workflow) => ({
        id: workflow.id,
        type: workflow.entityType,
        title: workflow.eventName,
        createdAt: workflow.createdAt.toISOString(),
      })),
      failedTriggers: failed,
    };
  }

  async approver(actor: Express.User) {
    const pendingTasks = await this.workflowStepsRepository
      .createQueryBuilder('step')
      .where('step.status = :status', { status: WorkflowStepStatus.ACTIVE })
      .andWhere(
        '(step.assignedUserId = :userId OR step.assignedRoleSlug IN (:...roles))',
        {
          userId: actor.userId,
          roles: actor.roles.length ? actor.roles : ['__none__'],
        },
      )
      .getCount();
    const actedTasks = await this.workflowStepsRepository.countBy({
      actionByUserId: actor.userId,
    });
    return {
      pendingTasks,
      actedTasks,
      overdueTasks: 0,
      averageApprovalTimeHours: 0,
    };
  }

  async accounts() {
    const [
      pendingPayments,
      paidPayments,
      billingApprovalTasks,
      issuedInvoices,
    ] = await Promise.all([
      this.paymentsRepository.countBy({ status: PaymentRequestStatus.PENDING }),
      this.paymentsRepository.countBy({ status: PaymentRequestStatus.PAID }),
      this.workflowStepsRepository
        .createQueryBuilder('step')
        .innerJoin('step.workflowInstance', 'instance')
        .where('step.status = :status', { status: WorkflowStepStatus.ACTIVE })
        .andWhere('step.assignedRoleSlug = :role', {
          role: 'accounts-officer',
        })
        .andWhere('instance.entityType = :entityType', {
          entityType: 'BillingRequest',
        })
        .getCount(),
      this.invoicesRepository.countBy({ status: InvoiceStatus.ISSUED }),
    ]);
    return {
      accountsReviewTasks: billingApprovalTasks,
      pendingPayments,
      paidAmountThisMonth: paidPayments,
      issuedInvoices,
    };
  }

  async finance() {
    const [issued, paid, cancelled] = await Promise.all([
      this.invoicesRepository.countBy({ status: InvoiceStatus.ISSUED }),
      this.invoicesRepository.countBy({ status: InvoiceStatus.PAID }),
      this.invoicesRepository.countBy({ status: InvoiceStatus.CANCELLED }),
    ]);
    return {
      invoices: { issued, paid, cancelled },
    };
  }

  async hr() {
    const [approved, rejected, underReview] = await Promise.all([
      this.leavesRepository.countBy({ status: LeaveRequestStatus.APPROVED }),
      this.leavesRepository.countBy({ status: LeaveRequestStatus.REJECTED }),
      this.leavesRepository.countBy({
        status: LeaveRequestStatus.UNDER_REVIEW,
      }),
    ]);
    return {
      leaveTasks: underReview,
      leaveCounts: { approved, rejected },
    };
  }

  private createdAtCondition({
    from,
    to,
  }: DashboardDateRangeQueryDto): Date | FindOperator<Date> | undefined {
    if (from && to) return Between(this.startOfDay(from), this.endOfDay(to));
    if (from) return MoreThanOrEqual(this.startOfDay(from));
    if (to) return LessThanOrEqual(this.endOfDay(to));
    return undefined;
  }

  private startOfDay(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private endOfDay(value: string) {
    return new Date(`${value}T23:59:59.999Z`);
  }
}
