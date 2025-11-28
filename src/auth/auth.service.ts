// Import các exception và Logger từ NestJS
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
// Import PrismaService để tương tác với database
import { PrismaService } from '../prisma/prisma.service';
// Import bcrypt để hash và verify password
import * as bcrypt from 'bcrypt';
// Import các DTO để validate và type-check dữ liệu
import {
  RegisterUserDto,
  LoginDto,
  LoginOtpDto,
  LoginOAuthDto,
  VerifyTwoFactorLoginDto,
} from './dto/auth.dto';
// Import crypto để generate UUID
import * as crypto from 'crypto';
// Import các service để xử lý token, verification, 2FA
import { TokenService } from './security/token.service';
import { VerificationService } from './security/verification.service';
import { TwoFactorService } from './security/two-factor.service';
// import { AuthRateLimitService } from './security/auth-rate-limit.service';
// Import ConfigService để đọc environment variables
import { ConfigService } from '@nestjs/config';
// Import Prisma types
import { ResAssociate, ResUser, Prisma } from '@prisma/client';
// Import EmailService để gửi email
import { EmailService } from '../common/services/email.service';
// Import HttpService để gọi external APIs (Google, Facebook)
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * @Injectable() - Đánh dấu class này là NestJS service, có thể được inject vào các class khác
 * AuthService - Service xử lý business logic cho authentication và authorization
 *
 * Chức năng chính:
 * - Đăng ký user mới
 * - Đăng nhập (password, OTP, OAuth)
 * - Xác thực email/phone
 * - Quản lý 2FA
 * - Reset password
 * - Quản lý tokens (access, refresh)
 * - Link providers (Google, Facebook, phone, password)
 */
@Injectable()
export class AuthService {
  // Flag để check xem có đang ở production mode không
  private readonly isProduction: boolean;
  // Logger để log các events và errors
  private readonly logger = new Logger(AuthService.name);

  /**
   * Constructor - Dependency Injection
   * NestJS tự động inject các dependencies khi tạo instance của service
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService,
    private readonly twoFactorService: TwoFactorService,
    // private readonly authRateLimit: AuthRateLimitService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly httpService: HttpService,
  ) {
    // Check xem có đang ở production mode không
    // Dùng để quyết định có trả về preview code trong response không
    this.isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development') ===
      'production';
  }

  /**
   * Đăng ký user mới
   *
   * @param dto - RegisterUserDto chứa thông tin đăng ký (email/phone, password, nickname, etc.)
   * @returns User object và verification codes (nếu có email/phone)
   *
   * Quy trình:
   * 1. Validate password strength
   * 2. Check email/phone đã tồn tại chưa
   * 3. Hash password với bcrypt (12 rounds)
   * 4. Tạo user với union_id (UUID)
   * 5. Tạo associate record (provider: 'password')
   * 6. Tự động tạo 2 wallets (diamond và vex) với balance = 0
   * 7. Tạo và gửi verification codes (nếu có email/phone)
   */
  async register(dto: RegisterUserDto) {
    // Validate password strength (uppercase, lowercase, number, special char, min 8 chars)
    this.ensureStrongPassword(dto.password);

    // Check và normalize email nếu có
    if (dto.email) {
      dto.email = this.normalizeEmail(dto.email);
      const emailExists = await this.prisma.resAssociate.findFirst({
        where: { email: dto.email },
      });
      if (emailExists) throw new BadRequestException('Email already in use');
    }

    // Check phone number nếu có
    if (dto.phone_number) {
      dto.phone_number = dto.phone_number.trim();
      const phoneExists = await this.prisma.resAssociate.findFirst({
        where: { phone_number: dto.phone_number },
      });
      if (phoneExists) throw new BadRequestException('Phone number already in use');
    }

    // Hash password với bcrypt (12 rounds = độ bảo mật cao)
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Tạo user mới với tất cả thông tin
    const user = await this.prisma.resUser.create({
      data: {
        union_id: crypto.randomUUID(), // Generate UUID cho union_id
        nickname: dto.nickname,
        avatar: dto.avatar,
        role: dto.role || 'user', // Default role là 'user'
        bio: dto.bio,
        gender: dto.gender,
        birthday: dto.birthday ? new Date(dto.birthday) : null,
        // Tạo associate record (link user với provider 'password')
        associates: {
          create: {
            ref_id: dto.email || dto.phone_number, // ref_id là email hoặc phone
            hash: hashedPassword,
            provider: 'password',
            email: dto.email,
            phone_number: dto.phone_number,
          },
        },
        // Tự động tạo 2 ví (diamond và vex) khi đăng ký user
        wallets: {
          create: [
            {
              currency: 'diamond',
              balance: new Prisma.Decimal(0),
            },
            {
              currency: 'vex',
              balance: new Prisma.Decimal(0),
            },
          ],
        },
      },
    });

    // Tạo verification codes cho email và phone (nếu có)
    const emailVerification = dto.email
      ? await this.verificationService.createEmailCode({
          user_id: user.id,
          target: dto.email,
          context: 'register',
        })
      : undefined;
    const phoneVerification = dto.phone_number
      ? await this.verificationService.createPhoneCode({
          user_id: user.id,
          target: dto.phone_number,
          context: 'register',
        })
      : undefined;

    // Build verification response (có thể chứa preview_code trong dev mode)
    const verification: Record<string, unknown> = {};
    const emailResponse = this.buildVerificationResponse(emailVerification);
    const phoneResponse = this.buildVerificationResponse(phoneVerification);
    if (emailResponse) verification.email = emailResponse;
    if (phoneResponse) verification.phone = phoneResponse;

    return {
      user,
      verification,
    };
  }

