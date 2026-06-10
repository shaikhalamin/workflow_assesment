import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { RefreshTokenSession } from './entities/refresh-token-session.entity';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    name: 'Employee User',
    email: 'employee@example.com',
    passwordHash: '',
    isActive: true,
    roles: ['employee'],
    permissions: ['auth.profile.read'],
  };
  const jwtService = new JwtService({ secret: 'a'.repeat(32) });

  function buildRefreshSessionRepository(): Repository<RefreshTokenSession> {
    const updateBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    const repository = {
      create: jest.fn((session: RefreshTokenSession) => session),
      createQueryBuilder: jest.fn(() => updateBuilder),
      save: jest
        .fn()
        .mockImplementation(
          (session: RefreshTokenSession): Promise<RefreshTokenSession> =>
            Promise.resolve(session),
        ),
    };

    return repository as unknown as Repository<RefreshTokenSession>;
  }

  it('rejects invalid passwords', async () => {
    user.passwordHash = await bcrypt.hash('Password123!', 10);
    const service = new AuthService(
      {
        findByEmailWithAccess: jest.fn().mockResolvedValue(user),
      } as unknown as UsersService,
      buildRefreshSessionRepository(),
      jwtService,
      { domain: 'localhost' },
    );

    await expect(
      service.login({ email: user.email, password: 'wrong' }, {} as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('signs access tokens with only the user id claim', async () => {
    user.passwordHash = await bcrypt.hash('Password123!', 10);
    const service = new AuthService(
      {
        findByEmailWithAccess: jest.fn().mockResolvedValue(user),
      } as unknown as UsersService,
      buildRefreshSessionRepository(),
      jwtService,
      { domain: 'localhost' },
    );

    const result = await service.login(
      { email: user.email, password: 'Password123!' },
      {} as never,
    );
    const payload = await jwtService.verifyAsync<Record<string, unknown>>(
      result.cookies.accessToken.value,
    );

    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBeUndefined();
    expect(payload.roles).toBeUndefined();
    expect(payload.permissions).toBeUndefined();
  });

  it('does not set a cookie domain for localhost sessions', () => {
    const service = new AuthService(
      {
        findByEmailWithAccess: jest.fn(),
      } as unknown as UsersService,
      buildRefreshSessionRepository(),
      jwtService,
      { domain: 'localhost' },
    );

    expect(service.buildCookieOptions(1000).domain).toBeUndefined();
  });
});
