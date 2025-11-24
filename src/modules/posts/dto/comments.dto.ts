import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CommentUserDto {
  @ApiProperty({ example: 'user-1' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  nickname: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;
}

export class CommentDto {
  @ApiProperty({ example: 'comment-1' })
  id: string;

  @ApiProperty({ example: 'post-1' })
  post_id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'Great post!' })
  content: string;

  @ApiPropertyOptional({ example: 'comment-2', description: 'Parent comment ID for replies' })
  parent_id?: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: CommentUserDto, description: 'User info' })
  user?: CommentUserDto;

  @ApiPropertyOptional({ example: 5, description: 'Replies count' })
  replies_count?: number;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!', description: 'Comment content' })
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content: string;

  @ApiPropertyOptional({ example: 'comment-2', description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parent_id?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment', description: 'Comment content' })
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content: string;
}
