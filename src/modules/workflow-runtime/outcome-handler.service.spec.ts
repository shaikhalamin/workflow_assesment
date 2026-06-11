import { ExpenseStatus } from '../expenses/entities/expense.entity';
import { PaymentRequestStatus } from '../payments/entities/payment-request.entity';
import { WorkflowInstanceStatus } from './enums/workflow-runtime.enums';
import { OutcomeHandlerService } from './outcome-handler.service';

describe('OutcomeHandlerService', () => {
  it('does not create a payment request when an expense workflow outcome disables it', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'requester-1',
      amount: 2500,
      currency: 'BDT',
      status: ExpenseStatus.UNDER_REVIEW,
      approvedAt: null,
    };
    const expensesRepository = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn().mockResolvedValue(expense),
    };
    const paymentsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn().mockReturnValue({ id: 'payment-1' }),
      save: jest.fn().mockResolvedValue({ id: 'payment-1' }),
    };
    const leavesRepository = {};
    const notificationsService = {
      createPaymentCreated: jest.fn(),
    };
    const service = new OutcomeHandlerService(
      expensesRepository as never,
      paymentsRepository as never,
      leavesRepository as never,
      notificationsService as never,
    );

    await service.handleApproved(
      {
        id: 'workflow-1',
        entityType: 'Expense',
        entityId: 'expense-1',
        status: WorkflowInstanceStatus.APPROVED,
      } as never,
      { createPaymentRequest: false },
    );

    expect(expensesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExpenseStatus.APPROVED,
      }),
    );
    expect(paymentsRepository.findOneBy).not.toHaveBeenCalled();
    expect(paymentsRepository.create).not.toHaveBeenCalled();
    expect(notificationsService.createPaymentCreated).not.toHaveBeenCalled();
  });

  it('creates a payment request when an expense workflow outcome enables it', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'requester-1',
      amount: 2500,
      currency: 'BDT',
      status: ExpenseStatus.UNDER_REVIEW,
      approvedAt: null,
    };
    const payment = { id: 'payment-1' };
    const expensesRepository = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn().mockResolvedValue(expense),
    };
    const paymentsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(payment),
      save: jest.fn().mockResolvedValue(payment),
    };
    const leavesRepository = {};
    const notificationsService = {
      createPaymentCreated: jest.fn(),
    };
    const service = new OutcomeHandlerService(
      expensesRepository as never,
      paymentsRepository as never,
      leavesRepository as never,
      notificationsService as never,
    );

    await service.handleApproved(
      {
        id: 'workflow-1',
        entityType: 'Expense',
        entityId: 'expense-1',
        status: WorkflowInstanceStatus.APPROVED,
      } as never,
      { createPaymentRequest: true },
    );

    expect(expensesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExpenseStatus.PAYMENT_PENDING,
      }),
    );
    expect(paymentsRepository.create).toHaveBeenCalledWith({
      expenseId: 'expense-1',
      requesterId: 'requester-1',
      amount: 2500,
      currency: 'BDT',
      status: PaymentRequestStatus.PENDING,
    });
    expect(notificationsService.createPaymentCreated).toHaveBeenCalledWith({
      entityType: 'PaymentRequest',
      entityId: 'payment-1',
      workflowInstanceId: 'workflow-1',
      recipientRoleSlug: 'accounts-officer',
    });
  });
});
