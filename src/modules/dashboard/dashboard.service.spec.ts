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
      billing: { draft: 3, underReview: 3, rejected: 3, invoiced: 3 },
      recentInvoices: [],
      recentItems: [],
    });
  });
});
