import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto, LoginDto, LoginOtpDto, LoginOAuthDto, VerifyTwoFactorLoginDto } from './dto/auth.dto';
import * as crypto from 'crypto';
import { TokenService } from './security/token.service';
import { VerificationService } from './security/verification.service';
import { TwoFactorService } from './security/two-factor.service';
import { ConfigService } from '@nestjs/config';
import { ResAssociate, ResUser } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService,
    private readonly twoFactorService: TwoFactorService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction = (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development') === 'production';
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
      ? await this.verificationService.createEmailCode({ userId: user.id, target: dto.email, context: 'register' })
      : undefined;
    const phoneVerification = dto.phone_number
      ? await this.verificationService.createPhoneCode({ userId: user.id, target: dto.phone_number, context: 'register' })
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
    const associate = await this.prisma.resAssociate.findFirst({
      where: {
        OR: [
          { email: ref },
          { phone_number: ref },
        ],
      },
      include: { user: true },
    });

    if (!associate) throw new UnauthorizedException('User not found');

    const isValid = associate.hash ? await bcrypt.compare(dto.password, associate.hash) : false;
    if (!isValid) throw new UnauthorizedException('Invalid password');

    this.ensureVerifiedContact(associate);

    const twoFactorEnabled = await this.twoFactorService.isEnabled(associate.user.id);
    if (twoFactorEnabled && !dto.twoFactorCode) {
      const temp = await this.tokenService.generateTwoFactorToken(associate.user.id);
      return {
        requires_2fa: true,
        temp_token: temp.token,
        expires_in: temp.expiresIn,
      };
    }

    if (twoFactorEnabled && dto.twoFactorCode) {
      await this.twoFactorService.verifyLoginCode(associate.user.id, dto.twoFactorCode);
    }

    return this.buildAuthResponse(associate.user, ipAddress);
  }

  async requestPhoneLoginOtp(phone: string) {
    const verification = await this.verificationService.createPhoneCode({ target: phone.trim(), context: 'login' });
    return this.buildVerificationResponse(verification);
  }

  async loginOtp(dto: LoginOtpDto, ipAddress?: string) {
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
      associate = await this.prisma.resAssociate.findFirst({ where: { phone_number: dto.phone }, include: { user: true } });
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
    let associate = await this.prisma.resAssociate.findFirst({
      where: { provider: dto.provider, ref_id: dto.provider_id },
      include: { user: true },
    });
    if (associate) {
      const twoFactorEnabled = await this.twoFactorService.isEnabled(associate.user.id);
      if (twoFactorEnabled && !dto.twoFactorCode) {
        const temp = await this.tokenService.generateTwoFactorToken(associate.user.id);
        return {
          requires_2fa: true,
          temp_token: temp.token,
          expires_in: temp.expiresIn,
        };
      }

      if (twoFactorEnabled && dto.twoFactorCode) {
        await this.twoFactorService.verifyLoginCode(associate.user.id, dto.twoFactorCode);
      }

      return this.buildAuthResponse(associate.user, ipAddress);
    }

    let user = undefined as any;
    if (dto.email) {
      const emailAssoc = await this.prisma.resAssociate.findFirst({
        where: { email: this.normalizeEmail(dto.email) },
        include: { user: true },
      });
      if (emailAssoc) user = emailAssoc.user;
    }
    if (!user) {
      user = await this.prisma.resUser.create({
        data: {
          union_id: crypto.randomUUID(),
          nickname: dto.nickname || dto.provider,
        },
      });
    }
    await this.prisma.resAssociate.create({
      data: {
        user_id: user.id,
        provider: dto.provider,
        ref_id: dto.provider_id,
        email: dto.email ? this.normalizeEmail(dto.email) : undefined,
        email_verified: Boolean(dto.email),
      },
    });

    const twoFactorEnabled = await this.twoFactorService.isEnabled(user.id);
    if (twoFactorEnabled && !dto.twoFactorCode) {
      const temp = await this.tokenService.generateTwoFactorToken(user.id);
      return {
        requires_2fa: true,
        temp_token: temp.token,
        expires_in: temp.expiresIn,
      };
    }

    if (twoFactorEnabled && dto.twoFactorCode) {
      await this.twoFactorService.verifyLoginCode(user.id, dto.twoFactorCode);
    }

    return this.buildAuthResponse(user, ipAddress);
  }

  async linkProvider(userId: string, provider: 'google' | 'facebook' | 'phone' | 'password', refId: string, hash?: string) {
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
    const associate = await this.prisma.resAssociate.findFirst({ where: { phone_number: phone.trim() } });
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

    const associate = await this.prisma.resAssociate.findFirst({ where: { phone_number: phone.trim() } });
    if (!associate) {
      throw new NotFoundException('Account not found for this phone number');
    }

    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { phone_verified: true },
    });

    return { verified: true };
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
    const { user, refreshToken: rotatedRefresh } = await this.tokenService.rotateRefreshToken(refreshToken, ipAddress);
    const access = await this.tokenService.generateAccessToken(user.id, user.role);

    return {
      access_token: access.token,
      refresh_token: rotatedRefresh,
      expires_in: access.expiresIn,
      user,
    };
  }

  async logout(userId: string, refreshToken: string, accessToken?: string) {
    await this.tokenService.revokeRefreshToken(refreshToken, userId);
    await this.tokenService.blacklistAccessToken(accessToken, userId, 'logout');
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
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      user,
    };
  }

  private buildVerificationResponse(result?: { code: string; expiresAt: Date }) {
    if (!result) {
      return undefined;
    }
    return {
      message: 'Verification code sent successfully',
      expires_at: result.expiresAt,
      ...(this.isProduction ? {} : { preview_code: result.code }),
    };
  }

  private genericVerificationMessage() {
    return { message: 'If the destination exists, a verification code has been sent' };
  }
}
