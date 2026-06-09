import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../config/jwt.config';

export type AccessPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
};

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
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenFromRequest]),
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  validate(payload: AccessPayload): Express.User {
    if (
      !payload.sub ||
      !payload.email ||
      !Array.isArray(payload.roles) ||
      !Array.isArray(payload.permissions)
    ) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      sid: null,
    };
  }
}
