import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../config/jwt.config';
import { UsersService } from '../users/users.service';

export type AccessPayload = {
  sub: string;
};

export type AuthenticatedUser = Express.User;
export type AuthenticatedRequest = Request & { user: AuthenticatedUser };

function accessTokenFromRequest(request: Request): string | null {
  const cookies = request.cookies as unknown;
  if (!cookies || typeof cookies !== 'object') return null;
  const accessToken = (cookies as Record<string, unknown>).access_token;
  return typeof accessToken === 'string' ? accessToken : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    config: ConfigType<typeof jwtConfig>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenFromRequest]),
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  async validate(payload: AccessPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) throw new UnauthorizedException();

    const user = await this.usersService.findByIdWithAccess(payload.sub);
    if (!user?.isActive) throw new UnauthorizedException();

    return {
      userId: user.id,
      email: user.email,
      employeeGrade: user.employeeGrade,
      departmentId: user.departmentId,
      roles: user.roles,
      permissions: user.permissions,
      sid: null,
    };
  }
}
