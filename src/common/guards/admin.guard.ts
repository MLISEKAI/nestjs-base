import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserBasicRole } from '@prisma/client';

/**
 * Admin Guard - Chỉ cho phép admin truy cập
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== UserBasicRole.admin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
