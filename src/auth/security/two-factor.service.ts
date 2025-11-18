import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ResTwoFactor, ResUser } from '@prisma/client';
import { authenticator } from 'otplib';
import { createHash, randomBytes } from 'crypto';

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

  async enableTwoFactor(userId: string, code: string) {
    const record = await this.getTwoFactorRecord(userId);
    if (!record) {
      throw new BadRequestException('Two-factor secret not generated');
    }

    if (!this.verifyTotp(record.secret, code)) {
      throw new BadRequestException('Invalid two-factor code');
    }

    const { codes, hashes } = this.generateBackupCodes();

    await this.prisma.resTwoFactor.update({
      where: { user_id: userId },
      data: {
        enabled: true,
        verified_at: new Date(),
        backup_codes: hashes,
      },
    });

    return { backupCodes: codes };
  }

  async disableTwoFactor(userId: string, code: string) {
    const record = await this.getTwoFactorRecord(userId);
    if (!record?.enabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (!this.verifyTotp(record.secret, code)) {
      throw new BadRequestException('Invalid two-factor code');
    }

    await this.prisma.resTwoFactor.update({
      where: { user_id: userId },
      data: {
        enabled: false,
        backup_codes: [],
      },
    });
  }

  async isEnabled(userId: string) {
    const record = await this.getTwoFactorRecord(userId);
    return Boolean(record?.enabled);
  }

  async verifyLoginCode(userId: string, code: string) {
    const record = await this.getTwoFactorRecord(userId);
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

  private async getTwoFactorRecord(userId: string) {
    return this.prisma.resTwoFactor.findUnique({ where: { user_id: userId } });
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
