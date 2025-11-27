import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional Auth Guard
 * Cho phép request đi qua dù có hoặc không có JWT token
 * Nếu có token hợp lệ => req.user sẽ được set
 * Nếu không có token hoặc token không hợp lệ => req.user = undefined, request vẫn đi qua
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('account-auth') {
  handleRequest(err: any, user: any) {
    // Không throw error, chỉ return user (có thể là undefined)
    return user;
  }
}
