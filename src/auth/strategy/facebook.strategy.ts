import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');
    const callbackURL =
      configService.get<string>('FACEBOOK_CALLBACK_URL') ||
      'http://localhost:3001/auth/oauth/facebook/callback';

    if (!clientID || !clientSecret) {
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL,
      });
      return;
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: 'email',
      profileFields: ['id', 'displayName', 'emails'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    const clientID = this.configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

    if (!clientID || !clientSecret) {
      this.logger.warn(
        'Facebook OAuth is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment variables.',
      );
      return done(new ServiceUnavailableException('Facebook OAuth is not configured'));
    }

    try {
      const email = profile.emails?.[0]?.value;
      const providerId = profile.id;
      const nickname = profile.displayName || profile.username || 'Facebook User';

      const result = await this.authService.loginOAuth(
        {
          provider: 'facebook',
          provider_id: providerId,
          email,
          nickname,
        },
        undefined,
      );

      return done(null, result);
    } catch (error) {
      return done(error);
    }
  }
}
