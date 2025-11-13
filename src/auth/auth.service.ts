import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto, LoginDto } from './dto/auth.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string | number;
  private jwtIssuer: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.jwtSecret = this.configService.get<string>('jwt.secret');
    this.jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
    this.jwtIssuer = this.configService.get<string>('jwt.issuer') ?? 'api';
  }

  async register(dto: RegisterUserDto) {
    // Kiểm tra email
    if (dto.email) {
      const emailExists = await this.prisma.resAssociate.findFirst({
        where: { email: dto.email },
      });
      if (emailExists) throw new BadRequestException('Email already in use');
    }

    // Kiểm tra phone
    if (dto.phone_number) {
      const phoneExists = await this.prisma.resAssociate.findFirst({
        where: { phone_number: dto.phone_number },
      });
      if (phoneExists) throw new BadRequestException('Phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

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

    return user;
  }

  async login(dto: LoginDto) {
    // Login bằng email hoặc phone
    const associate = await this.prisma.resAssociate.findFirst({
      where: {
        OR: [
          { email: dto.ref_id },
          { phone_number: dto.ref_id },
        ],
      },
      include: { user: true },
    });

    if (!associate) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(dto.password, associate.hash);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    const payload = { sub: associate.user.id, role: associate.user.role };
    const token = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn as any,
      issuer: this.jwtIssuer,
    });

    return { access_token: token, user: associate.user };
  }
}
