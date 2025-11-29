// Import Module decorator từ NestJS
import { Module } from '@nestjs/common';
// Import AuthService và Controllers
import { AuthService } from './auth.service';
import { RegistrationController } from './controllers/registration.controller';
import { LoginController } from './controllers/login.controller';
import { VerificationController } from './controllers/verification.controller';
import { PasswordController } from './controllers/password.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { TokenController } from './controllers/token.controller';
import { UserController } from './controllers/user.controller';
import { OAuthController } from './controllers/oauth.controller';
// Import PrismaModule để query database
import { PrismaModule } from '../prisma/prisma.module';
// Import JwtModule và PassportModule để xử lý authentication
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
// Import Passport strategies
import { AccountStrategy } from './strategy/jwt.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { FacebookStrategy } from './strategy/facebook.strategy';
// Import UsersModule để sử dụng user operations
import { UsersModule } from '../modules/users/users.module';
// Import ConfigModule và ConfigService để đọc environment variables
import { ConfigModule, ConfigService } from '@nestjs/config';
// Import CommonModule để sử dụng EmailService
import { CommonModule } from '../common/common.module';
// Import security services
import { TokenService } from './security/token.service';
import { VerificationService } from './security/verification.service';
import { TwoFactorService } from './security/two-factor.service';
// Import HttpModule để gọi external APIs (Google, Facebook)
import { HttpModule } from '@nestjs/axios';
// import { AuthRateLimitService } from './security/auth-rate-limit.service';
// Import new services
import { RegistrationService } from './services/registration.service';
import { LoginService } from './services/login.service';
import { OAuthService } from './services/oauth.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';

/**
 * @Module() - Đánh dấu class này là NestJS module
 * AuthModule - Module xử lý authentication và authorization
 *
 * Chức năng chính:
 * - User registration và login
 * - OAuth authentication (Google, Facebook, Anonymous)
 * - Email và phone verification
 * - Two-factor authentication (2FA)
 * - Password reset
 * - Token management (access tokens, refresh tokens)
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - UsersModule: User operations
 * - CommonModule: EmailService
 * - JwtModule: JWT token signing và verification
 * - PassportModule: Passport strategies
 * - HttpModule: HTTP requests to OAuth providers
 * - ConfigModule: Environment variables
 *
 * Exports:
 * - AuthService: Để các modules khác sử dụng
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UsersModule,
    CommonModule,
    HttpModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<number>('jwt.expiresIn') ?? 3600;
        return {
          secret: configService.get<string>('jwt.secret') || process.env.JWT_SECRET || 'secretKey',
          signOptions: {
            expiresIn,
            issuer: configService.get<string>('jwt.issuer') ?? 'api',
          },
        };
      },
    }),
  ],
  providers: [
    AuthService,
    AccountStrategy,
    GoogleStrategy,
    FacebookStrategy,
    TokenService,
    VerificationService,
    TwoFactorService,
    // AuthRateLimitService,
    // New services
    RegistrationService,
    LoginService,
    OAuthService,
    EmailVerificationService,
    PasswordResetService,
  ],
  controllers: [
    RegistrationController,
    LoginController,
    VerificationController,
    PasswordController,
    TwoFactorController,
    TokenController,
    UserController,
    OAuthController,
  ],
  exports: [AuthService],
})
export class AuthModule {}
