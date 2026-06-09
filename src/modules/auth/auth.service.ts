import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { CookieOptions, Request } from 'express';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenSession } from './entities/refresh-token-session.entity';
import { UsersService, UserWithAccess } from '../users/users.service';

type AccessPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
};

type RefreshPayload = {
  sub: string;
  sid: string;
  jti: string;
};

type UserSummary = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

type AuthCookie = {
  name: 'access_token' | 'refresh_token';
  value: string;
  options: CookieOptions;
};

export type AuthResult = {
  user: UserSummary;
  cookies: {
    accessToken: AuthCookie;
    refreshToken: AuthCookie;
  };
};

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = ACCESS_TOKEN_TTL_SECONDS * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;
const COOKIES_CONFIG_TOKEN = 'CONFIGURATION(cookies)';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(RefreshTokenSession)
    private readonly refreshTokenSessionsRepository: Repository<RefreshTokenSession>,
    private readonly jwtService: JwtService,
    @Inject(COOKIES_CONFIG_TOKEN)
    private readonly cookieConfig: { domain: string },
  ) {}

  async login(dto: LoginDto, request: Request): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithAccess(dto.email);
    if (!user?.isActive) throw new UnauthorizedException();

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) throw new UnauthorizedException();

    await this.revokeActiveSessionsForUser(user.id);
    return this.createAuthResult(user, request);
  }

  async refresh(
    refreshToken: string | undefined,
    request: Request,
  ): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.findActiveSession(payload.sid, payload.jti);

    if (!session) throw new UnauthorizedException();

    const tokenMatches = await bcrypt.compare(refreshToken!, session.tokenHash);
    if (!tokenMatches) throw new UnauthorizedException();

    const user = await this.usersService.findByIdWithAccess(payload.sub);
    if (!user?.isActive) throw new UnauthorizedException();

    const replacementSid = randomUUID();
    const result = await this.createAuthResult(user, request, replacementSid);
    await this.revokeSession(session, replacementSid);

    return result;
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const session = await this.findActiveSession(payload.sid, payload.jti);
      if (session) await this.revokeSession(session);
    } catch {
      return;
    }
  }

  async me(userId: string): Promise<{ user: UserSummary }> {
    const user = await this.usersService.findByIdWithAccess(userId);
    if (!user?.isActive) throw new UnauthorizedException();
    return { user: this.toUserSummary(user) };
  }

  buildCookieOptions(maxAgeMs: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain: this.cookieConfig.domain,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  private async createAuthResult(
    user: UserWithAccess,
    request: Request,
    sid = randomUUID(),
  ): Promise<AuthResult> {
    const jti = randomUUID();
    const accessPayload: AccessPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
    const refreshPayload: RefreshPayload = {
      sub: user.id,
      sid,
      jti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    ]);

    await this.refreshTokenSessionsRepository.save(
      this.refreshTokenSessionsRepository.create({
        id: sid,
        userId: user.id,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        jti,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
        revokedAt: null,
        replacedBySessionId: null,
        userAgent: request.get?.('user-agent') ?? null,
        ipAddress: request.ip ?? null,
      }),
    );

    return {
      user: this.toUserSummary(user),
      cookies: {
        accessToken: {
          name: 'access_token',
          value: accessToken,
          options: this.buildCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE_MS),
        },
        refreshToken: {
          name: 'refresh_token',
          value: refreshToken,
          options: this.buildCookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE_MS),
        },
      },
    };
  }

  private async verifyRefreshToken(
    refreshToken: string | undefined,
  ): Promise<RefreshPayload> {
    if (!refreshToken) throw new UnauthorizedException();

    try {
      const payload =
        await this.jwtService.verifyAsync<RefreshPayload>(refreshToken);
      if (!payload.sub || !payload.sid || !payload.jti) {
        throw new UnauthorizedException();
      }

      return payload;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private async findActiveSession(
    sid: string,
    jti: string,
  ): Promise<RefreshTokenSession | null> {
    const session = await this.refreshTokenSessionsRepository
      .createQueryBuilder('session')
      .addSelect('session.tokenHash')
      .where('session.id = :sid', { sid })
      .andWhere('session.jti = :jti', { jti })
      .andWhere('session.revokedAt IS NULL')
      .getOne();

    if (!session || session.expiresAt <= new Date()) return null;
    return session;
  }

  private async revokeActiveSessionsForUser(userId: string): Promise<void> {
    await this.refreshTokenSessionsRepository
      .createQueryBuilder()
      .update(RefreshTokenSession)
      .set({ revokedAt: new Date() })
      .where('"userId" = :userId', { userId })
      .andWhere('"revokedAt" IS NULL')
      .execute();
  }

  private async revokeSession(
    session: RefreshTokenSession,
    replacedBySessionId: string | null = null,
  ): Promise<void> {
    session.revokedAt = new Date();
    session.replacedBySessionId = replacedBySessionId;
    await this.refreshTokenSessionsRepository.save(session);
  }

  private toUserSummary(user: UserWithAccess): UserSummary {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
