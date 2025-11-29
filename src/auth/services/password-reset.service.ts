import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationService } from '../security/verification.service';
import * as bcrypt from 'bcrypt';

/**
 * PasswordResetService - Xử lý reset password
 */
@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  async requestPasswordReset(email: string, normalizeEmail: (email: string) => string, genericMessage: () => any) {
    const normalized = normalizeEmail(email);
    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: normalized, provider: 'password' },
    });

    if (!associate) {
      return genericMessage();
    }

    const verification = await this.verificationService.createEmailCode({
      user_id: associate.user_id,
      target: normalized,
      context: 'password-reset',
    });

    return verification;
  }

  async resetPassword(email: string, code: string, newPassword: string, normalizeEmail: (email: string) => string, ensureStrongPassword: (pwd: string) => void) {
    const normalized = normalizeEmail(email);

    await this.verificationService.verifyEmailCode(normalized, code);

    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: normalized, provider: 'password' },
    });

    if (!associate) {
      throw new NotFoundException('Account not found for this email');
    }

    ensureStrongPassword(newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { hash: hashedPassword },
    });

    return { success: true };
  }
}
