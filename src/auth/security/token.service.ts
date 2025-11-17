import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ResRefreshToken, ResUser, UserBasicRole } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';

interface AccessTokenPayload {
  token: string;
  expiresIn: number;
  jti: string;
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TwoFactorTokenPayload {
  token: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number;
  private readonly jwtIssuer: string;
  private readonly refreshTtlMs: number;
  private readonly accessTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('jwt.secret') || process.env.JWT_SECRET || 'secretKey';
    this.jwtExpiresIn = this.configService.get<number>('jwt.expiresIn') ?? 3600;
    this.jwtIssuer = this.configService.get<string>('jwt.issuer') ?? 'api';
    this.refreshTtlMs = this.configService.get<number>('jwt.refreshTtlMs') ?? 1000 * 60 * 60 * 24 * 30;
    this.accessTtlSeconds = this.jwtExpiresIn;
  }

  async createSession(user: ResUser, ipAddress?: string): Promise<SessionTokens> {
    const access = await this.generateAccessToken(user.id, user.role);
    const refresh = await this.createRefreshToken(user.id, ipAddress);

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      expiresIn: access.expiresIn,
    };
  }

  async generateAccessToken(userId: string, role: UserBasicRole): Promise<AccessTokenPayload> {
    const jti = randomUUID();
    const payload = { sub: userId, role, jti };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
      issuer: this.jwtIssuer,
    });

    return {
      token,
      expiresIn: this.accessTtlSeconds,
      jti,
    };
  }

  async generateTwoFactorToken(userId: string): Promise<TwoFactorTokenPayload> {
    const payload = { sub: userId, purpose: '2fa' as const };
    const ttlSeconds = 5 * 60;
    const token = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: ttlSeconds,
      issuer: this.jwtIssuer,
    });
    return {
      token,
      expiresIn: ttlSeconds,
    };
  }

  async createRefreshToken(userId: string, ipAddress?: string) {
    const token = randomBytes(48).toString('hex');
    const hash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    const record = await this.prisma.resRefreshToken.create({
      data: {
        user_id: userId,
        token_hash: hash,
        expires_at: expiresAt,
        created_by_ip: ipAddress,
      },
    });

    return { token, record };
  }

  async rotateRefreshToken(refreshToken: string, ipAddress?: string) {
    const existing = await this.resolveRefreshToken(refreshToken);
    const { token, record } = await this.createRefreshToken(existing.user_id, ipAddress);

    await this.prisma.resRefreshToken.update({
      where: { id: existing.id },
      data: {
        revoked_at: new Date(),
        replaced_by_id: record.id,
      },
    });

    return { user: existing.user, refreshToken: token };
  }

  async revokeRefreshToken(refreshToken: string, expectedUserId?: string) {
    const existing = await this.resolveRefreshToken(refreshToken);
    if (expectedUserId && existing.user_id !== expectedUserId) {
      throw new UnauthorizedException('Invalid refresh token owner');
    }

    await this.prisma.resRefreshToken.update({
      where: { id: existing.id },
      data: { revoked_at: new Date() },
    });
  }

  async blacklistAccessToken(token: string | null | undefined, userId: string, reason?: string) {
    if (!token) return;
    try {
      const payload = await this.jwtService.verifyAsync<{ jti?: string; exp?: number }>(token, {
        secret: this.jwtSecret,
        issuer: this.jwtIssuer,
      });

      if (!payload?.jti) {
        return;
      }

      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + this.accessTtlSeconds * 1000);

      await this.prisma.resTokenBlacklist.upsert({
        where: { jti: payload.jti },
        update: {
          expires_at: expiresAt,
          reason,
          user_id: userId,
        },
        create: {
          jti: payload.jti,
          user_id: userId,
          reason,
          expires_at: expiresAt,
        },
      });
    } catch {
      // ignore failures – token is either invalid or already expired
    }
  }

  extractBearerToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [scheme, value] = authHeader.split(' ');
    if (!value || scheme?.toLowerCase() !== 'bearer') {
      return null;
    }
    return value;
  }

  async verifyTwoFactorToken(tempToken: string): Promise<{ userId: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string; purpose?: string }>(tempToken, {
        secret: this.jwtSecret,
        issuer: this.jwtIssuer,
      });

      if (!payload?.sub || payload.purpose !== '2fa') {
        throw new UnauthorizedException('Invalid 2FA token');
      }

      return { userId: payload.sub };
    } catch {
      throw new UnauthorizedException('Invalid 2FA token');
    }
  }

  private async resolveRefreshToken(refreshToken: string): Promise<ResRefreshToken & { user: ResUser }> {
    const hash = this.hashToken(refreshToken);
    const existing = await this.prisma.resRefreshToken.findFirst({
      where: {
        token_hash: hash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return existing;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}

