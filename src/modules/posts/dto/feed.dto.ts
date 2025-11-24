import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// User DTO for Friends/Latest Feed
export class FeedUserDto {
  @ApiProperty({ example: 'uuid', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'Craig Curtis', description: 'User nickname' })
  nickname: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/...',
    description: 'Avatar URL',
  })
  avatar?: string;
}

// User DTO for Community Feed (same as FeedUserDto - kept for backward compatibility)
export class CommunityUserDto {
  @ApiProperty({ example: 'uuid', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'Craig Curtis', description: 'User nickname' })
  nickname: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/...',
    description: 'Avatar URL',
  })
  avatar?: string;
}

// Media DTO
export class FeedMediaDto {
  @ApiProperty({ example: 'uuid', description: 'Media ID' })
  id: string;

  @ApiProperty({
    example: 'image',
    enum: ['image', 'video', 'audio', 'file'],
    description: 'Media type',
  })
  type: string;

  @ApiProperty({ example: 'https://cdn.example.com/media/...', description: 'Media URL' })
  url: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/thumbnails/...',
    description: 'Thumbnail URL',
  })
  thumbnail_url?: string;

  @ApiPropertyOptional({ example: 1080, description: 'Width in pixels' })
  width?: number;

  @ApiPropertyOptional({ example: 1080, description: 'Height in pixels' })
  height?: number;
}

// Feed Post DTO (for Friends/Latest Feed)
export class FeedPostDto {
  @ApiProperty({ example: 'uuid', description: 'Post ID' })
  id: string;

  @ApiProperty({ type: FeedUserDto, description: 'Post author' })
  user: FeedUserDto;

  @ApiProperty({ example: 'When it comes to home decor...', description: 'Post content' })
  content: string;

  @ApiProperty({ type: [FeedMediaDto], description: 'Post media' })
  media: FeedMediaDto[];

  @ApiProperty({ example: ['#homedecor', '#interior'], type: [String], description: 'Hashtags' })
  hashtags: string[];

  @ApiProperty({ example: 245, description: 'Number of likes' })
  like_count: number;

  @ApiProperty({ example: 13, description: 'Number of comments' })
  comment_count: number;

  @ApiProperty({ example: 5, description: 'Number of shares' })
  share_count: number;

  @ApiProperty({ example: false, description: 'Whether current user liked this post' })
  is_liked: boolean;

  @ApiProperty({ example: '2025-11-24T15:02:00Z', description: 'Creation timestamp' })
  created_at: Date | string;

  @ApiProperty({
    example: 'public',
    enum: ['public', 'private', 'friends'],
    description: 'Privacy setting',
  })
  privacy: string;
}

// Community Feed Post DTO (different user format)
export class CommunityFeedPostDto {
  @ApiProperty({ example: 'uuid', description: 'Post ID' })
  id: string;

  @ApiProperty({ type: CommunityUserDto, description: 'Post author' })
  user: CommunityUserDto;

  @ApiProperty({ example: 'When it comes to home decor...', description: 'Post content' })
  content: string;

  @ApiProperty({ type: [FeedMediaDto], description: 'Post media' })
  media: FeedMediaDto[];

  @ApiProperty({ example: ['#homedecor', '#interior'], type: [String], description: 'Hashtags' })
  hashtags: string[];

  @ApiProperty({ example: 245, description: 'Number of likes' })
  like_count: number;

  @ApiProperty({ example: 13, description: 'Number of comments' })
  comment_count: number;

  @ApiProperty({ example: 5, description: 'Number of shares' })
  share_count: number;

  @ApiProperty({ example: false, description: 'Whether current user liked this post' })
  is_liked: boolean;

  @ApiProperty({ example: '2025-11-24T15:02:00Z', description: 'Creation timestamp' })
  created_at: Date | string;

  @ApiProperty({
    example: 'public',
    enum: ['public', 'private', 'friends'],
    description: 'Privacy setting',
  })
  privacy: string;
}

// Hot Topic DTO
export class HotTopicDto {
  @ApiProperty({ example: 'uuid', description: 'Hashtag ID' })
  id: string;

  @ApiProperty({ example: '#Sayhi2025', description: 'Hashtag name with #' })
  hashtag: string;

  @ApiProperty({ example: 120000, description: 'Number of posts' })
  post_count: number;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/topics/...',
    description: 'Thumbnail URL',
  })
  thumbnail_url?: string;

  @ApiProperty({ example: 98.5, description: 'Engagement score (0-100)' })
  engagement_score: number;
}

// Pagination Meta DTO
export class FeedMetaDto {
  @ApiProperty({ example: 1, description: 'Number of items in current page' })
  item_count: number;

  @ApiProperty({ example: 1, description: 'Total number of items' })
  total_items: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  items_per_page: number;

  @ApiProperty({ example: 1, description: 'Total number of pages' })
  total_pages: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  current_page: number;
}

// Friends/Latest Feed Response Data DTO
export class FeedResponseDataDto {
  @ApiProperty({ type: [FeedPostDto], description: 'List of posts' })
  items: FeedPostDto[];

  @ApiProperty({ type: FeedMetaDto, description: 'Pagination metadata' })
  meta: FeedMetaDto;
}

// Community Feed Response Data DTO
export class CommunityFeedResponseDataDto {
  @ApiProperty({ type: [CommunityFeedPostDto], description: 'List of posts' })
  items: CommunityFeedPostDto[];

  @ApiProperty({ type: FeedMetaDto, description: 'Pagination metadata' })
  meta: FeedMetaDto;
}

// Full Response DTOs (wrapped by ResponseInterceptor)
export class FriendsFeedResponseDto {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 0 })
  code: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: FeedResponseDataDto })
  data: FeedResponseDataDto;

  @ApiProperty({ example: 'generated-trace-id' })
  traceId: string;
}

export class LatestFeedResponseDto {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 0 })
  code: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: FeedResponseDataDto })
  data: FeedResponseDataDto;

  @ApiProperty({ example: 'generated-trace-id' })
  traceId: string;
}

export class CommunityFeedResponseDto {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 0 })
  code: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: CommunityFeedResponseDataDto })
  data: CommunityFeedResponseDataDto;

  @ApiProperty({ example: 'generated-trace-id' })
  traceId: string;
}
