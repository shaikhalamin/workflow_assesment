import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns employee summary shape', async () => {
    const service = new DashboardService(
      { countBy: jest.fn().mockResolvedValue(2) } as never,
      { countBy: jest.fn().mockResolvedValue(1) } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.employee({ userId: 'user-1', roles: ['employee'], permissions: [] } as never),
    ).resolves.toEqual({
      expenses: expect.any(Object),
      leaves: expect.any(Object),
      recentItems: expect.any(Array),
    });
  });
});
