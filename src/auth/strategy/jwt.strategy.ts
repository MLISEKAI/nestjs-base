import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ModuleRef } from '@nestjs/core';
import { UserBasicRole } from '@prisma/client';
import { ResUserService } from '../../modules/users/res-user.service';
import { ConfigService } from '@nestjs/config';


interface MyJwtPayload {
  sub: string;          
  role: UserBasicRole;  
  iat?: number;
  exp?: number;
  iss?: string;
}

@Injectable()
export class AccountStrategy
  extends PassportStrategy(Strategy, 'account-auth')
  implements OnModuleInit
{
  private accountService: ResUserService;

  constructor(private readonly moduleRef: ModuleRef, private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || process.env.JWT_SECRET || 'secretKey',
      issuer: configService.get<string>('jwt.issuer') ?? process.env.JWT_ISSUER ?? 'api',
    });
  }

  async onModuleInit() {
    this.accountService = this.moduleRef.get(ResUserService, { strict: false });
  }

  async validate(payload: MyJwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload: missing sub');
    }

    const user = await this.accountService.findUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
