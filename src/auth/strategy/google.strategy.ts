import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export interface GoogleProfile {
  provider: 'google';
  providerId: string;
  email?: string;
  nickname?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly isConfigured: boolean;

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || '/auth/oauth/google/callback';

    super({
      clientID: clientID || 'disabled',
      clientSecret: clientSecret || 'disabled',
      callbackURL,
      scope: ['email', 'profile'],
    });

    this.isConfigured = Boolean(clientID && clientSecret);
  }

  authenticate(req: any, options?: any) {
    if (!this.isConfigured) {
      return this.fail('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.', 503);
    }
    return super.authenticate(req, options);
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): GoogleProfile {
    const email = profile.emails?.[0]?.value;
    const nickname = profile.displayName;

    return {
      provider: 'google',
      providerId: profile.id,
      email,
      nickname,
    };
  }
}


