// Import các decorator và class từ NestJS để tạo controller
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  InternalServerErrorException,
} from '@nestjs/common';
// Import AuthService để xử lý business logic cho authentication
import { AuthService } from './auth.service';
// Import interface để type-check Google profile
import type { GoogleProfile } from './interfaces';
// Import các DTO để validate và type-check dữ liệu
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
// Import các decorator từ Swagger để tạo API documentation
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
// Import AuthGuard từ Passport để xác thực JWT token
import { AuthGuard } from '@nestjs/passport';
// Import Throttle để rate limiting
import { Throttle } from '@nestjs/throttler';
// Import type Request từ Express
import type { Request } from 'express';
// Import AuthGuard với alias để sử dụng cho OAuth flows
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

// Rate limit constants - Thời gian và giới hạn cho các endpoints
const ONE_MINUTE = 60_000; // 1 phút = 60,000 milliseconds
const FIVE_MINUTES = 300_000; // 5 phút = 300,000 milliseconds
// Định nghĩa rate limits cho từng loại endpoint
// limit: Số lượng requests tối đa
// ttl: Thời gian window (time to live) trong milliseconds
const RATE_LIMITS = {
  register: { limit: 5, ttl: ONE_MINUTE }, // Tối đa 5 đăng ký/phút
  login: { limit: 10, ttl: ONE_MINUTE }, // Tối đa 10 đăng nhập/phút
  otpRequest: { limit: 3, ttl: ONE_MINUTE }, // Tối đa 3 yêu cầu OTP/phút
  otpLogin: { limit: 5, ttl: ONE_MINUTE }, // Tối đa 5 đăng nhập OTP/phút
  oauth: { limit: 10, ttl: ONE_MINUTE }, // Tối đa 10 OAuth requests/phút
  verification: { limit: 5, ttl: FIVE_MINUTES }, // Tối đa 5 verification requests/5 phút
  refresh: { limit: 10, ttl: ONE_MINUTE }, // Tối đa 10 refresh token requests/phút
} as const;

