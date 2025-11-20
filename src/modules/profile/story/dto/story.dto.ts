import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class StoryDto {
  @ApiProperty({ example: 'story-1' })
  id: string;

  @ApiProperty({ example: 'user-1' })
  user_id: string;

  @ApiPropertyOptional({ example: 'My story' })
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  media_url?: string;

  @ApiPropertyOptional({ example: 'image', description: 'image or video' })
  media_type?: string;

  @ApiProperty({ example: '2025-11-13T00:00:00.000Z', description: 'Expiration time' })
  expires_at: Date;

  @ApiProperty({ example: '2025-11-12T00:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ description: 'User info' })
  user?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
}

export class CreateStoryDto {
  @ApiPropertyOptional({ example: 'My story', description: 'Story content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Media URL' })
  @IsString()
  media_url: string;

  @ApiProperty({
    example: 'image',
    description: 'Media type: image or video',
    enum: ['image', 'video'],
  })
  @IsString()
  media_type: 'image' | 'video';
}
