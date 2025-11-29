import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth.service';
import { RegisterWithEmailDto, RequestPhoneOtpDto, VerifyPhoneOtpDto } from '../dto';
import type { Request } from 'express';

const RATE_LIMITS = {
  register: { default: { limit: 5, ttl: 60000 } },
  otpRequest: { default: { limit: 3, ttl: 60000 } },
  otpLogin: { default: { limit: 5, ttl: 60000 } },
};

/**
 * RegistrationController - Xử lý đăng ký user mới
 */
@ApiTags('Auth - Registration')
@Controller('auth')
export class RegistrationController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email')
  @ApiOperation({ summary: 'Đăng ký user mới qua EMAIL' })
  @ApiBody({ type: RegisterWithEmailDto })
  @Throttle(RATE_LIMITS.register)
  registerWithEmail(@Body() dto: RegisterWithEmailDto) {
    return this.authService.registerWithEmail(dto);
  }

  @Post('register/phone')
  @ApiOperation({ 
    summary: 'Request OTP để đăng ký/đăng nhập qua phone',
    description: 'CHỈ CẦN phone_number. OTP sẽ được gửi qua SMS.'
  })
  @ApiBody({ type: RequestPhoneOtpDto })
  @Throttle(RATE_LIMITS.otpRequest)
  requestPhoneOtp(@Body() dto: RequestPhoneOtpDto) {
    return this.authService.requestPhoneOtp(dto);
  }

  @Post('phone/verify')
  @ApiOperation({ 
    summary: 'Verify OTP và đăng ký/đăng nhập (passwordless)',
    description: 'Verify OTP và trả về access_token. Nickname tự động sinh (user12345).'
  })
  @ApiBody({ type: VerifyPhoneOtpDto })
  @Throttle(RATE_LIMITS.otpLogin)
  verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto, @Req() req: Request) {
    return this.authService.verifyPhoneOtp(dto, req.ip);
  }
}
