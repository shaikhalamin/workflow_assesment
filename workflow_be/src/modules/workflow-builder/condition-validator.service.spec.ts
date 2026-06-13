import { BadRequestException } from '@nestjs/common';
import { ConditionValidatorService } from './condition-validator.service';

describe('ConditionValidatorService', () => {
  const service = new ConditionValidatorService();
  const schema = {
    fields: [
      { key: 'amount', type: 'number', operators: ['gte', 'lt', 'between'] },
      { key: 'category', type: 'select', operators: ['eq', 'in'] },
      { key: 'customFields.budgetOwnerId', type: 'user', operators: ['eq'] },
    ],
  };

  it('accepts valid all-mode conditions', () => {
    expect(() =>
      service.validateCondition(schema, {
        mode: 'all',
        conditions: [
          { field: 'amount', operator: 'gte', value: 5000 },
          { field: 'amount', operator: 'lt', value: 10000 },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects unknown fields', () => {
    expect(() =>
      service.validateCondition(schema, {
        mode: 'all',
        conditions: [{ field: 'missing', operator: 'eq', value: 'x' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects operators that field schemas do not allow', () => {
    expect(() =>
      service.validateCondition(schema, {
        mode: 'all',
        conditions: [{ field: 'category', operator: 'gte', value: 1 }],
      }),
    ).toThrow(BadRequestException);
  });
});
