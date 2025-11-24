import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PostPrivacy {
  public = 'public',
  private = 'private',
  friends = 'friends',
}

export class PostMediaDto {
  @ApiProperty({ example: 'media-1' })
  id: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  media_url: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
  thumbnail_url?: string;

  @ApiProperty({ example: 'image', enum: ['image', 'video', 'audio', 'file'] })
  media_type: string;

  @ApiPropertyOptional({ example: 1920 })
  width?: number;

  @ApiPropertyOptional({ example: 1080 })
  height?: number;

  @ApiProperty({ example: 1 })
  order: number;
}

export class PostHashtagDto {
  @ApiProperty({ example: 'hashtag-1' })
  id: string;

  @ApiProperty({ example: 'technology' })
  name: string;
}

export class PostUserDto {
  @ApiProperty({ example: 'user-1' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  nickname: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'union-123' })
  union_id?: string;
}

export class PostDto {
  @ApiProperty({ example: 'post-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'Hello world!' })
  content: string;

  @ApiProperty({ example: 'public', enum: ['public', 'private', 'friends'] })
  privacy: PostPrivacy;

  @ApiProperty({ example: 0 })
  share_count: number;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: PostUserDto })
  user?: PostUserDto;

  @ApiPropertyOptional({ type: [PostMediaDto] })
  media?: PostMediaDto[];

  @ApiPropertyOptional({ type: [PostHashtagDto] })
  hashtags?: PostHashtagDto[];

  @ApiPropertyOptional({ example: 100 })
  like_count?: number;

  @ApiPropertyOptional({ example: 20 })
  comment_count?: number;

  @ApiPropertyOptional({ example: false })
  is_liked?: boolean;
}

export class CreatePostMediaDto {
  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL của media' })
  @IsString()
  media_url: string;

  @ApiProperty({
    example: 'image',
    description: 'Loại media: image, video, audio, file',
    enum: ['image', 'video', 'audio', 'file'],
  })
  @IsString()
  @IsIn(['image', 'video', 'audio', 'file'])
  media_type: string;

  @ApiPropertyOptional({
    example: 'https://example.com/thumb.jpg',
    description: 'URL thumbnail (cho video)',
  })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiPropertyOptional({ example: 1920, description: 'Chiều rộng (cho image/video)' })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ example: 1080, description: 'Chiều cao (cho image/video)' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 1, description: 'Thứ tự hiển thị', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreatePostDto {
  @ApiProperty({ example: 'Hello world!', description: 'Nội dung bài viết' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: 'public',
    enum: ['public', 'private', 'friends'],
    description: 'Quyền riêng tư của bài viết',
    default: 'public',
  })
  @IsOptional()
  @IsEnum(PostPrivacy)
  privacy?: PostPrivacy;

  @ApiPropertyOptional({
    example: ['technology', 'programming'],
    description: 'Danh sách hashtags (tên hashtag)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    example: [{ media_url: 'https://example.com/image.jpg', media_type: 'image', order: 1 }],
    description: 'Danh sách media đính kèm',
    type: [CreatePostMediaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaDto)
  media?: CreatePostMediaDto[];
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Edited content', description: 'Nội dung bài viết' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example: 'friends',
    enum: ['public', 'private', 'friends'],
    description: 'Quyền riêng tư của bài viết',
  })
  @IsOptional()
  @IsEnum(PostPrivacy)
  privacy?: PostPrivacy;

  @ApiPropertyOptional({
    example: ['technology', 'programming'],
    description: 'Danh sách hashtags (tên hashtag)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    example: [{ media_url: 'https://example.com/image.jpg', media_type: 'image', order: 1 }],
    description: 'Danh sách media đính kèm (thay thế toàn bộ media cũ)',
    type: [CreatePostMediaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaDto)
  media?: CreatePostMediaDto[];
}

export class UpdatePostMediaDto {
  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  media_url?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}
