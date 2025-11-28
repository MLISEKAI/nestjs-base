import { ExecutionContext, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { handlerErrorSystem } from 'src/common';
import { ErrorSystemCode } from 'src/common/enum/error.enum';
import { SystemException } from 'src/common/exception/system-exception';
import { ResUserService } from 'src/modules/users/user.service';

@Injectable()
export class ClientAuthGuard extends AuthGuard('client-auth') implements OnModuleInit {
  constructor(
    private jwtService: JwtService,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  private userService: ResUserService;

  async onModuleInit() {
    this.userService = this.moduleRef.get(ResUserService, { strict: false });
  }

  private logger = new Logger(ClientAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // this.logger.log(`Header request http - payload ${JSON.stringify(request?.headers || {})}`);
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new SystemException(ErrorSystemCode.INVALID_ACCESS_TOKEN);
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_TOKEN_SECRET,
      });
      request['user'] = await this.userService.getUserCachingByUid(payload['sub']);
      if (!request['user']) throw new SystemException(ErrorSystemCode.FORBIDDEN_REQUEST);
      this.logger.log(
        `Request from userId: ${payload['sub']} - ${request?.method} ${request?.path} - data: ${JSON.stringify(
          request?.data,
        )}`,
      );
    } catch (error: any) {
      this.logger.error(`Authentication client user ERROR: ${error.message}`);
      return handlerErrorSystem(error, {
        message: error?.message,
        code: ErrorSystemCode.FORBIDDEN_REQUEST,
      });
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
