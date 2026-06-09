import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from '../expenses/entities/expense.entity';
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

@Injectable()
export class OutcomeHandlerService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(PaymentRequest)
    private readonly paymentsRepository: Repository<PaymentRequest>,
    @InjectRepository(LeaveRequest)
    private readonly leavesRepository: Repository<LeaveRequest>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleApproved(instance: WorkflowInstance): Promise<void> {
    if (instance.entityType === 'LeaveRequest') {
      await this.approveLeave(instance);
      return;
    }
    if (instance.entityType !== 'Expense') return;
    const expense = await this.expensesRepository.findOneBy({
      id: instance.entityId,
    });
    if (!expense) return;
    expense.status = ExpenseStatus.PAYMENT_PENDING;
    expense.approvedAt = new Date();
    await this.expensesRepository.save(expense);

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
    if (instance.entityType !== 'Expense') return;
    const expense = await this.expensesRepository.findOneBy({
      id: instance.entityId,
    });
    if (!expense) return;
    expense.status = ExpenseStatus.REJECTED;
    expense.rejectionReason = reason;
    expense.rejectedAt = new Date();
    await this.expensesRepository.save(expense);
  }

  private async approveLeave(instance: WorkflowInstance): Promise<void> {
    const leave = await this.leavesRepository.findOneBy({ id: instance.entityId });
    if (!leave) return;
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
    const leave = await this.leavesRepository.findOneBy({ id: instance.entityId });
    if (!leave) return;
    leave.status = LeaveRequestStatus.REJECTED;
    leave.rejectionReason = reason;
    leave.rejectedAt = new Date();
    await this.leavesRepository.save(leave);
  }
}
