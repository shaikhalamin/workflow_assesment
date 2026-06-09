import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService, AuthResult } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
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
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.refresh(
      request.cookies?.refresh_token,
      request,
    );
    this.setAuthCookies(response, result);
    return { user: result.user };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.authService.logout(request.cookies?.refresh_token);
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
}
