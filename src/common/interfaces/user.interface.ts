/**
 * IUser - Interface cho user data
 *
 * Lưu ý:
 * - id: User ID (bắt buộc)
 * - union_id: Union ID (bắt buộc)
 * - role: User role (bắt buộc)
 * - nickname: User nickname (bắt buộc)
 * - is_blocked: User có bị block không (bắt buộc)
 * - bio, avatar, gender, birthday: Optional fields
 * - created_at, updated_at: Timestamps
 * - deleted_at: Soft delete timestamp (optional)
 * - is_deleted: Soft delete flag (bắt buộc)
 */
export interface IUser {
  /** User ID (bắt buộc) */
  readonly id: string;
  /** Union ID (bắt buộc) */
  readonly union_id: string;
  /** User role (bắt buộc) */
  readonly role: string;
  /** User nickname (bắt buộc) */
  readonly nickname: string;
  /** User có bị block không (bắt buộc) */
  readonly is_blocked: boolean;
  /** User bio (optional) */
  readonly bio?: string;
  /** User avatar URL (optional) */
  readonly avatar?: string;
  /** User gender (optional) */
  readonly gender?: string;
  /** User birthday (optional) */
  readonly birthday?: Date | string;
  /** Created timestamp */
  readonly created_at: Date | string;
  /** Updated timestamp */
  readonly updated_at: Date | string;
  /** Soft delete timestamp (optional) */
  readonly deleted_at?: Date | string | null;
  /** Soft delete flag (bắt buộc) */
  readonly is_deleted: boolean;
}

/**
 * IUserConnection - Interface cho user connection data
 *
 * Lưu ý:
 * - id: User ID
 * - nickname: User nickname
 * - avatar: User avatar URL (optional)
 * - is_following: Có đang follow user này không
 * - is_friend: Có phải friend không
 */
export interface IUserConnection {
  /** User ID */
  readonly id: string;
  /** User nickname */
  readonly nickname: string;
  /** User avatar URL (optional) */
  readonly avatar?: string;
  /** Có đang follow user này không */
  readonly is_following: boolean;
  /** Có phải friend không */
  readonly is_friend: boolean;
}

/**
 * IUserProfile - Interface cho user profile với statistics
 *
 * Lưu ý:
 * - Extends IUser với thêm statistics fields
 * - followers_count: Số followers (optional)
 * - following_count: Số following (optional)
 * - friends_count: Số friends (optional)
 * - posts_count: Số posts (optional)
 */
export interface IUserProfile extends IUser {
  /** Số followers (optional) */
  readonly followers_count?: number;
  /** Số following (optional) */
  readonly following_count?: number;
  /** Số friends (optional) */
  readonly friends_count?: number;
  /** Số posts (optional) */
  readonly posts_count?: number;
}
