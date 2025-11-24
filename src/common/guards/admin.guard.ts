// Import Injectable, CanActivate, ExecutionContext và ForbiddenException từ NestJS
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// Import UserBasicRole enum từ Prisma
import { UserBasicRole } from '@prisma/client';

/**
 * @Injectable() - Đánh dấu class này là NestJS guard
 * AdminGuard - Guard để kiểm tra quyền admin
 *
 * Chức năng chính:
 * - Kiểm tra user đã authenticated chưa
 * - Kiểm tra user có role là admin không
 * - Throw ForbiddenException nếu không phải admin
 *
 * Lưu ý:
 * - Phải được sử dụng cùng với AuthGuard('account-auth')
 * - Chỉ cho phép users có role = UserBasicRole.admin truy cập
 * - Throw ForbiddenException nếu user không có quyền
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
