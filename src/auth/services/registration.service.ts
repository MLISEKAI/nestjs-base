import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationService } from '../security/verification.service';
import { RegisterWithEmailDto, RequestPhoneOtpDto, VerifyPhoneOtpDto } from '../dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

/**
 * RegistrationService - Xử lý đăng ký user mới
 */
@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  /**
   * Đăng ký user mới qua EMAIL
   */
  async registerWithEmail(dto: RegisterWithEmailDto, ensureStrongPassword: (pwd: string) => void): Promise<any> {
    // Validate password strength
    ensureStrongPassword(dto.password);

    // Normalize email
    const email = dto.email.trim().toLowerCase();

    // Check email đã tồn tại chưa
    const emailExists = await this.prisma.resAssociate.findFirst({
      where: { email },
    });
    if (emailExists) throw new BadRequestException('Email already in use');

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Tạo user mới
    const user = await this.prisma.resUser.create({
      data: {
        union_id: crypto.randomUUID(),
        nickname: dto.nickname,
        avatar: dto.avatar,
        role: 'user',
        bio: dto.bio,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : null,
        associates: {
          create: {
            ref_id: email,
            hash: hashedPassword,
            provider: 'password',
            email: email,
          },
        },
        wallets: {
          create: [
            { currency: 'diamond', balance: new Prisma.Decimal(0) },
            { currency: 'vex', balance: new Prisma.Decimal(0) },
          ],
        },
      },
    });

    // Tạo email verification code
    const emailVerification = await this.verificationService.createEmailCode({
      user_id: user.id,
      target: email,
      context: 'register',
    });

    return { user, emailVerification };
  }

  /**
   * Request OTP để đăng ký/đăng nhập qua phone
   */
  async requestPhoneOtp(dto: RequestPhoneOtpDto): Promise<any> {
    const phone = dto.phone_number.trim();

    const verification = await this.verificationService.createPhoneCode({
      target: phone,
      context: 'phone_otp_auth',
    });

    return verification;
  }

  /**
   * Verify OTP và đăng ký/đăng nhập (trả về user)
   */
  async verifyPhoneOtp(dto: VerifyPhoneOtpDto) {
    const phone = dto.phone_number.trim();

    // Verify OTP code
    await this.verificationService.verifyPhoneCode(phone, dto.otp);

    // Tìm user theo phone
    let associate = await this.prisma.resAssociate.findFirst({
      where: { phone_number: phone },
      include: { user: true },
    });

    if (!associate) {
      // User chưa tồn tại → Tạo mới (ĐĂNG KÝ)
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const nickname = `user${randomNum}`;

      const user = await this.prisma.resUser.create({
        data: {
          union_id: crypto.randomUUID(),
          nickname: nickname,
          role: 'user',
          associates: {
            create: {
              ref_id: phone,
              provider: 'phone',
              phone_number: phone,
              phone_verified: true,
            },
          },
          wallets: {
            create: [
              { currency: 'diamond', balance: new Prisma.Decimal(0) },
              { currency: 'vex', balance: new Prisma.Decimal(0) },
            ],
          },
        },
      });

      // Query lại để lấy associate
      associate = await this.prisma.resAssociate.findFirst({
        where: { phone_number: phone },
        include: { user: true },
      });
    } else {
      // User đã tồn tại → Update phone_verified
      await this.prisma.resAssociate.update({
        where: { id: associate.id },
        data: { phone_verified: true },
      });
    }

    return associate.user;
  }
}