/**
 * @ApiTags('Auth') - Nhóm các endpoints này trong Swagger UI với tag "Auth"
 * @Controller('auth') - Định nghĩa base route là /auth
 * AuthController - Controller xử lý các HTTP requests liên quan đến authentication và authorization
 * Bao gồm: đăng ký, đăng nhập, OAuth, 2FA, verification, password reset, etc.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject AuthService khi tạo instance của controller
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * @Post('register') - HTTP POST method, route: POST /auth/register
   * Đăng ký user mới với email/phone và password
   * @Throttle({ register: RATE_LIMITS.register }) - Rate limit: tối đa 5 requests/phút
   * @ApiBody({ type: RegisterUserDto }) - Validate request body theo RegisterUserDto
   */
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký user mới' })
  @ApiBody({ type: RegisterUserDto })
  @Throttle({ register: RATE_LIMITS.register })
  register(@Body() dto: RegisterUserDto) {
    // Gọi service để đăng ký user mới
    // Service sẽ: hash password, tạo user, tạo associate, tạo wallets (diamond, vex), gửi verification code
    return this.authService.register(dto);
  }

  /**
   * @Post('login') - HTTP POST method, route: POST /auth/login
   * Đăng nhập với email/phone và password
   * @Throttle({ login: RATE_LIMITS.login }) - Rate limit: tối đa 10 requests/phút
   * @Req() req - Lấy request object để lấy IP address (dùng cho rate limiting và security)
   * @ApiBody({ type: LoginDto }) - Validate request body theo LoginDto
   */
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập với email/phone và password' })
  @ApiBody({ type: LoginDto })
  @Throttle({ login: RATE_LIMITS.login })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    // Gọi service để đăng nhập
    // Service sẽ: verify password, check 2FA, tạo JWT tokens
    // Nếu user có 2FA enabled, sẽ trả về requires_2fa: true và temp_token
    const res = await this.authService.login(dto, req.ip);

    // Check nếu response có requires_2fa (2FA enabled), trả về nguyên vẹn
    // Nếu không, format response để đảm bảo structure nhất quán
    if ('requires_2fa' in res && res.requires_2fa === true) {
      // 2FA flow: validate và trả về requires_2fa, temp_token, expires_in
      const twoFactorRes = res as {
        requires_2fa: boolean;
        temp_token: string;
        expires_in: number;
      };
      // Defensive check: đảm bảo 2FA response có đầy đủ các properties cần thiết
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

    // Normal login flow: validate và format response với access_token, refresh_token, expires_at
    const authRes = res as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: string;
    };
    // Defensive check: đảm bảo response có đầy đủ các properties cần thiết
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

  /**
   * @Post('login/otp/request') - HTTP POST method, route: POST /auth/login/otp/request
   * Yêu cầu OTP để đăng nhập qua số điện thoại
   * @Throttle({ otpRequest: RATE_LIMITS.otpRequest }) - Rate limit: tối đa 3 requests/phút
   *
   * Lưu ý:
   * - Khác với `/auth/phone/request` (chỉ verify số điện thoại của user đã tồn tại, không đăng nhập)
   * - Endpoint này có thể được sử dụng cho cả user mới (hệ thống sẽ tự động tạo account) hoặc user đã tồn tại
   * - OTP sẽ được gửi qua SMS và có thời hạn sử dụng
   * - Trong môi trường development, OTP code sẽ được trả về trong response để test
   * - Trong production, OTP chỉ được gửi qua SMS
   */
  @Post('login/otp/request')
  @ApiOperation({
    summary: 'Yêu cầu OTP để đăng nhập qua số điện thoại',
    description:
      'Gửi mã OTP đến số điện thoại để đăng nhập. Endpoint này có thể được sử dụng cho cả user mới (hệ thống sẽ tự động tạo account) hoặc user đã tồn tại. OTP sẽ được gửi qua SMS và có thời hạn sử dụng. Sau khi nhận OTP, user cần gọi endpoint /auth/login/otp để verify và đăng nhập.\n\n**Lưu ý:**\n- Khác với `/auth/phone/request` (chỉ verify số điện thoại của user đã tồn tại, không đăng nhập)\n- Rate limit: Tối đa 3 requests/phút để tránh spam\n- Trong môi trường development, OTP code sẽ được trả về trong response để test\n- Trong production, OTP chỉ được gửi qua SMS',
  })
  @ApiBody({
    type: RequestPhoneCodeDto,
    description: 'Số điện thoại theo định dạng E.164 (ví dụ: +84912345678)',
  })
  @ApiCreatedResponse({
    description: 'OTP đã được gửi thành công đến số điện thoại',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'boolean', example: false },
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Verification code sent successfully' },
        data: {
          type: 'object',
          nullable: true,
          properties: {
            expires_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-20T08:50:00Z',
              description: 'Thời gian hết hạn của OTP code',
            },
            preview_code: {
              type: 'string',
              example: '123456',
              description: 'OTP code để test (chỉ có trong development mode)',
            },
          },
          example: {
            expires_at: '2025-11-20T08:50:00Z',
            preview_code: '123456',
          },
        },
        traceId: { type: 'string', example: 'BFu11CDQq4' },
      },
      required: ['error', 'code', 'message', 'data', 'traceId'],
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Số điện thoại không hợp lệ hoặc không đúng định dạng E.164',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too Many Requests - Vượt quá rate limit (tối đa 3 requests/phút)',
  })
  @Throttle({ otpRequest: RATE_LIMITS.otpRequest })
  requestLoginOtp(@Body() dto: RequestPhoneCodeDto) {
    // Gọi service để tạo và gửi OTP code qua SMS
    // Service sẽ tạo verification code và gửi SMS (hoặc trả về trong dev mode)
    return this.authService.requestPhoneLoginOtp(dto.phone);
  }

  /**
   * @Post('login/otp') - HTTP POST method, route: POST /auth/login/otp
   * Đăng nhập qua OTP số điện thoại
   * @Throttle({ otpLogin: RATE_LIMITS.otpLogin }) - Rate limit: tối đa 5 requests/phút
   * @Req() req - Lấy IP address để track và security
   *
   * Lưu ý:
   * - Verify OTP và đăng nhập
   * - Nếu user chưa tồn tại, sẽ tự động tạo account mới
   * - Trả về JWT token để đăng nhập
   * - Khác với /auth/phone/verify (chỉ verify, không đăng nhập)
   */
  @Post('login/otp')
  @ApiOperation({
    summary: 'Đăng nhập qua OTP số điện thoại',
    description:
      'Verify OTP và đăng nhập. Nếu user chưa tồn tại, sẽ tự động tạo account mới. Trả về JWT token để đăng nhập. Khác với /auth/phone/verify (chỉ verify, không đăng nhập).',
  })
  @ApiBody({ type: LoginOtpDto })
  @Throttle({ otpLogin: RATE_LIMITS.otpLogin })
  loginOtp(@Body() dto: LoginOtpDto, @Req() req: Request) {
    // Gọi service để verify OTP và đăng nhập
    // Service sẽ: verify OTP, tìm hoặc tạo user, tạo JWT tokens
    return this.authService.loginOtp(dto, req.ip);
  }

  /**
   * @Post('login/oauth') - HTTP POST method, route: POST /auth/login/oauth
   * Đăng nhập qua OAuth provider (Google, Facebook, Anonymous)
   * @Throttle({ oauth: RATE_LIMITS.oauth }) - Rate limit: tối đa 10 requests/phút
   * @Req() req - Lấy IP address để track và security
   *
   * Bảo mật:
   * - Google: Verify access token với https://www.googleapis.com/oauth2/v2/userinfo
   * - Facebook: Verify access token với https://graph.facebook.com/debug_token
   * - Anonymous: Không verify (dùng cho testing)
   *
   * Cách sử dụng (Google/Facebook):
   * 1. Client lấy access_token từ Google/Facebook OAuth flow (client-side)
   * 2. Gửi POST request CHỈ với: provider và access_token
   * 3. Server verify token với provider API và tự động lấy thông tin user
   * 4. Đăng nhập hoặc tạo user mới
   *
   * Cách sử dụng (Anonymous):
   * - Gửi provider: "anonymous", provider_id (required), email và nickname (optional)
   */
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
    // Gọi service để đăng nhập qua OAuth
    // Service sẽ: verify token với provider API, tìm hoặc tạo user, tạo JWT tokens
    return this.authService.loginOAuth(dto, req.ip);
  }

  /**
   * @Get('oauth/google') - HTTP GET method, route: GET /auth/oauth/google
   * Chuyển hướng sang Google OAuth (server-side flow)
   * @UseGuards(NestAuthGuard('google')) - Sử dụng GoogleStrategy để xử lý OAuth flow
   * @ApiExcludeEndpoint() - Ẩn endpoint này khỏi Swagger UI (vì không thể test trên Swagger)
   *
   * Lưu ý:
   * - Endpoint này redirect đến Google OAuth consent screen
   * - Sử dụng trong browser: mở URL này trong tab mới để bắt đầu OAuth flow
   * - Sau khi user authorize, Google sẽ redirect về /auth/oauth/google/callback
   * - Passport Strategy sẽ tự động xử lý redirect
   */
  @Get('oauth/google')
  @ApiOperation({
    summary: 'Chuyển hướng sang Google OAuth (server-side flow)',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Endpoint này redirect đến Google OAuth. Sử dụng trong browser: mở URL này trong tab mới để bắt đầu OAuth flow. Sau khi authorize, Google sẽ redirect về /auth/oauth/google/callback',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('google'))
  googleAuth() {
    // Passport Strategy sẽ tự động redirect tới Google OAuth consent screen
    // Không cần code ở đây, Passport xử lý tất cả
  }

  /**
   * @Get('oauth/google/callback') - HTTP GET method, route: GET /auth/oauth/google/callback
   * Callback từ Google OAuth
   * @UseGuards(NestAuthGuard('google')) - GoogleStrategy đã xử lý OAuth flow và set req.user
   * @ApiExcludeEndpoint() - Ẩn endpoint này khỏi Swagger UI (vì không thể test trên Swagger)
   *
   * Lưu ý:
   * - Đây là callback endpoint được Google gọi sau khi user authorize
   * - GoogleStrategy đã verify token và set req.user với GoogleProfile
   * - Chỉ hoạt động trong OAuth flow thực tế (không thể test trên Swagger)
   */
  @Get('oauth/google/callback')
  @ApiOperation({
    summary: 'Callback từ Google OAuth',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Đây là callback endpoint được Google gọi sau khi user authorize. Chỉ hoạt động trong OAuth flow thực tế.',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('google'))
  async googleAuthCallback(@Req() req: any) {
    // GoogleStrategy đã verify token và set req.user với GoogleProfile
    const profile = req.user as GoogleProfile;
    // Gọi service để đăng nhập với thông tin từ Google
    // Service sẽ: tìm hoặc tạo user, tạo JWT tokens
    // isServerSideFlow=true vì đây là server-side flow đã được verify bởi Passport Strategy
    return this.authService.loginOAuth(
      {
        provider: profile.provider,
        provider_id: profile.providerId,
        email: profile.email,
        nickname: profile.nickname,
      },
      req.ip,
      true, // isServerSideFlow: true - đã verify bởi Passport Strategy
    );
  }

  /**
   * @Get('oauth/facebook') - HTTP GET method, route: GET /auth/oauth/facebook
   * Chuyển hướng sang Facebook OAuth (server-side flow)
   * @UseGuards(NestAuthGuard('facebook')) - Sử dụng FacebookStrategy để xử lý OAuth flow
   * @ApiExcludeEndpoint() - Ẩn endpoint này khỏi Swagger UI (vì không thể test trên Swagger)
   *
   * Lưu ý:
   * - Endpoint này redirect đến Facebook OAuth consent screen
   * - Sử dụng trong browser: mở URL này trong tab mới để bắt đầu OAuth flow
   * - Sau khi user authorize, Facebook sẽ redirect về /auth/oauth/facebook/callback
   * - Passport Strategy sẽ tự động xử lý redirect
   */
  @Get('oauth/facebook')
  @ApiOperation({
    summary: 'Chuyển hướng sang Facebook OAuth (server-side flow)',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Endpoint này redirect đến Facebook OAuth. Sử dụng trong browser: mở URL này trong tab mới để bắt đầu OAuth flow. Sau khi authorize, Facebook sẽ redirect về /auth/oauth/facebook/callback',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('facebook'))
  facebookAuth() {
    // Passport Strategy sẽ tự động redirect tới Facebook OAuth consent screen
    // Không cần code ở đây, Passport xử lý tất cả
  }

  /**
   * @Get('oauth/facebook/callback') - HTTP GET method, route: GET /auth/oauth/facebook/callback
   * Callback từ Facebook OAuth
   * @UseGuards(NestAuthGuard('facebook')) - FacebookStrategy đã xử lý OAuth flow và login
   * @ApiExcludeEndpoint() - Ẩn endpoint này khỏi Swagger UI (vì không thể test trên Swagger)
   *
   * Lưu ý:
   * - Đây là callback endpoint được Facebook gọi sau khi user authorize
   * - FacebookStrategy đã verify token, tìm/tạo user, và login
   * - req.user đã chứa kết quả (JWT tokens) từ FacebookStrategy
   * - Chỉ hoạt động trong OAuth flow thực tế (không thể test trên Swagger)
   */
  @Get('oauth/facebook/callback')
  @ApiOperation({
    summary: 'Callback từ Facebook OAuth',
    description:
      '⚠️ KHÔNG THỂ TEST TRÊN SWAGGER - Đây là callback endpoint được Facebook gọi sau khi user authorize. Chỉ hoạt động trong OAuth flow thực tế.',
  })
  @ApiExcludeEndpoint()
  @UseGuards(NestAuthGuard('facebook'))
  async facebookAuthCallback(@Req() req: any) {
    // FacebookStrategy đã xử lý login trong validate() method
    // req.user chứa kết quả (JWT tokens) từ authService.loginOAuth()
    return req.user;
  }

  /**
   * @Post('login/verify-2fa') - HTTP POST method, route: POST /auth/login/verify-2fa
   * Xác thực mã 2FA cho phiên đăng nhập đang chờ
   * @Throttle({ login: RATE_LIMITS.login }) - Rate limit: tối đa 10 requests/phút
   * @Req() req - Lấy IP address để track và security
   *
   * Lưu ý:
   * - Endpoint này được gọi sau khi login trả về requires_2fa: true
   * - User cần gửi temp_token (từ login response) và 2FA code
   * - Sau khi verify thành công, sẽ trả về JWT tokens
   */
  @Post('login/verify-2fa')
  @ApiOperation({ summary: 'Xác thực mã 2FA cho phiên đăng nhập đang chờ' })
  @ApiBody({ type: VerifyTwoFactorLoginDto })
  @Throttle({ login: RATE_LIMITS.login })
  verifyLoginTwoFactor(@Body() dto: VerifyTwoFactorLoginDto, @Req() req: Request) {
    // Gọi service để verify 2FA code
    // Service sẽ: verify temp_token, verify 2FA code, tạo JWT tokens
    return this.authService.verifyLoginTwoFactor(dto, req.ip);
  }

  /**
   * @Post('link') - HTTP POST method, route: POST /auth/link
   * Thêm tài khoản bên thứ 3 (Google, Facebook, phone, password) vào tài khoản hiện có
   * @UseGuards(AuthGuard('account-auth')) - Yêu cầu authentication (JWT token)
   * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
   * @ApiBody({ type: LinkProviderDto }) - Validate request body theo LinkProviderDto
   *
   * Lưu ý:
   * - User phải đã đăng nhập (có JWT token)
   * - Cho phép link nhiều providers vào cùng 1 account
   * - Nếu provider đã được link với account khác, sẽ throw error
   */
  @Post('link')
  @ApiOperation({
    summary: 'Thêm tài khoản bên thứ 3 (Google, Facebook…) vào tài khoản hiện có của bạn',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: LinkProviderDto })
  @UseGuards(AuthGuard('account-auth'))
  link(@Body() body: LinkProviderDto, @Req() req: any) {
    // Lấy user_id từ JWT token (user đang đăng nhập)
    const userId = req.user.id;
    // Gọi service để link provider vào account
    // Service sẽ: tạo resAssociate record với provider và ref_id
    return this.authService.linkProvider(userId, body.provider, body.ref_id, body.hash);
  }

  /**
   * @Post('email/request') - HTTP POST method, route: POST /auth/email/request
   * Yêu cầu mã xác thực email
   * @Throttle({ emailVerification: RATE_LIMITS.verification }) - Rate limit: tối đa 5 requests/5 phút
   * @ApiBody({ type: RequestEmailCodeDto }) - Validate request body theo RequestEmailCodeDto
   *
   * Lưu ý:
   * - Gửi mã xác thực đến email
   * - Chỉ dùng cho user đã tồn tại (không tự động tạo account)
   * - Mã sẽ được gửi qua email (hoặc trả về trong dev mode)
   */
  @Post('email/request')
  @ApiOperation({ summary: 'Yêu cầu mã xác thực email' })
  @ApiBody({ type: RequestEmailCodeDto })
  @Throttle({ emailVerification: RATE_LIMITS.verification })
  requestEmailCode(@Body() dto: RequestEmailCodeDto) {
    // Gọi service để tạo và gửi email verification code
    // Service sẽ tạo verification code và gửi email (hoặc trả về trong dev mode)
    return this.authService.requestEmailVerification(dto.email);
  }

  /**
   * @Post('email/verify') - HTTP POST method, route: POST /auth/email/verify
   * Xác thực email với mã
   * @ApiBody({ type: VerifyEmailCodeDto }) - Validate request body theo VerifyEmailCodeDto
   *
   * Lưu ý:
   * - Verify mã xác thực và đánh dấu email đã được verify
   * - Chỉ dùng cho user đã tồn tại
   * - Sau khi verify, email_verified sẽ được set thành true
   */
  @Post('email/verify')
  @ApiOperation({ summary: 'Xác thực email với mã' })
  @ApiBody({ type: VerifyEmailCodeDto })
  verifyEmail(@Body() dto: VerifyEmailCodeDto) {
    // Gọi service để verify email code
    // Service sẽ: verify code, update email_verified = true
    return this.authService.verifyEmailCode(dto.email, dto.code);
  }

  /**
   * @Post('phone/request') - HTTP POST method, route: POST /auth/phone/request
   * Yêu cầu mã xác thực số điện thoại
   * @Throttle({ phoneVerification: RATE_LIMITS.verification }) - Rate limit: tối đa 5 requests/5 phút
   * @ApiBody({ type: RequestPhoneCodeDto }) - Validate request body theo RequestPhoneCodeDto
   *
   * Lưu ý:
   * - Gửi mã xác thực đến số điện thoại của user đã tồn tại
   * - Chỉ dùng để verify số điện thoại, KHÔNG đăng nhập
   * - Nếu muốn đăng nhập bằng OTP, dùng /auth/login/otp/request
   * - Yêu cầu user phải đã có account
   */
  @Post('phone/request')
  @ApiOperation({
    summary: 'Yêu cầu mã xác thực số điện thoại',
    description:
      'Gửi mã xác thực đến số điện thoại của user đã tồn tại. Chỉ dùng để verify số điện thoại, KHÔNG đăng nhập. Nếu muốn đăng nhập bằng OTP, dùng /auth/login/otp/request. Yêu cầu user phải đã có account.',
  })
  @ApiBody({ type: RequestPhoneCodeDto })
  @Throttle({ phoneVerification: RATE_LIMITS.verification })
  requestPhoneCode(@Body() dto: RequestPhoneCodeDto) {
    // Gọi service để tạo và gửi phone verification code
    // Service sẽ tạo verification code và gửi SMS (hoặc trả về trong dev mode)
    return this.authService.requestPhoneVerification(dto.phone);
  }

  /**
   * @Post('phone/verify') - HTTP POST method, route: POST /auth/phone/verify
   * Xác thực số điện thoại với mã
   * @ApiBody({ type: VerifyPhoneCodeDto }) - Validate request body theo VerifyPhoneCodeDto
   *
   * Lưu ý:
   * - Verify mã xác thực và đánh dấu số điện thoại đã được verify
   * - KHÔNG đăng nhập, chỉ verify
   * - Nếu muốn đăng nhập bằng OTP, dùng /auth/login/otp
   * - Yêu cầu user phải đã có account
   * - Sau khi verify, phone_verified sẽ được set thành true
   */
  @Post('phone/verify')
  @ApiOperation({
    summary: 'Xác thực số điện thoại với mã',
    description:
      'Verify mã xác thực và đánh dấu số điện thoại đã được verify. KHÔNG đăng nhập, chỉ verify. Nếu muốn đăng nhập bằng OTP, dùng /auth/login/otp. Yêu cầu user phải đã có account.',
  })
  @ApiBody({ type: VerifyPhoneCodeDto })
  verifyPhone(@Body() dto: VerifyPhoneCodeDto) {
    // Gọi service để verify phone code
    // Service sẽ: verify code, update phone_verified = true
    return this.authService.verifyPhoneCode(dto.phone, dto.code);
  }

  /**
   * @Post('2fa/setup') - HTTP POST method, route: POST /auth/2fa/setup
   * Tạo secret 2FA và QR code
   * @UseGuards(AuthGuard('account-auth')) - Yêu cầu authentication (JWT token)
   * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
   *
   * Lưu ý:
   * - User phải đã đăng nhập (có JWT token)
   * - Tạo 2FA secret và QR code để user scan vào authenticator app
   * - Sau khi setup, user cần gọi /auth/2fa/enable để kích hoạt 2FA
   */
  @Post('2fa/setup')
  @ApiOperation({ summary: 'Tạo secret 2FA' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  setupTwoFactor(@Req() req: any) {
    // Lấy user_id từ JWT token
    // Gọi service để tạo 2FA secret và QR code
    return this.authService.generateTwoFactorSecret(req.user.id);
  }

  /**
   * @Post('2fa/enable') - HTTP POST method, route: POST /auth/2fa/enable
   * Kích hoạt 2FA sau khi xác thực mã
   * @UseGuards(AuthGuard('account-auth')) - Yêu cầu authentication (JWT token)
   * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
   * @ApiBody({ type: TwoFactorCodeDto }) - Validate request body theo TwoFactorCodeDto
   *
   * Lưu ý:
   * - User phải đã đăng nhập (có JWT token)
   * - User phải đã setup 2FA (gọi /auth/2fa/setup trước)
   * - Verify 2FA code từ authenticator app
   * - Sau khi enable, user sẽ cần nhập 2FA code mỗi lần đăng nhập
   * - Trả về backup codes để user lưu lại (dùng khi mất device)
   */
  @Post('2fa/enable')
  @ApiOperation({ summary: 'Kích hoạt 2FA sau khi xác thực mã' })
  @ApiBody({ type: TwoFactorCodeDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  enableTwoFactor(@Body() dto: TwoFactorCodeDto, @Req() req: any) {
    // Lấy user_id từ JWT token
    // Gọi service để enable 2FA
    // Service sẽ: verify 2FA code, enable 2FA, tạo backup codes
    return this.authService.enableTwoFactor(req.user.id, dto.code);
  }

  /**
   * @Post('2fa/disable') - HTTP POST method, route: POST /auth/2fa/disable
   * Vô hiệu hóa 2FA
   * @UseGuards(AuthGuard('account-auth')) - Yêu cầu authentication (JWT token)
   * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
   * @ApiBody({ type: TwoFactorCodeDto }) - Validate request body theo TwoFactorCodeDto
   *
   * Lưu ý:
   * - User phải đã đăng nhập (có JWT token)
   * - User phải đã enable 2FA
   * - Verify 2FA code từ authenticator app để disable
   * - Sau khi disable, user sẽ không cần nhập 2FA code khi đăng nhập
   */
  @Post('2fa/disable')
  @ApiOperation({ summary: 'Vô hiệu hóa 2FA' })
  @ApiBody({ type: TwoFactorCodeDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  disableTwoFactor(@Body() dto: TwoFactorCodeDto, @Req() req: any) {
    // Lấy user_id từ JWT token
    // Gọi service để disable 2FA
    // Service sẽ: verify 2FA code, disable 2FA
    return this.authService.disableTwoFactor(req.user.id, dto.code);
  }

  /**
   * @Post('refresh') - HTTP POST method, route: POST /auth/refresh
   * Làm mới access token bằng refresh token
   * @Throttle({ refresh: RATE_LIMITS.refresh }) - Rate limit: tối đa 10 requests/phút
   * @Req() req - Lấy IP address để track và security
   * @ApiBody({ type: RefreshTokenDto }) - Validate request body theo RefreshTokenDto
   *
   * Lưu ý:
   * - Dùng refresh token để tạo access token mới
   * - Refresh token sẽ được rotate (tạo mới và revoke cũ) để tăng bảo mật
   * - Access token mới sẽ có thời hạn mới
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiBody({ type: RefreshTokenDto })
  @Throttle({ refresh: RATE_LIMITS.refresh })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    // Gọi service để refresh tokens
    // Service sẽ: verify refresh token, rotate refresh token, tạo access token mới
    return this.authService.refreshTokens(dto.refresh_token, req.ip);
  }

  /**
   * @Post('logout') - HTTP POST method, route: POST /auth/logout
   * Đăng xuất và hủy token
   * @UseGuards(AuthGuard('account-auth')) - Yêu cầu authentication (JWT token)
   * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
   * @ApiBody({ type: LogoutDto, required: false }) - Refresh token (optional) trong body
   *
   * Lưu ý:
   * - Blacklist access token hiện tại (luôn luôn làm)
   * - Nếu có refresh_token trong body, sẽ revoke refresh token đó để ngăn tạo access token mới
   * - Sau khi logout, access token và refresh token sẽ không thể sử dụng được nữa
   */
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
    // Lấy access token từ Authorization header
    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader ? authHeader.split(' ')[1] : undefined;
    // Gọi service để logout
    // Service sẽ: blacklist access token, revoke refresh token (nếu có)
    return this.authService.logout(req.user.id, dto?.refresh_token, token);
  }

  /**
   * @Get('me') - HTTP GET method, route: GET /auth/me
   * Lấy thông tin user hiện tại từ token
   * @UseGuards(AuthGuard('account-auth')) - Yêu cầu authentication (JWT token)
   * @ApiBearerAuth('JWT-auth') - Yêu cầu JWT token trong header
   *
   * Lưu ý:
   * - Trả về thông tin user hiện tại (user đang đăng nhập)
   * - User object đã được load từ JWT strategy, service sẽ optimize để tránh duplicate query
   * - Trả về full user profile với associates (providers)
   */
  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại từ token' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('account-auth'))
  getMe(@Req() req: any) {
    // Pass the entire user object from JWT strategy to avoid duplicate query
    // Service sẽ check nếu user object đã có associates thì dùng luôn, không query lại
    return this.authService.getCurrentUser(req.user);
  }

  /**
   * @Post('password/forgot') - HTTP POST method, route: POST /auth/password/forgot
   * Yêu cầu reset password qua email
   * @Throttle({ verification: RATE_LIMITS.verification }) - Rate limit: tối đa 5 requests/5 phút
   * @ApiBody({ type: RequestPasswordResetDto }) - Validate request body theo RequestPasswordResetDto
   *
   * Lưu ý:
   * - Gửi mã reset password đến email
   * - Chỉ dùng cho user đã tồn tại với provider 'password'
   * - Mã sẽ được gửi qua email (hoặc trả về trong dev mode)
   * - Trả về generic message để không leak thông tin (kể cả khi email không tồn tại)
   */
  @Post('password/forgot')
  @ApiOperation({ summary: 'Yêu cầu reset password qua email' })
  @ApiBody({ type: RequestPasswordResetDto })
  @Throttle({ verification: RATE_LIMITS.verification })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    // Gọi service để tạo và gửi password reset code
    // Service sẽ: tạo verification code với context 'password-reset', gửi email
    return this.authService.requestPasswordReset(dto.email);
  }

  /**
   * @Post('password/reset') - HTTP POST method, route: POST /auth/password/reset
   * Reset password với mã xác thực từ email
   * @Throttle({ verification: RATE_LIMITS.verification }) - Rate limit: tối đa 5 requests/5 phút
   * @ApiBody({ type: ResetPasswordDto }) - Validate request body theo ResetPasswordDto
   *
   * Lưu ý:
   * - Verify mã reset password và update password mới
   * - Chỉ dùng cho user đã tồn tại với provider 'password'
   * - Password mới phải đáp ứng yêu cầu về độ mạnh (uppercase, lowercase, number, special char, min 8 chars)
   * - Sau khi reset, user cần đăng nhập lại với password mới
   */
  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password với mã xác thực từ email' })
  @ApiBody({ type: ResetPasswordDto })
  @Throttle({ verification: RATE_LIMITS.verification })
  resetPassword(@Body() dto: ResetPasswordDto) {
    // Gọi service để reset password
    // Service sẽ: verify code với context 'password-reset', validate password strength, hash và update password
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }
}
