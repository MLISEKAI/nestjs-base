import { PostPrivacy, Prisma } from '@prisma/client';

/**
 * Post with relations from Prisma
 */
export interface PostWithRelations {
  id: string;
  user_id: string;
  content: string;
  privacy: PostPrivacy;
  share_count: number;
  created_at: Date;
  updated_at: Date;
  user?: {
    id: string;
    nickname: string;
    avatar?: string;
    union_id?: string;
  };
  media?: Array<{
    id: string;
    media_url: string;
    thumbnail_url?: string;
    media_type: string;
    width?: number;
    height?: number;
    order: number;
  }>;
  hashtags?: Array<{
    id: string;
    hashtag: {
      id: string;
      name: string;
    };
  }>;
  likes?: Array<{
    user_id: string;
  }>;
  _count?: {
    likes?: number;
    comments?: number;
  };
}

/**
 * Formatted post for API response
 */
export interface FormattedPost {
  id: string;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  content: string;
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>;
  hashtags: Array<{
    id: string;
    name: string;
  }>;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_liked: boolean;
  created_at: Date | string;
  privacy: PostPrivacy;
}

/**
 * Prisma where clause for posts (alias for Prisma.ResPostWhereInput)
 */
export type PostWhereClause = Prisma.ResPostWhereInput;
