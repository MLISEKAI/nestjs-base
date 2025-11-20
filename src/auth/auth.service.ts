import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  RegisterUserDto,
  LoginDto,
  LoginOtpDto,
  LoginOAuthDto,
  VerifyTwoFactorLoginDto,
} from './dto/auth.dto';
import * as crypto from 'crypto';
import { TokenService } from './security/token.service';
import { VerificationService } from './security/verification.service';
import { TwoFactorService } from './security/two-factor.service';
// import { AuthRateLimitService } from './security/auth-rate-limit.service';
import { ConfigService } from '@nestjs/config';
import { ResAssociate, ResUser } from '@prisma/client';
import { EmailService } from '../common/services/email.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly isProduction: boolean;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService,
    private readonly twoFactorService: TwoFactorService,
    // private readonly authRateLimit: AuthRateLimitService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
  ) {
    this.isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development') ===
      'production';
  }

  async register(dto: RegisterUserDto) {
    this.ensureStrongPassword(dto.password);

    if (dto.email) {
      dto.email = this.normalizeEmail(dto.email);
      const emailExists = await this.prisma.resAssociate.findFirst({
        where: { email: dto.email },
      });
      if (emailExists) throw new BadRequestException('Email already in use');
    }

    if (dto.phone_number) {
      dto.phone_number = dto.phone_number.trim();
      const phoneExists = await this.prisma.resAssociate.findFirst({
        where: { phone_number: dto.phone_number },
      });
      if (phoneExists) throw new BadRequestException('Phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.resUser.create({
      data: {
        union_id: crypto.randomUUID(),
        nickname: dto.nickname,
        avatar: dto.avatar,
        role: dto.role || 'user',
        bio: dto.bio,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : null,
        associates: {
          create: {
            ref_id: dto.email || dto.phone_number,
            hash: hashedPassword,
            provider: 'password',
            email: dto.email,
            phone_number: dto.phone_number,
          },
        },
      },
    });

    const emailVerification = dto.email
      ? await this.verificationService.createEmailCode({
          userId: user.id,
          target: dto.email,
          context: 'register',
        })
      : undefined;
    const phoneVerification = dto.phone_number
      ? await this.verificationService.createPhoneCode({
          userId: user.id,
          target: dto.phone_number,
          context: 'register',
        })
      : undefined;

    const verification: Record<string, unknown> = {};
    const emailResponse = this.buildVerificationResponse(emailVerification);
    const phoneResponse = this.buildVerificationResponse(phoneVerification);
    if (emailResponse) verification.email = emailResponse;
    if (phoneResponse) verification.phone = phoneResponse;

    return {
      user,
      verification,
    };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const ref = dto.ref_id.includes('@') ? this.normalizeEmail(dto.ref_id) : dto.ref_id.trim();
    // await this.authRateLimit.checkLogin(ref, ipAddress);
    const associate = await this.prisma.resAssociate.findFirst({
      where: {
        OR: [{ email: ref }, { phone_number: ref }],
      },
      include: { user: true },
    });

    if (!associate) {
      this.logger.warn(`Login failed: user not found`, { ref, ipAddress });
      throw new UnauthorizedException('User not found');
    }

    const isValid = associate.hash ? await bcrypt.compare(dto.password, associate.hash) : false;
    if (!isValid) {
      this.logger.warn(`Login failed: invalid password`, {
        ref,
        ipAddress,
        userId: associate.user.id,
      });
      throw new UnauthorizedException('Invalid password');
    }

    this.ensureVerifiedContact(associate);

    const twoFactorEnabled = await this.twoFactorService.isEnabled(associate.user.id);
    if (twoFactorEnabled) {
      const temp = await this.tokenService.generateTwoFactorToken(associate.user.id);
      return {
        requires_2fa: true,
        temp_token: temp.token,
        expires_in: temp.expiresIn,
      };
    }

    return this.buildAuthResponse(associate.user, ipAddress);
  }

  async requestPhoneLoginOtp(phone: string) {
    const verification = await this.verificationService.createPhoneCode({
      target: phone.trim(),
      context: 'login',
    });
    return this.buildVerificationResponse(verification);
  }

  async loginOtp(dto: LoginOtpDto, ipAddress?: string) {
    // await this.authRateLimit.checkOtp(dto.phone, ipAddress);
    await this.verificationService.verifyPhoneCode(dto.phone, dto.otp);
    let associate = await this.prisma.resAssociate.findFirst({
      where: { phone_number: dto.phone },
      include: { user: true },
    });
    if (!associate) {
      const user = await this.prisma.resUser.create({
        data: {
          union_id: crypto.randomUUID(),
          nickname: dto.phone,
          associates: {
            create: {
              ref_id: dto.phone,
              provider: 'phone',
              phone_number: dto.phone,
              phone_verified: true,
            },
          },
        },
      });
      associate = await this.prisma.resAssociate.findFirst({
        where: { phone_number: dto.phone },
        include: { user: true },
      });
      if (!associate) throw new NotFoundException('Associate not created');
    } else {
      await this.prisma.resAssociate.update({
        where: { id: associate.id },
        data: { phone_verified: true },
      });
    }

    return this.buildAuthResponse(associate.user, ipAddress);
  }

  async loginOAuth(dto: LoginOAuthDto, ipAddress?: string) {
    // Verify token với provider (trừ anonymous và server-side flow)
    let verifiedProfile: {
      provider_id: string;
      email?: string;
      nickname?: string;
    };

    if (dto.provider === 'anonymous') {
      // Anonymous không cần verify
      if (!dto.provider_id) {
        throw new BadRequestException('provider_id is required for anonymous provider');
      }
      verifiedProfile = {
        provider_id: dto.provider_id,
        email: dto.email,
        nickname: dto.nickname,
      };
    } else if (dto.provider_id && !dto.access_token) {
      // Server-side flow: đã verify bởi Passport Strategy, chỉ cần provider_id
      verifiedProfile = {
        provider_id: dto.provider_id,
        email: dto.email,
        nickname: dto.nickname,
      };
    } else if (dto.provider === 'google') {
      if (!dto.access_token) {
        throw new BadRequestException('access_token is required for Google provider');
      }
      verifiedProfile = await this.verifyGoogleToken(dto.access_token);
    } else if (dto.provider === 'facebook') {
      if (!dto.access_token) {
        throw new BadRequestException('access_token is required for Facebook provider');
      }
      verifiedProfile = await this.verifyFacebookToken(dto.access_token);
    } else {
      throw new BadRequestException(`Unsupported provider: ${dto.provider}`);
    }

    // Tìm user theo provider_id đã verify
    const associate = await this.prisma.resAssociate.findFirst({
      where: { provider: dto.provider, ref_id: verifiedProfile.provider_id },
      include: { user: true },
    });

    if (associate) {
      const twoFactorEnabled = await this.twoFactorService.isEnabled(associate.user.id);
      if (twoFactorEnabled) {
        const temp = await this.tokenService.generateTwoFactorToken(associate.user.id);
        return {
          requires_2fa: true,
          temp_token: temp.token,
          expires_in: temp.expiresIn,
        };
      }

      return this.buildAuthResponse(associate.user, ipAddress);
    }

    // Tạo user mới hoặc link với user đã có
    let user = undefined as any;
    if (verifiedProfile.email) {
      const emailAssoc = await this.prisma.resAssociate.findFirst({
        where: { email: this.normalizeEmail(verifiedProfile.email) },
        include: { user: true },
      });
      if (emailAssoc) user = emailAssoc.user;
    }
    if (!user) {
      user = await this.prisma.resUser.create({
        data: {
          union_id: crypto.randomUUID(),
          nickname: verifiedProfile.nickname || dto.provider,
        },
      });
    }
    await this.prisma.resAssociate.create({
      data: {
        user_id: user.id,
        provider: dto.provider,
        ref_id: verifiedProfile.provider_id,
        email: verifiedProfile.email ? this.normalizeEmail(verifiedProfile.email) : undefined,
        email_verified: Boolean(verifiedProfile.email),
      },
    });

    const twoFactorEnabled = await this.twoFactorService.isEnabled(user.id);
    if (twoFactorEnabled) {
      const temp = await this.tokenService.generateTwoFactorToken(user.id);
      return {
        requires_2fa: true,
        temp_token: temp.token,
        expires_in: temp.expiresIn,
      };
    }

    return this.buildAuthResponse(user, ipAddress);
  }

  /**
   * Verify Google access token và lấy thông tin user
   */
  private async verifyGoogleToken(accessToken: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      const data = response.data;
      if (!data.id) {
        throw new UnauthorizedException('Invalid Google token: missing user id');
      }

      return {
        provider_id: data.id,
        email: data.email,
        nickname: data.name,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired Google access token');
      }
      this.logger.error(`Google token verification failed: ${error.message}`);
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * Verify Facebook access token và lấy thông tin user
   */
  private async verifyFacebookToken(accessToken: string) {
    try {
      const appId = this.configService.get<string>('FACEBOOK_APP_ID');
      const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

      if (!appId || !appSecret) {
        throw new ServiceUnavailableException('Facebook OAuth is not configured');
      }

      // Verify token với Facebook
      const verifyResponse = await firstValueFrom(
        this.httpService.get('https://graph.facebook.com/debug_token', {
          params: {
            input_token: accessToken,
            access_token: `${appId}|${appSecret}`,
          },
        }),
      );

      if (!verifyResponse.data.data?.is_valid) {
        throw new UnauthorizedException('Invalid or expired Facebook access token');
      }

      const userId = verifyResponse.data.data.user_id;

      // Lấy thông tin user
      const userResponse = await firstValueFrom(
        this.httpService.get(`https://graph.facebook.com/${userId}`, {
          params: {
            fields: 'id,name,email',
            access_token: accessToken,
          },
        }),
      );

      const userData = userResponse.data;
      return {
        provider_id: userData.id,
        email: userData.email,
        nickname: userData.name,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired Facebook access token');
      }
      this.logger.error(`Facebook token verification failed: ${error.message}`);
      throw new UnauthorizedException('Failed to verify Facebook token');
    }
  }

  async linkProvider(
    userId: string,
    provider: 'google' | 'facebook' | 'phone' | 'password',
    refId: string,
    hash?: string,
  ) {
    const exists = await this.prisma.resAssociate.findFirst({ where: { provider, ref_id: refId } });
    if (exists) throw new BadRequestException('Provider already linked to another account');
    const data: any = { user_id: userId, provider, ref_id: refId };
    if (provider === 'password') {
      if (!hash) throw new BadRequestException('Password hash required');
      data.hash = hash;
      data.email = this.normalizeEmail(refId);
      data.email_verified = false;
    }
    if (provider === 'phone') {
      data.phone_number = refId.trim();
      data.phone_verified = false;
    }
    return this.prisma.resAssociate.create({ data });
  }

  async requestEmailVerification(email: string) {
    const normalized = this.normalizeEmail(email);
    const associate = await this.prisma.resAssociate.findFirst({ where: { email: normalized } });
    if (!associate) {
      return this.genericVerificationMessage();
    }

    const verification = await this.verificationService.createEmailCode({
      userId: associate.user_id,
      target: normalized,
      context: 'resend',
    });

    return this.buildVerificationResponse(verification);
  }

  async verifyEmailCode(email: string, code: string) {
    const normalized = this.normalizeEmail(email);
    await this.verificationService.verifyEmailCode(normalized, code);

    const associate = await this.prisma.resAssociate.findFirst({ where: { email: normalized } });
    if (!associate) {
      throw new NotFoundException('Account not found for this email');
    }

    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { email_verified: true },
    });

    return { verified: true };
  }

  async requestPhoneVerification(phone: string) {
    const associate = await this.prisma.resAssociate.findFirst({
      where: { phone_number: phone.trim() },
    });
    if (!associate) {
      return this.genericVerificationMessage();
    }
    const verification = await this.verificationService.createPhoneCode({
      userId: associate.user_id,
      target: phone.trim(),
      context: 'resend',
    });
    return this.buildVerificationResponse(verification);
  }

  async verifyPhoneCode(phone: string, code: string) {
    await this.verificationService.verifyPhoneCode(phone.trim(), code);

    const associate = await this.prisma.resAssociate.findFirst({
      where: { phone_number: phone.trim() },
    });
    if (!associate) {
      throw new NotFoundException('Account not found for this phone number');
    }

    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { phone_verified: true },
    });

    return { verified: true };
  }

  async requestPasswordReset(email: string) {
    const normalized = this.normalizeEmail(email);
    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: normalized, provider: 'password' },
      include: { user: true },
    });

    if (!associate) {
      // Trả về generic message để không leak thông tin
      return this.genericVerificationMessage();
    }

    // Tạo verification code với context 'password-reset'
    const verification = await this.verificationService.createEmailCode({
      userId: associate.user_id,
      target: normalized,
      context: 'password-reset',
    });

    // Gửi email với code
    try {
      await this.emailService.sendPasswordResetCode(normalized, verification.code);
      this.logger.log(`Password reset email sent to: ${normalized}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      // Vẫn trả về response để không leak thông tin
    }

    // Trong dev mode, log code ra console
    if (!this.isProduction) {
      this.logger.debug(`[DEV] Password reset code for ${normalized}: ${verification.code}`);
    }

    return this.buildVerificationResponse(verification);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const normalized = this.normalizeEmail(email);

    // Verify code với context 'password-reset'
    await this.verificationService.verifyEmailCodeWithContext(normalized, code, 'password-reset');

    // Tìm associate và update password
    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: normalized, provider: 'password' },
    });

    if (!associate) {
      throw new NotFoundException('Account not found');
    }

    // Validate password strength
    this.ensureStrongPassword(newPassword);

    // Hash password mới
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { hash: hashedPassword },
    });

    this.logger.log(`Password reset successful for user: ${associate.user_id}`);

    return { message: 'Password reset successfully' };
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.resUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.twoFactorService.generateSecret(user);
  }

  async enableTwoFactor(userId: string, code: string) {
    const result = await this.twoFactorService.enableTwoFactor(userId, code);
    return {
      enabled: true,
      backupCodes: result.backupCodes,
    };
  }

  async disableTwoFactor(userId: string, code: string) {
    await this.twoFactorService.disableTwoFactor(userId, code);
    return { enabled: false };
  }

  async refreshTokens(refreshToken: string, ipAddress?: string) {
    const { user, refreshToken: rotatedRefresh } = await this.tokenService.rotateRefreshToken(
      refreshToken,
      ipAddress,
    );
    const access = await this.tokenService.generateAccessToken(user.id, user.role);

    return this.buildTokenResponse(access.token, rotatedRefresh, access.expiresAt);
  }

  async logout(userId: string, refreshToken?: string, accessToken?: string) {
    // Blacklist access token hiện tại (luôn luôn làm)
    await this.tokenService.blacklistAccessToken(accessToken, userId, 'logout');

    // Nếu có refresh token, revoke nó để ngăn tạo access token mới
    if (refreshToken) {
      try {
        await this.tokenService.revokeRefreshToken(refreshToken, userId);
      } catch (error) {
        // Nếu refresh token không hợp lệ hoặc đã revoked, không cần throw error
        // Vì mục đích chính là blacklist access token, đã hoàn thành
        this.logger.warn(`Failed to revoke refresh token during logout: ${error.message}`);
      }
    }

    return { success: true };
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

  async verifyLoginTwoFactor(dto: VerifyTwoFactorLoginDto, ipAddress?: string) {
    const { userId } = await this.tokenService.verifyTwoFactorToken(dto.temp_token);
    await this.twoFactorService.verifyLoginCode(userId, dto.code);

    const user = await this.prisma.resUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildAuthResponse(user, ipAddress);
  }

  private async buildAuthResponse(user: ResUser, ipAddress?: string) {
    const tokens = await this.tokenService.createSession(user, ipAddress);
    return this.buildTokenResponse(tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
  }

  private buildVerificationResponse(result?: { code: string; expiresAt: Date }) {
    if (!result) {
      return undefined;
    }
    // Trả về object có 'message' để ResponseInterceptor extract message
    // nhưng vẫn giữ các field khác (expires_at, preview_code) trong data
    return {
      message: 'Verification code sent successfully',
      expires_at: result.expiresAt,
      ...(this.isProduction ? {} : { preview_code: result.code }),
    };
  }

  private genericVerificationMessage() {
    return { message: 'If the destination exists, a verification code has been sent' };
  }

  /**
   * Get current user with full profile information
   * Optimized to use existing user object if available to avoid duplicate queries
   */
  async getCurrentUser(userIdOrUser: string | any) {
    // If user object is already provided (from JWT strategy), use it directly
    if (userIdOrUser && typeof userIdOrUser === 'object' && userIdOrUser.id) {
      // Check if associates are already included
      if (userIdOrUser.associates) {
        return userIdOrUser;
      }
      // If not, fetch only associates to enrich the existing user object
      const associates = await this.prisma.resAssociate.findMany({
        where: { user_id: userIdOrUser.id },
        select: {
          id: true,
          provider: true,
          email: true,
          phone_number: true,
          email_verified: true,
          phone_verified: true,
        },
      });
      return {
        ...userIdOrUser,
        associates,
      };
    }

    // If only userId is provided, fetch full user with associates
    const userId = userIdOrUser as string;
    const user = await this.prisma.resUser.findUnique({
      where: { id: userId },
      include: {
        associates: {
          select: {
            id: true,
            provider: true,
            email: true,
            phone_number: true,
            email_verified: true,
            phone_verified: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private buildTokenResponse(accessToken: string, refreshToken: string, expiresAt: Date) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
    };
  }
}
