import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { paginateQb, paginateRepo } from '../../common/http/paginate';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ResubmitExpenseDto } from './dto/resubmit-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    private readonly workflowRuntimeService: WorkflowRuntimeService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateExpenseDto, actor: Express.User): Promise<Expense> {
    const expense = await this.expensesRepository.save(
      this.expensesRepository.create({
        requesterId: actor.userId,
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
    return expense;
  }

  list(query: ExpenseQueryDto, actor: Express.User) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const adminLike = actor.roles.some((role) =>
      ['admin', 'accounts-officer', 'finance-admin', 'cfo'].includes(role),
    );
    const qb = this.expensesRepository
      .createQueryBuilder('expense')
      .orderBy('expense.createdAt', 'DESC');
    if (query.status) {
      qb.andWhere('expense.status = :status', { status: query.status });
    }
    if (!adminLike) {
      qb.andWhere('expense.requesterId = :userId', { userId: actor.userId });
    }
    return paginateQb(qb, { page, limit, idColumn: 'expense.id' });
  }

  async findOne(id: string, actor: Express.User): Promise<Expense> {
    const expense = await this.expensesRepository.findOneBy({ id });
    if (!expense) throw new NotFoundException('Expense not found');
    const adminLike = actor.roles.some((role) =>
      ['admin', 'accounts-officer', 'finance-admin', 'cfo'].includes(role),
    );
    if (!adminLike && expense.requesterId !== actor.userId) {
      throw new BadRequestException('Expense is not visible to this user');
    }
    return expense;
  }

  async update(
    id: string,
    dto: UpdateExpenseDto,
    actor: Express.User,
  ): Promise<Expense> {
    const expense = await this.findOne(id, actor);
    if (expense.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can update expense');
    }
    if (![ExpenseStatus.DRAFT, ExpenseStatus.REJECTED].includes(expense.status)) {
      throw new BadRequestException('Only draft or rejected expenses can be updated');
    }
    Object.assign(expense, this.mapUpdate(dto));
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'EXPENSE_UPDATED',
      entityType: 'Expense',
      entityId: expense.id,
    });
    return this.expensesRepository.save(expense);
  }

  async submit(id: string, actor: Express.User): Promise<Expense> {
    const expense = await this.expensesRepository.findOneBy({ id });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can submit expense');
    }
    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Only draft expenses can be submitted');
    }

    const result = await this.workflowRuntimeService.trigger({
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      entityId: expense.id,
      requesterId: expense.requesterId,
      departmentId: expense.departmentId,
      metadata: this.workflowMetadata(expense),
    });

    expense.status = ExpenseStatus.UNDER_REVIEW;
    expense.workflowInstanceId =
      'workflowInstanceId' in result &&
      typeof result.workflowInstanceId === 'string'
        ? result.workflowInstanceId
        : null;
    expense.submittedAt = new Date();
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'EXPENSE_SUBMITTED',
      entityType: 'Expense',
      entityId: expense.id,
      workflowInstanceId: expense.workflowInstanceId,
      oldStatus: ExpenseStatus.DRAFT,
      newStatus: ExpenseStatus.UNDER_REVIEW,
    });
    return this.expensesRepository.save(expense);
  }

  async resubmit(
    id: string,
    dto: ResubmitExpenseDto,
    actor: Express.User,
  ): Promise<Expense> {
    const expense = await this.update(id, dto, actor);
    if (expense.status !== ExpenseStatus.REJECTED) {
      throw new BadRequestException('Only rejected expenses can be resubmitted');
    }
    expense.status = ExpenseStatus.DRAFT;
    expense.rejectionReason = null;
    await this.expensesRepository.save(expense);
    return this.submit(id, actor);
  }

  private workflowMetadata(expense: Expense): Record<string, unknown> {
    return {
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
}
