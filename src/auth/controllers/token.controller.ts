import { Controller, Post, Body, Req, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth.service';
import { TokenService } from '../security/token.service';
import { RefreshTokenDto, LogoutDto } from '../dto';
import type { Request } from 'express';

const RATE_LIMITS = {
  refresh: { default: { limit: 10, ttl: 60000 } },
};

/**
 * TokenController - Xử lý token management
 */
@ApiTags('Auth - Token')
@Controller('auth')
export class TokenController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @Throttle(RATE_LIMITS.refresh)
  refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshTokens(dto.refresh_token, req.ip);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất và revoke tokens' })
  @ApiBody({ type: LogoutDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  async logout(
    @Body() dto: LogoutDto,
    @Req() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const accessToken = this.tokenService.extractBearerToken(authHeader);
    return this.authService.logout(req.user.id, dto.refresh_token, accessToken);
  }
}
