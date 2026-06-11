import { BadRequestException } from '@nestjs/common';
import type { TriggerWorkflowDto } from '../workflow-runtime/dto/trigger-workflow.dto';
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
      trigger: jest.Mock<
        Promise<{ workflowInstanceId: string }>,
        [TriggerWorkflowDto]
      >;
    } = {
      trigger: jest
        .fn<Promise<{ workflowInstanceId: string }>, [TriggerWorkflowDto]>()
        .mockResolvedValue({ workflowInstanceId: 'wi-1' }),
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
});
