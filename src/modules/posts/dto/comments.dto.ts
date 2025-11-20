import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'User info' })
  user?: {
    id: string;
    nickname: string;
    avatar?: string;
  };

  @ApiPropertyOptional({ description: 'Replies count' })
  replies_count?: number;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!', description: 'Comment content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'comment-2', description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID()
  parent_id?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment', description: 'Comment content' })
  @IsString()
  content: string;
}
