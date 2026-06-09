import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from '../expenses/entities/expense.entity';
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

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
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
    const [draftExpenses, reviewExpenses, approvedLeaves, pendingLeaves] =
      await Promise.all([
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
      ]);

    return {
      expenses: { draft: draftExpenses, underReview: reviewExpenses },
      leaves: { approved: approvedLeaves, underReview: pendingLeaves },
      recentItems: [],
    };
  }

  async admin() {
    const [active, approved, rejected, failed] = await Promise.all([
      this.workflowInstancesRepository.countBy({
        status: WorkflowInstanceStatus.ACTIVE,
      }),
      this.workflowInstancesRepository.countBy({
        status: WorkflowInstanceStatus.APPROVED,
      }),
      this.workflowInstancesRepository.countBy({
        status: WorkflowInstanceStatus.REJECTED,
      }),
      this.workflowInstancesRepository.countBy({
        status: WorkflowInstanceStatus.FAILED,
      }),
    ]);
    return {
      workflows: { active, approved, rejected },
      recentWorkflowChanges: [],
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
    const [pendingPayments, paidPayments] = await Promise.all([
      this.paymentsRepository.countBy({ status: PaymentRequestStatus.PENDING }),
      this.paymentsRepository.countBy({ status: PaymentRequestStatus.PAID }),
    ]);
    return {
      accountsReviewTasks: 0,
      pendingPayments,
      paidAmountThisMonth: paidPayments,
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
}
