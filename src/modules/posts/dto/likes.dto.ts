import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PostReaction } from '../../../common/enums';

export class LikeUserDto {
  @ApiProperty({ example: 'user-1' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  nickname: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'Striving for excellence...' })
  bio?: string;

  @ApiPropertyOptional({ example: 'male', description: 'Gender: male, female, other' })
  gender?: string;

  @ApiPropertyOptional({ example: true, description: 'Current user is following this user' })
  is_following?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Current user is friend with this user (both follow each other)' })
  is_friend?: boolean;

  @ApiPropertyOptional({ example: true, description: 'This user is following current user (follower)' })
  is_follower?: boolean;
}

export class PostLikeDto {
  @ApiProperty({ example: 'like-1' })
  id: string;

  @ApiProperty({ example: 'post-1' })
  post_id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({
    example: 'like',
    description: 'Reaction type: like, love, haha, wow, sad, angry',
    enum: PostReaction,
  })
  reaction: PostReaction;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ type: LikeUserDto, description: 'User info' })
  user?: LikeUserDto;
}

export class LikeStatsDto {
  @ApiProperty({ example: 100, description: 'Total likes count' })
  total: number;

  @ApiProperty({ example: 50, description: 'Like reactions count' })
  like: number;

  @ApiProperty({ example: 30, description: 'Love reactions count' })
  love: number;

  @ApiProperty({ example: 10, description: 'Haha reactions count' })
  haha: number;

  @ApiProperty({ example: 5, description: 'Wow reactions count' })
  wow: number;

  @ApiProperty({ example: 3, description: 'Sad reactions count' })
  sad: number;

  @ApiProperty({ example: 2, description: 'Angry reactions count' })
  angry: number;
}

export class CheckUserLikedDto {
  @ApiProperty({ example: true, description: 'Whether user has liked the post' })
  is_liked: boolean;

  @ApiPropertyOptional({
    example: 'like',
    description: 'Reaction type if liked',
    enum: PostReaction,
  })
  reaction?: PostReaction;
}

export class LikePostDto {
  @ApiProperty({
    example: 'like',
    description: 'Reaction type: like, love, haha, wow, sad, angry',
    enum: PostReaction,
  })
  @IsEnum(PostReaction, {
    message: 'reaction must be one of the following values: like, love, haha, wow, sad, angry',
  })
  reaction: PostReaction;
}
