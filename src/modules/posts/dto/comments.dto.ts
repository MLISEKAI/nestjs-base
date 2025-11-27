import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MinLength, MaxLength, ValidateIf, IsArray, ValidateNested, IsEnum, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CommentUserDto {
  @ApiProperty({ example: 'user-1' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  nickname: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'Striving for excellence...' })
  bio?: string;

  @ApiPropertyOptional({ example: true, description: 'Current user is following this user' })
  is_following?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Current user is friend with this user' })
  is_friend?: boolean;

  @ApiPropertyOptional({ example: true, description: 'This user is following current user (follower)' })
  is_follower?: boolean;
}

export class CommentMediaDto {
  @ApiProperty({ example: 'media-1' })
  id: string;

  @ApiProperty({ example: 'https://cloudinary.com/image.jpg' })
  media_url: string;

  @ApiPropertyOptional({ example: 'https://cloudinary.com/thumb.jpg' })
  thumbnail_url?: string;

  @ApiProperty({ example: 'image', enum: ['image', 'video', 'audio'] })
  media_type: string;

  @ApiPropertyOptional({ example: 1920 })
  width?: number;

  @ApiPropertyOptional({ example: 1080 })
  height?: number;

  @ApiPropertyOptional({ example: 120, description: 'Duration in seconds for video/audio' })
  duration?: number;

  @ApiProperty({ example: 0 })
  order: number;
}

export class CreateCommentMediaDto {
  @ApiProperty({ example: 'https://cloudinary.com/image.jpg' })
  @IsString()
  media_url: string;

  @ApiPropertyOptional({ example: 'https://cloudinary.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiProperty({ example: 'image', enum: ['image', 'video', 'audio'] })
  @IsEnum(['image', 'video', 'audio'])
  media_type: string;

  @ApiPropertyOptional({ example: 1920 })
  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 1080 })
  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CommentDto {
  @ApiProperty({ example: 'comment-1' })
  id: string;

  @ApiProperty({ example: 'post-1' })
  post_id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiPropertyOptional({ example: 'Great post!' })
  content?: string;

  @ApiPropertyOptional({ example: 'comment-2', description: 'Parent comment ID for replies' })
  parent_id?: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: CommentUserDto, description: 'User info' })
  user?: CommentUserDto;

  @ApiPropertyOptional({ type: [CommentMediaDto], description: 'Comment media attachments' })
  media?: CommentMediaDto[];

  @ApiPropertyOptional({ example: 5, description: 'Replies count' })
  replies_count?: number;
}

export class CreateCommentDto {
  @ApiPropertyOptional({ example: 'Great post!', description: 'Comment content (optional if media provided)' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content?: string;

  @ApiPropertyOptional({
    example: null,
    description:
      'Parent comment ID (UUID) - CHỈ DÙNG KHI REPLY COMMENT. Để tạo comment đầu tiên (top-level): để TRỐNG, null, hoặc KHÔNG gửi field này. Để reply: dùng UUID của comment muốn reply (lấy từ GET /posts/{post_id}/comments)',
    nullable: true,
  })
  @Transform(({ value }) => {
    // Convert empty string to undefined
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @ValidateIf((o) => o.parent_id !== undefined && o.parent_id !== null && o.parent_id !== '')
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parent_id?: string;

  @ApiPropertyOptional({ type: [CreateCommentMediaDto], description: 'Media attachments (images, videos, audio)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCommentMediaDto)
  media?: CreateCommentMediaDto[];
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Updated comment', description: 'Comment content' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content?: string;

  @ApiPropertyOptional({ type: [CreateCommentMediaDto], description: 'Media attachments (replaces all existing media)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCommentMediaDto)
  media?: CreateCommentMediaDto[];
}
