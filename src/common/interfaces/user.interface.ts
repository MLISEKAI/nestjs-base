/**
 * User interface
 */
export interface IUser {
  id: string;
  union_id: string;
  role: string;
  nickname: string;
  is_blocked: boolean;
  bio?: string;
  avatar?: string;
  gender?: string;
  birthday?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;
  is_deleted: boolean;
}

/**
 * User connection interface
 */
export interface IUserConnection {
  id: string;
  nickname: string;
  avatar?: string;
  is_following: boolean;
  is_friend: boolean;
}

/**
 * User profile interface
 */
export interface IUserProfile extends IUser {
  followers_count?: number;
  following_count?: number;
  friends_count?: number;
  posts_count?: number;
}
