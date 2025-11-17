import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterUserDto,
  LoginDto,
  LoginOtpDto,
  LoginOAuthDto,
  LinkProviderDto,
  RequestEmailCodeDto,
  VerifyEmailCodeDto,
  RequestPhoneCodeDto,
  VerifyPhoneCodeDto,
  TwoFactorCodeDto,
  RefreshTokenDto,
  VerifyTwoFactorLoginDto,
} from './dto/auth.dto';
import { ApiTags, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

const ONE_MINUTE = 60_000;
const FIVE_MINUTES = 300_000;
const RATE_LIMITS = {
  register: { limit: 5, ttl: ONE_MINUTE },
  login: { limit: 10, ttl: ONE_MINUTE },
  otpRequest: { limit: 3, ttl: ONE_MINUTE },
  otpLogin: { limit: 5, ttl: ONE_MINUTE },
  oauth: { limit: 10, ttl: ONE_MINUTE },
  verification: { limit: 5, ttl: FIVE_MINUTES },
  refresh: { limit: 10, ttl: ONE_MINUTE },
} as const;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký user mới' })
  @ApiBody({ type: RegisterUserDto })
  @Throttle({ register: RATE_LIMITS.register })
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhâp ' })
  @ApiBody({ type: LoginDto })
  @Throttle({ login: RATE_LIMITS.login })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('login/otp/request')
  @ApiOperation({ summary: 'Yêu cầu OTP để đăng nhập qua số điện thoại' })
  @ApiBody({ type: RequestPhoneCodeDto })
  @Throttle({ otpRequest: RATE_LIMITS.otpRequest })
  requestLoginOtp(@Body() dto: RequestPhoneCodeDto) {
    return this.authService.requestPhoneLoginOtp(dto.phone);
  }

  @Post('login/otp')
  @ApiOperation({ summary: 'Đăng nhập qua OTP số điện thoại' })
  @ApiBody({ type: LoginOtpDto })
  @Throttle({ otpLogin: RATE_LIMITS.otpLogin })
  loginOtp(@Body() dto: LoginOtpDto, @Req() req: Request) {
    return this.authService.loginOtp(dto, req.ip);
  }

  @Post('login/oauth')
  @ApiOperation({ summary: 'Đăng nhập qua OAuth provider' })
  @ApiBody({ type: LoginOAuthDto })
  @Throttle({ oauth: RATE_LIMITS.oauth })
  loginOAuth(@Body() dto: LoginOAuthDto, @Req() req: Request) {
    return this.authService.loginOAuth(dto, req.ip);
  }

  @Post('login/verify-2fa')
  @ApiOperation({ summary: 'Xác thực mã 2FA cho phiên đăng nhập đang chờ' })
  @ApiBody({ type: VerifyTwoFactorLoginDto })
  @Throttle({ login: RATE_LIMITS.login })
  verifyLoginTwoFactor(@Body() dto: VerifyTwoFactorLoginDto, @Req() req: Request) {
    return this.authService.verifyLoginTwoFactor(dto, req.ip);
  }

  @Post('link')
  @ApiOperation({ summary: 'Liên kết provider với tài khoản hiện tại' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: LinkProviderDto })
  @UseGuards(AuthGuard('account-auth'))
  link(@Body() body: LinkProviderDto, @Req() req: any) {
    const userId = req.user.id;
    return this.authService.linkProvider(userId, body.provider, body.ref_id, body.hash);
  }

  @Post('email/request')
  @ApiOperation({ summary: 'Yêu cầu mã xác thực email' })
  @ApiBody({ type: RequestEmailCodeDto })
  @Throttle({ emailVerification: RATE_LIMITS.verification })
  requestEmailCode(@Body() dto: RequestEmailCodeDto) {
    return this.authService.requestEmailVerification(dto.email);
  }

  @Post('email/verify')
  @ApiOperation({ summary: 'Xác thực email với mã' })
  @ApiBody({ type: VerifyEmailCodeDto })
  verifyEmail(@Body() dto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(dto.email, dto.code);
  }

  @Post('phone/request')
  @ApiOperation({ summary: 'Yêu cầu mã xác thực số điện thoại' })
  @ApiBody({ type: RequestPhoneCodeDto })
  @Throttle({ phoneVerification: RATE_LIMITS.verification })
  requestPhoneCode(@Body() dto: RequestPhoneCodeDto) {
    return this.authService.requestPhoneVerification(dto.phone);
  }

  @Post('phone/verify')
  @ApiOperation({ summary: 'Xác thực số điện thoại với mã' })
  @ApiBody({ type: VerifyPhoneCodeDto })
  verifyPhone(@Body() dto: VerifyPhoneCodeDto) {
    return this.authService.verifyPhoneCode(dto.phone, dto.code);
  }

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
  @ApiOperation({ summary: 'Vô hiệu hóa 2FA' })
  @ApiBody({ type: TwoFactorCodeDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  disableTwoFactor(@Body() dto: TwoFactorCodeDto, @Req() req: any) {
    return this.authService.disableTwoFactor(req.user.id, dto.code);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiBody({ type: RefreshTokenDto })
  @Throttle({ refresh: RATE_LIMITS.refresh })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshTokens(dto.refresh_token, req.ip);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất và hủy token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  logout(@Body() dto: RefreshTokenDto, @Req() req: any) {
    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader ? authHeader.split(' ')[1] : undefined;
    return this.authService.logout(req.user.id, dto.refresh_token, token);
  }
}
