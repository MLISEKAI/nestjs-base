import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth.service';
import { RequestPasswordResetDto, ResetPasswordDto } from '../dto';

const RATE_LIMITS = {
  passwordReset: { default: { limit: 3, ttl: 300000 } },
};

/**
 * PasswordController - Xử lý password reset
 */
@ApiTags('Auth - Password')
@Controller('auth')
export class PasswordController {
  constructor(private readonly authService: AuthService) {}

  @Post('password/reset/request')
  @ApiOperation({ summary: 'Yêu cầu reset password qua email' })
  @ApiBody({ type: RequestPasswordResetDto })
  @Throttle(RATE_LIMITS.passwordReset)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password với mã xác thực' })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }
}
