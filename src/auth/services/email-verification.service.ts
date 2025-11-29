import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationService } from '../security/verification.service';

/**
 * EmailVerificationService - Xử lý email verification
 */
@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  async requestEmailVerification(email: string, normalizeEmail: (email: string) => string, genericMessage: () => any) {
    const normalized = normalizeEmail(email);
    const associate = await this.prisma.resAssociate.findFirst({ where: { email: normalized } });
    
    if (!associate) {
      return genericMessage();
    }

    const verification = await this.verificationService.createEmailCode({
      user_id: associate.user_id,
      target: normalized,
      context: 'resend',
    });

    return verification;
  }

  async verifyEmailCode(email: string, code: string, normalizeEmail: (email: string) => string) {
    const normalized = normalizeEmail(email);
    await this.verificationService.verifyEmailCode(normalized, code);

    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: normalized },
    });

    if (!associate) {
      throw new NotFoundException('Account not found for this email');
    }

    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { email_verified: true },
    });

    return { verified: true };
  }
}
