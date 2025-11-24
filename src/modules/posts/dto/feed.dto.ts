import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostDto, PostUserDto, PostMediaDto, PostHashtagDto } from './posts.dto';

export class FeedPostDto {
  @ApiProperty({ example: 'post-1' })
  id: string;

  @ApiProperty({ type: PostUserDto })
  user: PostUserDto;

  @ApiProperty({ example: 'Hello world!' })
  content: string;

  @ApiProperty({ type: [PostMediaDto] })
  media: PostMediaDto[];

  @ApiProperty({ type: [PostHashtagDto] })
  tags: PostHashtagDto[];

  @ApiProperty({ example: 'public', enum: ['public', 'private', 'friends'] })
  visibility: string;

  @ApiProperty({ example: 100 })
  likesCount: number;

  @ApiProperty({ example: 20 })
  commentsCount: number;

  @ApiProperty({ example: 5 })
  shareCount: number;

  @ApiProperty({ example: false })
  isLiked: boolean;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: string;
}

export class HotTopicDto {
  @ApiProperty({ example: 'technology' })
  hashtag: string;

  @ApiProperty({ example: 1000 })
  post_count: number;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  thumbnail_url?: string;

  @ApiProperty({ example: 1500 })
  engagement_score: number;
}

export class FeedMetaDto {
  @ApiProperty({ example: 20 })
  item_count: number;

  @ApiProperty({ example: 100 })
  total_items: number;

  @ApiProperty({ example: 20 })
  items_per_page: number;

  @ApiProperty({ example: 5 })
  total_pages: number;

  @ApiProperty({ example: 0 })
  current_page: number;
}

export class FeedResponseDto {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 0 })
  code: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: [FeedPostDto] })
  items: FeedPostDto[];

  @ApiProperty({ type: FeedMetaDto })
  meta: FeedMetaDto;

  @ApiProperty({ example: 'trace-123456' })
  traceId: string;
}

export class CommunityFeedResponseDto {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 0 })
  code: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: [HotTopicDto] })
  hot_topics: HotTopicDto[];

  @ApiProperty({ type: [FeedPostDto] })
  items: FeedPostDto[];

  @ApiProperty({ type: FeedMetaDto })
  meta: FeedMetaDto;

  @ApiProperty({ example: 'trace-123456' })
  traceId: string;
}