  /**
   * Đăng nhập với email và password
   *
   * @param dto - LoginDto chứa ref_id (email) và password
   * @param ipAddress - IP address của client (dùng cho rate limiting và security)
   * @returns JWT tokens hoặc requires_2fa response nếu user có 2FA enabled
   *
   * Quy trình:
   * 1. Normalize ref_id (email)
   * 2. Tìm associate theo email
   * 3. Verify password với bcrypt
   * 4. Check email đã được verify chưa
   * 5. Check 2FA enabled:
   *    - Nếu có: trả về requires_2fa: true và temp_token
   *    - Nếu không: tạo JWT tokens và trả về
   */
  async login(dto: LoginDto, ipAddress?: string) {
    // Normalize ref_id: nếu có @ thì là email, normalize email; nếu không thì trim phone
    const ref = dto.ref_id.includes('@') ? this.normalizeEmail(dto.ref_id) : dto.ref_id.trim();
    // await this.authRateLimit.checkLogin(ref, ipAddress);

    // Tìm associate theo email
    const associate = await this.prisma.resAssociate.findFirst({
      where: {
        email: ref,
      },
      include: { user: true },
    });

    if (!associate) {
      this.logger.warn(`Login failed: user not found`, { ref, ipAddress });
      throw new UnauthorizedException('User not found');
    }

    // Verify password với bcrypt
    const isValid = associate.hash ? await bcrypt.compare(dto.password, associate.hash) : false;
    if (!isValid) {
      this.logger.warn(`Login failed: invalid password`, {
        ref,
        ipAddress,
        user_id: associate.user.id,
      });
      throw new UnauthorizedException('Invalid password');
    }

    // Check email/phone đã được verify chưa (yêu cầu bắt buộc)
    this.ensureVerifiedContact(associate);

    // Check 2FA enabled
    const twoFactorEnabled = await this.twoFactorService.isEnabled(associate.user.id);
    if (twoFactorEnabled) {
      // Nếu có 2FA, tạo temp token và yêu cầu user nhập 2FA code
      const temp = await this.tokenService.generateTwoFactorToken(associate.user.id);
      return {
        requires_2fa: true,
        temp_token: temp.token,
        expires_in: temp.expiresIn,
      };
    }

    // Nếu không có 2FA, tạo JWT tokens và trả về
    return this.buildAuthResponse(associate.user, ipAddress);
  }

  /**
   * Yêu cầu OTP để đăng nhập qua số điện thoại
   *
   * @param phone - Số điện thoại (format E.164)
   * @returns Verification response với expires_at và preview_code (dev mode)
   *
   * Lưu ý:
   * - Khác với requestPhoneVerification: endpoint này dùng cho login, có thể tạo user mới
   * - Context: 'login' (khác với 'register' hoặc 'resend')
   * - OTP sẽ được gửi qua SMS (hoặc trả về trong dev mode)
   */
  async requestPhoneLoginOtp(phone: string) {
    // Tạo verification code với context 'login'
    // Không cần user_id vì có thể là user mới
    const verification = await this.verificationService.createPhoneCode({
      target: phone.trim(),
      context: 'login',
    });
    return this.buildVerificationResponse(verification);
  }

