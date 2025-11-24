// Import Injectable và ExecutionContext từ NestJS
import { Injectable, ExecutionContext } from '@nestjs/common';
// Import AuthGuard từ Passport
import { AuthGuard } from '@nestjs/passport';
// Import Observable và operators từ RxJS
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * @Injectable() - Đánh dấu class này là NestJS guard
 * OptionalAuthGuard - Guard để optional authentication (không bắt buộc phải có token)
 *
 * Chức năng chính:
 * - Thử authenticate với JWT token nếu có
 * - Không throw error nếu token missing hoặc invalid
 * - Cho phép request tiếp tục với hoặc không có user
 *
 * Lưu ý:
 * - Dùng cho các endpoints public nhưng có thể có thông tin thêm nếu user đã đăng nhập
 * - Nếu có token hợp lệ, request.user sẽ có user object
 * - Nếu không có token hoặc token invalid, request.user sẽ là null
 * - Không throw error, luôn return true để cho phép request tiếp tục
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('account-auth') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Try to activate, but don't throw error if authentication fails
    const result = super.canActivate(context);

    // If it's a Promise, catch errors and allow request to continue
    if (result instanceof Promise) {
      return result.catch(() => {
        // If authentication fails, just continue without user
        return true;
      });
    }

    // If it's an Observable, catch errors
    if (result instanceof Observable) {
      return result.pipe(
        catchError(() => {
          // If authentication fails, just continue without user
          return of(true);
        }),
      );
    }

    // If it's a boolean, return as is
    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    // If there's an error or no user, just return null instead of throwing
    if (err || !user) {
      return null;
    }
    return user;
  }
}
