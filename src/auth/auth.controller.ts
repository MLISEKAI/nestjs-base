import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { GoogleProfile } from './strategy/google.strategy';
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
  LogoutDto,
  VerifyTwoFactorLoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { ApiTags, ApiBody, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

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
  @ApiOperation({
    summary: 'Yêu cầu OTP để đăng nhập qua số điện thoại',
    description:
      'Gửi OTP đến số điện thoại để đăng nhập. Có thể dùng cho user mới (sẽ tự động tạo account) hoặc user đã có. Khác với /auth/phone/request (chỉ verify số điện thoại của user đã tồn tại).',
  })
  @ApiBody({ type: RequestPhoneCodeDto })
  @Throttle({ otpRequest: RATE_LIMITS.otpRequest })
  requestLoginOtp(@Body() dto: RequestPhoneCodeDto) {
    return this.authService.requestPhoneLoginOtp(dto.phone);
  }

  @Post('login/otp')
  @ApiOperation({
    summary: 'Đăng nhập qua OTP số điện thoại',
    description:
      'Verify OTP và đăng nhập. Nếu user chưa tồn tại, sẽ tự động tạo account mới. Trả về JWT token để đăng nhập. Khác với /auth/phone/verify (chỉ verify, không đăng nhập).',
  })
  @ApiBody({ type: LoginOtpDto })
  @Throttle({ otpLogin: RATE_LIMITS.otpLogin })
  loginOtp(@Body() dto: LoginOtpDto, @Req() req: Request) {
    return this.authService.loginOtp(dto, req.ip);
  }

  @Post('login/oauth')
  @ApiOperation({
    summary: 'Đăng nhập qua OAuth provider (Google, Facebook, Anonymous)',
    description:
      '✅ ĐÃ VERIFY: Endpoint này verify access token với Google/Facebook API để đảm bảo dữ liệu thật.\n\n' +
      '📋 CÁCH SỬ DỤNG (Google/Facebook):\n' +
      '1. Client lấy access_token từ Google/Facebook OAuth flow (client-side)\n' +
      '2. Gửi POST request CHỈ với:\n' +
      '   - provider: "google" hoặc "facebook"\n' +
      '   - access_token: token từ OAuth flow\n' +
      '   - ❌ KHÔNG gửi provider_id, email, nickname (sẽ được tự động lấy từ token)\n' +
      '3. Server verify token với provider API\n' +
      '4. Server tự động lấy provider_id, email, nickname từ API\n' +
      '5. Đăng nhập hoặc tạo user mới\n\n' +
      '📋 CÁCH SỬ DỤNG (Anonymous):\n' +
      '1. Gửi POST request với:\n' +
      '   - provider: "anonymous"\n' +
      '   - provider_id: ID tự định nghĩa (required)\n' +
      '   - email, nickname: optional\n\n' +
      '🔒 BẢO MẬT:\n' +
      '- Google: Verify với https://www.googleapis.com/oauth2/v2/userinfo\n' +
      '- Facebook: Verify với https://graph.facebook.com/debug_token\n' +
      '- Anonymous: Không verify\n\n' +
      '💡 VÍ DỤ REQUEST (Google/Facebook):\n' +
      '```json\n' +
      '{\n' +
      '  "provider": "google",\n' +
      '  "access_token": "ya29.a0AfH6SMBx..."\n' +
      '}\n' +
      '```\n' +
      'Server sẽ tự động lấy provider_id, email, nickname từ Google API.\n\n' +
      '💡 VÍ DỤ REQUEST (Anonymous):\n' +
      '```json\n' +
      '{\n' +
      '  "provider": "anonymous",\n' +
      '  "provider_id": "anonymous-uid-123",\n' +
      '  "email": "user@example.com",\n' +
      '  "nickname": "NguyenVanA"\n' +
      '}\n' +
      '```',
  })
  @ApiBody({ type: LoginOAuthDto })
  @Throttle({ oauth: RATE_LIMITS.oauth })
  loginOAuth(@Body() dto: LoginOAuthDto, @Req() req: Request) {
    return this.authService.loginOAuth(dto, req.ip);
  }

  @Get('oauth/google')
  @ApiOperation({
    summary: 'Chuyển hướng sang Google OAuth (server-side flow)',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Endpoint này redirect đến Google OAuth. Sử dụng trong browser: mở URL này trong tab mới để bắt đầu OAuth flow. Sau khi authorize, Google sẽ redirect về /auth/oauth/google/callback',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('google'))
  googleAuth() {
    // Passport sẽ redirect tới Google
  }

  @Get('oauth/google/callback')
  @ApiOperation({
    summary: 'Callback từ Google OAuth',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Đây là callback endpoint được Google gọi sau khi user authorize. Chỉ hoạt động trong OAuth flow thực tế.',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('google'))
  async googleAuthCallback(@Req() req: any) {
    const profile = req.user as GoogleProfile;
    return this.authService.loginOAuth(
      {
        provider: profile.provider,
        provider_id: profile.providerId,
        email: profile.email,
        nickname: profile.nickname,
      },
      req.ip,
    );
  }

  @Get('oauth/facebook')
  @ApiOperation({
    summary: 'Chuyển hướng sang Facebook OAuth (server-side flow)',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Endpoint này redirect đến Facebook OAuth. Sử dụng trong browser: mở URL này trong tab mới để bắt đầu OAuth flow. Sau khi authorize, Facebook sẽ redirect về /auth/oauth/facebook/callback',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('facebook'))
  facebookAuth() {
    // Passport sẽ redirect tới Facebook
  }

  @Get('oauth/facebook/callback')
  @ApiOperation({
    summary: 'Callback từ Facebook OAuth',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Đây là callback endpoint được Facebook gọi sau khi user authorize. Chỉ hoạt động trong OAuth flow thực tế.',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('facebook'))
  async facebookAuthCallback(@Req() req: any) {
    // FacebookStrategy đã xử lý login, req.user chứa kết quả
    return req.user;
  }

  @Post('login/verify-2fa')
  @ApiOperation({ summary: 'Xác thực mã 2FA cho phiên đăng nhập đang chờ' })
  @ApiBody({ type: VerifyTwoFactorLoginDto })
  @Throttle({ login: RATE_LIMITS.login })
  verifyLoginTwoFactor(@Body() dto: VerifyTwoFactorLoginDto, @Req() req: Request) {
    return this.authService.verifyLoginTwoFactor(dto, req.ip);
  }

  @Post('link')
  @ApiOperation({
    summary: 'Thêm tài khoản bên thứ 3 (Google, Facebook…) vào tài khoản hiện có của bạn',
  })
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
  @ApiOperation({
    summary: 'Yêu cầu mã xác thực số điện thoại',
    description:
      'Gửi mã xác thực đến số điện thoại của user đã tồn tại. Chỉ dùng để verify số điện thoại, KHÔNG đăng nhập. Nếu muốn đăng nhập bằng OTP, dùng /auth/login/otp/request. Yêu cầu user phải đã có account.',
  })
  @ApiBody({ type: RequestPhoneCodeDto })
  @Throttle({ phoneVerification: RATE_LIMITS.verification })
  requestPhoneCode(@Body() dto: RequestPhoneCodeDto) {
    return this.authService.requestPhoneVerification(dto.phone);
  }

  @Post('phone/verify')
  @ApiOperation({
    summary: 'Xác thực số điện thoại với mã',
    description:
      'Verify mã xác thực và đánh dấu số điện thoại đã được verify. KHÔNG đăng nhập, chỉ verify. Nếu muốn đăng nhập bằng OTP, dùng /auth/login/otp. Yêu cầu user phải đã có account.',
  })
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
  @ApiOperation({
    summary: 'Đăng xuất và hủy token',
    description:
      'Blacklist access token hiện tại. Nếu có refresh_token trong body, sẽ revoke refresh token đó để ngăn tạo access token mới.',
  })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  logout(@Body() dto: LogoutDto, @Req() req: any) {
    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader ? authHeader.split(' ')[1] : undefined;
    return this.authService.logout(req.user.id, dto?.refresh_token, token);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại từ token' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  getMe(@Req() req: any) {
    // Pass the entire user object from JWT strategy to avoid duplicate query
    return this.authService.getCurrentUser(req.user);
  }

  @Post('password/forgot')
  @ApiOperation({ summary: 'Yêu cầu reset password qua email' })
  @ApiBody({ type: RequestPasswordResetDto })
  @Throttle({ verification: RATE_LIMITS.verification })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password với mã xác thực từ email' })
  @ApiBody({ type: ResetPasswordDto })
  @Throttle({ verification: RATE_LIMITS.verification })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }
}
