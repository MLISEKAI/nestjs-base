// Import các decorator và exception từ NestJS
import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
// Import PassportStrategy để tạo JWT strategy
import { PassportStrategy } from '@nestjs/passport';
// Import ExtractJwt và Strategy từ passport-jwt
import { ExtractJwt, Strategy } from 'passport-jwt';
// Import ModuleRef để lazy load dependencies (tránh circular dependency)
import { ModuleRef } from '@nestjs/core';
// Import Prisma types
import { UserBasicRole } from '@prisma/client';
// Import PrismaService để check token blacklist
import { PrismaService } from '../../prisma/prisma.service';
// Import ResUserService để lấy user info
import { ResUserService } from 'src/modules/users/service/res-user.service';
// Import ConfigService để đọc JWT config
import { ConfigService } from '@nestjs/config';

/**
 * Interface cho JWT payload
 *
 * @property sub - Subject (user ID)
 * @property role - User role
 * @property jti - JWT ID (dùng để blacklist token)
 * @property iat - Issued at (timestamp)
 * @property exp - Expiration (timestamp)
 * @property iss - Issuer
 */
interface MyJwtPayload {
  sub: string;
  role: UserBasicRole;
  jti?: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

/**
 * @Injectable() - Đánh dấu class này là NestJS service
 * AccountStrategy - JWT Strategy để xác thực JWT token
 *
 * Chức năng:
 * - Extract JWT token từ Authorization header (Bearer token)
 * - Verify JWT token signature và expiration
 * - Check token blacklist
 * - Load user info và attach vào request (req.user)
 *
 * @extends PassportStrategy(Strategy, 'account-auth')
 *   - Strategy: passport-jwt Strategy
 *   - 'account-auth': Tên của strategy (dùng trong @UseGuards(AuthGuard('account-auth')))
 * @implements OnModuleInit - Lazy load ResUserService để tránh circular dependency
 */
@Injectable()
export class AccountStrategy
  extends PassportStrategy(Strategy, 'account-auth')
  implements OnModuleInit
{
  // Lazy load ResUserService để tránh circular dependency
  private accountService: ResUserService;

  /**
   * Constructor - Dependency Injection
   *
   * @param moduleRef - ModuleRef để lazy load ResUserService
   * @param configService - ConfigService để đọc JWT config
   * @param prisma - PrismaService để check token blacklist
   */
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Configure JWT Strategy
    super({
      // Extract JWT token từ Authorization header: "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Không ignore expiration (check expiration)
      ignoreExpiration: false,
      // JWT secret key (từ config hoặc env)
      secretOrKey: configService.get<string>('jwt.secret') || process.env.JWT_SECRET || 'secretKey',
      // JWT issuer (từ config hoặc env)
      issuer: configService.get<string>('jwt.issuer') ?? process.env.JWT_ISSUER ?? 'api',
    });
  }

  /**
   * onModuleInit - Lifecycle hook, được gọi sau khi module được khởi tạo
   * Lazy load ResUserService để tránh circular dependency
   */
  async onModuleInit() {
    // Lazy load ResUserService từ moduleRef
    this.accountService = this.moduleRef.get(ResUserService, { strict: false });
  }

  /**
   * validate - Method được Passport gọi sau khi verify JWT token thành công
   *
   * @param payload - JWT payload đã được verify
   * @returns User object (sẽ được attach vào req.user)
   * @throws UnauthorizedException nếu:
   *   - Payload thiếu sub hoặc jti
   *   - Token đã bị blacklist
   *   - User không tồn tại
   *
   * Quy trình:
   * 1. Validate payload (sub, jti)
   * 2. Check token blacklist
   * 3. Load user info từ database
   * 4. Return user object (sẽ được attach vào req.user)
   */
  async validate(payload: MyJwtPayload) {
    // Validate payload: phải có sub (user ID)
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload: missing sub');
    }

    // Validate payload: phải có jti (JWT ID để blacklist)
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token payload: missing jti');
    }

    // Check token blacklist (nếu token đã bị revoke/logout)
    const blacklisted = await this.prisma.resTokenBlacklist.findUnique({
      where: { jti: payload.jti },
    });
    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Load user info từ database
    // findUser(payload.sub, true) - true = include associates
    const user = await this.accountService.findUser(payload.sub, true);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user object (sẽ được attach vào req.user)
    return user;
  }
}
