import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'jsonwebtoken';
import { ModuleRef } from '@nestjs/core';
import { ResUserService } from 'src/modules/users/user.service';

@Injectable()
export class AccountStrategy extends PassportStrategy(Strategy, 'account-auth') implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_TOKEN_SECRET,
    });
  }

  private accountService: ResUserService;

  async onModuleInit() {
    this.accountService = this.moduleRef.get(ResUserService, { strict: false });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    const user = await this.accountService.getUserCachingByUid(payload['sub']);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