  /**
   * Đăng nhập qua OTP số điện thoại
   *
   * @param dto - LoginOtpDto chứa phone và otp
   * @param ipAddress - IP address của client
   * @returns JWT tokens
   *
   * Quy trình:
   * 1. Verify OTP code
   * 2. Tìm associate theo phone
   * 3. Nếu không tìm thấy: tạo user mới và associate
   * 4. Nếu tìm thấy: update phone_verified = true
   * 5. Tạo JWT tokens và trả về
   *
   * Lưu ý:
   * - Có thể tự động tạo user mới nếu chưa tồn tại
   * - Khác với verifyPhoneCode: endpoint này đăng nhập luôn, không chỉ verify
   */
  async loginOtp(dto: LoginOtpDto, ipAddress?: string) {
    // await this.authRateLimit.checkOtp(dto.phone, ipAddress);

    // Verify OTP code trước
    await this.verificationService.verifyPhoneCode(dto.phone, dto.otp);

    // Tìm associate theo phone
    let associate = await this.prisma.resAssociate.findFirst({
      where: { phone_number: dto.phone },
      include: { user: true },
    });

    if (!associate) {
      // Nếu không tìm thấy, tạo user mới
      const user = await this.prisma.resUser.create({
        data: {
          union_id: crypto.randomUUID(),
          nickname: dto.phone, // Default nickname là phone number
          associates: {
            create: {
              ref_id: dto.phone,
              provider: 'phone',
              phone_number: dto.phone,
              phone_verified: true, // Đã verify qua OTP
            },
          },
        },
      });
      // Lấy lại associate vừa tạo
      associate = await this.prisma.resAssociate.findFirst({
        where: { phone_number: dto.phone },
        include: { user: true },
      });
      if (!associate) throw new NotFoundException('Associate not created');
    } else {
      // Nếu tìm thấy, update phone_verified = true
      await this.prisma.resAssociate.update({
        where: { id: associate.id },
        data: { phone_verified: true },
      });
    }

    // Tạo JWT tokens và trả về
    return this.buildAuthResponse(associate.user, ipAddress);
  }

  /**
   * Đăng nhập qua OAuth provider (Google, Facebook, Anonymous)
   *
   * @param dto - LoginOAuthDto chứa provider, access_token (hoặc provider_id cho anonymous/server-side)
   * @param ipAddress - IP address của client
   * @param isServerSideFlow - Flag để chỉ định đây là server-side flow (đã verify bởi Passport Strategy)
   * @returns JWT tokens hoặc requires_2fa response nếu user có 2FA enabled
   *
   * Quy trình:
   * 1. Verify token với provider API (trừ anonymous và server-side flow)
   * 2. Tìm associate theo provider và provider_id
   * 3. Nếu tìm thấy: check 2FA và đăng nhập
   * 4. Nếu không tìm thấy:
   *    - Tìm user theo email (nếu có)
   *    - Nếu không tìm thấy: tạo user mới
   *    - Tạo associate record với provider
   *    - Check 2FA và đăng nhập
   *
   * Lưu ý:
   * - Google/Facebook (client-side): BẮT BUỘC phải có access_token để verify
   * - Google/Facebook (server-side): isServerSideFlow=true, đã verify bởi Passport Strategy
   * - Anonymous: không verify, chỉ cần provider_id
   */
  async loginOAuth(dto: LoginOAuthDto, ipAddress?: string, isServerSideFlow: boolean = false) {
    // Verify token với provider (trừ anonymous và server-side flow)
    let verifiedProfile: {
      provider_id: string;
      email?: string;
      nickname?: string;
    };

    if (dto.provider === 'anonymous') {
      // Anonymous không cần verify
      if (!dto.provider_id) {
        throw new BadRequestException('provider_id is required for anonymous provider');
      }
      verifiedProfile = {
        provider_id: dto.provider_id,
        email: dto.email,
        nickname: dto.nickname,
      };
    } else if (isServerSideFlow && dto.provider_id) {
      // Server-side flow: đã verify bởi Passport Strategy, chỉ cần provider_id
      // Chỉ cho phép khi isServerSideFlow=true (internal call từ Passport callbacks)
      // Validate provider phải là 'google' hoặc 'facebook' (không phải 'anonymous')
      if (dto.provider !== 'google' && dto.provider !== 'facebook') {
        throw new BadRequestException(
          `Invalid provider for server-side flow: ${dto.provider}. Only 'google' and 'facebook' are supported.`,
        );
      }
      verifiedProfile = {
        provider_id: dto.provider_id,
        email: dto.email,
        nickname: dto.nickname,
      };
    } else if (dto.provider === 'google') {
      // Client-side flow: BẮT BUỘC phải có access_token để verify
      if (!dto.access_token) {
        throw new BadRequestException('access_token is required for Google provider');
      }
      // Verify Google token và lấy thông tin user
      verifiedProfile = await this.verifyGoogleToken(dto.access_token);
    } else if (dto.provider === 'facebook') {
      // Client-side flow: BẮT BUỘC phải có access_token để verify
      if (!dto.access_token) {
        throw new BadRequestException('access_token is required for Facebook provider');
      }
      // Verify Facebook token và lấy thông tin user
      verifiedProfile = await this.verifyFacebookToken(dto.access_token);
    } else {
      throw new BadRequestException(`Unsupported provider: ${dto.provider}`);
    }

    // Tìm user theo provider_id đã verify
    const associate = await this.prisma.resAssociate.findFirst({
      where: { provider: dto.provider, ref_id: verifiedProfile.provider_id },
      include: { user: true },
    });

    if (associate) {
      // Nếu tìm thấy associate, check 2FA và đăng nhập
      const twoFactorEnabled = await this.twoFactorService.isEnabled(associate.user.id);
      if (twoFactorEnabled) {
        const temp = await this.tokenService.generateTwoFactorToken(associate.user.id);
        return {
          requires_2fa: true,
          temp_token: temp.token,
          expires_in: temp.expiresIn,
        };
      }

      return this.buildAuthResponse(associate.user, ipAddress);
    }

    // Nếu không tìm thấy associate, tạo user mới hoặc link với user đã có
    let user = undefined as any;
    // Tìm user theo email (nếu có) để link provider vào account đã có
    if (verifiedProfile.email) {
      const emailAssoc = await this.prisma.resAssociate.findFirst({
        where: { email: this.normalizeEmail(verifiedProfile.email) },
        include: { user: true },
      });
      if (emailAssoc) user = emailAssoc.user;
    }
    // Nếu không tìm thấy user theo email, tạo user mới
    if (!user) {
      user = await this.prisma.resUser.create({
        data: {
          union_id: crypto.randomUUID(),
          nickname: verifiedProfile.nickname || dto.provider,
        },
      });
    }
    // Tạo associate record với provider
    await this.prisma.resAssociate.create({
      data: {
        user_id: user.id,
        provider: dto.provider,
        ref_id: verifiedProfile.provider_id,
        email: verifiedProfile.email ? this.normalizeEmail(verifiedProfile.email) : undefined,
        email_verified: Boolean(verifiedProfile.email), // Email từ OAuth provider được coi là verified
      },
    });

    // Check 2FA và đăng nhập
    const twoFactorEnabled = await this.twoFactorService.isEnabled(user.id);
    if (twoFactorEnabled) {
      const temp = await this.tokenService.generateTwoFactorToken(user.id);
      return {
        requires_2fa: true,
        temp_token: temp.token,
        expires_in: temp.expiresIn,
      };
    }

    return this.buildAuthResponse(user, ipAddress);
  }

