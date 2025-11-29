import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './security/token.service';
import { TwoFactorService } from './security/two-factor.service';
import { RegistrationService } from './services/registration.service';
import { LoginService } from './services/login.service';
import { OAuthService } from './services/oauth.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import {
  RegisterWithEmailDto,
  RequestPhoneOtpDto,
  VerifyPhoneOtpDto,
  LoginDto,
  LoginOAuthDto,
  VerifyTwoFactorLoginDto,
  LinkProviderDto,
} from './dto';
import { ResUser, ResAssociate } from '@prisma/client';

/**
 * AuthService - Main orchestrator cho authentication
 */
@Injectable()
export class AuthService {
  private readonly isProduction: boolean;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly configService: ConfigService,
    private readonly registrationService: RegistrationService,
    private readonly loginService: LoginService,
    private readonly oauthService: OAuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
  ) {
    this.isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development') ===
      'production';
  }

  // ==================== REGISTRATION ====================

  async registerWithEmail(dto: RegisterWithEmailDto) {
    const { user, emailVerification } = await this.registrationService.registerWithEmail(
      dto,
      this.ensureStrongPassword.bind(this),
    );
    return {
      user,
      verification: {
        email: this.buildVerificationResponse(emailVerification),
      },
    };
  }

  async requestPhoneOtp(dto: RequestPhoneOtpDto) {
    const verification = await this.registrationService.requestPhoneOtp(dto);
    return this.buildVerificationResponse(verification);
  }

  async verifyPhoneOtp(dto: VerifyPhoneOtpDto, ipAddress?: string) {
    const user = await this.registrationService.verifyPhoneOtp(dto);
    return this.buildAuthResponse(user, ipAddress);
  }

  // ==================== LOGIN ====================

  async login(dto: LoginDto, ipAddress?: string) {
    const result = await this.loginService.login(
      dto,
      this.normalizeEmail.bind(this),
      this.ensureVerifiedContact.bind(this),
    );

    if (result.requires_2fa) {
      return result;
    }

    return this.buildAuthResponse(result.user, ipAddress);
  }

  async verifyLoginTwoFactor(dto: VerifyTwoFactorLoginDto, ipAddress?: string) {
    const user = await this.loginService.verifyLoginTwoFactor(dto.temp_token, dto.code);
    return this.buildAuthResponse(user, ipAddress);
  }

  async loginOAuth(dto: LoginOAuthDto, ipAddress?: string, isServerSideFlow: boolean = false) {
    const result = await this.oauthService.loginOAuth(dto, isServerSideFlow);

    if (result.requires_2fa) {
      return result;
    }

    return this.buildAuthResponse(result.user, ipAddress);
  }

  // ==================== VERIFICATION ====================

  async requestEmailVerification(email: string) {
    const verification = await this.emailVerificationService.requestEmailVerification(
      email,
      this.normalizeEmail.bind(this),
      this.genericVerificationMessage.bind(this),
    );
    return this.buildVerificationResponse(verification);
  }

  async verifyEmailCode(email: string, code: string) {
    return this.emailVerificationService.verifyEmailCode(email, code, this.normalizeEmail.bind(this));
  }

  // ==================== PASSWORD RESET ====================

  async requestPasswordReset(email: string) {
    const verification = await this.passwordResetService.requestPasswordReset(
      email,
      this.normalizeEmail.bind(this),
      this.genericVerificationMessage.bind(this),
    );
    return this.buildVerificationResponse(verification);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    return this.passwordResetService.resetPassword(
      email,
      code,
      newPassword,
      this.normalizeEmail.bind(this),
      this.ensureStrongPassword.bind(this),
    );
  }

  // ==================== 2FA ====================

  async generateTwoFactorSecret(user_id: string) {
    const user = await this.prisma.resUser.findUnique({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.twoFactorService.generateSecret(user);
  }

  async enableTwoFactor(user_id: string, code: string) {
    const result = await this.twoFactorService.enableTwoFactor(user_id, code);
    return {
      enabled: true,
      backup_codes: result.backupCodes,
    };
  }

  async disableTwoFactor(user_id: string, code: string) {
    await this.twoFactorService.disableTwoFactor(user_id, code);
    return { enabled: false };
  }

  // ==================== TOKEN MANAGEMENT ====================

  async refreshTokens(refreshToken: string, ipAddress?: string) {
    const { user, refreshToken: rotatedRefresh } = await this.tokenService.rotateRefreshToken(
      refreshToken,
      ipAddress,
    );
    return this.buildTokenResponse(
      (await this.tokenService.generateAccessToken(user.id, user.role)).token,
      rotatedRefresh,
      new Date(Date.now() + 3600 * 1000),
    );
  }

  async logout(user_id: string, refreshToken?: string, accessToken?: string) {
    await this.tokenService.blacklistAccessToken(accessToken, user_id, 'logout');
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken, user_id);
    }
    return { success: true };
  }

  // ==================== LINK PROVIDER ====================

  async linkProvider(user_id: string, data: LinkProviderDto) {
    // Implementation here (copy from old service)
    throw new Error('Not implemented yet');
  }

  // ==================== HELPERS ====================

  async getCurrentUser(userIdOrUser: string | any) {
    if (userIdOrUser && typeof userIdOrUser === 'object' && userIdOrUser.id) {
      return userIdOrUser;
    }

    const user = await this.prisma.resUser.findUnique({
      where: { id: userIdOrUser },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async buildAuthResponse(user: ResUser, ipAddress?: string) {
    const tokens = await this.tokenService.createSession(user, ipAddress);
    return this.buildTokenResponse(tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
  }

  private buildTokenResponse(accessToken: string, refreshToken: string, expiresAt: Date) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
    };
  }

  private buildVerificationResponse(verification: any) {
    if (!verification) return undefined;

    const response: any = {
      expires_at: verification.expires_at?.toISOString(),
    };

    if (!this.isProduction && verification.code) {
      response.preview_code = verification.code;
    }

    return response;
  }

  private genericVerificationMessage() {
    return {
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  private ensureStrongPassword(password: string) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
      );
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private ensureVerifiedContact(associate: ResAssociate) {
    if (associate.email && !associate.email_verified) {
      throw new UnauthorizedException('Email verification is required before logging in');
    }
    if (associate.phone_number && !associate.phone_verified) {
      throw new UnauthorizedException('Phone verification is required before logging in');
    }
  }
}
