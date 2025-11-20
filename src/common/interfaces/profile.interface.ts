/**
 * Profile interface
 */
export interface IProfile {
  id: string;
  user_id: string;
  nickname: string;
  bio?: string;
  avatar?: string;
  gender?: string;
  birthday?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Profile view interface
 */
export interface IProfileView {
  id: string;
  viewer_id: string;
  target_user_id: string;
  viewed_at: Date | string;
}

/**
 * Profile stats interface
 */
export interface IProfileStats {
  posts: number;
  followers_count: number;
  following_count: number;
  views_count: number;
}
