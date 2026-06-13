import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Paginated } from '../../common/http/paginated';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from './entities/payment-request.entity';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const payment = (): PaymentRequest => ({
    id: 'payment-1',
    expenseId: 'expense-1',
    requesterId: 'requester-1',
    amount: '4500.00',
    currency: 'BDT',
    status: PaymentRequestStatus.PENDING,
    paymentReference: null,
    paidById: null,
    paidAt: null,
    createdAt: new Date('2026-06-10T09:30:00.000Z'),
    updatedAt: new Date('2026-06-10T09:30:00.000Z'),
  });

  it('filters payment list to the expense requester when the actor only has expense read access', async () => {
    const paymentsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[payment()], 1]),
    };
    const service = new PaymentsService(
      paymentsRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.list({ page: 1, limit: 25 }, {
      userId: 'requester-1',
      roles: ['employee'],
      permissions: ['expenses.read'],
    } as never);

    expect(paymentsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { requesterId: 'requester-1' },
      }),
    );
    expect(result).toBeInstanceOf(Paginated);
    expect(result.items).toHaveLength(1);
  });

  it('does not filter payment list for users with payment read access', async () => {
    const paymentsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[payment()], 1]),
    };
    const service = new PaymentsService(
      paymentsRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.list({ page: 1, limit: 25 }, {
      userId: 'accounts-1',
      roles: ['accounts-officer'],
      permissions: ['payments.read'],
    } as never);

    expect(paymentsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
      }),
    );
  });

  it('allows the requester to read their own payment request with expense read access', async () => {
    const paymentsRepository = {
      findOneBy: jest.fn().mockResolvedValue(payment()),
    };
    const service = new PaymentsService(
      paymentsRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.findOne('payment-1', {
        userId: 'requester-1',
        roles: ['employee'],
        permissions: ['expenses.read'],
      } as never),
    ).resolves.toEqual(expect.objectContaining({ id: 'payment-1' }));
  });

  it('rejects reading another requester payment with expense read access only', async () => {
    const paymentsRepository = {
      findOneBy: jest.fn().mockResolvedValue(payment()),
    };
    const service = new PaymentsService(
      paymentsRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.findOne('payment-1', {
        userId: 'other-user',
        roles: ['employee'],
        permissions: ['expenses.read'],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects payment reads when the actor has neither payment nor expense read access', async () => {
    const service = new PaymentsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.list({ page: 1, limit: 25 }, {
        userId: 'user-1',
        roles: ['employee'],
        permissions: ['dashboard.read'],
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sends push and email channels when marking a payment paid', async () => {
    const paymentRequest = payment();
    const expense = {
      id: 'expense-1',
      requesterId: 'requester-1',
      status: 'PAYMENT_PENDING',
      paidAt: null,
    };
    const paymentsRepository = {
      findOneBy: jest.fn().mockResolvedValue(paymentRequest),
      save: jest.fn((value: PaymentRequest) => Promise.resolve(value)),
    };
    const expensesRepository = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn((value: typeof expense) => Promise.resolve(value)),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      createPaymentPaid: jest.fn().mockResolvedValue(undefined),
    };
    const service = new PaymentsService(
      paymentsRepository as never,
      expensesRepository as never,
      auditLogsService as never,
      notificationsService as never,
    );

    await service.markPaid(
      'payment-1',
      { userId: 'accounts-1', permissions: ['payments.write'] } as never,
      { paymentReference: 'TXN-1' },
    );

    expect(notificationsService.createPaymentPaid).toHaveBeenCalledWith({
      recipientUserId: 'requester-1',
      entityType: 'PaymentRequest',
      entityId: 'payment-1',
      channels: { push: true, email: true },
    });
  });
});
