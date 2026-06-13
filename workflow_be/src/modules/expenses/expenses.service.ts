import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { paginateQb } from '../../common/http/paginate';
import { Paginated } from '../../common/http/paginated';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import {
  canResubmit,
  toIsoStringOrNull,
  toWorkflowUserResponse,
} from '../../common/workflow.utils';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ResubmitExpenseDto } from './dto/resubmit-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import {
  TriggerWorkflowResult,
  WorkflowRuntimeService,
} from '../workflow-runtime/workflow-runtime.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    private readonly workflowRuntimeService: WorkflowRuntimeService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateExpenseDto,
    actor: Express.User,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expensesRepository.save(
      this.expensesRepository.create({
        requesterId: actor.userId,
        createdById: actor.userId,
        departmentId: dto.departmentId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        amount: String(dto.amount),
        currency: dto.currency ?? 'BDT',
        category: dto.category,
        vendor: dto.vendor ?? null,
        itemValue: dto.itemValue == null ? null : String(dto.itemValue),
        price: dto.price == null ? null : String(dto.price),
        quantity: dto.quantity == null ? null : String(dto.quantity),
        status: ExpenseStatus.DRAFT,
        customFieldsJson: dto.customFieldsJson ?? null,
      }),
    );
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'EXPENSE_CREATED',
      entityType: 'Expense',
      entityId: expense.id,
      metadataJson: { amount: expense.amount },
    });
    return this.findOne(expense.id, actor);
  }

  async list(
    query: ExpenseQueryDto,
    actor: Express.User,
  ): Promise<Paginated<ExpenseResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const qb = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.requester', 'requester')
      .leftJoinAndSelect('expense.createdBy', 'createdBy')
      .orderBy('expense.createdAt', 'DESC');
    if (query.status) {
      qb.andWhere('expense.status = :status', { status: query.status });
    }
    if (!this.canReadAllExpenses(actor)) {
      const assignedExpenseIds =
        await this.workflowRuntimeService.assignedEntityIdsForActor(
          'Expense',
          actor,
        );
      qb.andWhere(
        new Brackets((where) => {
          where.where('expense.requesterId = :userId', {
            userId: actor.userId,
          });
          if (assignedExpenseIds.length) {
            where.orWhere('expense.id IN (:...assignedExpenseIds)', {
              assignedExpenseIds,
            });
          }
        }),
      );
    }
    const paginated = await paginateQb(qb, {
      page,
      limit,
      idColumn: 'expense.id',
    });
    return new Paginated(
      await Promise.all(
        paginated.items.map((expense) => this.toResponse(expense)),
      ),
      paginated.page,
      paginated.limit,
      paginated.total,
    );
  }

  async findOne(id: string, actor: Express.User): Promise<ExpenseResponseDto> {
    return this.toResponse(await this.findVisibleExpense(id, actor, true));
  }

  async update(
    id: string,
    dto: UpdateExpenseDto,
    actor: Express.User,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.findVisibleExpense(id, actor, false);
    if (expense.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can update expense');
    }
    if (
      ![ExpenseStatus.DRAFT, ExpenseStatus.REJECTED].includes(expense.status)
    ) {
      throw new BadRequestException(
        'Only draft or rejected expenses can be updated',
      );
    }
    Object.assign(expense, this.mapUpdate(dto));
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'EXPENSE_UPDATED',
      entityType: 'Expense',
      entityId: expense.id,
    });
    await this.expensesRepository.save(expense);
    return this.findOne(id, actor);
  }

  async submit(id: string, actor: Express.User): Promise<ExpenseResponseDto> {
    const expense = await this.expensesRepository.findOneBy({ id });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can submit expense');
    }
    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Only draft expenses can be submitted');
    }

    const oldStatus = expense.status;
    const oldWorkflowInstanceId = expense.workflowInstanceId;
    const oldSubmittedAt = expense.submittedAt;
    const oldRejectionReason = expense.rejectionReason;
    expense.status = ExpenseStatus.UNDER_REVIEW;
    expense.submittedAt = new Date();
    expense.rejectionReason = null;
    await this.expensesRepository.save(expense);

    let result: TriggerWorkflowResult;
    try {
      result = await this.workflowRuntimeService.trigger({
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        entityId: expense.id,
        requesterId: expense.requesterId,
        departmentId: expense.departmentId,
        metadata: this.workflowMetadata(expense),
      });
    } catch (error: unknown) {
      await this.restoreSubmitState(
        expense,
        oldStatus,
        oldWorkflowInstanceId,
        oldSubmittedAt,
        oldRejectionReason,
      );
      throw error;
    }
    if (result.status !== 'triggered') {
      await this.restoreSubmitState(
        expense,
        oldStatus,
        oldWorkflowInstanceId,
        oldSubmittedAt,
        oldRejectionReason,
      );
      throw new BadRequestException(
        'No published workflow applies to this expense request',
      );
    }

    expense.workflowInstanceId = result.workflowInstanceId;
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'EXPENSE_SUBMITTED',
      entityType: 'Expense',
      entityId: expense.id,
      workflowInstanceId: expense.workflowInstanceId,
      oldStatus,
      newStatus: ExpenseStatus.UNDER_REVIEW,
    });
    await this.expensesRepository.save(expense);
    return this.findOne(id, actor);
  }

  async resubmit(
    id: string,
    dto: ResubmitExpenseDto,
    actor: Express.User,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.findVisibleExpense(id, actor, false);
    if (expense.status !== ExpenseStatus.REJECTED) {
      throw new BadRequestException(
        'Only rejected expenses can be resubmitted',
      );
    }
    if (
      !(await canResubmit(
        expense,
        ExpenseStatus.REJECTED,
        (workflowInstanceId) =>
          this.workflowRuntimeService.allowsResubmission(workflowInstanceId),
      ))
    ) {
      throw new BadRequestException(
        'This expense workflow does not allow resubmission',
      );
    }
    await this.update(id, dto, actor);
    const updatedExpense = await this.findVisibleExpense(id, actor, false);
    updatedExpense.status = ExpenseStatus.DRAFT;
    updatedExpense.rejectionReason = null;
    await this.expensesRepository.save(updatedExpense);
    return this.submit(id, actor);
  }

  async delete(id: string, actor: Express.User): Promise<SuccessResponseDto> {
    const expense = await this.expensesRepository.findOneBy({ id });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can delete expense');
    }
    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft expenses can be deleted before approval submission',
      );
    }

    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'EXPENSE_DELETED',
      entityType: 'Expense',
      entityId: expense.id,
      oldStatus: expense.status,
    });
    await this.expensesRepository.remove(expense);
    return { success: true };
  }

  private async findVisibleExpense(
    id: string,
    actor: Express.User,
    withUsers: boolean,
  ): Promise<Expense> {
    const expense = withUsers
      ? await this.expensesRepository.findOne({
          where: { id },
          relations: { createdBy: true, requester: true },
        })
      : await this.expensesRepository.findOneBy({ id });
    if (!expense) throw new NotFoundException('Expense not found');

    if (!(await this.canSeeExpense(expense, actor))) {
      throw new BadRequestException('Expense is not visible to this user');
    }
    return expense;
  }

  private async restoreSubmitState(
    expense: Expense,
    oldStatus: ExpenseStatus,
    oldWorkflowInstanceId: string | null,
    oldSubmittedAt: Date | null,
    oldRejectionReason: string | null,
  ): Promise<void> {
    expense.status = oldStatus;
    expense.workflowInstanceId = oldWorkflowInstanceId;
    expense.submittedAt = oldSubmittedAt;
    expense.rejectionReason = oldRejectionReason;
    await this.expensesRepository.save(expense);
  }

  private async canSeeExpense(
    expense: Expense,
    actor: Express.User,
  ): Promise<boolean> {
    if (
      this.canReadAllExpenses(actor) ||
      expense.requesterId === actor.userId
    ) {
      return true;
    }
    return this.workflowRuntimeService.userHasEntityAssignment({
      entityType: 'Expense',
      entityId: expense.id,
      actor,
    });
  }

  private canReadAllExpenses(actor: Express.User): boolean {
    return actor.roles.some((role) =>
      [
        'admin',
        'accounts-officer',
        'finance-admin',
        'cfo',
        'manager',
        'department-reviewer',
      ].includes(role),
    );
  }

  private workflowMetadata(expense: Expense): Record<string, unknown> {
    return {
      title: expense.title,
      amount: Number(expense.amount),
      currency: expense.currency,
      category: expense.category,
      vendor: expense.vendor,
      itemValue: expense.itemValue ? Number(expense.itemValue) : null,
      price: expense.price ? Number(expense.price) : null,
      quantity: expense.quantity ? Number(expense.quantity) : null,
      departmentId: expense.departmentId,
      customFields: expense.customFieldsJson ?? {},
    };
  }

  private mapUpdate(dto: UpdateExpenseDto): Partial<Expense> {
    return {
      title: dto.title,
      description: dto.description,
      amount: dto.amount === undefined ? undefined : String(dto.amount),
      currency: dto.currency,
      category: dto.category,
      vendor: dto.vendor,
      itemValue: dto.itemValue == null ? dto.itemValue : String(dto.itemValue),
      price: dto.price == null ? dto.price : String(dto.price),
      quantity: dto.quantity == null ? dto.quantity : String(dto.quantity),
      departmentId: dto.departmentId,
      customFieldsJson: dto.customFieldsJson,
    };
  }

  private async toResponse(expense: Expense): Promise<ExpenseResponseDto> {
    return {
      id: expense.id,
      requesterId: expense.requesterId,
      requester: toWorkflowUserResponse(expense.requester),
      createdById: expense.createdById,
      createdBy: toWorkflowUserResponse(expense.createdBy),
      departmentId: expense.departmentId,
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      vendor: expense.vendor,
      itemValue: expense.itemValue,
      price: expense.price,
      quantity: expense.quantity,
      status: expense.status,
      workflowInstanceId: expense.workflowInstanceId,
      canResubmit: await canResubmit(
        expense,
        ExpenseStatus.REJECTED,
        (workflowInstanceId) =>
          this.workflowRuntimeService.allowsResubmission(workflowInstanceId),
      ),
      rejectionReason: expense.rejectionReason,
      customFieldsJson: expense.customFieldsJson,
      submittedAt: toIsoStringOrNull(expense.submittedAt),
      approvedAt: toIsoStringOrNull(expense.approvedAt),
      rejectedAt: toIsoStringOrNull(expense.rejectedAt),
      paidAt: toIsoStringOrNull(expense.paidAt),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    };
  }
}
