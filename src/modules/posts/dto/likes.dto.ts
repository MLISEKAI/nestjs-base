import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class PostLikeDto {
  @ApiProperty({ example: 'like-1' })
  id: string;

  @ApiProperty({ example: 'post-1' })
  post_id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiProperty({ example: 'like', description: 'Reaction type: like, love, haha, wow, sad, angry' })
  reaction: string;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ description: 'User info' })
  user?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
}

export class LikePostDto {
  @ApiProperty({
    example: 'like',
    description: 'Reaction type: like, love, haha, wow, sad, angry',
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
  })
  @IsString()
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'])
  reaction: string;
}
