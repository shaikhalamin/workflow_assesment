import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  const service = new RuleEngineService();
  const data = {
    amount: 7500,
    category: 'travel',
    vendor: 'ACME',
    customFields: { budgetOwnerId: 'user-2' },
  };

  it('matches all-mode conditions', () => {
    expect(
      service.matches(data, {
        mode: 'all',
        conditions: [
          { field: 'amount', operator: 'gte', value: 5000 },
          { field: 'amount', operator: 'lt', value: 10000 },
        ],
      }),
    ).toBe(true);
  });

  it('matches nested field paths', () => {
    expect(
      service.matches(data, {
        mode: 'all',
        conditions: [
          {
            field: 'customFields.budgetOwnerId',
            operator: 'eq',
            value: 'user-2',
          },
        ],
      }),
    ).toBe(true);
  });

  it('supports in, not_in, contains, and empty operators', () => {
    expect(
      service.matches(data, {
        mode: 'all',
        conditions: [
          { field: 'category', operator: 'in', value: ['travel', 'meal'] },
          { field: 'category', operator: 'not_in', value: ['hardware'] },
          { field: 'vendor', operator: 'contains', value: 'CM' },
          { field: 'missing', operator: 'is_empty' },
        ],
      }),
    ).toBe(true);
  });
});
