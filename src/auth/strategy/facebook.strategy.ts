// Import các decorator, exception và Logger từ NestJS
import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
// Import PassportStrategy để tạo Facebook OAuth strategy
import { PassportStrategy } from '@nestjs/passport';
// Import Strategy và Profile từ passport-facebook
import { Strategy, Profile } from 'passport-facebook';
// Import ConfigService để đọc Facebook OAuth config
import { ConfigService } from '@nestjs/config';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * FacebookStrategy - Facebook OAuth Strategy để xử lý Facebook OAuth flow
 *
 * Chức năng:
 * - Redirect user đến Facebook OAuth consent screen
 * - Xử lý callback từ Facebook sau khi user authorize
 * - Extract user info từ Facebook profile
 *
 * @extends PassportStrategy(Strategy, 'facebook')
 *   - Strategy: passport-facebook Strategy
 *   - 'facebook': Tên của strategy (dùng trong @UseGuards(AuthGuard('facebook')))
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  // Logger để log các events và errors
  private readonly logger = new Logger(FacebookStrategy.name);

  /**
   * Constructor - Dependency Injection
   *
   * @param configService - ConfigService để đọc Facebook OAuth config
   */
  constructor(private readonly configService: ConfigService) {
    // Đọc Facebook OAuth config từ environment variables
    const clientID = configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');
    const callbackURL =
      configService.get<string>('FACEBOOK_CALLBACK_URL') ||
      'http://localhost:3001/auth/oauth/facebook/callback';

    // Nếu chưa config, tạo strategy với dummy values
    if (!clientID || !clientSecret) {
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL,
      });
      return;
    }

    // Configure Facebook OAuth Strategy
    super({
      clientID,
      clientSecret,
      callbackURL, // Callback URL sau khi user authorize
      scope: 'email', // Request email từ Facebook
      profileFields: ['id', 'displayName', 'emails'], // Request các fields từ Facebook profile
    });
  }

  /**
   * validate - Method được Passport gọi sau khi Facebook OAuth flow thành công
   *
   * @param _accessToken - Facebook OAuth access token (không dùng trong server-side flow)
   * @param _refreshToken - Facebook OAuth refresh token (không dùng trong server-side flow)
   * @param profile - Facebook user profile
   * @returns FacebookProfile object (sẽ được attach vào req.user)
   *
   * Lưu ý:
   * - Extract email và nickname từ Facebook profile
   * - Return FacebookProfile để controller có thể sử dụng
   */
  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    // Check Facebook OAuth config
    const clientID = this.configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

    if (!clientID || !clientSecret) {
      this.logger.warn(
        'Facebook OAuth is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment variables.',
      );
      throw new ServiceUnavailableException('Facebook OAuth is not configured');
    }

    // Extract email từ Facebook profile
    const email = profile.emails?.[0]?.value;
    // Extract nickname (displayName hoặc username)
    const nickname = profile.displayName || profile.username || 'Facebook User';

    // Return FacebookProfile object
    return {
      provider: 'facebook',
      providerId: profile.id, // Facebook user ID
      email,
      nickname,
    };
  }
}
