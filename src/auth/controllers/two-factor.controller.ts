import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { TwoFactorCodeDto } from '../dto';

/**
 * TwoFactorController - Xử lý 2FA
 */
@ApiTags('Auth - Two Factor')
@Controller('auth')
export class TwoFactorController {
  constructor(private readonly authService: AuthService) {}

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Tạo secret 2FA' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  setupTwoFactor(@Req() req: any) {
    return this.authService.generateTwoFactorSecret(req.user.id);
  }

  @Post('2fa/enable')
  @ApiOperation({ summary: 'Kích hoạt 2FA sau khi xác thực mã' })
  @ApiBody({ type: TwoFactorCodeDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  enableTwoFactor(@Body() dto: TwoFactorCodeDto, @Req() req: any) {
    return this.authService.enableTwoFactor(req.user.id, dto.code);
  }

  @Post('2fa/disable')
  @ApiOperation({ summary: 'Tắt 2FA' })
  @ApiBody({ type: TwoFactorCodeDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  disableTwoFactor(@Body() dto: TwoFactorCodeDto, @Req() req: any) {
    return this.authService.disableTwoFactor(req.user.id, dto.code);
  }
}
