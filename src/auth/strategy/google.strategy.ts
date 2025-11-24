// Import các decorator từ NestJS
import { Injectable } from '@nestjs/common';
// Import ConfigService để đọc Google OAuth config
import { ConfigService } from '@nestjs/config';
// Import PassportStrategy để tạo Google OAuth strategy
import { PassportStrategy } from '@nestjs/passport';
// Import Strategy và Profile từ passport-google-oauth20
import { Strategy, Profile } from 'passport-google-oauth20';
// Import GoogleProfile interface
import { GoogleProfile } from '../interfaces';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * GoogleStrategy - Google OAuth Strategy để xử lý Google OAuth flow
 *
 * Chức năng:
 * - Redirect user đến Google OAuth consent screen
 * - Xử lý callback từ Google sau khi user authorize
 * - Extract user info từ Google profile
 *
 * @extends PassportStrategy(Strategy, 'google')
 *   - Strategy: passport-google-oauth20 Strategy
 *   - 'google': Tên của strategy (dùng trong @UseGuards(AuthGuard('google')))
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  // Flag để check xem Google OAuth đã được config chưa
  private readonly isConfigured: boolean;

  /**
   * Constructor - Dependency Injection
   *
   * @param configService - ConfigService để đọc Google OAuth config
   */
  constructor(configService: ConfigService) {
    // Đọc Google OAuth config từ environment variables
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') || '/auth/oauth/google/callback';

    // Configure Google OAuth Strategy
    super({
      clientID: clientID || 'disabled', // Nếu không có config, set 'disabled'
      clientSecret: clientSecret || 'disabled',
      callbackURL, // Callback URL sau khi user authorize
      scope: ['email', 'profile'], // Request email và profile từ Google
    });

    // Check xem Google OAuth đã được config chưa
    this.isConfigured = Boolean(clientID && clientSecret);
  }

  /**
   * authenticate - Override method để check config trước khi authenticate
   *
   * @param req - Request object
   * @param options - OAuth options
   * @returns Authentication result hoặc fail nếu chưa config
   *
   * Lưu ý:
   * - Check xem Google OAuth đã được config chưa
   * - Nếu chưa config, trả về 503 Service Unavailable
   */
  authenticate(req: any, options?: any) {
    if (!this.isConfigured) {
      return this.fail(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        503,
      );
    }
    return super.authenticate(req, options);
  }

  /**
   * validate - Method được Passport gọi sau khi Google OAuth flow thành công
   *
   * @param _accessToken - Google OAuth access token (không dùng trong server-side flow)
   * @param _refreshToken - Google OAuth refresh token (không dùng trong server-side flow)
   * @param profile - Google user profile
   * @returns GoogleProfile object (sẽ được attach vào req.user)
   *
   * Lưu ý:
   * - Extract email và nickname từ Google profile
   * - Return GoogleProfile để controller có thể sử dụng
   */
  validate(_accessToken: string, _refreshToken: string, profile: Profile): GoogleProfile {
    // Extract email từ Google profile
    const email = profile.emails?.[0]?.value;
    // Extract nickname (displayName) từ Google profile
    const nickname = profile.displayName;

    // Return GoogleProfile object
    return {
      provider: 'google',
      providerId: profile.id, // Google user ID
      email,
      nickname,
    };
  }
}
