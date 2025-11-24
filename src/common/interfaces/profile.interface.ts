/**
 * IProfile - Interface cho user profile data
 *
 * Lưu ý:
 * - id: Profile ID (bắt buộc)
 * - user_id: User ID (bắt buộc)
 * - nickname: User nickname (bắt buộc)
 * - bio, avatar, gender, birthday: Optional fields
 * - created_at, updated_at: Timestamps
 */
export interface IProfile {
  /** Profile ID (bắt buộc) */
  readonly id: string;
  /** User ID (bắt buộc) */
  readonly user_id: string;
  /** User nickname (bắt buộc) */
  readonly nickname: string;
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
}

/**
 * IProfileView - Interface cho profile view tracking
 *
 * Lưu ý:
 * - id: View record ID
 * - viewer_id: ID của user xem profile
 * - target_user_id: ID của user được xem profile
 * - viewed_at: Thời điểm xem profile
 */
export interface IProfileView {
  /** View record ID */
  readonly id: string;
  /** ID của user xem profile */
  readonly viewer_id: string;
  /** ID của user được xem profile */
  readonly target_user_id: string;
  /** Thời điểm xem profile */
  readonly viewed_at: Date | string;
}

/**
 * IProfileStats - Interface cho profile statistics
 *
 * Lưu ý:
 * - posts: Số posts
 * - followers_count: Số followers
 * - following_count: Số following
 * - views_count: Số profile views
 */
export interface IProfileStats {
  /** Số posts */
  readonly posts: number;
  /** Số followers */
  readonly followers_count: number;
  /** Số following */
  readonly following_count: number;
  /** Số profile views */
  readonly views_count: number;
}
