import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth.service';
import { RequestEmailCodeDto, VerifyEmailCodeDto } from '../dto';

const RATE_LIMITS = {
  verification: { default: { limit: 5, ttl: 300000 } },
};

/**
 * VerificationController - Xử lý email/phone verification
 */
@ApiTags('Auth - Verification')
@Controller('auth')
export class VerificationController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/request')
  @ApiOperation({ summary: 'Yêu cầu mã xác thực email' })
  @ApiBody({ type: RequestEmailCodeDto })
  @Throttle(RATE_LIMITS.verification)
  requestEmailCode(@Body() dto: RequestEmailCodeDto) {
    return this.authService.requestEmailVerification(dto.email);
  }

  @Post('email/verify')
  @ApiOperation({ summary: 'Xác thực email với mã' })
  @ApiBody({ type: VerifyEmailCodeDto })
  verifyEmail(@Body() dto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(dto.email, dto.code);
  }
}
