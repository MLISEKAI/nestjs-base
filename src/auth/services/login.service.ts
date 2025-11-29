import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../security/token.service';
import { TwoFactorService } from '../security/two-factor.service';
import { LoginDto, LoginOAuthDto } from '../dto';
import * as bcrypt from 'bcrypt';

/**
 * LoginService - Xử lý đăng nhập
 */
@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Đăng nhập với email và password
   */
  async login(dto: LoginDto, normalizeEmail: (email: string) => string, ensureVerifiedContact: (associate: any) => void) {
    // Normalize ref_id
    const ref = dto.ref_id.includes('@') ? normalizeEmail(dto.ref_id) : dto.ref_id.trim();

    // Tìm associate với user và twoFactor
    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: ref },
      include: {
        user: {
          include: {
            twoFactor: true,
          },
        },
      },
    });

    if (!associate) {
      this.logger.warn(`Login failed: user not found`, { ref });
      throw new UnauthorizedException('User not found');
    }

    // Verify password
    const isValid = associate.hash ? await bcrypt.compare(dto.password, associate.hash) : false;
    if (!isValid) {
      this.logger.warn(`Login failed: invalid password`, { ref, user_id: associate.user.id });
      throw new UnauthorizedException('Invalid password');
    }

    // Check email/phone đã được verify chưa
    ensureVerifiedContact(associate);

    // Check 2FA
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

  /**
   * Verify 2FA và trả về user
   */
  async verifyLoginTwoFactor(tempToken: string, code: string) {
    const { user_id } = await this.tokenService.verifyTwoFactorToken(tempToken);
    await this.twoFactorService.verifyLoginCode(user_id, code);

    const user = await this.prisma.resUser.findUnique({ where: { id: user_id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