  /**
   * Verify Google access token và lấy thông tin user
   *
   * @param accessToken - Google OAuth access token
   * @returns Verified profile với provider_id, email, nickname
   * @throws UnauthorizedException nếu token không hợp lệ hoặc expired
   *
   * Quy trình:
   * 1. Gọi Google API để verify token và lấy user info
   * 2. Extract provider_id, email, nickname từ response
   * 3. Return verified profile
   */
  private async verifyGoogleToken(accessToken: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      const data = response.data;
      if (!data.id) {
        throw new UnauthorizedException('Invalid Google token: missing user id');
      }

      return {
        provider_id: data.id,
        email: data.email,
        nickname: data.name,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired Google access token');
      }
      this.logger.error(`Google token verification failed: ${error.message}`);
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * Verify Facebook access token và lấy thông tin user
   *
   * @param accessToken - Facebook OAuth access token
   * @returns Verified profile với provider_id, email, nickname
   * @throws UnauthorizedException nếu token không hợp lệ hoặc expired
   * @throws ServiceUnavailableException nếu Facebook OAuth chưa được config
   *
   * Quy trình:
   * 1. Verify token với Facebook debug_token API
   * 2. Lấy user_id từ verified token
   * 3. Gọi Facebook Graph API để lấy user info (id, name, email)
   * 4. Return verified profile
   */
  private async verifyFacebookToken(accessToken: string) {
    try {
      const appId = this.configService.get<string>('FACEBOOK_APP_ID');
      const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

      if (!appId || !appSecret) {
        throw new ServiceUnavailableException('Facebook OAuth is not configured');
      }

      // Verify token với Facebook
      const verifyResponse = await firstValueFrom(
        this.httpService.get('https://graph.facebook.com/debug_token', {
          params: {
            input_token: accessToken,
            access_token: `${appId}|${appSecret}`,
          },
        }),
      );

      if (!verifyResponse.data.data?.is_valid) {
        throw new UnauthorizedException('Invalid or expired Facebook access token');
      }

      const user_id = verifyResponse.data.data.user_id;

      // Lấy thông tin user
      const userResponse = await firstValueFrom(
        this.httpService.get(`https://graph.facebook.com/${user_id}`, {
          params: {
            fields: 'id,name,email',
            access_token: accessToken,
          },
        }),
      );

      const userData = userResponse.data;
      return {
        provider_id: userData.id,
        email: userData.email,
        nickname: userData.name,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired Facebook access token');
      }
      this.logger.error(`Facebook token verification failed: ${error.message}`);
      throw new UnauthorizedException('Failed to verify Facebook token');
    }
  }

  /**
   * Link provider (Google, Facebook, phone, password) vào account hiện có
   *
   * @param user_id - User ID của user đang đăng nhập
   * @param provider - Provider type ('google', 'facebook', 'phone', 'password')
   * @param refId - Provider ID hoặc email/phone (tùy provider)
   * @param hash - Password hash (chỉ cần cho provider 'password')
   * @returns Associate record vừa tạo
   *
   * Lưu ý:
   * - Check provider đã được link với account khác chưa
   * - Nếu provider là 'password': cần hash, normalize email, set email_verified = false
   * - Nếu provider là 'phone': trim phone, set phone_verified = false
   * - Cho phép link nhiều providers vào cùng 1 account
   */
  async linkProvider(
    user_id: string,
    provider: 'google' | 'facebook' | 'phone' | 'password',
    refId: string,
    hash?: string,
  ) {
    // Check provider đã được link với account khác chưa
    const exists = await this.prisma.resAssociate.findFirst({ where: { provider, ref_id: refId } });
    if (exists) throw new BadRequestException('Provider already linked to another account');

    // Build data object
    const data: any = { user_id: user_id, provider, ref_id: refId };

    // Nếu provider là 'password', cần hash và email
    if (provider === 'password') {
      if (!hash) throw new BadRequestException('Password hash required');
      data.hash = hash;
      data.email = this.normalizeEmail(refId);
      data.email_verified = false; // Cần verify email sau
    }

    // Nếu provider là 'phone', cần phone_number
    if (provider === 'phone') {
      data.phone_number = refId.trim();
      data.phone_verified = false; // Cần verify phone sau
    }

    // Tạo associate record
    return this.prisma.resAssociate.create({ data });
  }

  /**
   * Yêu cầu mã xác thực email (cho user đã tồn tại)
   *
   * @param email - Email cần verify
   * @returns Verification response hoặc generic message (nếu email không tồn tại)
   *
   * Lưu ý:
   * - Chỉ dùng cho user đã tồn tại (không tự động tạo account)
   * - Context: 'resend' (khác với 'register')
   * - Trả về generic message nếu email không tồn tại (để không leak thông tin)
   */
  async requestEmailVerification(email: string) {
    const normalized = this.normalizeEmail(email);
    const associate = await this.prisma.resAssociate.findFirst({ where: { email: normalized } });
    if (!associate) {
      // Trả về generic message để không leak thông tin
      return this.genericVerificationMessage();
    }

    // Tạo verification code với context 'resend'
    const verification = await this.verificationService.createEmailCode({
      user_id: associate.user_id,
      target: normalized,
      context: 'resend',
    });

    return this.buildVerificationResponse(verification);
  }

  /**
   * Xác thực email với mã
   *
   * @param email - Email cần verify
   * @param code - Verification code
   * @returns { verified: true }
   *
   * Quy trình:
   * 1. Normalize email
   * 2. Verify code với VerificationService
   * 3. Tìm associate theo email
   * 4. Update email_verified = true
   */
  async verifyEmailCode(email: string, code: string) {
    const normalized = this.normalizeEmail(email);
    // Verify code trước
    await this.verificationService.verifyEmailCode(normalized, code);

    // Tìm associate và update email_verified
    const associate = await this.prisma.resAssociate.findFirst({ where: { email: normalized } });
    if (!associate) {
      throw new NotFoundException('Account not found for this email');
    }

    // Update email_verified = true
    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { email_verified: true },
    });

