import { CLEAR_ALL_DATA_TABLES } from './clear-all-data';

describe('clear-all-data script', () => {
  it('clears identity and RBAC tables too', () => {
    expect(CLEAR_ALL_DATA_TABLES).toEqual(
      expect.arrayContaining(['users', 'roles', 'permissions', 'departments']),
    );
  });

  it('clears invoice and billing tables in dependency order', () => {
    expect(CLEAR_ALL_DATA_TABLES).toEqual(
      expect.arrayContaining(['invoices', 'billing_requests']),
    );
    expect(CLEAR_ALL_DATA_TABLES.indexOf('invoices')).toBeLessThan(
      CLEAR_ALL_DATA_TABLES.indexOf('billing_requests'),
    );
  });
});
