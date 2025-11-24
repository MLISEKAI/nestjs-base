// Import các decorator, exception và Logger từ NestJS
import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
// Import PassportStrategy để tạo Facebook OAuth strategy
import { PassportStrategy } from '@nestjs/passport';
// Import Strategy và Profile từ passport-facebook
import { Strategy, Profile } from 'passport-facebook';
// Import ConfigService để đọc Facebook OAuth config
import { ConfigService } from '@nestjs/config';
// Import AuthService để login sau khi OAuth thành công
import { AuthService } from '../auth.service';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * FacebookStrategy - Facebook OAuth Strategy để xử lý Facebook OAuth flow
 *
 * Chức năng:
 * - Redirect user đến Facebook OAuth consent screen
 * - Xử lý callback từ Facebook sau khi user authorize
 * - Login user sau khi OAuth thành công (khác với GoogleStrategy)
 *
 * @extends PassportStrategy(Strategy, 'facebook')
 *   - Strategy: passport-facebook Strategy
 *   - 'facebook': Tên của strategy (dùng trong @UseGuards(AuthGuard('facebook')))
 *
 * Lưu ý:
 * - Khác với GoogleStrategy: FacebookStrategy tự động login user trong validate()
 * - GoogleStrategy chỉ extract profile, controller sẽ gọi loginOAuth()
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  // Logger để log các events và errors
  private readonly logger = new Logger(FacebookStrategy.name);

  /**
   * Constructor - Dependency Injection
   *
   * @param configService - ConfigService để đọc Facebook OAuth config
   * @param authService - AuthService để login user sau khi OAuth thành công
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
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
   * @param accessToken - Facebook OAuth access token
   * @param refreshToken - Facebook OAuth refresh token
   * @param profile - Facebook user profile
   * @param done - Callback function để return result
   * @returns JWT tokens (từ authService.loginOAuth) hoặc error
   *
   * Quy trình:
   * 1. Check Facebook OAuth config
   * 2. Extract email, providerId, nickname từ Facebook profile
   * 3. Gọi authService.loginOAuth() để login user
   * 4. Return JWT tokens (sẽ được attach vào req.user)
   *
   * Lưu ý:
   * - Khác với GoogleStrategy: FacebookStrategy tự động login user trong validate()
   * - GoogleStrategy chỉ extract profile, controller sẽ gọi loginOAuth()
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    // Check Facebook OAuth config
    const clientID = this.configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

    if (!clientID || !clientSecret) {
      this.logger.warn(
        'Facebook OAuth is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment variables.',
      );
      return done(new ServiceUnavailableException('Facebook OAuth is not configured'));
    }

    try {
      // Extract email từ Facebook profile
      const email = profile.emails?.[0]?.value;
      // Extract providerId (Facebook user ID)
      const providerId = profile.id;
      // Extract nickname (displayName hoặc username)
      const nickname = profile.displayName || profile.username || 'Facebook User';

      // Gọi authService.loginOAuth() để login user
      // Service sẽ: tìm hoặc tạo user, tạo JWT tokens
      // isServerSideFlow=true vì đây là server-side flow đã được verify bởi Passport Strategy
      const result = await this.authService.loginOAuth(
        {
          provider: 'facebook',
          provider_id: providerId,
          email,
          nickname,
        },
        undefined, // ipAddress không cần trong server-side flow
        true, // isServerSideFlow: true - đã verify bởi Passport Strategy
      );

      // Return JWT tokens (sẽ được attach vào req.user)
      return done(null, result);
    } catch (error) {
      // Return error nếu có lỗi
      return done(error);
    }
  }
}