    return { verified: true };
  }

  /**
   * Yêu cầu mã xác thực số điện thoại (cho user đã tồn tại)
   *
   * @param phone - Số điện thoại cần verify
   * @returns Verification response hoặc generic message (nếu phone không tồn tại)
   *
   * Lưu ý:
   * - Chỉ dùng cho user đã tồn tại (không tự động tạo account)
   * - Context: 'resend' (khác với 'register' hoặc 'login')
   * - Trả về generic message nếu phone không tồn tại (để không leak thông tin)
   */
  async requestPhoneVerification(phone: string) {
    const associate = await this.prisma.resAssociate.findFirst({
      where: { phone_number: phone.trim() },
    });
    if (!associate) {
      // Trả về generic message để không leak thông tin
      return this.genericVerificationMessage();
    }
    // Tạo verification code với context 'resend'
    const verification = await this.verificationService.createPhoneCode({
      user_id: associate.user_id,
      target: phone.trim(),
      context: 'resend',
    });
    return this.buildVerificationResponse(verification);
  }

  /**
   * Xác thực số điện thoại với mã
   *
   * @param phone - Số điện thoại cần verify
   * @param code - Verification code
   * @returns { verified: true }
   *
   * Quy trình:
   * 1. Trim phone
   * 2. Verify code với VerificationService
   * 3. Tìm associate theo phone
   * 4. Update phone_verified = true
   */
  async verifyPhoneCode(phone: string, code: string) {
    // Verify code trước
    await this.verificationService.verifyPhoneCode(phone.trim(), code);

    // Tìm associate và update phone_verified
    const associate = await this.prisma.resAssociate.findFirst({
      where: { phone_number: phone.trim() },
    });
    if (!associate) {
      throw new NotFoundException('Account not found for this phone number');
    }

    // Update phone_verified = true
    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { phone_verified: true },
    });

    return { verified: true };
  }

  /**
   * Yêu cầu reset password qua email
   *
   * @param email - Email của user cần reset password
   * @returns Verification response hoặc generic message (nếu email không tồn tại)
   *
   * Quy trình:
   * 1. Normalize email
   * 2. Tìm associate với provider 'password'
   * 3. Tạo verification code với context 'password-reset'
   * 4. Gửi email với code
   * 5. Trong dev mode, log code ra console
   *
   * Lưu ý:
   * - Chỉ dùng cho user với provider 'password'
   * - Trả về generic message nếu email không tồn tại (để không leak thông tin)
   * - Code sẽ được gửi qua email (hoặc log trong dev mode)
   */
  async requestPasswordReset(email: string) {
    const normalized = this.normalizeEmail(email);
    // Tìm associate với provider 'password'
    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: normalized, provider: 'password' },
      include: { user: true },
    });

    if (!associate) {
      // Trả về generic message để không leak thông tin
      return this.genericVerificationMessage();
    }

    // Tạo verification code với context 'password-reset'
    const verification = await this.verificationService.createEmailCode({
      user_id: associate.user_id,
      target: normalized,
      context: 'password-reset',
    });

    // Gửi email với code
    try {
      await this.emailService.sendPasswordResetCode(normalized, verification.code);
      this.logger.log(`Password reset email sent to: ${normalized}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      // Vẫn trả về response để không leak thông tin
    }

    // Trong dev mode, log code ra console để test
    if (!this.isProduction) {
      this.logger.debug(`[DEV] Password reset code for ${normalized}: ${verification.code}`);
    }

    return this.buildVerificationResponse(verification);
  }

  /**
   * Reset password với mã xác thực từ email
   *
   * @param email - Email của user
   * @param code - Verification code từ email
   * @param newPassword - Password mới
   * @returns { message: 'Password reset successfully' }
   *
   * Quy trình:
   * 1. Normalize email
   * 2. Verify code với context 'password-reset'
   * 3. Tìm associate với provider 'password'
   * 4. Validate password strength
   * 5. Hash password mới với bcrypt
   * 6. Update password trong database
   *
   * Lưu ý:
   * - Chỉ dùng cho user với provider 'password'
   * - Password mới phải đáp ứng yêu cầu về độ mạnh
   */
  async resetPassword(email: string, code: string, newPassword: string) {
    const normalized = this.normalizeEmail(email);

    // Verify code với context 'password-reset'
    await this.verificationService.verifyEmailCodeWithContext(normalized, code, 'password-reset');

    // Tìm associate với provider 'password'
    const associate = await this.prisma.resAssociate.findFirst({
      where: { email: normalized, provider: 'password' },
    });

    if (!associate) {
      throw new NotFoundException('Account not found');
    }

    // Validate password strength (uppercase, lowercase, number, special char, min 8 chars)
    this.ensureStrongPassword(newPassword);

    // Hash password mới với bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password trong database
    await this.prisma.resAssociate.update({
      where: { id: associate.id },
      data: { hash: hashedPassword },
    });

    this.logger.log(`Password reset successful for user: ${associate.user_id}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Tạo 2FA secret và QR code
   *
   * @param user_id - User ID
   * @returns Secret và QR code URL để user scan vào authenticator app
   *
   * Lưu ý:
   * - User phải đã đăng nhập
   * - Sau khi setup, user cần gọi enableTwoFactor() để kích hoạt
   */
  async generateTwoFactorSecret(user_id: string) {
    const user = await this.prisma.resUser.findUnique({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Generate secret và QR code
    return this.twoFactorService.generateSecret(user);
  }

  /**
   * Kích hoạt 2FA sau khi xác thực mã
   *
   * @param user_id - User ID
   * @param code - 2FA code từ authenticator app
   * @returns { enabled: true, backupCodes: string[] }
   *
   * Lưu ý:
   * - User phải đã setup 2FA (gọi generateTwoFactorSecret trước)
   * - Verify 2FA code từ authenticator app
   * - Trả về backup codes để user lưu lại (dùng khi mất device)
   */
  async enableTwoFactor(user_id: string, code: string) {
    const result = await this.twoFactorService.enableTwoFactor(user_id, code);
    return {
      enabled: true,
      backupCodes: result.backupCodes, // Backup codes để user lưu lại
    };
  }

  /**
   * Vô hiệu hóa 2FA
   *
   * @param user_id - User ID
   * @param code - 2FA code từ authenticator app (hoặc backup code)
   * @returns { enabled: false }
   *
   * Lưu ý:
   * - User phải đã enable 2FA
   * - Verify 2FA code để disable (bảo mật)
   * - Sau khi disable, user sẽ không cần nhập 2FA code khi đăng nhập
   */
  async disableTwoFactor(user_id: string, code: string) {
    await this.twoFactorService.disableTwoFactor(user_id, code);
    return { enabled: false };
  }

  /**
   * Làm mới access token bằng refresh token
   *
   * @param refreshToken - Refresh token
   * @param ipAddress - IP address của client
   * @returns JWT tokens mới (access_token, refresh_token, expires_at)
   *
   * Quy trình:
   * 1. Rotate refresh token (tạo mới và revoke cũ) để tăng bảo mật
   * 2. Tạo access token mới
   * 3. Trả về cả 2 tokens
   *
   * Lưu ý:
   * - Refresh token sẽ được rotate (tạo mới và revoke cũ)
   * - Access token mới sẽ có thời hạn mới
   */
  async refreshTokens(refreshToken: string, ipAddress?: string) {
    // Rotate refresh token (tạo mới và revoke cũ)
    const { user, refreshToken: rotatedRefresh } = await this.tokenService.rotateRefreshToken(
      refreshToken,
      ipAddress,
    );
    // Tạo access token mới
    const access = await this.tokenService.generateAccessToken(user.id, user.role);

    return this.buildTokenResponse(access.token, rotatedRefresh, access.expiresAt);
  }

  /**
   * Đăng xuất và hủy token
   *
   * @param user_id - User ID
   * @param refreshToken - Refresh token (optional) để revoke
   * @param accessToken - Access token để blacklist
   * @returns { success: true }
   *
   * Quy trình:
   * 1. Blacklist access token hiện tại (luôn luôn làm)
   * 2. Nếu có refresh token, revoke nó để ngăn tạo access token mới
   *
   * Lưu ý:
   * - Access token sẽ được blacklist (không thể sử dụng được nữa)
   * - Refresh token sẽ được revoke (nếu có)
   * - Sau khi logout, cả 2 tokens sẽ không thể sử dụng được
   */
  async logout(user_id: string, refreshToken?: string, accessToken?: string) {
    // Blacklist access token hiện tại (luôn luôn làm)
    await this.tokenService.blacklistAccessToken(accessToken, user_id, 'logout');

    // Nếu có refresh token, revoke nó để ngăn tạo access token mới
    if (refreshToken) {
      try {
        await this.tokenService.revokeRefreshToken(refreshToken, user_id);
      } catch (error) {
        // Nếu refresh token không hợp lệ hoặc đã revoked, không cần throw error
        // Vì mục đích chính là blacklist access token, đã hoàn thành
        this.logger.warn(`Failed to revoke refresh token during logout: ${error.message}`);
      }
    }

    return { success: true };
  }

  /**
   * Validate password strength
   *
   * @param password - Password cần validate
   * @throws BadRequestException nếu password không đáp ứng yêu cầu
   *
   * Yêu cầu:
   * - Ít nhất 1 chữ hoa
   * - Ít nhất 1 chữ thường
   * - Ít nhất 1 số
   * - Ít nhất 1 ký tự đặc biệt (@$!%*?&)
   * - Tối thiểu 8 ký tự
   */
  private ensureStrongPassword(password: string) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
      );
    }
  }

  /**
   * Normalize email (trim và lowercase)
   *
   * @param email - Email cần normalize
   * @returns Email đã được normalize
   */
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  /**
   * Kiểm tra email/phone đã được verify chưa
   *
   * @param associate - Associate record
   * @throws UnauthorizedException nếu email/phone chưa được verify
   *
   * Lưu ý:
   * - Yêu cầu bắt buộc: email hoặc phone phải được verify trước khi đăng nhập
   * - Nếu có email nhưng chưa verify: throw error
   * - Nếu có phone nhưng chưa verify: throw error
   */
  private ensureVerifiedContact(associate: ResAssociate) {
    if (associate.email && !associate.email_verified) {
      throw new UnauthorizedException('Email verification is required before logging in');
    }
    if (associate.phone_number && !associate.phone_verified) {
      throw new UnauthorizedException('Phone verification is required before logging in');
    }
  }

  /**
   * Xác thực mã 2FA cho phiên đăng nhập đang chờ
   *
   * @param dto - VerifyTwoFactorLoginDto chứa temp_token và code
   * @param ipAddress - IP address của client
   * @returns JWT tokens
   *
   * Quy trình:
   * 1. Verify temp_token để lấy user_id
   * 2. Verify 2FA code
   * 3. Tạo JWT tokens và trả về
   *
   * Lưu ý:
   * - Endpoint này được gọi sau khi login trả về requires_2fa: true
   * - temp_token được tạo từ login() khi user có 2FA enabled
   */
  async verifyLoginTwoFactor(dto: VerifyTwoFactorLoginDto, ipAddress?: string) {
    // Verify temp_token để lấy user_id
    const { user_id } = await this.tokenService.verifyTwoFactorToken(dto.temp_token);
    // Verify 2FA code
    await this.twoFactorService.verifyLoginCode(user_id, dto.code);

    // Lấy user và tạo JWT tokens
    const user = await this.prisma.resUser.findUnique({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildAuthResponse(user, ipAddress);
  }

  /**
   * Build authentication response với JWT tokens
   *
   * @param user - User object
   * @param ipAddress - IP address của client
   * @returns JWT tokens (access_token, refresh_token, expires_at)
   */
  private async buildAuthResponse(user: ResUser, ipAddress?: string) {
    // Tạo session với access token và refresh token
    const tokens = await this.tokenService.createSession(user, ipAddress);
    return this.buildTokenResponse(tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
  }

  /**
   * Build verification response
   *
   * @param result - Verification result với code và expiresAt
   * @returns Verification response với message, expires_at, và preview_code (dev mode)
   *
   * Lưu ý:
   * - Trả về object có 'message' để ResponseInterceptor extract message
   * - Trong dev mode, trả về preview_code để test
   * - Trong production, không trả về preview_code
   */
  private buildVerificationResponse(result?: { code: string; expiresAt: Date }) {
    if (!result) {
      return undefined;
    }
    // Trả về object có 'message' để ResponseInterceptor extract message
    // nhưng vẫn giữ các field khác (expires_at, preview_code) trong data
    return {
      message: 'Verification code sent successfully',
      expires_at: result.expiresAt,
      ...(this.isProduction ? {} : { preview_code: result.code }), // Chỉ trả về trong dev mode
    };
  }

  /**
   * Generic verification message để không leak thông tin
   *
   * @returns Generic message (dùng khi email/phone không tồn tại)
   *
   * Lưu ý:
   * - Dùng để tránh leak thông tin về email/phone có tồn tại hay không
   * - Luôn trả về cùng 1 message, bất kể email/phone có tồn tại hay không
   */
  private genericVerificationMessage() {
    return { message: 'If the destination exists, a verification code has been sent' };
  }

  /**
   * Get current user with full profile information
   * Optimized to use existing user object if available to avoid duplicate queries
   *
   * @param userIdOrUser - User ID (string) hoặc User object (từ JWT strategy)
   * @returns User object với associates (providers) và albums
   *
   * Lưu ý:
   * - Nếu user object đã được cung cấp (từ JWT strategy), sử dụng trực tiếp để tránh duplicate query
   * - Nếu chỉ có user_id, fetch full user với associates và albums
   * - Optimize để tránh query database không cần thiết
   */
  async getCurrentUser(userIdOrUser: string | any) {
    // If user object is already provided (from JWT strategy), use it directly
    if (userIdOrUser && typeof userIdOrUser === 'object' && userIdOrUser.id) {
      // Check if associates and albums are already included
      if (userIdOrUser.associates && userIdOrUser.albums) {
        return userIdOrUser;
      }
      // Fetch missing data (associates or albums)
      const needsAssociates = !userIdOrUser.associates;
      const needsAlbums = !userIdOrUser.albums;

      const [associates, albums] = await Promise.all([
        needsAssociates
          ? this.prisma.resAssociate.findMany({
              where: { user_id: userIdOrUser.id },
              select: {
                id: true,
                provider: true,
                email: true,
                phone_number: true,
                email_verified: true,
                phone_verified: true,
              },
            })
          : Promise.resolve(userIdOrUser.associates),
        needsAlbums
          ? this.prisma.resAlbum.findMany({
              where: { user_id: userIdOrUser.id },
              select: {
                id: true,
                image_url: true,
                created_at: true,
              },
              orderBy: {
                created_at: 'desc',
              },
            })
          : Promise.resolve(userIdOrUser.albums),
      ]);
      return {
        ...userIdOrUser,
        associates,
        albums,
      };
    }

    // If only user_id is provided, fetch full user with associates and albums
    const user_id = userIdOrUser as string;
    const user = await this.prisma.resUser.findUnique({
      where: { id: user_id },
      include: {
        associates: {
          select: {
            id: true,
            provider: true,
            email: true,
            phone_number: true,
            email_verified: true,
            phone_verified: true,
          },
        },
        albums: {
          select: {
            id: true,
            image_url: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Build token response với format chuẩn
   *
   * @param accessToken - Access token
   * @param refreshToken - Refresh token
   * @param expiresAt - Thời gian hết hạn của access token
   * @returns Token response với access_token, refresh_token, expires_at
   */
  private buildTokenResponse(accessToken: string, refreshToken: string, expiresAt: Date) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(), // Convert Date to ISO string
    };
  }
}
