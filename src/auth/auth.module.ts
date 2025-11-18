import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccountStrategy } from './strategy/jwt.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { FacebookStrategy } from './strategy/facebook.strategy';
import { UsersModule } from '../modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { TokenService } from './security/token.service';
import { VerificationService } from './security/verification.service';
import { TwoFactorService } from './security/two-factor.service';
import { HttpModule } from '@nestjs/axios';
// import { AuthRateLimitService } from './security/auth-rate-limit.service';

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
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
