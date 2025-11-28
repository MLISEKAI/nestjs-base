// Import Injectable, exceptions và Logger từ NestJS
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// Import PrismaService để query database
import { PrismaService } from '../../prisma/prisma.service';
// Import VerificationCodeType enum từ Prisma
import { VerificationCodeType } from '@prisma/client';
// Import crypto functions để hash codes và generate random codes
import { createHash, randomInt, timingSafeEqual } from 'crypto';

/**
 * VerificationRequest - Interface cho verification code request
 */
interface VerificationRequest {
  user_id?: string;
  target: string;
  context?: string;
}

/**
 * VerificationResult - Interface cho verification code response
 */
interface VerificationResult {
  code: string;
  expiresAt: Date;
  target: string;
  type: VerificationCodeType;
}

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * VerificationService - Service xử lý verification codes (email và phone)
 *
 * Chức năng chính:
 * - Tạo verification codes cho email và phone
 * - Verify verification codes
 * - Track verification attempts (max 5 attempts)
 * - Normalize email addresses
 *
 * Lưu ý:
 * - Email codes có TTL 30 phút
 * - Phone codes có TTL 5 phút
 * - Codes được hash trước khi lưu vào database (SHA-256)
 * - Sử dụng timing-safe comparison để prevent timing attacks
 * - Max attempts: 5 lần, sau đó code bị lock
 * - Codes chỉ được sử dụng một lần (verified_at được set sau khi verify)
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly emailTtlMs = 1000 * 60 * 30; // 30 minutes
  private readonly phoneTtlMs = 1000 * 60 * 5; // 5 minutes
  private readonly maxAttempts = 5;

  constructor(private readonly prisma: PrismaService) {}

  async createEmailCode(request: VerificationRequest): Promise<VerificationResult> {
    const target = this.normalizeEmail(request.target);
    return this.createCode({
      ...request,
      target,
      ttlMs: this.emailTtlMs,
      type: VerificationCodeType.email,
    });
  }

  async createPhoneCode(request: VerificationRequest): Promise<VerificationResult> {
    const target = request.target.trim();
    return this.createCode({
      ...request,
      target,
      ttlMs: this.phoneTtlMs,
      type: VerificationCodeType.phone,
    });
  }

  async verifyEmailCode(email: string, code: string) {
    const target = this.normalizeEmail(email);
    return this.verifyCode(target, VerificationCodeType.email, code);
  }

  async verifyPhoneCode(phone: string, code: string) {
    return this.verifyCode(phone.trim(), VerificationCodeType.phone, code);
  }

  async verifyEmailCodeWithContext(email: string, code: string, context: string) {
    const target = this.normalizeEmail(email);
    const record = await this.prisma.resVerificationCode.findFirst({
      where: {
        target,
        type: VerificationCodeType.email,
        context,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Verification code not found');
    }

    if (record.verified_at) {
      throw new BadRequestException('Verification code already used');
    }

    if (record.expires_at < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    if (record.attempts >= this.maxAttempts) {
      throw new BadRequestException('Maximum verification attempts reached');
    }

    const submittedHash = this.hashCode(code);
    const storedHash = record.code;

    if (!this.safeCompare(storedHash, submittedHash)) {
      await this.prisma.resVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    return this.prisma.resVerificationCode.update({
      where: { id: record.id },
      data: { verified_at: new Date() },
    });
  }

  private async createCode(
    params: VerificationRequest & { ttlMs: number; type: VerificationCodeType },
  ): Promise<VerificationResult> {
    const code = this.generateNumericCode();
    const expiresAt = new Date(Date.now() + params.ttlMs);

    await this.prisma.resVerificationCode.create({
      data: {
        user_id: params.user_id,
        target: params.target,
        type: params.type,
        code: this.hashCode(code),
        expires_at: expiresAt,
        context: params.context,
      },
    });

    this.logger.debug(`Generated ${params.type} verification code for target ${params.target}`);

    return {
      code,
      expiresAt,
      target: params.target,
      type: params.type,
    };
  }

  private async verifyCode(target: string, type: VerificationCodeType, code: string) {
    const record = await this.prisma.resVerificationCode.findFirst({
      where: {
        target,
        type,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Verification code not found');
    }

    if (record.verified_at) {
      throw new BadRequestException('Verification code already used');
    }

    if (record.expires_at < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    if (record.attempts >= this.maxAttempts) {
      throw new BadRequestException('Maximum verification attempts reached');
    }

    const submittedHash = this.hashCode(code);
    const storedHash = record.code;

    if (!this.safeCompare(storedHash, submittedHash)) {
      await this.prisma.resVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    return this.prisma.resVerificationCode.update({
      where: { id: record.id },
      data: { verified_at: new Date() },
    });
  }

  private generateNumericCode(length = 6) {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return String(randomInt(min, max));
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code.trim()).digest('hex');
  }

  private safeCompare(a: string, b: string) {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
