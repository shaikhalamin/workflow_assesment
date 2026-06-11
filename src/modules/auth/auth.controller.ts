import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import { ApiData } from '../../common/http/swagger';
import { AuthService, AuthResult } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('auth')
@ApiCookieAuth('access_token')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiData(AuthResponseDto, {
    status: 201,
    description: 'Creates an employee account and starts an auth session',
    errors: [400, 409, 429],
  })
  async signup(
    @Body() dto: SignupDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.signup(dto, request);
    this.setAuthCookies(response, result);
    return { user: result.user };
  }

  @Public()
  @Post('login')
  @ApiData(AuthResponseDto, {
    status: 201,
    description: 'Starts an auth session for valid credentials',
    errors: [400, 401, 429],
  })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto, request);
    this.setAuthCookies(response, result);
    return { user: result.user };
  }

  @Public()
  @Post('refresh')
  @ApiData(AuthResponseDto, {
    status: 201,
    description: 'Rotates refresh token cookies and returns the current user',
    errors: [401, 429],
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.refresh(
      this.getRefreshToken(request),
      request,
    );
    this.setAuthCookies(response, result);
    return { user: result.user };
  }

  @Post('logout')
  @ApiData(SuccessResponseDto, {
    status: 201,
    description: 'Revokes the current refresh token session',
    errors: [401, 429],
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SuccessResponseDto> {
    await this.authService.logout(this.getRefreshToken(request));
    response.clearCookie(
      'access_token',
      this.authService.buildCookieOptions(0),
    );
    response.clearCookie(
      'refresh_token',
      this.authService.buildCookieOptions(0),
    );
    return { success: true };
  }

  @Get('me')
  @ApiData(AuthResponseDto, {
    description: 'Returns the authenticated user profile',
    errors: [401, 429],
  })
  me(@CurrentUser() user: Express.User): Promise<AuthResponseDto> {
    return this.authService.me(user.userId);
  }

  private setAuthCookies(response: Response, result: AuthResult): void {
    response.cookie(
      result.cookies.accessToken.name,
      result.cookies.accessToken.value,
      result.cookies.accessToken.options,
    );
    response.cookie(
      result.cookies.refreshToken.name,
      result.cookies.refreshToken.value,
      result.cookies.refreshToken.options,
    );
  }

  private getRefreshToken(request: Request): string | undefined {
    const cookies = request.cookies as unknown;
    if (!cookies || typeof cookies !== 'object') return undefined;
    const refreshToken = (cookies as Record<string, unknown>).refresh_token;
    return typeof refreshToken === 'string' ? refreshToken : undefined;
  }
}
