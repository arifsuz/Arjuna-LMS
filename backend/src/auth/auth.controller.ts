import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { CurrentUser } from '../common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto);

    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken, req);

    return {
      message: 'Login berhasil',
      accessToken: tokens.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Refresh token tidak ditemukan' };
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken, req);

    return {
      message: 'Token berhasil di-refresh',
      accessToken: tokens.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const domain = this.getCookieDomain(req);
    res.clearCookie('access_token', { path: '/', domain: domain || undefined });
    res.clearCookie('refresh_token', { path: '/', domain: domain || undefined });
    return { message: 'Logout berhasil' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: any) {
    return { user };
  }

  private getCookieDomain(req?: Request): string | undefined {
    if (process.env.COOKIE_DOMAIN) {
      return process.env.COOKIE_DOMAIN;
    }
    if (!req) return undefined;

    const host = (req.get('host') || req.hostname || '').split(':')[0];
    const origin = req.get('origin') || '';

    if (host.includes('sandiwarno.tech') || origin.includes('sandiwarno.tech')) {
      return '.sandiwarno.tech';
    }

    // Dynamic extraction for custom production domains (e.g., sub.domain.com -> .domain.com)
    if (
      host &&
      !host.includes('localhost') &&
      !host.startsWith('127.0.0.1') &&
      !host.startsWith('192.168.') &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(host)
    ) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        return '.' + parts.slice(-2).join('.');
      }
    }

    return undefined;
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    req?: Request,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = this.getCookieDomain(req);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: domain || undefined,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: domain || undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}
