// Import Injectable và exceptions từ NestJS
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from '../../prisma/prisma.service';
// Import ConfigService để đọc environment variables
import { ConfigService } from '@nestjs/config';
// Import Prisma types
import { ResTwoFactor, ResUser } from '@prisma/client';
// Import authenticator từ otplib để generate và verify TOTP codes
import { authenticator } from 'otplib';
// Import crypto functions để hash backup codes
import { createHash, randomBytes } from 'crypto';

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * TwoFactorService - Service xử lý two-factor authentication (2FA)
 *
 * Chức năng chính:
 * - Generate TOTP secret và QR code URL
 * - Enable/disable 2FA
 * - Verify 2FA codes (TOTP hoặc backup codes)
 * - Generate và manage backup codes
 *
 * Lưu ý:
 * - Sử dụng TOTP (Time-based One-Time Password) với otplib
 * - Backup codes được hash trước khi lưu vào database
 * - Backup codes được consume sau khi sử dụng (one-time use)
 * - TOTP codes có window tolerance (mặc định của otplib)
 */
@Injectable()
export class TwoFactorService {
  private readonly issuer: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.issuer = this.configService.get<string>('jwt.issuer') ?? 'api';
  }

  async generateSecret(user: ResUser) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.nickname ?? user.union_id, this.issuer, secret);

    await this.prisma.resTwoFactor.upsert({
      where: { user_id: user.id },
      update: { secret, enabled: false },
      create: {
        user_id: user.id,
        secret,
      },
    });

    return { secret, otpauthUrl };
  }

  async enableTwoFactor(user_id: string, code: string) {
    const record = await this.getTwoFactorRecord(user_id);
    if (!record) {
      throw new BadRequestException('Two-factor secret not generated');
    }

    if (!this.verifyTotp(record.secret, code)) {
      throw new BadRequestException('Invalid two-factor code');
    }

    const { codes, hashes } = this.generateBackupCodes();

    await this.prisma.resTwoFactor.update({
      where: { user_id: user_id },
      data: {
        enabled: true,
        verified_at: new Date(),
        backup_codes: hashes,
      },
    });

    return { backupCodes: codes };
  }

  async disableTwoFactor(user_id: string, code: string) {
    const record = await this.getTwoFactorRecord(user_id);
    if (!record?.enabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (!this.verifyTotp(record.secret, code)) {
      throw new BadRequestException('Invalid two-factor code');
    }

    await this.prisma.resTwoFactor.update({
      where: { user_id: user_id },
      data: {
        enabled: false,
        backup_codes: [],
      },
    });
  }

  async isEnabled(user_id: string) {
    const record = await this.getTwoFactorRecord(user_id);
    return Boolean(record?.enabled);
  }

  async verifyLoginCode(user_id: string, code: string) {
    const record = await this.getTwoFactorRecord(user_id);
    if (!record?.enabled) {
      throw new UnauthorizedException('Two-factor authentication is not enabled');
    }

    if (this.verifyTotp(record.secret, code)) {
      return true;
    }

    if (await this.consumeBackupCode(record, code)) {
      return true;
    }

    throw new UnauthorizedException('Invalid two-factor code');
  }

  private async consumeBackupCode(record: ResTwoFactor, code: string) {
    const hashed = this.hashValue(code);
    if (!record.backup_codes.includes(hashed)) {
      return false;
    }

    const updatedCodes = record.backup_codes.filter((existing) => existing !== hashed);
    await this.prisma.resTwoFactor.update({
      where: { user_id: record.user_id },
      data: { backup_codes: updatedCodes },
    });
    return true;
  }

  private async getTwoFactorRecord(user_id: string) {
    return this.prisma.resTwoFactor.findUnique({ where: { user_id: user_id } });
  }

  private verifyTotp(secret: string, code: string) {
    const value = code?.trim();
    if (!value) return false;
    return authenticator.check(value, secret);
  }

  private generateBackupCodes(length = 5) {
    const codes = Array.from({ length }, () => randomBytes(5).toString('hex'));
    const hashes = codes.map((code) => this.hashValue(code));
    return { codes, hashes };
  }

  private hashValue(value: string) {
    return createHash('sha256').update(value.trim()).digest('hex');
  }
}
