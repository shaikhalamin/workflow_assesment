import { BadRequestException } from '@nestjs/common';
import type { TriggerWorkflowDto } from '../workflow-runtime/dto/trigger-workflow.dto';
import { WorkflowStepStatus } from '../workflow-runtime/enums/workflow-runtime.enums';
import type { TriggerWorkflowResult } from '../workflow-runtime/workflow-runtime.service';
import { ExpensesService } from './expenses.service';
import { ExpenseStatus } from './entities/expense.entity';

describe('ExpensesService', () => {
  it('stores the actor as requester and creator when creating an expense', async () => {
    const repo = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockImplementation((value) =>
        Promise.resolve({
          id: 'expense-1',
          createdAt: new Date('2026-06-10T08:00:00.000Z'),
          updatedAt: new Date('2026-06-10T08:00:00.000Z'),
          ...value,
        }),
      ),
      findOne: jest.fn().mockResolvedValue({
        id: 'expense-1',
        requesterId: 'requester-1',
        requester: null,
        createdById: 'requester-1',
        createdBy: null,
        departmentId: null,
        title: 'Laptop reimbursement',
        description: null,
        amount: '4500',
        currency: 'BDT',
        category: 'Software',
        vendor: null,
        itemValue: null,
        price: null,
        quantity: null,
        status: ExpenseStatus.DRAFT,
        workflowInstanceId: null,
        rejectionReason: null,
        customFieldsJson: null,
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
        paidAt: null,
        createdAt: new Date('2026-06-10T08:00:00.000Z'),
        updatedAt: new Date('2026-06-10T08:00:00.000Z'),
      }),
    };
    const service = new ExpensesService(
      repo as never,
      {} as never,
      {} as never,
    );

    await service.create(
      {
        title: 'Laptop reimbursement',
        amount: 4500,
        category: 'Software',
      },
      { userId: 'requester-1', roles: [] } as never,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 'requester-1',
        createdById: 'requester-1',
      }),
    );
  });

  it('loads requester and creator relations for expense detail responses', async () => {
    const createdAt = new Date('2026-06-10T08:00:00.000Z');
    const requester = {
      id: 'requester-1',
      name: 'Expense Requester',
      email: 'requester@example.com',
    };
    const creator = {
      id: 'creator-1',
      name: 'Expense Creator',
      email: 'creator@example.com',
    };
    const repo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'expense-1',
        requesterId: 'requester-1',
        requester,
        createdById: 'creator-1',
        createdBy: creator,
        departmentId: 'dept-1',
        title: 'Laptop reimbursement',
        description: null,
        amount: '4500',
        currency: 'BDT',
        category: 'Software',
        vendor: null,
        itemValue: null,
        price: null,
        quantity: null,
        status: ExpenseStatus.DRAFT,
        workflowInstanceId: null,
        rejectionReason: null,
        customFieldsJson: null,
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
        paidAt: null,
        createdAt,
        updatedAt: createdAt,
      }),
    };
    const service = new ExpensesService(
      repo as never,
      {} as never,
      {} as never,
    );

    const response = await service.findOne('expense-1', {
      userId: 'requester-1',
      roles: [],
    } as never);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'expense-1' },
      relations: { createdBy: true, requester: true },
    });
    expect(response.requester).toEqual(requester);
    expect(response.createdBy).toEqual(creator);
  });

  it('marks rejected expenses as resubmittable when the workflow allows it', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'expense-1',
        requesterId: 'requester-1',
        requester: null,
        createdById: 'requester-1',
        createdBy: null,
        departmentId: 'dept-1',
        title: 'Laptop reimbursement',
        description: null,
        amount: '4500',
        currency: 'BDT',
        category: 'Software',
        vendor: null,
        itemValue: null,
        price: null,
        quantity: null,
        status: ExpenseStatus.REJECTED,
        workflowInstanceId: 'workflow-1',
        rejectionReason: 'Receipt missing',
        customFieldsJson: null,
        submittedAt: new Date('2026-06-10T08:00:00.000Z'),
        approvedAt: null,
        rejectedAt: new Date('2026-06-11T08:00:00.000Z'),
        paidAt: null,
        createdAt: new Date('2026-06-10T08:00:00.000Z'),
        updatedAt: new Date('2026-06-11T08:00:00.000Z'),
      }),
    };
    const runtime = {
      allowsResubmission: jest.fn().mockResolvedValue(true),
    };
    const service = new ExpensesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    const response = await service.findOne('expense-1', {
      userId: 'requester-1',
      roles: [],
    } as never);

    expect(runtime.allowsResubmission).toHaveBeenCalledWith('workflow-1');
    expect(response.canResubmit).toBe(true);
  });

  it('submits a draft expense and triggers workflow metadata', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      title: 'Travel',
      amount: '7500',
      currency: 'BDT',
      category: 'travel',
      status: ExpenseStatus.DRAFT,
      customFieldsJson: {},
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      findOne: jest.fn().mockResolvedValue({
        ...expense,
        requester: null,
        createdById: 'user-1',
        createdBy: null,
        description: null,
        vendor: null,
        itemValue: null,
        price: null,
        quantity: null,
        workflowInstanceId: 'wi-1',
        rejectionReason: null,
        submittedAt: new Date('2026-06-11T08:00:00.000Z'),
        approvedAt: null,
        rejectedAt: null,
        paidAt: null,
        createdAt: new Date('2026-06-10T08:00:00.000Z'),
        updatedAt: new Date('2026-06-11T08:00:00.000Z'),
      }),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const runtime: {
      trigger: jest.Mock<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>;
    } = {
      trigger: jest
        .fn<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>()
        .mockResolvedValue({
          status: 'triggered',
          workflowInstanceId: 'wi-1',
          activeStep: {
            id: 'step-1',
            stepName: 'Review',
            stepOrder: 1,
            assignedUserId: null,
            assignedRoleSlug: 'manager',
            status: WorkflowStepStatus.ACTIVE,
          },
        }),
    };
    const service = new ExpensesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    await service.submit('expense-1', { userId: 'user-1', roles: [] } as never);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExpenseStatus.UNDER_REVIEW,
        workflowInstanceId: 'wi-1',
      }),
    );
    const triggerCall = runtime.trigger.mock.calls[0]?.[0];
    expect(triggerCall?.metadata).toEqual(
      expect.objectContaining({
        title: 'Travel',
        amount: 7500,
        currency: 'BDT',
      }),
    );
  });

  it('rejects submitting a draft expense when no published workflow applies', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      title: 'Travel',
      amount: '7500',
      currency: 'BDT',
      category: 'travel',
      status: ExpenseStatus.DRAFT,
      customFieldsJson: {},
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      findOne: jest.fn().mockResolvedValue({
        ...expense,
        requester: null,
        createdById: 'user-1',
        createdBy: null,
        description: null,
        vendor: null,
        itemValue: null,
        price: null,
        quantity: null,
        workflowInstanceId: null,
        rejectionReason: null,
        submittedAt: new Date('2026-06-11T08:00:00.000Z'),
        approvedAt: null,
        rejectedAt: null,
        paidAt: null,
        createdAt: new Date('2026-06-10T08:00:00.000Z'),
        updatedAt: new Date('2026-06-11T08:00:00.000Z'),
      }),
      save: jest.fn(),
    };
    const runtime = {
      trigger: jest.fn().mockResolvedValue({ status: 'skipped' }),
    };
    const service = new ExpensesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    await expect(
      service.submit('expense-1', { userId: 'user-1', roles: [] } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(expense.status).toBe(ExpenseStatus.DRAFT);
  });

  it('rejects submit by a non-owner', async () => {
    const service = new ExpensesService(
      {
        findOneBy: jest.fn().mockResolvedValue({ requesterId: 'owner-1' }),
      } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.submit('expense-1', { userId: 'other-1' } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects resubmit by a non-owner', async () => {
    const service = new ExpensesService(
      {
        findOneBy: jest.fn().mockResolvedValue({
          requesterId: 'owner-1',
          status: ExpenseStatus.REJECTED,
        }),
      } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.resubmit('expense-1', {}, { userId: 'other-1', roles: [] } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resubmits a rejected expense with edited fields and triggers workflow', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      title: 'Old title',
      description: 'Old note',
      amount: '1000',
      currency: 'BDT',
      category: 'Travel',
      vendor: 'Old vendor',
      itemValue: null,
      price: null,
      quantity: null,
      status: ExpenseStatus.REJECTED,
      workflowInstanceId: 'workflow-1',
      rejectionReason: 'Receipt missing',
      customFieldsJson: {},
    };
    const savedValues: unknown[] = [];
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      findOne: jest.fn().mockResolvedValue({
        ...expense,
        requester: null,
        createdById: 'user-1',
        createdBy: null,
        submittedAt: new Date('2026-06-11T08:00:00.000Z'),
        approvedAt: null,
        rejectedAt: null,
        paidAt: null,
        createdAt: new Date('2026-06-10T08:00:00.000Z'),
        updatedAt: new Date('2026-06-11T08:00:00.000Z'),
      }),
      save: jest.fn().mockImplementation((value) => {
        savedValues.push({ ...value });
        return Promise.resolve(value);
      }),
    };
    const runtime: {
      allowsResubmission: jest.Mock<Promise<boolean>, [string]>;
      trigger: jest.Mock<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>;
    } = {
      allowsResubmission: jest.fn<Promise<boolean>, [string]>().mockResolvedValue(true),
      trigger: jest.fn<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>().mockResolvedValue({
        status: 'triggered',
        workflowInstanceId: 'workflow-2',
        activeStep: {
          id: 'step-1',
          stepName: 'Review',
          stepOrder: 1,
          assignedUserId: null,
          assignedRoleSlug: 'manager',
          status: WorkflowStepStatus.ACTIVE,
        },
      }),
    };
    const service = new ExpensesService(repo as never, runtime as never, {} as never);

    await service.resubmit(
      'expense-1',
      {
        title: 'Updated title',
        amount: 1250,
        category: 'Meal',
        vendor: 'Updated vendor',
        description: 'Updated note',
      },
      { userId: 'user-1', roles: [] } as never,
    );

    expect(runtime.allowsResubmission).toHaveBeenCalledWith('workflow-1');
    expect(expense.title).toBe('Updated title');
    expect(expense.amount).toBe('1250');
    expect(expense.category).toBe('Meal');
    expect(expense.vendor).toBe('Updated vendor');
    expect(expense.description).toBe('Updated note');
    expect(expense.rejectionReason).toBeNull();
    expect(expense.status).toBe(ExpenseStatus.UNDER_REVIEW);
    expect(expense.workflowInstanceId).toBe('workflow-2');
    expect(runtime.trigger).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityId: 'expense-1',
        metadata: expect.objectContaining({
          title: 'Updated title',
          amount: 1250,
          category: 'Meal',
          vendor: 'Updated vendor',
        }),
      }),
    );
    expect(savedValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Updated title',
          amount: '1250',
        }),
        expect.objectContaining({
          status: ExpenseStatus.DRAFT,
          rejectionReason: null,
        }),
        expect.objectContaining({
          status: ExpenseStatus.UNDER_REVIEW,
          workflowInstanceId: 'workflow-2',
        }),
      ]),
    );
  });

  it('rejects resubmitting an expense when the workflow disallows it', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'user-1',
      status: ExpenseStatus.REJECTED,
      workflowInstanceId: 'workflow-1',
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn(),
    };
    const runtime = {
      allowsResubmission: jest.fn().mockResolvedValue(false),
    };
    const service = new ExpensesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    await expect(
      service.resubmit('expense-1', {}, {
        userId: 'user-1',
        roles: [],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(runtime.allowsResubmission).toHaveBeenCalledWith('workflow-1');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('deletes a draft expense owned by the requester', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'requester-1',
      status: ExpenseStatus.DRAFT,
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      remove: jest.fn().mockResolvedValue(expense),
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ExpensesService(
      repo as never,
      {} as never,
      auditLogs as never,
    );

    const response = await service.delete('expense-1', {
      userId: 'requester-1',
      roles: [],
    } as never);

    expect(repo.remove).toHaveBeenCalledWith(expense);
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPENSE_DELETED',
        entityId: 'expense-1',
      }),
    );
    expect(response).toEqual({ success: true });
  });

  it('rejects deleting an expense after it is submitted for approval', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'expense-1',
        requesterId: 'requester-1',
        status: ExpenseStatus.UNDER_REVIEW,
      }),
      remove: jest.fn(),
    };
    const service = new ExpensesService(
      repo as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.delete('expense-1', {
        userId: 'requester-1',
        roles: [],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
