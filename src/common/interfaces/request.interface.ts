// Import Request type từ Express
import { Request } from 'express';

/**
 * AuthenticatedUser - Interface cho authenticated user từ JWT token
 *
 * Lưu ý:
 * - id: User ID (bắt buộc)
 * - union_id: Union ID (optional)
 * - role: User role (optional)
 * - nickname: User nickname (optional)
 * - avatar: User avatar URL (optional)
 */
export interface AuthenticatedUser {
  /** User ID (bắt buộc) */
  readonly id: string;
  /** Union ID (optional) */
  readonly union_id?: string;
  /** User role (optional) */
  readonly role?: string;
  /** User nickname (optional) */
  readonly nickname?: string;
  /** User avatar URL (optional) */
  readonly avatar?: string;
}

/**
 * AuthenticatedRequest - Interface cho Express Request với authenticated user
 *
 * Lưu ý:
 * - Extends Express Request
 * - user: Authenticated user từ JWT token (bắt buộc)
 * - Được sử dụng trong các endpoints cần authentication
 */
export interface AuthenticatedRequest extends Request {
  /** Authenticated user từ JWT token (bắt buộc) */
  readonly user: AuthenticatedUser;
}

/**
 * OptionalAuthenticatedRequest - Interface cho Express Request với optional authenticated user
 *
 * Lưu ý:
 * - Extends Express Request
 * - user: Authenticated user từ JWT token (optional)
 * - Được sử dụng trong các endpoints public nhưng có thể có thông tin thêm nếu user đã đăng nhập
 */
export interface OptionalAuthenticatedRequest extends Request {
  /** Authenticated user từ JWT token (optional) */
  readonly user?: AuthenticatedUser;
}
