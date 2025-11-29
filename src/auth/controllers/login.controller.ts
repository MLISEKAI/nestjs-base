import { Controller, Post, Body, Req, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth.service';
import { LoginDto, VerifyTwoFactorLoginDto } from '../dto';
import type { Request } from 'express';

const RATE_LIMITS = {
  login: { default: { limit: 10, ttl: 60000 } },
};

/**
 * LoginController - Xử lý đăng nhập
 */
@ApiTags('Auth - Login')
@Controller('auth')
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập với email và password' })
  @ApiBody({ type: LoginDto })
  @Throttle(RATE_LIMITS.login)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const res = await this.authService.login(dto, req.ip);

    if ('requires_2fa' in res && res.requires_2fa === true) {
      const twoFactorRes = res as {
        requires_2fa: boolean;
        temp_token: string;
        expires_in: number;
      };
      
      if (!twoFactorRes.temp_token || twoFactorRes.expires_in === undefined) {
        throw new InternalServerErrorException(
          'Invalid 2FA response format: missing temp_token or expires_in',
        );
      }
      
      return {
        requires_2fa: twoFactorRes.requires_2fa,
        temp_token: twoFactorRes.temp_token,
        expires_in: twoFactorRes.expires_in,
      };
    }

    const authRes = res as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: string;
    };
    
    if (!authRes.access_token || !authRes.refresh_token || !authRes.expires_at) {
      throw new InternalServerErrorException(
        'Invalid login response format: missing access_token, refresh_token, or expires_at',
      );
    }
    
    return {
      access_token: authRes.access_token,
      refresh_token: authRes.refresh_token,
      expires_at: authRes.expires_at,
    };
  }

  @Post('login/verify-2fa')
  @ApiOperation({ summary: 'Xác thực mã 2FA cho phiên đăng nhập đang chờ' })
  @ApiBody({ type: VerifyTwoFactorLoginDto })
  @Throttle(RATE_LIMITS.login)
  verifyLoginTwoFactor(@Body() dto: VerifyTwoFactorLoginDto, @Req() req: Request) {
    return this.authService.verifyLoginTwoFactor(dto, req.ip);
  }
}
