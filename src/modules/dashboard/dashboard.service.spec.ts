import { Between } from 'typeorm';
import { WorkflowInstanceStatus } from '../workflow-runtime/enums/workflow-runtime.enums';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns employee summary shape', async () => {
    const service = new DashboardService(
      { countBy: jest.fn().mockResolvedValue(2) } as never,
      { countBy: jest.fn().mockResolvedValue(3) } as never,
      { find: jest.fn().mockResolvedValue([]) } as never,
      { countBy: jest.fn().mockResolvedValue(1) } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.employee({
        userId: 'user-1',
        roles: ['employee'],
        permissions: [],
      } as never),
    ).resolves.toEqual({
      expenses: { draft: 2, underReview: 2 },
      leaves: { approved: 1, underReview: 1 },
      billing: {
        draft: 3,
        submitted: 0,
        underReview: 3,
        approved: 0,
        rejected: 3,
        invoiced: 3,
        cancelled: 0,
      },
      recentInvoices: [],
      recentItems: [],
    });
  });

  it('returns filtered executive admin summary shape', async () => {
    const billingRequestsRepository = {
      countBy: jest
        .fn()
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(11),
    };
    const invoicesRepository = {
      countBy: jest
        .fn()
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(13)
        .mockResolvedValueOnce(14),
    };
    const paymentsRepository = {
      countBy: jest
        .fn()
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(16)
        .mockResolvedValueOnce(17),
    };
    const workflowInstancesRepository = {
      countBy: jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4),
      find: jest.fn().mockResolvedValue([
        {
          id: 'workflow-1',
          entityType: 'BillingRequest',
          eventName: 'billing.submit',
          createdAt: new Date('2026-06-12T10:00:00.000Z'),
        },
      ]),
    };
    const service = new DashboardService(
      {} as never,
      billingRequestsRepository as never,
      invoicesRepository as never,
      {} as never,
      {} as never,
      paymentsRepository as never,
      workflowInstancesRepository as never,
    );

    await expect(
      service.admin({ from: '2026-06-01', to: '2026-06-30' }),
    ).resolves.toEqual({
      workflows: { active: 1, approved: 2, rejected: 3, failed: 4 },
      billing: {
        draft: 5,
        submitted: 6,
        underReview: 7,
        approved: 8,
        rejected: 9,
        invoiced: 10,
        cancelled: 11,
      },
      invoices: { issued: 12, paid: 13, cancelled: 14 },
      payments: { pending: 15, paid: 16, cancelled: 17 },
      recentWorkflowChanges: [
        {
          id: 'workflow-1',
          type: 'BillingRequest',
          title: 'billing.submit',
          createdAt: '2026-06-12T10:00:00.000Z',
        },
      ],
      failedTriggers: 4,
    });

    expect(workflowInstancesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { updatedAt: 'DESC' },
        take: 5,
      }),
    );
    expect(workflowInstancesRepository.countBy).toHaveBeenNthCalledWith(1, {
      createdAt: Between(
        new Date('2026-06-01T00:00:00.000Z'),
        new Date('2026-06-30T23:59:59.999Z'),
      ),
      status: WorkflowInstanceStatus.ACTIVE,
    });
  });
});
