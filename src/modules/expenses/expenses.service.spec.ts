import { BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpenseStatus } from './entities/expense.entity';

describe('ExpensesService', () => {
  it('submits a draft expense and triggers workflow metadata', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      amount: '7500',
      currency: 'BDT',
      category: 'travel',
      status: ExpenseStatus.DRAFT,
      customFieldsJson: {},
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const runtime = {
      trigger: jest.fn().mockResolvedValue({ workflowInstanceId: 'wi-1' }),
    };
    const service = new ExpensesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    await service.submit('expense-1', { userId: 'user-1' } as never);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExpenseStatus.UNDER_REVIEW,
        workflowInstanceId: 'wi-1',
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
