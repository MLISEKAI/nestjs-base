import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccountStrategy } from './strategy/jwt.strategy';
import { UsersModule } from '../modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './security/token.service';
import { VerificationService } from './security/verification.service';
import { TwoFactorService } from './security/two-factor.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UsersModule,
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
  providers: [AuthService, AccountStrategy, TokenService, VerificationService, TwoFactorService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
