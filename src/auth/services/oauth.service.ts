import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../security/token.service';
import { LoginOAuthDto } from '../dto';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

/**
 * OAuthService - Xử lý OAuth login (Google, Facebook, Anonymous)
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async loginOAuth(dto: LoginOAuthDto, isServerSideFlow: boolean = false) {
    let verifiedProfile: {
      provider_id: string;
      email?: string;
      nickname?: string;
    };

    if (isServerSideFlow) {
      verifiedProfile = {
        provider_id: dto.provider_id!,
        email: dto.email,
        nickname: dto.nickname,
      };
    } else if (dto.provider === 'anonymous') {
      if (!dto.provider_id) {
        throw new BadRequestException('provider_id is required for anonymous provider');
      }
      verifiedProfile = { provider_id: dto.provider_id };
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

    const associate = await this.prisma.resAssociate.findFirst({
      where: { provider: dto.provider, ref_id: verifiedProfile.provider_id },
      include: {
        user: {
          include: {
            twoFactor: true,
          },
        },
      },
    });

    if (associate) {
      const twoFactorEnabled = associate.user.twoFactor?.enabled ?? false;
      if (twoFactorEnabled) {
        const temp = await this.tokenService.generateTwoFactorToken(associate.user.id);
        return {
          requires_2fa: true,
          temp_token: temp.token,
          expires_in: temp.expiresIn,
        };
      }
      return { user: associate.user, requires_2fa: false };
    }

    // Tạo user mới
    let user = undefined as any;
    if (verifiedProfile.email) {
      const emailAssoc = await this.prisma.resAssociate.findFirst({
        where: { email: verifiedProfile.email.trim().toLowerCase() },
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
        email: verifiedProfile.email ? verifiedProfile.email.trim().toLowerCase() : undefined,
        email_verified: Boolean(verifiedProfile.email),
      },
    });

    const userWithTwoFactor = await this.prisma.resUser.findUnique({
      where: { id: user.id },
      include: { twoFactor: true },
    });
    const twoFactorEnabled = userWithTwoFactor?.twoFactor?.enabled ?? false;
    if (twoFactorEnabled) {
      const temp = await this.tokenService.generateTwoFactorToken(user.id);
      return {
        requires_2fa: true,
        temp_token: temp.token,
        expires_in: temp.expiresIn,
      };
    }

    return { user, requires_2fa: false };
  }

  private async verifyGoogleToken(accessToken: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      const { id, email, name } = response.data;
      if (!id) {
        throw new BadRequestException('Invalid Google token: missing user ID');
      }

      return {
        provider_id: id,
        email: email || undefined,
        nickname: name || undefined,
      };
    } catch (error: any) {
      this.logger.error('Google token verification failed', error);
      throw new BadRequestException('Invalid Google access token');
    }
  }

  private async verifyFacebookToken(accessToken: string) {
    try {
      const appId = this.configService.get<string>('FACEBOOK_APP_ID');
      const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

      if (!appId || !appSecret) {
        throw new BadRequestException('Facebook app credentials not configured');
      }

      const debugResponse = await firstValueFrom(
        this.httpService.get(
          `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`,
        ),
      );

      if (!debugResponse.data?.data?.is_valid) {
        throw new BadRequestException('Invalid Facebook token');
      }

      const userResponse = await firstValueFrom(
        this.httpService.get(`https://graph.facebook.com/me?fields=id,email,name&access_token=${accessToken}`),
      );

      const { id, email, name } = userResponse.data;
      if (!id) {
        throw new BadRequestException('Invalid Facebook token: missing user ID');
      }

      return {
        provider_id: id,
        email: email || undefined,
        nickname: name || undefined,
      };
    } catch (error: any) {
      this.logger.error('Facebook token verification failed', error);
      throw new BadRequestException('Invalid Facebook access token');
    }
  }
}
