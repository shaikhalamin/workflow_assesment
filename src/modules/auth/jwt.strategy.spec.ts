import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';

describe('JwtStrategy', () => {
  const user = {
    id: 'user-1',
    name: 'Employee User',
    email: 'employee@example.com',
    passwordHash: 'hash',
    employeeGrade: 'G5',
    isActive: true,
    roles: ['employee'],
    permissions: ['auth.profile.read'],
  };

  it('hydrates roles and permissions from the database by user id', async () => {
    const findByIdWithAccess = jest.fn().mockResolvedValue(user);
    const usersService = {
      findByIdWithAccess,
    } as unknown as UsersService;
    const strategy = Reflect.construct(JwtStrategy, [
      { secret: 'a'.repeat(32) },
      usersService,
    ]);

    await expect(strategy.validate({ sub: user.id })).resolves.toEqual({
      userId: user.id,
      email: user.email,
      employeeGrade: user.employeeGrade,
      roles: user.roles,
      permissions: user.permissions,
      sid: null,
    });
    expect(findByIdWithAccess).toHaveBeenCalledWith(user.id);
  });

  it('rejects tokens when the user no longer has active access', async () => {
    const findByIdWithAccess = jest.fn().mockResolvedValue(null);
    const usersService = {
      findByIdWithAccess,
    } as unknown as UsersService;
    const strategy = Reflect.construct(JwtStrategy, [
      { secret: 'a'.repeat(32) },
      usersService,
    ]);

    await expect(strategy.validate({ sub: user.id })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
