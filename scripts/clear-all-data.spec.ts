import { CLEAR_ALL_DATA_TABLES } from './clear-all-data';

describe('clear-all-data script', () => {
  it('clears identity and RBAC tables too', () => {
    expect(CLEAR_ALL_DATA_TABLES).toEqual(
      expect.arrayContaining(['users', 'roles', 'permissions', 'departments']),
    );
  });
});
