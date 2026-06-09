import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: 'employee@example.com',
    passwordHash: '',
    isActive: true,
    roles: ['employee'],
    permissions: ['auth.profile.read'],
  };

  it('rejects invalid passwords', async () => {
    user.passwordHash = await bcrypt.hash('Password123!', 10);
    const service = new AuthService(
      { findByEmailWithAccess: jest.fn().mockResolvedValue(user) } as never,
      { revokeActiveSessionsForUser: jest.fn() } as never,
      new JwtService({ secret: 'a'.repeat(32) }),
      { domain: 'localhost' },
    );

    await expect(
      service.login({ email: user.email, password: 'wrong' }, {} as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
